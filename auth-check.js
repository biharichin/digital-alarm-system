// Authentication Check Script
class AuthCheck {
    constructor() {
        this.checkAuth();
        this.setupLogout();
    }

    checkAuth() {
        // Check if user is logged in
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || 
                           JSON.parse(sessionStorage.getItem('currentUser'));

        if (!currentUser) {
            // Not logged in, redirect to login page
            window.location.href = 'index.html';
            return;
        }

        // User is logged in, display user info
        this.displayUserInfo(currentUser);
    }

    displayUserInfo(user) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = `Welcome, ${user.name}!`;
        }
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    logout() {
        // Clear user session
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
}

// Initialize auth check when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AuthCheck();
}); 