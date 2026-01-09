#!/bin/bash

echo "======================================"
echo "FormBackend SaaS - Setup Script"
echo "======================================"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js found: $(node --version)"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..
echo "✓ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..
echo "✓ Frontend dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating .env file..."
    cp backend/.env.example backend/.env
    echo "✓ Created backend/.env - IMPORTANT: Update this file with your credentials!"
    echo ""
    echo "⚠️  You MUST update the following in backend/.env:"
    echo "   - JWT_SECRET (use a random string)"
    echo "   - SMTP credentials (for email notifications)"
    echo "   - Stripe keys (for payments)"
    echo ""
else
    echo "✓ .env file already exists"
    echo ""
fi

echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your credentials"
echo "2. Run './start.sh' to start the application"
echo ""
