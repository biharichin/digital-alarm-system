const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string (will be set via environment variable)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alarm-system';

// Database connection options
const dbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

// Connect to MongoDB
async function connectToDatabase() {
    try {
        await mongoose.connect(MONGODB_URI, dbOptions);
        console.log('✅ Connected to MongoDB Atlas database');
        console.log(`📊 Database: ${mongoose.connection.name}`);
        console.log(`🌐 Connection: ${mongoose.connection.host}:${mongoose.connection.port}`);
        return true;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.log('⚠️  Falling back to local file storage');
        return false;
    }
}

// Disconnect from database
async function disconnectFromDatabase() {
    try {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error disconnecting from MongoDB:', error.message);
    }
}

// Check if database is connected
function isDatabaseConnected() {
    return mongoose.connection.readyState === 1;
}

module.exports = {
    connectToDatabase,
    disconnectFromDatabase,
    isDatabaseConnected,
    mongoose
}; 