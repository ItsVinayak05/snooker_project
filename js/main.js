// Main application logic

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const navMenu = document.querySelector('nav ul');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('show');
        });
    }
    
    // Initialize pages
    if (document.querySelector('.dashboard')) {
        initializeDashboard();
    }
    
    if (document.querySelector('.booking-section')) {
        initializeBookingPage();
    }
    
    if (document.querySelector('.admin-dashboard')) {
        initializeAdminPage();
    }
    
    // Logout buttons
    const userLogoutBtn = document.getElementById('logoutBtn');
    if (userLogoutBtn) {
        userLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    }
    
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutAdmin();
        });
    }
});

// Initialize admin page
function initializeAdminPage() {
    const admin = getCurrentAdmin();
    if (!admin) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load admin data
    loadAdminStats();
    loadAllBookings();
    
    // Tab functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const tabId = this.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`${tabId}Tab`).classList.add('active');
            
            // Load data for the selected tab
            if (tabId === 'members') loadAllMembers();
            if (tabId === 'payments') loadAllPayments();
        });
    });
    
    // Filter buttons
    document.getElementById('filterBookingsBtn').addEventListener('click', function() {
        const date = document.getElementById('bookingDateFilter').value;
        filterBookings(date);
    });
    
    document.getElementById('resetBookingsFilterBtn').addEventListener('click', function() {
        document.getElementById('bookingDateFilter').value = '';
        loadAllBookings();
    });
    
    document.getElementById('searchMemberBtn').addEventListener('click', function() {
        const searchTerm = document.getElementById('memberSearch').value;
        searchMembers(searchTerm);
    });
    
    document.getElementById('filterPaymentsBtn').addEventListener('click', function() {
        const month = document.getElementById('paymentMonthFilter').value;
        filterPayments(month);
    });
}

// Admin functions
function loadAdminStats() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    const today = new Date().toISOString().split('T')[0];
    
    document.getElementById('totalMembers').textContent = users.length;
    document.getElementById('todayBookings').textContent = bookings.filter(b => b.date === today).length;
    
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthBookings = bookings.filter(b => {
        const [year, month] = b.date.split('-');
        return parseInt(month) === currentMonth && parseInt(year) === currentYear;
    });
    
    const monthlyRevenue = monthBookings.reduce((sum, b) => sum + b.amount, 0);
    document.getElementById('monthlyRevenue').textContent = `₹${monthlyRevenue.toFixed(2)}`;
}

function loadAllBookings() {
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    renderBookingsTable(bookings, users);
}

function filterBookings(date) {
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    const filtered = date ? bookings.filter(b => b.date === date) : bookings;
    renderBookingsTable(filtered, users);
}

function renderBookingsTable(bookings, users) {
    const tableBody = document.getElementById('bookingsTable');
    tableBody.innerHTML = '';
    
    if (bookings.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">No bookings found</td></tr>';
        return;
    }
    
    bookings.sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));
    
    bookings.forEach(booking => {
        const user = users.find(u => u.id === booking.userId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${booking.id.slice(-6)}</td>
            <td>${user ? user.name : 'Unknown'}</td>
            <td>${formatDate(booking.date)}</td>
            <td>${formatTime(booking.time)}</td>
            <td>${booking.duration} hr</td>
            <td>${booking.partnerName || '-'}</td>
            <td>₹${booking.amount.toFixed(2)}</td>
            <td><span class="status-badge confirmed">Confirmed</span></td>
        `;
        tableBody.appendChild(row);
    });
}

// Add similar functions for members and payments management
function loadAllMembers() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const tableBody = document.getElementById('membersTable');
    tableBody.innerHTML = '';
    
    if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7">No members found</td></tr>';
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id.slice(-6)}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>${formatDate(user.joinDate)}</td>
            <td>₹${user.balance.toFixed(2)}</td>
            <td><button class="btn btn-small">View</button></td>
        `;
        tableBody.appendChild(row);
    });
}

function searchMembers(searchTerm) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const filtered = searchTerm ? 
        users.filter(u => 
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.phone.includes(searchTerm)
        ) : users;
    
    renderMembersTable(filtered);
}

function renderMembersTable(users) {
    const tableBody = document.getElementById('membersTable');
    tableBody.innerHTML = '';
    
    if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7">No members found</td></tr>';
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id.slice(-6)}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>${formatDate(user.joinDate)}</td>
            <td>₹${user.balance.toFixed(2)}</td>
            <td><button class="btn btn-small">View</button></td>
        `;
        tableBody.appendChild(row);
    });
}