const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const weatherRoutes = require('./routes/weather');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../')));

// Routes
app.use('/api/weather', weatherRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Weather API Server is running' });
});

// Simple catch-all route - REMOVED THE PROBLEMATIC '*'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌤️ Weather API endpoints available at http://localhost:${PORT}/api/weather`);
});