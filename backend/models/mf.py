"""
Matrix Factorization Model for Collaborative Filtering
Standalone implementation for the CoLLM CIE module
"""

import torch
import torch.nn as nn
import numpy as np
from typing import Tuple, Optional

class MatrixFactorizationModel(nn.Module):
    """
    Classic Matrix Factorization with biases
    Learns user and item latent factors from interaction data
    """
    def __init__(self, num_users: int, num_items: int, embedding_dim: int = 128, 
                 dropout: float = 0.1):
        super().__init__()

        self.num_users = num_users
        self.num_items = num_items
        self.embedding_dim = embedding_dim

        # Embeddings
        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        self.item_embedding = nn.Embedding(num_items, embedding_dim)

        # Biases
        self.user_bias = nn.Embedding(num_users, 1)
        self.item_bias = nn.Embedding(num_items, 1)
        self.global_bias = nn.Parameter(torch.zeros(1))

        # Dropout for regularization
        self.dropout = nn.Dropout(dropout)

        # Initialize
        self._init_weights()

    def _init_weights(self):
        """Xavier initialization"""
        nn.init.xavier_uniform_(self.user_embedding.weight)
        nn.init.xavier_uniform_(self.item_embedding.weight)
        nn.init.zeros_(self.user_bias.weight)
        nn.init.zeros_(self.item_bias.weight)

    def forward(self, user_ids: torch.Tensor, item_ids: torch.Tensor) -> torch.Tensor:
        """
        Forward pass: compute interaction scores
        Args:
            user_ids: [batch_size]
            item_ids: [batch_size]
        Returns:
            scores: [batch_size]
        """
        # Get embeddings
        user_emb = self.dropout(self.user_embedding(user_ids))
        item_emb = self.dropout(self.item_embedding(item_ids))

        # Dot product interaction
        interaction = (user_emb * item_emb).sum(dim=-1)

        # Add biases
        user_b = self.user_bias(user_ids).squeeze()
        item_b = self.item_bias(item_ids).squeeze()

        prediction = interaction + user_b + item_b + self.global_bias

        return prediction

    def get_user_embedding(self, user_ids: torch.Tensor) -> torch.Tensor:
        """Get user collaborative embeddings"""
        return self.user_embedding(user_ids)

    def get_item_embedding(self, item_ids: torch.Tensor) -> torch.Tensor:
        """Get item collaborative embeddings"""
        return self.item_embedding(item_ids)

    def predict(self, user_ids: np.ndarray, item_ids: np.ndarray) -> np.ndarray:
        """Batch prediction for evaluation"""
        self.eval()
        with torch.no_grad():
            u = torch.LongTensor(user_ids)
            i = torch.LongTensor(item_ids)
            scores = self.forward(u, i)
            return torch.sigmoid(scores).numpy()

    def get_all_predictions(self, user_id: int, num_items: int) -> np.ndarray:
        """Get predictions for all items for a given user"""
        self.eval()
        with torch.no_grad():
            user_tensor = torch.LongTensor([user_id] * num_items)
            item_tensor = torch.LongTensor(range(num_items))
            scores = self.forward(user_tensor, item_tensor)
            return torch.sigmoid(scores).numpy()

class LightGCNModel(nn.Module):
    """
    LightGCN: Simplified Graph Convolution Network
    Paper: He et al., SIGIR 2020
    """
    def __init__(self, num_users: int, num_items: int, embedding_dim: int = 128, 
                 num_layers: int = 3, dropout: float = 0.1):
        super().__init__()

        self.num_users = num_users
        self.num_items = num_items
        self.embedding_dim = embedding_dim
        self.num_layers = num_layers

        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        self.item_embedding = nn.Embedding(num_items, embedding_dim)

        self.dropout = nn.Dropout(dropout)

        nn.init.xavier_uniform_(self.user_embedding.weight)
        nn.init.xavier_uniform_(self.item_embedding.weight)

    def forward(self, user_ids: torch.Tensor, item_ids: torch.Tensor,
                adj_matrix: Optional[torch.Tensor] = None) -> torch.Tensor:

        # Initial embeddings
        all_embeddings = torch.cat([
            self.user_embedding.weight,
            self.item_embedding.weight
        ])

        embeddings_list = [all_embeddings]

        # Graph propagation
        if adj_matrix is not None:
            for _ in range(self.num_layers):
                if adj_matrix.is_sparse:
                    all_embeddings = torch.sparse.mm(adj_matrix, all_embeddings)
                else:
                    all_embeddings = torch.mm(adj_matrix, all_embeddings)
                embeddings_list.append(self.dropout(all_embeddings))

        # Mean of all layers
        final_embeddings = torch.stack(embeddings_list, dim=0).mean(dim=0)

        user_emb = final_embeddings[:self.num_users]
        item_emb = final_embeddings[self.num_users:]

        u = user_emb[user_ids]
        i = item_emb[item_ids]

        return (u * i).sum(dim=-1)

    def get_user_embedding(self, user_ids: torch.Tensor) -> torch.Tensor:
        return self.user_embedding(user_ids)

    def get_item_embedding(self, item_ids: torch.Tensor) -> torch.Tensor:
        return self.item_embedding(item_ids)

class DINModel(nn.Module):
    """
    Deep Interest Network
    Paper: Zhou et al., KDD 2018
    """
    def __init__(self, num_users: int, num_items: int, embedding_dim: int = 128,
                 max_seq_len: int = 50, hidden_units: list = [200, 80]):
        super().__init__()

        self.embedding_dim = embedding_dim
        self.max_seq_len = max_seq_len

        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        self.item_embedding = nn.Embedding(num_items, embedding_dim)

        # Attention mechanism
        self.attention = nn.Sequential(
            nn.Linear(embedding_dim * 4, 80),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(80, 40),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(40, 1)
        )

        # Fully connected layers
        fc_input = embedding_dim * 3
        layers = []
        for unit in hidden_units:
            layers.extend([
                nn.Linear(fc_input, unit),
                nn.ReLU(),
                nn.BatchNorm1d(unit),
                nn.Dropout(0.2)
            ])
            fc_input = unit
        layers.append(nn.Linear(fc_input, 1))

        self.fc = nn.Sequential(*layers)

    def forward(self, user_ids: torch.Tensor, item_ids: torch.Tensor,
                history_items: torch.Tensor, history_length: torch.Tensor) -> torch.Tensor:

        user_emb = self.user_embedding(user_ids)
        item_emb = self.item_embedding(item_ids)

        # History embeddings
        history_emb = self.item_embedding(history_items)

        # Attention
        batch_size, max_len, _ = history_emb.shape
        query_expanded = item_emb.unsqueeze(1).expand(-1, max_len, -1)

        din_input = torch.cat([
            query_expanded,
            history_emb,
            query_expanded - history_emb,
            query_expanded * history_emb
        ], dim=-1)

        attention_weights = self.attention(din_input.view(-1, self.embedding_dim * 4))
        attention_weights = attention_weights.view(batch_size, max_len)
        attention_weights = torch.sigmoid(attention_weights)

        # Mask
        mask = torch.arange(max_len, device=history_items.device).unsqueeze(0) < history_length.unsqueeze(1)
        attention_weights = attention_weights.masked_fill(~mask, 0)

        # Weighted sum
        attention_output = (history_emb * attention_weights.unsqueeze(-1)).sum(dim=1)

        # Concatenate and predict
        concat = torch.cat([user_emb, item_emb, attention_output], dim=-1)
        output = self.fc(concat).squeeze()

        return output

    def get_user_embedding(self, user_ids: torch.Tensor, 
                          history_items: Optional[torch.Tensor] = None,
                          history_length: Optional[torch.Tensor] = None) -> torch.Tensor:
        user_emb = self.user_embedding(user_ids)
        if history_items is not None and history_length is not None:
            history_emb = self.item_embedding(history_items)
            mask = torch.arange(history_items.size(1), device=history_items.device).unsqueeze(0) < history_length.unsqueeze(1)
            masked_history = history_emb * mask.unsqueeze(-1).float()
            history_repr = masked_history.sum(dim=1) / history_length.unsqueeze(1).float().clamp(min=1)
            return torch.cat([user_emb, history_repr], dim=-1)
        return user_emb

    def get_item_embedding(self, item_ids: torch.Tensor) -> torch.Tensor:
        return self.item_embedding(item_ids)
