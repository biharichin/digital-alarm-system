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
            userNameElement.textContent = `Welcome, ${user.username}!`;
        }
        
        // Load user's profile picture
        this.loadUserProfilePicture(user);
        
        // Also refresh profile picture in AlarmSystem if available
        setTimeout(() => {
            if (window.alarmSystem && window.alarmSystem.refreshProfilePicture) {
                window.alarmSystem.refreshProfilePicture();
            }
        }, 200);
    }

    loadUserProfilePicture(user) {
        if (user && user.id) {
            const storageKey = `profile_${user.id}`;
            let savedImage = localStorage.getItem(storageKey);
            
            // If object URL is not available, try base64 data
            if (!savedImage) {
                savedImage = localStorage.getItem(`${storageKey}_data`);
            }
            
            if (savedImage) {
                const profilePic = document.getElementById('profilePicture');
                if (profilePic) {
                    profilePic.innerHTML = `<img src="${savedImage}" alt="Profile Picture">`;
                }
            }
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
        // Clear user session but preserve user-specific data
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || 
                           JSON.parse(sessionStorage.getItem('currentUser'));
        
        // Store user ID for preserving data
        const userId = currentUser ? currentUser.id : null;
        
        // Clear session data
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
        
        // Note: Profile pictures and other user data are preserved in localStorage
        // They will be automatically loaded when user logs back in
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
}

// Initialize auth check when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AuthCheck();
}); 