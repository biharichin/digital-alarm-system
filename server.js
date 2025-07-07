const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
// const database = require('./config/database');
const userService = require('./services/userService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for testing
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Validation middleware
function validateUserData(req, res, next) {
    const { username, email, password, age, country } = req.body;
    
    if (!username || !email || !password || !age || !country) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required: username, email, password, age, country'
        });
    }
    
    if (username.length < 3) {
        return res.status(400).json({
            success: false,
            message: 'Username must be at least 3 characters long'
        });
    }
    
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long'
        });
    }
    
    if (age < 18) {
        return res.status(400).json({
            success: false,
            message: 'User must be at least 18 years old'
        });
    }
    
    // Country validation - Only India is allowed
    if (country !== 'India') {
        return res.status(403).json({
            success: false,
            message: 'Sorry, this application is currently only available for users from India. Only Indian citizens can sign up.'
        });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address'
        });
    }
    
    next();
}

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Alarm System Backend is running',
        timestamp: new Date().toISOString(),
        storage: userService.getStorageType()
    });
});

// User signup endpoint
app.post('/api/signup', validateUserData, async (req, res) => {
    try {
        const { username, email, password, age, country } = req.body;
        
        // Check if user already exists
        const existingUser = await userService.userExists(email, username);
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email or username already exists'
            });
        }
        
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Create new user
        const newUser = await userService.createUser({
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            age: parseInt(age),
            country: country,
            lastLogin: null,
            alarmCount: 0,
            totalAlarms: 0,
            isActive: true
        });
        
        // Return success (without password)
        const { password: _, ...userWithoutPassword } = newUser.toObject ? newUser.toObject() : newUser;
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: userWithoutPassword
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during signup'
        });
    }
});

// User login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        // Find user
        const user = await userService.findUserByEmail(email);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Update last login
        await userService.updateUser(user._id || user.id, {
            lastLogin: new Date()
        });
        
        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user.toObject ? user.toObject() : user;
        
        res.json({
            success: true,
            message: 'Login successful',
            user: userWithoutPassword
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
});

// Admin endpoint to get all users
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        
        res.json({
            success: true,
            message: 'Users retrieved successfully',
            count: users.length,
            users: users,
            storage: userService.getStorageType()
        });
        
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching users'
        });
    }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userService.findUserById(id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user.toObject ? user.toObject() : user;
        
        res.json({
            success: true,
            user: userWithoutPassword
        });
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update user stats
app.put('/api/users/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        const { alarmCount, totalAlarms } = req.body;
        
        const updatedUser = await userService.updateUserStats(id, {
            alarmCount,
            totalAlarms
        });
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User stats updated successfully'
        });
        
    } catch (error) {
        console.error('Update user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get user alarms
app.get('/api/users/:id/alarms', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userService.findUserById(id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            alarms: user.alarms || []
        });
        
    } catch (error) {
        console.error('Get user alarms error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Save user alarms
app.put('/api/users/:id/alarms', async (req, res) => {
    try {
        const { id } = req.params;
        const { alarms } = req.body;
        
        const updatedUser = await userService.updateUserAlarms(id, alarms || []);
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Alarms saved successfully'
        });
        
    } catch (error) {
        console.error('Save user alarms error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Reset user password (for testing)
app.put('/api/users/:id/reset-password', async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }
        
        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // Update user password
        const updatedUser = await userService.updateUser(id, {
            password: hashedPassword
        });
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Password reset successfully'
        });
        
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Initialize database connection and start server
async function startServer() {
    try {
        // Try to connect to MongoDB
        // await database.connectToDatabase();
        
        // Start server
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Alarm System Backend running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🌐 Network access: http://192.168.94.218:${PORT}/api/health`);
            console.log(`👥 Signup: POST http://localhost:${PORT}/api/signup`);
            console.log(`🔐 Login: POST http://localhost:${PORT}/api/login`);
            console.log(`👨‍💼 Admin: GET http://localhost:${PORT}/api/admin/users`);
            console.log(`💾 Storage: ${userService.getStorageType()}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app; 
