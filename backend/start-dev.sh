#!/bin/sh

# Handle SIGTERM and SIGINT signals properly
trap 'echo "Received signal, shutting down gracefully..."; kill -TERM $CHILD_PID; wait $CHILD_PID' TERM INT

# Start the NestJS application in the background
npm run start:dev &
CHILD_PID=$!

# Wait for the child process
wait $CHILD_PID
