const User = require('../models/User');
const { isDatabaseConnected } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// File storage fallback
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

class UserService {
    constructor() {
        this.useDatabase = false;
        this.initializeStorage();
    }

    async initializeStorage() {
        this.useDatabase = await isDatabaseConnected();
        if (!this.useDatabase) {
            await this.ensureDataDirectory();
        }
    }

    // File storage methods (fallback)
    async ensureDataDirectory() {
        const dataDir = path.dirname(USERS_FILE);
        try {
            await fs.access(dataDir);
        } catch {
            await fs.mkdir(dataDir, { recursive: true });
        }
    }

    async readUsersFromFile() {
        try {
            const data = await fs.readFile(USERS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    async writeUsersToFile(users) {
        await this.ensureDataDirectory();
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    }

    // Database methods
    async createUser(userData) {
        if (this.useDatabase) {
            const user = new User(userData);
            return await user.save();
        } else {
            const users = await this.readUsersFromFile();
            const newUser = {
                _id: uuidv4(),
                ...userData,
                createdAt: new Date(),
                alarms: []
            };
            users.push(newUser);
            await this.writeUsersToFile(users);
            return newUser;
        }
    }

    async findUserByEmail(email) {
        if (this.useDatabase) {
            return await User.findOne({ email: email.toLowerCase() });
        } else {
            const users = await this.readUsersFromFile();
            return users.find(user => user.email.toLowerCase() === email.toLowerCase());
        }
    }

    async findUserById(id) {
        if (this.useDatabase) {
            return await User.findById(id);
        } else {
            const users = await this.readUsersFromFile();
            return users.find(user => user._id === id);
        }
    }

    async findUserByUsername(username) {
        if (this.useDatabase) {
            return await User.findOne({ username: username.toLowerCase() });
        } else {
            const users = await this.readUsersFromFile();
            return users.find(user => user.username.toLowerCase() === username.toLowerCase());
        }
    }

    async updateUser(id, updateData) {
        if (this.useDatabase) {
            return await User.findByIdAndUpdate(id, updateData, { new: true });
        } else {
            const users = await this.readUsersFromFile();
            const userIndex = users.findIndex(user => user._id === id);
            if (userIndex === -1) return null;
            
            users[userIndex] = { ...users[userIndex], ...updateData };
            await this.writeUsersToFile(users);
            return users[userIndex];
        }
    }

    async getAllUsers() {
        if (this.useDatabase) {
            return await User.find({}, '-password');
        } else {
            const users = await this.readUsersFromFile();
            return users.map(user => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
        }
    }

    async updateUserAlarms(id, alarms) {
        if (this.useDatabase) {
            return await User.findByIdAndUpdate(id, {
                alarms: alarms,
                alarmCount: alarms.length,
                totalAlarms: alarms.length
            }, { new: true });
        } else {
            const users = await this.readUsersFromFile();
            const userIndex = users.findIndex(user => user._id === id);
            if (userIndex === -1) return null;
            
            users[userIndex].alarms = alarms;
            users[userIndex].alarmCount = alarms.length;
            users[userIndex].totalAlarms = alarms.length;
            
            await this.writeUsersToFile(users);
            return users[userIndex];
        }
    }

    async updateUserStats(id, stats) {
        if (this.useDatabase) {
            return await User.findByIdAndUpdate(id, stats, { new: true });
        } else {
            const users = await this.readUsersFromFile();
            const userIndex = users.findIndex(user => user._id === id);
            if (userIndex === -1) return null;
            
            users[userIndex] = { ...users[userIndex], ...stats };
            await this.writeUsersToFile(users);
            return users[userIndex];
        }
    }

    // Check if user exists
    async userExists(email, username) {
        if (this.useDatabase) {
            const existingUser = await User.findOne({
                $or: [
                    { email: email.toLowerCase() },
                    { username: username.toLowerCase() }
                ]
            });
            return existingUser;
        } else {
            const users = await this.readUsersFromFile();
            return users.find(user => 
                user.email.toLowerCase() === email.toLowerCase() || 
                user.username.toLowerCase() === username.toLowerCase()
            );
        }
    }

    // Get storage type
    getStorageType() {
        return this.useDatabase ? 'MongoDB Atlas' : 'Local File Storage';
    }
}

module.exports = new UserService(); 