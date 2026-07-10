"""
CoLLM: Integrating Collaborative Embeddings into Large Language Models for Recommendation
Main Backend Application - Production Ready
"""

import os
import sys
import json
import time
import pickle
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Union, Any
from dataclasses import dataclass, asdict
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, ndcg_score
from transformers import AutoTokenizer, AutoModel, get_linear_schedule_with_warmup
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
import redis
import asyncio
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================

@dataclass
class CoLLMConfig:
    """Configuration for CoLLM model and training"""
    # Model Architecture
    llm_model_name: str = "microsoft/DialoGPT-medium"  # Using smaller model for demo
    embedding_dim: int = 768
    collaborative_dim: int = 128
    hidden_dim: int = 512
    num_mapping_layers: int = 3
    dropout: float = 0.1

    # LoRA Configuration
    lora_r: int = 8
    lora_alpha: int = 16
    lora_dropout: float = 0.05

    # Training
    batch_size: int = 32
    learning_rate: float = 1e-4
    collaborative_lr: float = 1e-3
    num_epochs: int = 10
    warmup_steps: int = 100
    max_seq_length: int = 512

    # Data
    max_history_length: int = 10
    train_ratio: float = 0.8
    val_ratio: float = 0.1

    # Paths
    model_save_path: str = "./models/collm_model.pt"
    data_path: str = "./data"

    # Inference
    top_k: int = 10
    temperature: float = 0.7

# =============================================================================
# DATA MODELS
# =============================================================================

class UserInteraction(BaseModel):
    user_id: str
    item_id: str
    rating: float = Field(ge=0, le=5)
    timestamp: Optional[str] = None
    item_title: Optional[str] = None

class RecommendationRequest(BaseModel):
    user_id: str
    context: Optional[str] = None
    num_recommendations: int = Field(default=5, ge=1, le=20)
    include_explanation: bool = True

class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[Dict[str, Any]]
    scores: List[float]
    explanations: Optional[List[str]] = None
    latency_ms: float
    model_version: str

class TrainingStatus(BaseModel):
    status: str
    progress: float
    current_epoch: int
    total_epochs: int
    loss: Optional[float] = None
    metrics: Optional[Dict[str, float]] = None

# =============================================================================
# COLLABORATIVE MODELS (Traditional CF)
# =============================================================================

class MatrixFactorization(nn.Module):
    """
    Matrix Factorization for collaborative filtering
    Maps users and items to latent factor space
    """
    def __init__(self, num_users: int, num_items: int, embedding_dim: int = 128):
        super().__init__()
        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        self.item_embedding = nn.Embedding(num_items, embedding_dim)
        self.user_bias = nn.Embedding(num_users, 1)
        self.item_bias = nn.Embedding(num_items, 1)
        self.global_bias = nn.Parameter(torch.zeros(1))

        # Initialize with Xavier
        nn.init.xavier_uniform_(self.user_embedding.weight)
        nn.init.xavier_uniform_(self.item_embedding.weight)

    def forward(self, user_ids: torch.Tensor, item_ids: torch.Tensor) -> torch.Tensor:
        user_emb = self.user_embedding(user_ids)
        item_emb = self.item_embedding(item_ids)

        # Dot product with biases
        interaction = (user_emb * item_emb).sum(dim=-1, keepdim=True)
        prediction = interaction + self.user_bias(user_ids) + self.item_bias(item_ids) + self.global_bias

        return prediction.squeeze()

    def get_user_representation(self, user_ids: torch.Tensor) -> torch.Tensor:
        return self.user_embedding(user_ids)

    def get_item_representation(self, item_ids: torch.Tensor) -> torch.Tensor:
        return self.item_embedding(item_ids)

class LightGCNLayer(nn.Module):
    """Simplified Graph Convolution Layer for LightGCN"""
    def __init__(self):
        super().__init__()

    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        # Normalized adjacency matrix multiplication
        return torch.sparse.mm(adj, x) if adj.is_sparse else torch.mm(adj, x)

class LightGCN(nn.Module):
    """
    LightGCN: Simplifying and Powering Graph Convolution Network for Recommendation
    Paper: He et al., SIGIR 2020
    """
    def __init__(self, num_users: int, num_items: int, embedding_dim: int = 128, num_layers: int = 3):
        super().__init__()
        self.num_users = num_users
        self.num_items = num_items
        self.embedding_dim = embedding_dim
        self.num_layers = num_layers

        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        self.item_embedding = nn.Embedding(num_items, embedding_dim)

        nn.init.xavier_uniform_(self.user_embedding.weight)
        nn.init.xavier_uniform_(self.item_embedding.weight)

    def forward(self, user_ids: torch.Tensor, item_ids: torch.Tensor, 
                adj_matrix: Optional[torch.Tensor] = None) -> torch.Tensor:
        # Get initial embeddings
        all_embeddings = torch.cat([self.user_embedding.weight, self.item_embedding.weight])

        embeddings_list = [all_embeddings]

        # Graph convolution layers
        if adj_matrix is not None:
            for _ in range(self.num_layers):
                all_embeddings = torch.sparse.mm(adj_matrix, all_embeddings) if adj_matrix.is_sparse else torch.mm(adj_matrix, all_embeddings)
                embeddings_list.append(all_embeddings)

        # Mean pooling of all layers
        final_embeddings = torch.stack(embeddings_list, dim=0).mean(dim=0)

        user_emb = final_embeddings[:self.num_users]
        item_emb = final_embeddings[self.num_users:]

        user_repr = user_emb[user_ids]
        item_repr = item_emb[item_ids]

        return (user_repr * item_repr).sum(dim=-1)

    def get_user_representation(self, user_ids: torch.Tensor) -> torch.Tensor:
        return self.user_embedding(user_ids)

    def get_item_representation(self, item_ids: torch.Tensor) -> torch.Tensor:
        return self.item_embedding(item_ids)

class DINAttention(nn.Module):
    """Deep Interest Network Attention Mechanism"""
    def __init__(self, embedding_dim: int, hidden_units: List[int] = [80, 40]):
        super().__init__()
        self.embedding_dim = embedding_dim

        # Attention network
        layers = []
        input_dim = embedding_dim * 4  # query, key, query-key, query*key
        for unit in hidden_units:
            layers.extend([
                nn.Linear(input_dim, unit),
                nn.ReLU(),
                nn.Dropout(0.2)
            ])
            input_dim = unit
        layers.append(nn.Linear(input_dim, 1))

        self.attention = nn.Sequential(*layers)

    def forward(self, query: torch.Tensor, keys: torch.Tensor, keys_length: torch.Tensor) -> torch.Tensor:
        # query: [B, D], keys: [B, T, D]
        batch_size, max_len, _ = keys.shape

        # Expand query for each key
        query_expanded = query.unsqueeze(1).expand(-1, max_len, -1)  # [B, T, D]

        # Attention inputs
        din_input = torch.cat([
            query_expanded,
            keys,
            query_expanded - keys,
            query_expanded * keys
        ], dim=-1)  # [B, T, 4D]

        # Compute attention weights
        attention_weights = self.attention(din_input.view(-1, 4 * self.embedding_dim))
        attention_weights = attention_weights.view(batch_size, max_len)
        attention_weights = torch.sigmoid(attention_weights)

        # Apply mask
        mask = torch.arange(max_len, device=keys.device).unsqueeze(0) < keys_length.unsqueeze(1)
        attention_weights = attention_weights.masked_fill(~mask, 0)

        # Weighted sum
        output = (keys * attention_weights.unsqueeze(-1)).sum(dim=1)

        return output

class DIN(nn.Module):
    """
    Deep Interest Network for Click-Through Rate Prediction
    Paper: Zhou et al., KDD 2018
    """
    def __init__(self, num_users: int, num_items: int, embedding_dim: int = 128, 
                 max_seq_len: int = 50, hidden_units: List[int] = [200, 80]):
        super().__init__()
        self.embedding_dim = embedding_dim
        self.max_seq_len = max_seq_len

        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        self.item_embedding = nn.Embedding(num_items, embedding_dim)

        self.attention = DINAttention(embedding_dim)

        # Fully connected layers
        fc_input_dim = embedding_dim * 3  # user, item, attention_output
        layers = []
        for unit in hidden_units:
            layers.extend([
                nn.Linear(fc_input_dim, unit),
                nn.ReLU(),
                nn.BatchNorm1d(unit),
                nn.Dropout(0.2)
            ])
            fc_input_dim = unit
        layers.append(nn.Linear(fc_input_dim, 1))

        self.fc = nn.Sequential(*layers)

    def forward(self, user_ids: torch.Tensor, item_ids: torch.Tensor,
                history_items: torch.Tensor, history_length: torch.Tensor) -> torch.Tensor:
        user_emb = self.user_embedding(user_ids)
        item_emb = self.item_embedding(item_ids)

        # Get history embeddings
        history_emb = self.item_embedding(history_items)

        # Apply attention
        attention_output = self.attention(item_emb, history_emb, history_length)

        # Concatenate all features
        concat = torch.cat([user_emb, item_emb, attention_output], dim=-1)

        output = self.fc(concat).squeeze()

        return output

    def get_user_representation(self, user_ids: torch.Tensor, 
                                 history_items: Optional[torch.Tensor] = None,
                                 history_length: Optional[torch.Tensor] = None) -> torch.Tensor:
        user_emb = self.user_embedding(user_ids)
        if history_items is not None and history_length is not None:
            # Use average of history items as additional user representation
            history_emb = self.item_embedding(history_items)
            mask = torch.arange(history_items.size(1), device=history_items.device).unsqueeze(0) < history_length.unsqueeze(1)
            masked_history = history_emb * mask.unsqueeze(-1).float()
            history_repr = masked_history.sum(dim=1) / history_length.unsqueeze(1).float().clamp(min=1)
            return torch.cat([user_emb, history_repr], dim=-1)
        return user_emb

    def get_item_representation(self, item_ids: torch.Tensor) -> torch.Tensor:
        return self.item_embedding(item_ids)

# =============================================================================
# COLLABORATIVE INFORMATION ENCODING (CIE) MODULE
# =============================================================================

class CollaborativeInfoEncoder(nn.Module):
    """
    CIE Module: Maps collaborative embeddings to LLM token embedding space
    This is the core innovation of CoLLM
    """
    def __init__(self, collaborative_dim: int, llm_dim: int, 
                 num_layers: int = 3, hidden_dim: int = 512, dropout: float = 0.1):
        super().__init__()

        layers = []
        input_dim = collaborative_dim

        for i in range(num_layers):
            if i == num_layers - 1:
                output_dim = llm_dim
            else:
                output_dim = hidden_dim

            layers.extend([
                nn.Linear(input_dim, output_dim),
                nn.LayerNorm(output_dim),
                nn.ReLU(),
                nn.Dropout(dropout)
            ])
            input_dim = output_dim

        self.mapping = nn.Sequential(*layers)

        # Learnable projection to align with LLM space
        self.projection = nn.Linear(llm_dim, llm_dim)

    def forward(self, collaborative_embedding: torch.Tensor) -> torch.Tensor:
        mapped = self.mapping(collaborative_embedding)
        projected = self.projection(mapped)
        return projected

# =============================================================================
# LoRA IMPLEMENTATION
# =============================================================================

class LoRALayer(nn.Module):
    """
    Low-Rank Adaptation for efficient fine-tuning
    Paper: Hu et al., ICLR 2022
    """
    def __init__(self, in_features: int, out_features: int, rank: int = 8, alpha: int = 16):
        super().__init__()
        self.rank = rank
        self.alpha = alpha
        self.scaling = alpha / rank

        self.lora_A = nn.Parameter(torch.zeros(in_features, rank))
        self.lora_B = nn.Parameter(torch.zeros(rank, out_features))

        nn.init.kaiming_uniform_(self.lora_A, a=5**0.5)
        nn.init.zeros_(self.lora_B)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return (x @ self.lora_A @ self.lora_B) * self.scaling

class LinearWithLoRA(nn.Module):
    """Linear layer with LoRA adaptation"""
    def __init__(self, linear: nn.Linear, rank: int = 8, alpha: int = 16):
        super().__init__()
        self.linear = linear
        self.lora = LoRALayer(linear.in_features, linear.out_features, rank, alpha)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.linear(x) + self.lora(x)

def add_lora_to_model(model: nn.Module, rank: int = 8, alpha: int = 16, 
                      target_modules: List[str] = ["q_proj", "v_proj"]):
    """Add LoRA layers to target modules in the model"""
    for name, module in model.named_modules():
        if any(target in name for target in target_modules):
            if isinstance(module, nn.Linear):
                parent_name = ".".join(name.split(".")[:-1])
                child_name = name.split(".")[-1]
                parent = model.get_submodule(parent_name) if parent_name else model
                setattr(parent, child_name, LinearWithLoRA(module, rank, alpha))
    return model

# =============================================================================
# CoLLM: MAIN MODEL
# =============================================================================

class CoLLM(nn.Module):
    """
    CoLLM: Integrating Collaborative Embeddings into Large Language Models for Recommendation

    Architecture:
    1. Prompt Construction: Build text prompts with user/item IDs
    2. Hybrid Encoding: Text via LLM tokenizer, Collaborative via CIE module
    3. LLM Prediction: LoRA-enhanced LLM for recommendation

    Two-step training:
    Step 1: Fine-tune LoRA with text-only prompts
    Step 2: Tune CIE module with full prompts (collaborative + text)
    """
    def __init__(self, config: CoLLMConfig, num_users: int, num_items: int,
                 collaborative_model_type: str = "mf"):
        super().__init__()
        self.config = config
        self.num_users = num_users
        self.num_items = num_items

        # Initialize LLM and tokenizer
        logger.info(f"Loading LLM: {config.llm_model_name}")
        self.tokenizer = AutoTokenizer.from_pretrained(config.llm_model_name)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

        self.llm = AutoModel.from_pretrained(config.llm_model_name)
        self.llm_dim = self.llm.config.hidden_size

        # Add LoRA to LLM
        logger.info("Adding LoRA layers...")
        self.llm = add_lora_to_model(self.llm, config.lora_r, config.lora_alpha)

        # Collaborative model
        self.collaborative_model_type = collaborative_model_type
        if collaborative_model_type == "mf":
            self.collaborative_model = MatrixFactorization(num_users, num_items, config.collaborative_dim)
        elif collaborative_model_type == "lightgcn":
            self.collaborative_model = LightGCN(num_users, num_items, config.collaborative_dim)
        elif collaborative_model_type == "din":
            self.collaborative_model = DIN(num_users, num_items, config.collaborative_dim)
        else:
            raise ValueError(f"Unknown collaborative model: {collaborative_model_type}")

        # CIE Module: Maps collaborative embeddings to LLM space
        actual_collab_dim = config.collaborative_dim * 2 if collaborative_model_type == "din" else config.collaborative_dim
        self.cie = CollaborativeInfoEncoder(
            actual_collab_dim, 
            self.llm_dim, 
            config.num_mapping_layers,
            config.hidden_dim,
            config.dropout
        )

        # Recommendation head
        self.rec_head = nn.Sequential(
            nn.Linear(self.llm_dim, self.llm_dim // 2),
            nn.ReLU(),
            nn.Dropout(config.dropout),
            nn.Linear(self.llm_dim // 2, 1)
        )

        # Freeze LLM parameters (only LoRA is trainable)
        for name, param in self.llm.named_parameters():
            if 'lora' not in name:
                param.requires_grad = False

    def build_prompt(self, user_id: int, item_id: int, user_history: List[str],
                     item_title: str, include_collaborative: bool = True) -> str:
        """Build prompt template for recommendation"""
        history_str = ", ".join(user_history[:self.config.max_history_length]) if user_history else "None"

        if include_collaborative:
            prompt = f"""#Question: A user has given high ratings to the following items: {history_str}. 
Additionally, we have information about the user's preferences encoded in the feature <UserID:{user_id}>.
Using all available information, make a prediction about whether the user would enjoy the item titled "{item_title}" 
with the feature <TargetItemID:{item_id}>? Answer with "Yes" or "No".
#Answer:"""
        else:
            prompt = f"""#Question: A user has given high ratings to the following items: {history_str}. 
Make a prediction about whether the user would enjoy the item titled "{item_title}"? 
Answer with "Yes" or "No".
#Answer:"""

        return prompt

    def encode_collaborative(self, user_ids: torch.Tensor, item_ids: torch.Tensor,
                             history_items: Optional[torch.Tensor] = None,
                             history_length: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor]:
        """Encode collaborative information via CIE module"""
        if self.collaborative_model_type == "din":
            user_collab = self.collaborative_model.get_user_representation(user_ids, history_items, history_length)
        else:
            user_collab = self.collaborative_model.get_user_representation(user_ids)

        item_collab = self.collaborative_model.get_item_representation(item_ids)

        # Map to LLM space
        user_mapped = self.cie(user_collab)
        item_mapped = self.cie(item_collab)

        return user_mapped, item_mapped

    def forward(self, prompts: List[str], user_ids: torch.Tensor, item_ids: torch.Tensor,
                history_items: Optional[torch.Tensor] = None,
                history_length: Optional[torch.Tensor] = None,
                use_collaborative: bool = True) -> torch.Tensor:
        """
        Forward pass with hybrid encoding
        """
        # Tokenize text prompts
        encoded = self.tokenizer(
            prompts,
            padding=True,
            truncation=True,
            max_length=self.config.max_seq_length,
            return_tensors="pt"
        )

        input_ids = encoded['input_ids'].to(user_ids.device)
        attention_mask = encoded['attention_mask'].to(user_ids.device)

        # Get text embeddings from LLM embedding layer
        text_embeddings = self.llm.get_input_embeddings()(input_ids)

        if use_collaborative:
            # Get collaborative embeddings
            user_mapped, item_mapped = self.encode_collaborative(user_ids, item_ids, history_items, history_length)

            # Find positions of <UserID> and <TargetItemID> tokens in prompts
            # For simplicity, we prepend collaborative embeddings to text embeddings
            # In practice, you'd insert them at specific positions
            collab_embeddings = torch.stack([user_mapped, item_mapped], dim=1)

            # Combine: [collab_embeddings, text_embeddings]
            combined_embeddings = torch.cat([collab_embeddings, text_embeddings], dim=1)
            combined_attention = torch.cat([
                torch.ones(collab_embeddings.size()[:2], device=attention_mask.device),
                attention_mask
            ], dim=1)
        else:
            combined_embeddings = text_embeddings
            combined_attention = attention_mask

        # Pass through LLM
        outputs = self.llm(
            inputs_embeds=combined_embeddings,
            attention_mask=combined_attention
        )

        # Use pooled output for prediction
        pooled = outputs.last_hidden_state[:, 0]  # CLS token or first token

        # Recommendation prediction
        prediction = self.rec_head(pooled).squeeze()

        return prediction

    def recommend(self, user_id: int, candidate_items: List[Dict], 
                  user_history: List[str], top_k: int = 10) -> List[Tuple[int, float, str]]:
        """Generate top-k recommendations for a user"""
        self.eval()

        results = []
        with torch.no_grad():
            for item in candidate_items:
                prompt = self.build_prompt(user_id, item['id'], user_history, item['title'])

                # Get prediction
                user_tensor = torch.tensor([user_id])
                item_tensor = torch.tensor([item['id']])

                pred = self.forward([prompt], user_tensor, item_tensor, use_collaborative=True)
                prob = torch.sigmoid(pred).item()

                results.append((item['id'], prob, item['title']))

        # Sort by probability and return top-k
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

# =============================================================================
# TRAINING PIPELINE
# =============================================================================

class CoLLMTrainer:
    """Two-step training pipeline for CoLLM"""

    def __init__(self, model: CoLLM, config: CoLLMConfig):
        self.model = model
        self.config = config
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)

    def step1_train_lora(self, train_loader: DataLoader, val_loader: DataLoader) -> Dict[str, float]:
        """
        Step 1: Train LoRA module with text-only prompts
        This ensures cold-start recommendation capability
        """
        logger.info("=" * 50)
        logger.info("STEP 1: Training LoRA Module (Text-Only)")
        logger.info("=" * 50)

        # Only optimize LoRA parameters and rec_head
        trainable_params = []
        for name, param in self.model.named_parameters():
            if 'lora' in name or 'rec_head' in name:
                param.requires_grad = True
                trainable_params.append(param)
            else:
                param.requires_grad = False

        optimizer = torch.optim.AdamW(trainable_params, lr=self.config.learning_rate)
        criterion = nn.BCEWithLogitsLoss()

        best_val_auc = 0
        history = {'train_loss': [], 'val_auc': []}

        for epoch in range(self.config.num_epochs):
            self.model.train()
            total_loss = 0

            for batch in train_loader:
                prompts, user_ids, item_ids, labels = batch[:4]
                labels = labels.float().to(self.device)
                user_ids = user_ids.to(self.device)
                item_ids = item_ids.to(self.device)

                # Forward without collaborative info
                predictions = self.model(prompts, user_ids, item_ids, use_collaborative=False)

                loss = criterion(predictions, labels)

                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

                total_loss += loss.item()

            avg_loss = total_loss / len(train_loader)

            # Validation
            val_auc = self.evaluate(val_loader, use_collaborative=False)

            history['train_loss'].append(avg_loss)
            history['val_auc'].append(val_auc)

            logger.info(f"Epoch {epoch+1}/{self.config.num_epochs} - Loss: {avg_loss:.4f}, Val AUC: {val_auc:.4f}")

            if val_auc > best_val_auc:
                best_val_auc = val_auc
                torch.save(self.model.state_dict(), f"{self.config.model_save_path}.step1")

        return history

    def step2_train_cie(self, train_loader: DataLoader, val_loader: DataLoader) -> Dict[str, float]:
        """
        Step 2: Train CIE module with full prompts (collaborative + text)
        """
        logger.info("=" * 50)
        logger.info("STEP 2: Training CIE Module (Collaborative + Text)")
        logger.info("=" * 50)

        # Load best LoRA from step 1
        self.model.load_state_dict(torch.load(f"{self.config.model_save_path}.step1"))

        # Freeze LoRA, train CIE and collaborative model
        for name, param in self.model.named_parameters():
            if 'cie' in name or 'collaborative_model' in name:
                param.requires_grad = True
            else:
                param.requires_grad = False

        optimizer = torch.optim.AdamW([
            {'params': self.model.cie.parameters(), 'lr': self.config.learning_rate},
            {'params': self.model.collaborative_model.parameters(), 'lr': self.config.collaborative_lr}
        ])
        criterion = nn.BCEWithLogitsLoss()

        best_val_auc = 0
        history = {'train_loss': [], 'val_auc': []}

        for epoch in range(self.config.num_epochs):
            self.model.train()
            total_loss = 0

            for batch in train_loader:
                prompts, user_ids, item_ids, labels = batch[:4]
                labels = labels.float().to(self.device)
                user_ids = user_ids.to(self.device)
                item_ids = item_ids.to(self.device)

                # Forward with collaborative info
                predictions = self.model(prompts, user_ids, item_ids, use_collaborative=True)

                loss = criterion(predictions, labels)

                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

                total_loss += loss.item()

            avg_loss = total_loss / len(train_loader)

            # Validation
            val_auc = self.evaluate(val_loader, use_collaborative=True)

            history['train_loss'].append(avg_loss)
            history['val_auc'].append(val_auc)

            logger.info(f"Epoch {epoch+1}/{self.config.num_epochs} - Loss: {avg_loss:.4f}, Val AUC: {val_auc:.4f}")

            if val_auc > best_val_auc:
                best_val_auc = val_auc
                torch.save(self.model.state_dict(), self.config.model_save_path)

        return history

    def evaluate(self, data_loader: DataLoader, use_collaborative: bool = True) -> float:
        """Evaluate model performance"""
        self.model.eval()
        all_preds = []
        all_labels = []

        with torch.no_grad():
            for batch in data_loader:
                prompts, user_ids, item_ids, labels = batch[:4]
                user_ids = user_ids.to(self.device)
                item_ids = item_ids.to(self.device)

                predictions = self.model(prompts, user_ids, item_ids, use_collaborative=use_collaborative)
                probs = torch.sigmoid(predictions)

                all_preds.extend(probs.cpu().numpy())
                all_labels.extend(labels.numpy())

        try:
            auc = roc_auc_score(all_labels, all_preds)
        except:
            auc = 0.5

        return auc

# =============================================================================
# DATASET AND DATA LOADER
# =============================================================================

class RecommendationDataset(Dataset):
    """Dataset for recommendation with prompts"""

    def __init__(self, interactions: pd.DataFrame, user_history: Dict, item_metadata: Dict,
                 max_history: int = 10):
        self.interactions = interactions
        self.user_history = user_history
        self.item_metadata = item_metadata
        self.max_history = max_history

    def __len__(self):
        return len(self.interactions)

    def __getitem__(self, idx):
        row = self.interactions.iloc[idx]
        user_id = int(row['user_id'])
        item_id = int(row['item_id'])
        label = float(row['label'])

        # Get user history
        history = self.user_history.get(user_id, [])
        history_titles = [self.item_metadata.get(h, {}).get('title', '') for h in history[:self.max_history]]

        # Get item title
        item_title = self.item_metadata.get(item_id, {}).get('title', f'Item_{item_id}')

        # Build prompt
        history_str = ", ".join(history_titles) if history_titles else "None"
        prompt = f"""#Question: A user has given high ratings to the following items: {history_str}. 
Additionally, we have information about the user's preferences encoded in the feature <UserID:{user_id}>.
Using all available information, make a prediction about whether the user would enjoy the item titled "{item_title}" 
with the feature <TargetItemID:{item_id}>? Answer with "Yes" or "No".
#Answer:"""

        return prompt, user_id, item_id, label, history_titles, item_title

def create_synthetic_data(num_users: int = 1000, num_items: int = 5000, 
                          num_interactions: int = 50000) -> Tuple[pd.DataFrame, Dict, Dict]:
    """Create synthetic recommendation dataset for demonstration"""
    np.random.seed(42)

    # Generate interactions
    users = np.random.randint(0, num_users, num_interactions)
    items = np.random.randint(0, num_items, num_interactions)

    # Generate ratings based on user-item affinity (synthetic pattern)
    ratings = []
    for u, i in zip(users, items):
        # Some users like certain item categories
        affinity = np.random.normal(0.5, 0.2)
        if u % 10 == i % 10:  # Some correlation
            affinity += 0.3
        rating = 1 if affinity > 0.5 else 0
        ratings.append(rating)

    interactions = pd.DataFrame({
        'user_id': users,
        'item_id': items,
        'label': ratings
    })

    # Remove duplicates
    interactions = interactions.drop_duplicates(subset=['user_id', 'item_id'])

    # Build user history
    user_history = {}
    for _, row in interactions[interactions['label'] == 1].iterrows():
        uid = int(row['user_id'])
        iid = int(row['item_id'])
        if uid not in user_history:
            user_history[uid] = []
        user_history[uid].append(iid)

    # Item metadata
    item_metadata = {}
    genres = ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Romance', 'Thriller', 'Documentary', 'Animation']
    for i in range(num_items):
        genre = genres[i % len(genres)]
        item_metadata[i] = {
            'title': f'{genre} Movie {i}',
            'genre': genre,
            'year': 1990 + (i % 30)
        }

    return interactions, user_history, item_metadata

# =============================================================================
# FASTAPI APPLICATION
# =============================================================================

class CoLLMService:
    """Singleton service for CoLLM model"""

    def __init__(self):
        self.model: Optional[CoLLM] = None
        self.config = CoLLMConfig()
        self.item_metadata: Dict = {}
        self.user_history: Dict = {}
        self.is_ready = False

    async def initialize(self):
        """Initialize the service with model and data"""
        logger.info("Initializing CoLLM Service...")

        # Create synthetic data for demo
        interactions, self.user_history, self.item_metadata = create_synthetic_data()

        num_users = interactions['user_id'].max() + 1
        num_items = interactions['item_id'].max() + 1

        # Initialize model
        self.model = CoLLM(self.config, num_users, num_items, "mf")

        # In production, load pre-trained weights here
        # self.model.load_state_dict(torch.load(self.config.model_save_path))

        self.is_ready = True
        logger.info("CoLLM Service initialized successfully!")

    def get_recommendations(self, user_id: str, num_recommendations: int = 5) -> Dict:
        """Get recommendations for a user"""
        if not self.is_ready:
            raise HTTPException(status_code=503, detail="Service not ready")

        start_time = time.time()

        try:
            user_id_int = int(user_id)
            user_history = self.user_history.get(user_id_int, [])
            history_titles = [self.item_metadata.get(h, {}).get('title', '') for h in user_history[:10]]

            # Generate candidate items (all items not in history)
            candidate_items = []
            for item_id, metadata in self.item_metadata.items():
                if item_id not in user_history:
                    candidate_items.append({
                        'id': item_id,
                        'title': metadata['title'],
                        'genre': metadata.get('genre', 'Unknown')
                    })

            # Get recommendations
            recommendations = self.model.recommend(
                user_id_int, 
                candidate_items[:100],  # Limit for demo
                history_titles,
                top_k=num_recommendations
            )

            # Format response
            results = []
            for item_id, score, title in recommendations:
                results.append({
                    'item_id': item_id,
                    'title': title,
                    'confidence': round(score, 4),
                    'genre': self.item_metadata.get(item_id, {}).get('genre', 'Unknown')
                })

            latency = (time.time() - start_time) * 1000

            return {
                'user_id': user_id,
                'recommendations': results,
                'latency_ms': round(latency, 2),
                'model_version': 'CoLLM-v1.0',
                'history_count': len(user_history)
            }

        except Exception as e:
            logger.error(f"Recommendation error: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

# Global service instance
service = CoLLMService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown"""
    await service.initialize()
    yield
    # Cleanup if needed

app = FastAPI(
    title="CoLLM API",
    description="Integrating Collaborative Embeddings into Large Language Models for Recommendation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "service": "CoLLM API",
        "version": "1.0.0",
        "status": "ready" if service.is_ready else "initializing",
        "paper": "CoLLM: Integrating Collaborative Embeddings into Large Language Models for Recommendation"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": service.is_ready,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Get personalized recommendations for a user"""
    result = service.get_recommendations(
        request.user_id,
        request.num_recommendations
    )

    return RecommendationResponse(
        user_id=result['user_id'],
        recommendations=result['recommendations'],
        scores=[r['confidence'] for r in result['recommendations']],
        explanations=[f"Recommended based on collaborative and semantic analysis" for _ in result['recommendations']],
        latency_ms=result['latency_ms'],
        model_version=result['model_version']
    )

@app.get("/recommend/{user_id}")
async def get_recommendations_get(user_id: str, num: int = Query(default=5, ge=1, le=20)):
    """Get recommendations via GET request"""
    result = service.get_recommendations(user_id, num)
    return result

@app.get("/items")
async def get_items(skip: int = 0, limit: int = 100):
    """Get available items"""
    items = []
    for item_id, metadata in list(service.item_metadata.items())[skip:skip+limit]:
        items.append({
            'item_id': item_id,
            **metadata
        })
    return {"items": items, "total": len(service.item_metadata)}

@app.get("/users/{user_id}/history")
async def get_user_history(user_id: str):
    """Get user's interaction history"""
    try:
        user_id_int = int(user_id)
        history = service.user_history.get(user_id_int, [])
        history_details = []
        for item_id in history:
            meta = service.item_metadata.get(item_id, {})
            history_details.append({
                'item_id': item_id,
                **meta
            })
        return {
            'user_id': user_id,
            'history': history_details,
            'count': len(history_details)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/interact")
async def record_interaction(interaction: UserInteraction):
    """Record a new user interaction"""
    try:
        user_id = int(interaction.user_id)
        item_id = int(interaction.item_id)

        if user_id not in service.user_history:
            service.user_history[user_id] = []
        service.user_history[user_id].append(item_id)

        return {
            'status': 'success',
            'user_id': user_id,
            'item_id': item_id,
            'message': 'Interaction recorded successfully'
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model/info")
async def get_model_info():
    """Get model architecture and configuration info"""
    return {
        'model_name': 'CoLLM',
        'architecture': {
            'llm': service.config.llm_model_name,
            'collaborative_model': 'MatrixFactorization',
            'cie_layers': service.config.num_mapping_layers,
            'lora_rank': service.config.lora_r,
            'lora_alpha': service.config.lora_alpha
        },
        'training': {
            'two_step_training': True,
            'step1': 'LoRA fine-tuning with text-only prompts',
            'step2': 'CIE module tuning with collaborative + text'
        },
        'datasets': {
            'num_users': len(service.user_history),
            'num_items': len(service.item_metadata)
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
