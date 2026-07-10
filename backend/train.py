"""
CoLLM Training Script
Two-step training pipeline implementation
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime
from typing import Dict, List, Tuple, Optional

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, ndcg_score
from transformers import AutoTokenizer, get_linear_schedule_with_warmup
import matplotlib.pyplot as plt

from models.mf import MatrixFactorizationModel, LightGCNModel, DINModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CoLLMDataset(Dataset):
    """Dataset for CoLLM training"""

    def __init__(self, interactions: pd.DataFrame, user_history: Dict, 
                 item_metadata: Dict, tokenizer, max_length: int = 512,
                 max_history: int = 10):
        self.interactions = interactions
        self.user_history = user_history
        self.item_metadata = item_metadata
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.max_history = max_history

    def __len__(self):
        return len(self.interactions)

    def __getitem__(self, idx):
        row = self.interactions.iloc[idx]
        user_id = int(row['user_id'])
        item_id = int(row['item_id'])
        label = float(row['label'])

        # Get history
        history = self.user_history.get(user_id, [])
        history_titles = [self.item_metadata.get(h, {}).get('title', '') for h in history[:self.max_history]]
        item_title = self.item_metadata.get(item_id, {}).get('title', f'Item_{item_id}')

        # Build prompt
        history_str = ", ".join(history_titles) if history_titles else "None"
        prompt = f"Question: A user has given high ratings to: {history_str}. "
        prompt += f"Predict if they will enjoy "{item_title}"? Answer Yes or No."

        # Tokenize
        encoded = self.tokenizer(
            prompt,
            padding='max_length',
            truncation=True,
            max_length=self.max_length,
            return_tensors='pt'
        )

        return {
            'input_ids': encoded['input_ids'].squeeze(),
            'attention_mask': encoded['attention_mask'].squeeze(),
            'user_id': torch.LongTensor([user_id]),
            'item_id': torch.LongTensor([item_id]),
            'label': torch.FloatTensor([label])
        }

def train_collaborative_model(model, train_loader, val_loader, epochs: int = 20,
                               lr: float = 0.001, device: str = 'cuda') -> Dict:
    """Train standalone collaborative model"""
    model = model.to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.BCEWithLogitsLoss()

    best_auc = 0
    history = {'train_loss': [], 'val_auc': []}

    for epoch in range(epochs):
        model.train()
        total_loss = 0

        for batch in train_loader:
            user_ids = batch['user_id'].to(device).squeeze()
            item_ids = batch['item_id'].to(device).squeeze()
            labels = batch['label'].to(device).squeeze()

            predictions = model(user_ids, item_ids)
            loss = criterion(predictions, labels)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        avg_loss = total_loss / len(train_loader)

        # Validation
        model.eval()
        all_preds = []
        all_labels = []

        with torch.no_grad():
            for batch in val_loader:
                user_ids = batch['user_id'].to(device).squeeze()
                item_ids = batch['item_id'].to(device).squeeze()
                labels = batch['label'].to(device).squeeze()

                preds = model(user_ids, item_ids)
                all_preds.extend(torch.sigmoid(preds).cpu().numpy())
                all_labels.extend(labels.cpu().numpy())

        val_auc = roc_auc_score(all_labels, all_preds)

        history['train_loss'].append(avg_loss)
        history['val_auc'].append(val_auc)

        logger.info(f"Epoch {epoch+1}/{epochs} - Loss: {avg_loss:.4f}, Val AUC: {val_auc:.4f}")

        if val_auc > best_auc:
            best_auc = val_auc
            torch.save(model.state_dict(), 'best_collaborative.pt')

    return history

def plot_training_history(history: Dict, save_path: str = 'training_history.png'):
    """Plot training curves"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    ax1.plot(history['train_loss'], label='Train Loss')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Loss')
    ax1.set_title('Training Loss')
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    ax2.plot(history['val_auc'], label='Validation AUC', color='green')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('AUC')
    ax2.set_title('Validation AUC')
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches='tight')
    plt.close()
    logger.info(f"Training history saved to {save_path}")

def main():
    parser = argparse.ArgumentParser(description='Train CoLLM models')
    parser.add_argument('--model', type=str, default='mf', choices=['mf', 'lightgcn', 'din'])
    parser.add_argument('--epochs', type=int, default=20)
    parser.add_argument('--batch_size', type=int, default=256)
    parser.add_argument('--lr', type=float, default=0.001)
    parser.add_argument('--embedding_dim', type=int, default=128)
    parser.add_argument('--data_path', type=str, default='data')
    args = parser.parse_args()

    # Load data (synthetic for demo)
    from main import create_synthetic_data
    interactions, user_history, item_metadata = create_synthetic_data()

    num_users = interactions['user_id'].max() + 1
    num_items = interactions['item_id'].max() + 1

    # Split data
    train_df, temp_df = train_test_split(interactions, test_size=0.2, random_state=42)
    val_df, test_df = train_test_split(temp_df, test_size=0.5, random_state=42)

    # Create tokenizer
    tokenizer = AutoTokenizer.from_pretrained('microsoft/DialoGPT-medium')
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # Create datasets
    train_dataset = CoLLMDataset(train_df, user_history, item_metadata, tokenizer)
    val_dataset = CoLLMDataset(val_df, user_history, item_metadata, tokenizer)

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size)

    # Initialize model
    if args.model == 'mf':
        model = MatrixFactorizationModel(num_users, num_items, args.embedding_dim)
    elif args.model == 'lightgcn':
        model = LightGCNModel(num_users, num_items, args.embedding_dim)
    else:
        model = DINModel(num_users, num_items, args.embedding_dim)

    logger.info(f"Training {args.model.upper()} model...")
    device = 'cuda' if torch.cuda.is_available() else 'cpu'

    history = train_collaborative_model(
        model, train_loader, val_loader, 
        epochs=args.epochs, lr=args.lr, device=device
    )

    # Plot results
    plot_training_history(history)

    logger.info("Training completed!")

if __name__ == '__main__':
    main()
