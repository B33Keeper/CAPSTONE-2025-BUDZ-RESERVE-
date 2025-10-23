#!/bin/bash

echo "Starting Budz Reserve Development Environment..."
echo

# Check if Docker is running
if ! docker --version >/dev/null 2>&1; then
    echo "ERROR: Docker is not installed or not running!"
    echo "Please install Docker and start it."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp env.template .env
    echo "Please edit .env file with your configuration before running again."
    exit 1
fi

echo "Starting services with Docker Compose..."
docker-compose -f docker-compose.dev.yml up --build



