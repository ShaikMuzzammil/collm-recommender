# CoLLM Architecture Documentation

## Detailed System Design

### 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CoLLM System                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐        │
│   │   Client    │◄────►│   Frontend  │◄────►│   Backend   │        │
│   │  (Browser)  │      │   (React)   │      │  (FastAPI)  │        │
│   └─────────────┘      └─────────────┘      └──────┬──────┘        │
│                                                     │                │
│                                        ┌────────────┴────────────┐  │
│                                        │                         │  │
│                              ┌─────────▼──────────┐   ┌──────────▼──┐│
│                              │  CoLLM Model       │   │   Redis     ││
│                              │  (PyTorch)         │   │   Cache     ││
│                              └─────────┬──────────┘   └─────────────┘│
│                                        │                            │
│                    ┌───────────────────┼───────────────────┐          │
│                    │                   │                   │          │
│           ┌────────▼──────┐  ┌─────────▼──────┐  ┌────────▼──────┐  │
│           │   LLM + LoRA  │  │  CIE Module    │  │ Collaborative │  │
│           │  (Vicuna-7B)  │  │  (MLP Mapping) │  │    Model      │  │
│           │               │  │                │  │ (MF/LightGCN)│  │
│           └───────────────┘  └────────────────┘  └───────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Data Flow

```
User Request
    │
    ▼
┌─────────────────┐
│  React Frontend │
│  (Dashboard)    │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  FastAPI Backend │
│  (Validation)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌─────────┐
│ Redis │ │  CoLLM  │
│ Cache │ │  Model  │
└───────┘ └────┬────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   ┌─────────┐  ┌──────────┐
   │  Text   │  │Collaborative│
   │Encoding │  │  Encoding  │
   │ (LLM)   │  │   (CIE)    │
   └────┬────┘  └─────┬────┘
        │             │
        └──────┬──────┘
               │
               ▼
        ┌────────────┐
        │  Hybrid    │
        │  Fusion    │
        │  (Concat)  │
        └─────┬──────┘
              │
              ▼
        ┌────────────┐
        │ LLM + LoRA │
        │ Processing │
        └─────┬──────┘
              │
              ▼
        ┌────────────┐
        │ Prediction │
        │   Head     │
        └─────┬──────┘
              │
              ▼
        ┌────────────┐
        │  Response  │
        │ (JSON)     │
        └────────────┘
```

### 3. Component Details

#### 3.1 Prompt Construction Module
- **Input**: User ID, Item ID, User History, Item Metadata
- **Process**: Template-based prompt generation
- **Output**: Structured text prompt with placeholders

#### 3.2 Hybrid Encoding Module
- **Text Branch**: LLM tokenizer → token IDs → embedding lookup
- **Collaborative Branch**: Collaborative model → CIE mapping → LLM space
- **Fusion**: Concatenate collaborative embeddings with text embeddings

#### 3.3 CIE Module (Collaborative Information Encoding)
- **Input**: User/item collaborative embeddings (dim=128)
- **Architecture**: 3-layer MLP with LayerNorm and Dropout
- **Output**: Mapped embeddings in LLM token space (dim=768)
- **Key Property**: Preserves low-rank structure of collaborative info

#### 3.4 LoRA Module
- **Target**: Query and Value projection layers in LLM attention
- **Parameters**: rank=8, alpha=16, dropout=0.05
- **Efficiency**: Only 0.1% of LLM parameters are trainable

### 4. Training Data Flow

```
Step 1: LoRA Training
─────────────────────
Raw Data → Text Prompts → Tokenization → LLM + LoRA → BCE Loss
              │
              └─► No Collaborative Info

Step 2: CIE Training
─────────────────────
Raw Data → Full Prompts → Hybrid Encoding → LLM + LoRA → BCE Loss
              │              │
              │              ├─► Text Embeddings (Frozen)
              │              └─► Collaborative Embeddings (Trainable)
              │
              └─► Includes UserID & TargetItemID
```

### 5. Inference Optimization

#### 5.1 Caching Strategy
- **Redis Cache**: Store frequent user embeddings
- **TTL**: 1 hour for user profiles, 24 hours for item embeddings
- **Hit Rate**: Expected 70-80% for active users

#### 5.2 Batch Processing
- **Dynamic Batching**: Group concurrent requests
- **Maximum Batch Size**: 64 for GPU efficiency
- **Timeout**: 10ms for batch formation

#### 5.3 Model Quantization
- **INT8 Quantization**: For production deployment
- **Expected Speedup**: 2-4x with <1% accuracy loss
- **Dynamic Quantization**: Applied to linear layers

### 6. Scalability Considerations

#### 6.1 Horizontal Scaling
- **Load Balancer**: Distribute requests across multiple backend instances
- **Model Replication**: Each instance loads model independently
- **Shared Cache**: Redis cluster for cross-instance caching

#### 6.2 Vertical Scaling
- **GPU Utilization**: Single A100 can handle 1000+ concurrent users
- **Memory Optimization**: Gradient checkpointing for large batches
- **Mixed Precision**: FP16 training and inference

#### 6.3 Database Sharding
- **User Sharding**: Partition by user ID hash
- **Item Sharding**: Partition by item category
- **Cross-Shard Queries**: Minimal for recommendation tasks
