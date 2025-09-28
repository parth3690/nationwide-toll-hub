/**
 * Nationwide Toll Hub - Local Development Server
 * 
 * Simple Express server for local testing and demonstration
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mock data
const mockTolls = [
  {
    id: 'toll-001',
    agency: 'California DOT',
    location: 'Golden Gate Bridge',
    amount: 8.75,
    timestamp: '2024-12-28T10:30:00Z',
    vehicleId: 'ABC123',
    status: 'paid'
  },
  {
    id: 'toll-002',
    agency: 'New York MTA',
    location: 'Verrazzano Bridge',
    amount: 19.00,
    timestamp: '2024-12-28T09:15:00Z',
    vehicleId: 'XYZ789',
    status: 'unpaid'
  },
  {
    id: 'toll-003',
    agency: 'Florida DOT',
    location: 'SunPass',
    amount: 2.50,
    timestamp: '2024-12-27T16:45:00Z',
    vehicleId: 'DEF456',
    status: 'paid'
  }
];

const mockStatements = [
  {
    id: 'stmt-001',
    month: 'December 2024',
    totalAmount: 30.25,
    tollCount: 3,
    status: 'unpaid',
    dueDate: '2025-01-15'
  }
];

const mockUser = {
  id: 'user-123',
  email: 'demo@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1-555-0123',
  vehicles: ['ABC123', 'XYZ789', 'DEF456']
};

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Nationwide Toll Hub API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'GET /api/tolls - Get toll events',
      'GET /api/statements - Get statements',
      'GET /api/user - Get user info',
      'POST /api/auth/login - Login',
      'POST /api/payments - Process payment'
    ]
  });
});

// Authentication
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'demo@example.com' && password === 'demo123') {
    res.json({
      success: true,
      user: mockUser,
      token: 'mock-jwt-token-' + Date.now()
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// User info
app.get('/api/user', (req, res) => {
  res.json({
    success: true,
    user: mockUser
  });
});

// Toll events
app.get('/api/tolls', (req, res) => {
  const { status, agency, limit = 10 } = req.query;
  
  let filteredTolls = [...mockTolls];
  
  if (status) {
    filteredTolls = filteredTolls.filter(toll => toll.status === status);
  }
  
  if (agency) {
    filteredTolls = filteredTolls.filter(toll => 
      toll.agency.toLowerCase().includes(agency.toLowerCase())
    );
  }
  
  filteredTolls = filteredTolls.slice(0, parseInt(limit));
  
  res.json({
    success: true,
    data: filteredTolls,
    total: filteredTolls.length
  });
});

app.get('/api/tolls/:id', (req, res) => {
  const toll = mockTolls.find(t => t.id === req.params.id);
  
  if (toll) {
    res.json({
      success: true,
      data: toll
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Toll event not found'
    });
  }
});

// Statements
app.get('/api/statements', (req, res) => {
  res.json({
    success: true,
    data: mockStatements
  });
});

app.get('/api/statements/:id', (req, res) => {
  const statement = mockStatements.find(s => s.id === req.params.id);
  
  if (statement) {
    res.json({
      success: true,
      data: statement
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Statement not found'
    });
  }
});

// Payments
app.post('/api/payments', (req, res) => {
  const { tollId, amount, paymentMethod } = req.body;
  
  if (!tollId || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  // Mock payment processing
  res.json({
    success: true,
    paymentId: 'pay-' + Date.now(),
    amount: amount,
    status: 'completed',
    timestamp: new Date().toISOString()
  });
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  const totalTolls = mockTolls.length;
  const paidTolls = mockTolls.filter(t => t.status === 'paid').length;
  const unpaidTolls = mockTolls.filter(t => t.status === 'unpaid').length;
  const totalAmount = mockTolls.reduce((sum, toll) => sum + toll.amount, 0);
  const unpaidAmount = mockTolls
    .filter(t => t.status === 'unpaid')
    .reduce((sum, toll) => sum + toll.amount, 0);
  
  res.json({
    success: true,
    data: {
      totalTolls,
      paidTolls,
      unpaidTolls,
      totalAmount: totalAmount.toFixed(2),
      unpaidAmount: unpaidAmount.toFixed(2),
      monthlySpending: totalAmount.toFixed(2)
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Nationwide Toll Hub API Server');
  console.log('================================');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🔗 API Documentation: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log('  GET  /api/tolls - Get toll events');
  console.log('  GET  /api/statements - Get statements');
  console.log('  GET  /api/user - Get user info');
  console.log('  POST /api/auth/login - Login (demo@example.com / demo123)');
  console.log('  POST /api/payments - Process payment');
  console.log('  GET  /api/dashboard/stats - Dashboard statistics');
  console.log('');
  console.log('🎉 Server is ready for testing!');
});

module.exports = app;
