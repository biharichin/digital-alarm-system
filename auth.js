class AuthSystem {
    constructor() {
        // API base URL - supports both localhost and network access
this.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3001/api' 
    : 'http://192.168.94.218:3001/api';
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.userStats = JSON.parse(localStorage.getItem('userStats')) || {};
        
        this.init();
    }

    init() {
        this.checkCountryAccess();
        this.setupEventListeners();
        this.checkAuthStatus();
        this.loadUserStats();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Form submissions
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('signupFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        // Password toggle
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.togglePassword(e.target.closest('.form-group').querySelector('input'));
            });
        });

        // Success modal button
        document.getElementById('successBtn').addEventListener('click', () => {
            this.hideSuccessModal();
        });
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tab}Form`).classList.add('active');
    }

    async handleSignup() {
        const username = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim().toLowerCase();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const age = parseInt(document.getElementById('signupAge').value);
        const country = document.getElementById('signupCountry').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Validation
        if (!this.validateSignup(username, email, password, confirmPassword, age, country, agreeTerms)) {
            return;
        }

        this.showLoading();

        try {
            // Send registration request to backend
            const response = await fetch(`${this.API_BASE_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password,
                    age: age,
                    country: country
                })
            });

            const result = await response.json();

            if (result.success) {
                // Track user registration
                this.trackUserAction('signup', { email, username, age });

                // Show success
                this.hideLoading();
                this.showSuccessModal('Account Created!', 'Your account has been created successfully. You can now log in.');

                // Clear form
                document.getElementById('signupFormElement').reset();
            } else {
                this.hideLoading();
                this.showError(result.message || 'Registration failed. Please try again.');
            }

        } catch (error) {
            this.hideLoading();
            this.showError('Connection error. Please check if the backend server is running.');
            console.error('Signup error:', error);
        }
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validation
        if (!this.validateLogin(email, password)) {
            return;
        }

        this.showLoading();

        try {
            // Send login request to backend
            const response = await fetch(`${this.API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const result = await response.json();

            if (result.success) {
                // Set current user
                this.currentUser = {
                    id: result.user.id,
                    username: result.user.username,
                    email: result.user.email,
                    age: result.user.age
                };

                if (rememberMe) {
                    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                } else {
                    sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                }

                // Track user login
                this.trackUserAction('login', { email, username: result.user.username });

                // Redirect to alarm system
                this.hideLoading();
                window.location.href = 'dashboard.html';
            } else {
                this.hideLoading();
                this.showError(result.message || 'Invalid email or password.');
            }

        } catch (error) {
            this.hideLoading();
            this.showError('Connection error. Please check if the backend server is running.');
            console.error('Login error:', error);
        }
    }

    validateSignup(name, email, password, confirmPassword, age, country, agreeTerms) {
        // Name validation
        if (name.length < 2) {
            this.showError('Name must be at least 2 characters long.');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError('Please enter a valid email address.');
            return false;
        }

        // Age validation
        if (!age || age < 18) {
            this.showError('You must be 18 or older to use this app. Only 18+ users allowed.');
            return false;
        }

        if (age > 120) {
            this.showError('Please enter a valid age.');
            return false;
        }

        // Country validation - Only India is allowed
        if (!country || country === '') {
            this.showError('Please select your country.');
            return false;
        }

        if (country !== 'India') {
            this.showError('Sorry, this application is currently only available for users from India. Only Indian citizens can sign up.');
            return false;
        }

        // Password validation
        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long.');
            return false;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match.');
            return false;
        }

        // Terms agreement
        if (!agreeTerms) {
            this.showError('Please agree to the Terms & Conditions.');
            return false;
        }

        return true;
    }

    validateLogin(email, password) {
        if (!email || !password) {
            this.showError('Please fill in all fields.');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError('Please enter a valid email address.');
            return false;
        }

        return true;
    }

    hashPassword(password) {
        // Simple hash function (in production, use bcrypt or similar)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    verifyPassword(password, hashedPassword) {
        return this.hashPassword(password) === hashedPassword;
    }

    checkCountryAccess() {
        // Check if user has confirmed they're from India
        const userCountry = sessionStorage.getItem('userCountry');
        
        if (!userCountry || userCountry !== 'India') {
            // User hasn't confirmed they're from India, redirect to country check
            window.location.href = 'country-check.html';
            return;
        } else {
            // User has confirmed they're from India, set the country field
            this.setIndiaAsSelected();
        }
    }

    setIndiaAsSelected() {
        // Set India as selected in the country dropdown
        const countrySelect = document.getElementById('signupCountry');
        if (countrySelect) {
            countrySelect.value = 'India';
        }
    }

    checkAuthStatus() {
        if (this.currentUser) {
            // User is already logged in, redirect to alarm system
            window.location.href = 'index.html';
        }
    }

    togglePassword(input) {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        
        const icon = input.parentElement.querySelector('.toggle-password i');
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('show');
    }

    showError(message) {
        // Remove existing error messages
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        
        // Create new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message show';
        errorDiv.textContent = message;
        
        // Insert at the top of the active form
        const activeForm = document.querySelector('.auth-form.active');
        activeForm.insertBefore(errorDiv, activeForm.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    showSuccessModal(title, message) {
        document.getElementById('successTitle').textContent = title;
        document.getElementById('successMessage').textContent = message;
        document.getElementById('successModal').classList.add('show');
    }

    hideSuccessModal() {
        document.getElementById('successModal').classList.remove('show');
    }

    // Update user stats on backend
    async updateUserStats(userId, stats) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/users/${userId}/stats`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(stats)
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error updating user stats:', error);
            return false;
        }
    }

    trackUserAction(action, data) {
        const timestamp = new Date().toISOString();
        const userAction = {
            action: action,
            data: data,
            timestamp: timestamp,
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            language: navigator.language
        };

        // Save to user stats
        if (!this.userStats[data.email]) {
            this.userStats[data.email] = {
                actions: [],
                firstSeen: timestamp,
                lastSeen: timestamp
            };
        }

        this.userStats[data.email].actions.push(userAction);
        this.userStats[data.email].lastSeen = timestamp;

        localStorage.setItem('userStats', JSON.stringify(this.userStats));

        // Log for analytics (in production, send to server)
        console.log('User Action:', userAction);
    }

    loadUserStats() {
        // Load user statistics for analytics
        const stats = {
            totalUsers: this.users.length,
            totalSignups: this.users.length,
            totalLogins: this.users.filter(u => u.lastLogin).length,
            recentActivity: this.users
                .filter(u => u.lastLogin)
                .sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin))
                .slice(0, 5)
        };

        // Store stats for admin dashboard
        localStorage.setItem('appStats', JSON.stringify(stats));
    }

    // Admin functions for data collection
    getUsersData() {
        return {
            users: this.users,
            stats: this.userStats,
            appStats: JSON.parse(localStorage.getItem('appStats') || '{}')
        };
    }

    exportUserData() {
        const data = this.getUsersData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alarm-system-users-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize authentication system
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});

// Add admin functions to window for easy access
window.getUsersData = () => window.authSystem.getUsersData();
window.exportUserData = () => window.authSystem.exportUserData(); 