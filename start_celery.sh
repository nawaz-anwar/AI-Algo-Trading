#!/bin/bash

echo "🚀 Starting Celery Worker for CryptoAlgo"
echo "=========================================="

cd Backend

# Activate virtual environment
source venv/bin/activate

# Start Celery worker
celery -A app.tasks.celery_app worker --loglevel=INFO --concurrency=2

