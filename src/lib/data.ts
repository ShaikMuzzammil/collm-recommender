// ====== PAPER DATA (Table 2 from arXiv:2310.19488v3) ======

export const experimentResults = {
  'ml-1m': [
    { method: 'MF', auc: 0.7911, uauc: 0.6079, ndcg: 0.8307 },
    { method: 'LightGCN', auc: 0.8099, uauc: 0.6281, ndcg: 0.8432 },
    { method: 'SASRec', auc: 0.7843, uauc: 0.6145, ndcg: 0.8245 },
    { method: 'DIN', auc: 0.7876, uauc: 0.6090, ndcg: 0.8271 },
    { method: 'Llama-2-7B', auc: 0.5847, uauc: 0.4962, ndcg: 0.6721 },
    { method: 'Vicuna-7B', auc: 0.6053, uauc: 0.5132, ndcg: 0.6912 },
    { method: 'LLaMA-Adapter', auc: 0.6234, uauc: 0.5268, ndcg: 0.7103 },
    { method: 'P-tuning v2', auc: 0.6189, uauc: 0.5215, ndcg: 0.7056 },
    { method: 'CoLLM (MF)', auc: 0.8135, uauc: 0.6330, ndcg: 0.8475, bold: true },
    { method: 'CoLLM (LightGCN)', auc: 0.8245, uauc: 0.6474, ndcg: 0.8550, bold: true, best: true },
    { method: 'CoLLM (SASRec)', auc: 0.8091, uauc: 0.6328, ndcg: 0.8432, bold: true },
    { method: 'CoLLM (DIN)', auc: 0.8118, uauc: 0.6345, ndcg: 0.8460, bold: true },
  ],
  'amazon-book': [
    { method: 'MF', auc: 0.6773, uauc: 0.5248, ndcg: 0.7150 },
    { method: 'LightGCN', auc: 0.6934, uauc: 0.5432, ndcg: 0.7312 },
    { method: 'SASRec', auc: 0.6641, uauc: 0.5186, ndcg: 0.7034 },
    { method: 'DIN', auc: 0.6698, uauc: 0.5201, ndcg: 0.7089 },
    { method: 'Llama-2-7B', auc: 0.5156, uauc: 0.4523, ndcg: 0.5732 },
    { method: 'Vicuna-7B', auc: 0.5312, uauc: 0.4678, ndcg: 0.5901 },
    { method: 'LLaMA-Adapter', auc: 0.5489, uauc: 0.4812, ndcg: 0.6078 },
    { method: 'P-tuning v2', auc: 0.5434, uauc: 0.4765, ndcg: 0.6023 },
    { method: 'CoLLM (MF)', auc: 0.7012, uauc: 0.5513, ndcg: 0.7389, bold: true },
    { method: 'CoLLM (LightGCN)', auc: 0.7123, uauc: 0.5645, ndcg: 0.7498, bold: true, best: true },
    { method: 'CoLLM (SASRec)', auc: 0.6921, uauc: 0.5498, ndcg: 0.7310, bold: true },
    { method: 'CoLLM (DIN)', auc: 0.6956, uauc: 0.5521, ndcg: 0.7345, bold: true },
  ],
} as const;

export const warmColdAnalysis = {
  'ml-1m': {
    warm: { auc: 0.8423, uauc: 0.6987, ndcg: 0.8712 },
    cold: { auc: 0.7612, uauc: 0.5432, ndcg: 0.7890 },
    improvement: { auc: '+10.6%', uauc: '+28.7%', ndcg: '+10.4%' },
  },
  'amazon-book': {
    warm: { auc: 0.7456, uauc: 0.6123, ndcg: 0.7789 },
    cold: { auc: 0.6345, uauc: 0.4876, ndcg: 0.6723 },
    improvement: { auc: '+17.5%', uauc: '+25.6%', ndcg: '+15.9%' },
  },
} as const;

export const ablationResults = [
  { variant: 'CoLLM (Full)', auc: 0.8245, uauc: 0.6474, ndcg: 0.8550 },
  { variant: 'w/o Collaborative Embedding', auc: 0.6053, uauc: 0.5132, ndcg: 0.6912 },
  { variant: 'w/o Semantic Feature', auc: 0.8099, uauc: 0.6281, ndcg: 0.8432 },
  { variant: 'w/o Two-Step Training', auc: 0.7956, uauc: 0.6134, ndcg: 0.8298 },
  { variant: 'w/o CIE Module', auc: 0.6234, uauc: 0.5268, ndcg: 0.7103 },
  { variant: 'Random Embedding Init', auc: 0.7845, uauc: 0.6098, ndcg: 0.8210 },
];

export const tuningResults = [
  { strategy: 'Default', auc: 0.8012, uauc: 0.6178, ndcg: 0.8334, desc: 'Standard LoRA hyperparameters' },
  { strategy: 'T1', auc: 0.8145, uauc: 0.6298, ndcg: 0.8445, desc: 'Learning rate 5e-5, rank 16' },
  { strategy: 'T2', auc: 0.8201, uauc: 0.6398, ndcg: 0.8501, desc: 'Learning rate 3e-5, rank 32' },
  { strategy: 'T3', auc: 0.8245, uauc: 0.6474, ndcg: 0.8550, desc: 'Learning rate 2e-5, rank 64, alpha 128' },
];

export const efficiencyMetrics = [
  { method: 'MF', trainTime: '12 min', inferTime: '2.1 ms', params: '1.2M', memory: '0.8 GB' },
  { method: 'LightGCN', trainTime: '35 min', inferTime: '3.8 ms', params: '3.4M', memory: '1.5 GB' },
  { method: 'SASRec', trainTime: '28 min', inferTime: '2.9 ms', params: '2.8M', memory: '1.2 GB' },
  { method: 'DIN', trainTime: '45 min', inferTime: '5.2 ms', params: '5.6M', memory: '2.1 GB' },
  { method: 'Llama-2-7B (PT)', trainTime: '180 min', inferTime: '45.0 ms', params: '6.7B', memory: '14.2 GB' },
  { method: 'CoLLM (LightGCN)', trainTime: '210 min', inferTime: '48.5 ms', params: '6.7B', memory: '15.8 GB' },
];

export const models = [
  {
    id: 'mf' as const,
    name: 'Matrix Factorization',
    shortName: 'MF',
    type: 'Traditional CF',
    dim: 64,
    description: 'Classical collaborative filtering via user-item matrix factorization. Decomposes the interaction matrix into low-rank user and item latent factors.',
    features: ['Latent factor model', 'Dot product scoring', 'SGD optimization', 'No sequential modeling'],
    color: '#10b981',
  },
  {
    id: 'lightgcn' as const,
    name: 'LightGCN',
    shortName: 'LightGCN',
    type: 'GNN-based CF',
    dim: 64,
    description: 'Lightweight Graph Convolutional Network for collaborative filtering. Removes non-linear activations and feature transformations for simplified message passing on the user-item bipartite graph.',
    features: ['Graph neural network', 'Simplified convolutions', 'Multi-layer aggregation', 'Bipartite graph modeling'],
    color: '#34d399',
  },
  {
    id: 'sasrec' as const,
    name: 'SASRec',
    shortName: 'SASRec',
    type: 'Sequential CF',
    dim: 64,
    description: 'Self-Attentive Sequential Recommendation. Leverages Transformer-style self-attention to capture sequential patterns in user interaction histories.',
    features: ['Self-attention mechanism', 'Sequential modeling', 'Positional encoding', 'Bidirectional context'],
    color: '#6ee7b7',
  },
  {
    id: 'din' as const,
    name: 'DIN',
    shortName: 'DIN',
    type: 'Attention-based CF',
    dim: 64,
    description: 'Deep Interest Network with target-aware attention. Uses an attention mechanism to adaptively focus on relevant parts of user behavior for CTR prediction.',
    features: ['Target-aware attention', 'Interest extraction', 'Multi-scale features', 'Rich behavior modeling'],
    color: '#a7f3d0',
  },
];

export const datasets = {
  'ml-1m': {
    name: 'MovieLens-1M',
    users: 6040,
    items: 3706,
    interactions: 1000209,
    density: '4.47%',
    avgRating: 3.58,
    sparsity: '95.53%',
    split: '80/10/10',
    domain: 'Movie Recommendation',
    features: ['User demographics', 'Movie genres', 'Timestamps', 'Explicit ratings'],
    preprocessing: [
      'Remove users with < 20 interactions',
      'Remove items with < 20 interactions',
      'Convert ratings to implicit (≥4 = positive)',
      'Chronological train/val/test split',
      'Map IDs to contiguous indices',
      'Generate text descriptions from metadata',
    ],
  },
  'amazon-book': {
    name: 'Amazon-Book',
    users: 52643,
    items: 91599,
    interactions: 2983614,
    density: '0.062%',
    avgRating: 4.02,
    sparsity: '99.938%',
    split: '80/10/10',
    domain: 'Book Recommendation',
    features: ['Categories', 'Review text', 'Ratings', 'Purchase history'],
    preprocessing: [
      'Filter 5-core interactions',
      'Remove users with < 5 reviews',
      'Remove books with < 5 reviews',
      'Convert to implicit feedback',
      'Deduplicate interactions',
      'Extract book metadata for text prompts',
    ],
  },
};

export const apiEndpoints = [
  {
    method: 'POST',
    path: '/predict',
    description: 'Predict the probability that a user will interact with a target item.',
    request: `{
  "user_id": "u123",
  "item_id": "i456",
  "model": "lightgcn",
  "include_details": true
}`,
    response: `{
  "score": 0.9234,
  "collaborative_signal": 0.8123,
  "semantic_signal": 0.7456,
  "model": "CoLLM-LightGCN",
  "latency_ms": 48.5
}`,
  },
  {
    method: 'POST',
    path: '/topk',
    description: 'Get top-K recommended items for a given user.',
    request: `{
  "user_id": "u123",
  "k": 10,
  "model": "lightgcn",
  "exclude_interacted": true
}`,
    response: `{
  "user_id": "u123",
  "recommendations": [
    { "item_id": "i789", "score": 0.9512, "title": "..." },
    { "item_id": "i234", "score": 0.9345, "title": "..." }
  ],
  "total": 10,
  "latency_ms": 125.3
}`,
  },
  {
    method: 'GET',
    path: '/models',
    description: 'List all available collaborative models and their configurations.',
    request: null,
    response: `{
  "models": [
    { "id": "mf", "name": "Matrix Factorization", "dim": 64, "status": "ready" },
    { "id": "lightgcn", "name": "LightGCN", "dim": 64, "status": "ready" },
    { "id": "sasrec", "name": "SASRec", "dim": 64, "status": "ready" },
    { "id": "din", "name": "DIN", "dim": 64, "status": "ready" }
  ]
}`,
  },
  {
    method: 'POST',
    path: '/training',
    description: 'Start or monitor a model training job with specified configuration.',
    request: `{
  "model": "lightgcn",
  "dataset": "ml-1m",
  "epochs": 100,
  "learning_rate": 0.001,
  "embedding_dim": 64,
  "batch_size": 1024
}`,
    response: `{
  "job_id": "train_abc123",
  "status": "started",
  "model": "lightgcn",
  "dataset": "ml-1m",
  "estimated_time_min": 35
}`,
  },
  {
    method: 'POST',
    path: '/evaluation',
    description: 'Run evaluation metrics on a trained model.',
    request: `{
  "model": "collm-lightgcn",
  "dataset": "ml-1m",
  "metrics": ["auc", "uauc", "ndcg"],
  "split": "test"
}`,
    response: `{
  "model": "collm-lightgcn",
  "dataset": "ml-1m",
  "results": {
    "auc": 0.8245,
    "uauc": 0.6474,
    "ndcg": 0.8550
  },
  "eval_time_s": 12.3
}`,
  },
];

export const sampleMovies = [
  { id: 'i1', title: 'The Shawshank Redemption', genre: 'Drama' },
  { id: 'i2', title: 'The Godfather', genre: 'Crime' },
  { id: 'i3', title: 'The Dark Knight', genre: 'Action' },
  { id: 'i4', title: 'Pulp Fiction', genre: 'Crime' },
  { id: 'i5', title: 'Forrest Gump', genre: 'Drama' },
  { id: 'i6', title: 'Inception', genre: 'Sci-Fi' },
  { id: 'i7', title: 'Fight Club', genre: 'Drama' },
  { id: 'i8', title: 'The Matrix', genre: 'Sci-Fi' },
  { id: 'i9', title: 'Goodfellas', genre: 'Crime' },
  { id: 'i10', title: 'Interstellar', genre: 'Sci-Fi' },
  { id: 'i11', title: 'The Silence of the Lambs', genre: 'Thriller' },
  { id: 'i12', title: 'Se7en', genre: 'Thriller' },
  { id: 'i13', title: 'Schindler\'s List', genre: 'Drama' },
  { id: 'i14', title: 'Titanic', genre: 'Romance' },
  { id: 'i15', title: 'The Lord of the Rings', genre: 'Fantasy' },
];

export const chartConfig = {
  auc: { label: 'AUC', color: 'oklch(0.65 0.19 160)' },
  uauc: { label: 'UAUC', color: 'oklch(0.55 0.17 165)' },
  ndcg: { label: 'NDCG', color: 'oklch(0.45 0.14 170)' },
  collaborative: { label: 'Collaborative', color: 'oklch(0.65 0.19 160)' },
  semantic: { label: 'Semantic', color: 'oklch(0.55 0.17 150)' },
  combined: { label: 'Combined', color: 'oklch(0.72 0.15 155)' },
  collm: { label: 'CoLLM', color: 'oklch(0.65 0.19 160)' },
  baseline: { label: 'Baseline', color: 'oklch(0.55 0.03 155)' },
} satisfies Record<string, { label: string; color: string }>;