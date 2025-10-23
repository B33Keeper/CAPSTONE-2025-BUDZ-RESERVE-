#!/bin/bash

echo "Starting Budz Reserve Production Environment..."
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
    echo "Please edit .env file with your production configuration before running again."
    exit 1
fi

echo "Starting services with Docker Compose..."
docker-compose up --build -d

echo
echo "Services started successfully!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo
echo "To view logs: docker-compose logs -f"
echo "To stop services: docker-compose down"
echo



