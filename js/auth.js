// auth.js - Complete Authentication System
const Auth = {
    // Initialize authentication system
    init: function() {
        this.checkAuthState();
        this.setupEventListeners();
    },

    // Check if user is logged in
    checkAuthState: function() {
        const protectedPages = ['dashboard.html', 'booking.html', 'admin.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage)) {
            const user = this.getCurrentUser();
            if (!user) {
                window.location.href = 'login.html';
                return;
            }
            
            // Redirect admin away from regular pages
            if (currentPage !== 'admin.html' && user.isAdmin) {
                window.location.href = 'admin.html';
            }
            
            // Redirect regular users away from admin page
            if (currentPage === 'admin.html' && !user.isAdmin) {
                window.location.href = 'dashboard.html';
            }
        }
    },

    // Get current logged in user
    getCurrentUser: function() {
        return JSON.parse(localStorage.getItem('currentUser'));
    },

    // Setup all authentication event listeners
    setupEventListeners: function() {
        // Registration form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration();
            });
        }

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Logout buttons
        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        });
    },

    // Handle user registration
    handleRegistration: function() {
        const name = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate inputs
        if (!name || !email || !phone || !password || !confirmPassword) {
            alert('Please fill all fields!');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        // Check if email already exists
        const users = DB.getUsers();
        if (users.some(user => user.email === email)) {
            alert('Email already registered!');
            return;
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            phone,
            password,
            joinDate: new Date().toISOString(),
            balance: 0,
            isAdmin: false
        };

        // Save user
        DB.addUser(newUser);
        alert('Registration successful! Please login.');
        window.location.href = 'login.html';
    },

    // Handle user login
    handleLogin: function() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Find user
        const user = DB.getUsers().find(u => u.email === email && u.password === password);

        if (!user) {
            alert('Invalid email or password!');
            return;
        }

        // Set current user
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Redirect based on role
        if (user.isAdmin) {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    },

    // Handle logout
    handleLogout: function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
};

// Initialize authentication system when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    Auth.init();
});