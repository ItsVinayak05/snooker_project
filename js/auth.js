// Authentication functions

// Check if user is logged in
function checkAuth() {
    if (window.location.pathname.includes('admin.html')) {
        if (!getCurrentAdmin()) {
            window.location.href = 'login.html';
        }
    } else if (window.location.pathname.includes('dashboard.html') || 
               window.location.pathname.includes('booking.html')) {
        if (!getCurrentUser()) {
            window.location.href = 'login.html';
        }
    }
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// Get current admin
function getCurrentAdmin() {
    const admin = localStorage.getItem('currentAdmin');
    return admin ? JSON.parse(admin) : null;
}

// Register new user
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            
            const users = JSON.parse(localStorage.getItem('users')) || [];
            
            if (users.some(user => user.email === email)) {
                alert('Email already registered!');
                return;
            }
            
            const newUser = {
                id: Date.now().toString(),
                name: fullName,
                email,
                phone,
                password,
                joinDate: new Date().toISOString(),
                balance: 0
            };
            
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            alert('Registration successful! Please login.');
            window.location.href = 'login.html';
        });
    }
    
    // Login user
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Check admin login
            if (email === 'admin@indorama.com' && password === 'admin123') {
                const admin = {
                    id: 'admin1',
                    name: 'Admin',
                    email: 'admin@indorama.com'
                };
                localStorage.setItem('currentAdmin', JSON.stringify(admin));
                window.location.href = 'admin.html';
                return;
            }
            
            // Check regular users
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                window.location.href = 'dashboard.html';
            } else {
                alert('Invalid email or password!');
            }
        });
    }
});

// Logout user
function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Logout admin
function logoutAdmin() {
    localStorage.removeItem('currentAdmin');
    window.location.href = 'login.html';
}

// Initialize auth check
checkAuth();