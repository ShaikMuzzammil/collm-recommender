#!/bin/bash
# CoLLM Quick Start Script

echo "=========================================="
echo "  CoLLM Capstone Project - Quick Start"
echo "=========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker and Docker Compose found"
echo ""

# Deploy
echo "Deploying CoLLM services..."
cd deployment
docker-compose up -d --build

echo ""
echo "=========================================="
echo "  ✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Access your application:"
echo "  🌐 Frontend: http://localhost:3000"
echo "  🔌 API:      http://localhost:8000"
echo "  📚 API Docs: http://localhost:8000/docs"
echo "  🔍 Redoc:    http://localhost:8000/redoc"
echo ""
echo "View logs:"
echo "  docker-compose logs -f"
echo ""
echo "Stop services:"
echo "  docker-compose down"
echo ""
echo "=========================================="
