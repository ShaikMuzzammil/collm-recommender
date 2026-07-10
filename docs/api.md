# CoLLM API Documentation

## Base URL
```
Development: http://localhost:8000
Production: https://api.collm.example.com
```

## Authentication
Currently, the API is open access. For production, implement:
- API Key authentication via `X-API-Key` header
- OAuth 2.0 / JWT tokens
- Rate limiting per API key

## Endpoints

### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### 2. Get Recommendations (POST)
```http
POST /recommend
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "42",
  "context": "optional user context",
  "num_recommendations": 5,
  "include_explanation": true
}
```

**Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| user_id | string | Yes | - | Unique user identifier |
| context | string | No | null | Additional context |
| num_recommendations | integer | No | 5 | Number of items to recommend (1-20) |
| include_explanation | boolean | No | true | Include AI explanation |

**Response:**
```json
{
  "user_id": "42",
  "recommendations": [
    {
      "item_id": 123,
      "title": "Sci-Fi Movie 2042",
      "confidence": 0.9245,
      "genre": "Sci-Fi"
    }
  ],
  "scores": [0.9245],
  "explanations": ["Recommended based on collaborative and semantic analysis"],
  "latency_ms": 45.2,
  "model_version": "CoLLM-v1.0"
}
```

### 3. Get Recommendations (GET)
```http
GET /recommend/{user_id}?num=5
```

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| user_id | path | Yes | - | User identifier |
| num | query | No | 5 | Number of recommendations |

### 4. Get User History
```http
GET /users/{user_id}/history
```

**Response:**
```json
{
  "user_id": "42",
  "history": [
    {
      "item_id": 101,
      "title": "Action Movie 101",
      "genre": "Action",
      "year": 2020
    }
  ],
  "count": 15
}
```

### 5. Record Interaction
```http
POST /interact
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "42",
  "item_id": "123",
  "rating": 4.5,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "status": "success",
  "user_id": 42,
  "item_id": 123,
  "message": "Interaction recorded successfully"
}
```

### 6. List Items
```http
GET /items?skip=0&limit=100
```

**Response:**
```json
{
  "items": [
    {
      "item_id": 1,
      "title": "Action Movie 1",
      "genre": "Action",
      "year": 2020
    }
  ],
  "total": 5000
}
```

### 7. Get Model Info
```http
GET /model/info
```

**Response:**
```json
{
  "model_name": "CoLLM",
  "architecture": {
    "llm": "microsoft/DialoGPT-medium",
    "collaborative_model": "MatrixFactorization",
    "cie_layers": 3,
    "lora_rank": 8,
    "lora_alpha": 16
  },
  "training": {
    "two_step_training": true,
    "step1": "LoRA fine-tuning with text-only prompts",
    "step2": "CIE module tuning with collaborative + text"
  },
  "datasets": {
    "num_users": 1000,
    "num_items": 5000
  }
}
```

## Error Handling

### Status Codes
| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid parameters |
| 404 | Not Found | User or item not found |
| 422 | Validation Error | Pydantic validation failed |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Model not loaded |

### Error Response Format
```json
{
  "detail": "Error description"
}
```

## Rate Limiting

Production deployment should implement:
- 100 requests/minute per API key
- 1000 requests/hour per user
- Burst allowance: 20 requests

## SDK Examples

### Python
```python
import requests

API_URL = "http://localhost:8000"

# Get recommendations
response = requests.post(f"{API_URL}/recommend", json={
    "user_id": "42",
    "num_recommendations": 5
})
recommendations = response.json()

# Record interaction
requests.post(f"{API_URL}/interact", json={
    "user_id": "42",
    "item_id": "123",
    "rating": 4.5
})
```

### JavaScript
```javascript
const API_URL = 'http://localhost:8000';

// Get recommendations
async function getRecommendations(userId, numRecs = 5) {
  const response = await fetch(`${API_URL}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, num_recommendations: numRecs })
  });
  return await response.json();
}

// Usage
getRecommendations('42', 5).then(data => {
  console.log(data.recommendations);
});
```

### cURL
```bash
# Get recommendations
curl -X POST "http://localhost:8000/recommend" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "42", "num_recommendations": 5}'

# Record interaction
curl -X POST "http://localhost:8000/interact" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "42", "item_id": "123", "rating": 4.5}'
```
