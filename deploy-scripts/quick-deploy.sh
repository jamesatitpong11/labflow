#!/bin/bash

# Quick Deploy Script for LabFlow Clinic
echo "🚀 Starting LabFlow Clinic Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Building frontend for production..."
npm run build:netlify

if [ $? -eq 0 ]; then
    print_status "Frontend build completed successfully!"
    print_status "📁 Built files are in the 'dist' directory"
    echo ""
    print_warning "Next steps:"
    echo "1. 📤 Upload the 'dist' folder to Netlify"
    echo "2. 🔧 Set environment variables in Netlify:"
    echo "   VITE_API_URL=https://your-render-backend.onrender.com"
    echo "   VITE_APP_ENV=production"
    echo ""
    echo "3. 🖥️  Deploy backend to Render using the 'backend' folder"
    echo "4. 🔧 Set environment variables in Render:"
    echo "   NODE_ENV=production"
    echo "   MONGODB_URI=your-mongodb-connection-string"
    echo "   FRONTEND_URL=https://your-netlify-app.netlify.app"
    echo ""
    print_status "🎉 Ready for deployment!"
else
    print_error "Build failed! Please check the errors above."
    exit 1
fi
