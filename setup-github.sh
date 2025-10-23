#!/bin/bash

echo "Setting up Budz Reserve for GitHub upload..."
echo

# Create .env file from template
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp env.template .env
    echo ".env file created. Please review and update with your settings."
else
    echo ".env file already exists."
fi

# Create uploads directory structure
if [ ! -d uploads ]; then
    echo "Creating uploads directory..."
    mkdir -p uploads/avatars uploads/general
    touch uploads/.gitkeep
    touch uploads/avatars/.gitkeep
    touch uploads/general/.gitkeep
fi

# Install dependencies
echo "Installing dependencies..."
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

echo
echo "Setup complete! Your project is ready for GitHub upload."
echo
echo "Next steps:"
echo "1. Review and update .env file with your settings"
echo "2. Test the application: ./start-dev.sh"
echo "3. Commit and push to GitHub"
echo



