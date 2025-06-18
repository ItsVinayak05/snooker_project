// admin.js - Complete Admin System
const AdminSystem = {
    // Initialize admin system
    init: function() {
        this.user = Auth.getCurrentUser();
        if (!this.user || !this.user.isAdmin) {
            window.location.href = 'login.html';
            return;
        }

        this.loadAdminStats();
        this.loadAllBookings();
        this.setupEventListeners();
    },

    // Load admin statistics
    loadAdminStats: function() {
        const users = DB.getUsers().filter(u => !u.isAdmin);
        const bookings = DB.getBookings();
        const today = new Date().toISOString().split('T')[0];
        
        document.getElementById('totalMembers').textContent = users.length;
        document.getElementById('todayBookings').textContent = bookings.filter(b => b.date === today).length;
        
        const currentMonth = new Date().getMonth() + 1;
        const monthRevenue = bookings
            .filter(b => new Date(b.date).getMonth() + 1 === currentMonth)
            .reduce((sum, b) => sum + b.amount, 0);
        document.getElementById('monthlyRevenue').textContent = `₹${monthRevenue.toFixed(2)}`;
    },

    // Load all bookings
    loadAllBookings: function() {
        const bookings = DB.getBookings();
        const users = DB.getUsers();
        
        const tableBody = document.getElementById('bookingsTable');
        tableBody.innerHTML = bookings.sort((a, b) => 
            new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time)
        ).map(b => {
            const user = users.find(u => u.id === b.userId);
            return `
                <tr>
                    <td>${b.id.slice(-6)}</td>
                    <td>${user?.name || 'Unknown'}</td>
                    <td>${this.formatDate(b.date)}</td>
                    <td>${this.formatTime(b.time)}</td>
                    <td>${b.duration} hr</td>
                    <td>${b.partnerName || '-'}</td>
                    <td>₹${b.amount.toFixed(2)}</td>
                    <td><span class="status-badge confirmed">Confirmed</span></td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="8">No bookings found</td></tr>';
    },

    // Setup event listeners
    setupEventListeners: function() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const tabId = e.target.getAttribute('data-tab');
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(`${tabId}Tab`).classList.add('active');
                
                // Load data for the selected tab
                if (tabId === 'members') this.loadAllMembers();
                if (tabId === 'payments') this.loadAllPayments();
            });
        });

        // Booking date filter
        document.getElementById('filterBookingsBtn').addEventListener('click', () => {
            const date = document.getElementById('bookingDateFilter').value;
            this.filterBookingsByDate(date);
        });

        // Reset booking filter
        document.getElementById('resetBookingsFilterBtn').addEventListener('click', () => {
            document.getElementById('bookingDateFilter').value = '';
            this.loadAllBookings();
        });

        // Member search
        document.getElementById('searchMemberBtn').addEventListener('click', () => {
            const searchTerm = document.getElementById('memberSearch').value.trim();
            this.searchMembers(searchTerm);
        });

        // Payment month filter
        document.getElementById('filterPaymentsBtn').addEventListener('click', () => {
            const month = document.getElementById('paymentMonthFilter').value;
            this.filterPaymentsByMonth(month);
        });
    },

    // Filter bookings by date
    filterBookingsByDate: function(date) {
        if (!date) return;
        
        const filtered = DB.getBookings().filter(b => b.date === date);
        this.renderBookingsTable(filtered);
    },

    // Load all members
    loadAllMembers: function() {
        const users = DB.getUsers().filter(u => !u.isAdmin);
        this.renderMembersTable(users);
    },

    // Search members
    searchMembers: function(searchTerm) {
        const users = DB.getUsers().filter(u => 
            !u.isAdmin && (
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.phone.includes(searchTerm)
            )
        );
        this.renderMembersTable(users);
    },

    // Render members table
    renderMembersTable: function(users) {
        document.getElementById('membersTable').innerHTML = users.map(u => `
            <tr>
                <td>${u.id.slice(-6)}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${u.phone}</td>
                <td>${this.formatDate(u.joinDate)}</td>
                <td>₹${u.balance.toFixed(2)}</td>
                <td><button class="btn btn-small">View</button></td>
            </tr>
        `).join('') || '<tr><td colspan="7">No members found</td></tr>';
    },

    // Load all payments
    loadAllPayments: function() {
        const payments = DB.getPayments();
        const users = DB.getUsers();
        
        document.getElementById('paymentsTable').innerHTML = payments.map(p => {
            const user = users.find(u => u.id === p.userId);
            return `
                <tr>
                    <td>${p.id.slice(-6)}</td>
                    <td>${user?.name || 'Unknown'}</td>
                    <td>${this.getMonthName(p.month)} ${p.year}</td>
                    <td>${p.hours}</td>
                    <td>₹${p.amount.toFixed(2)}</td>
                    <td><span class="status-badge ${p.status}">${p.status}</span></td>
                    <td><button class="btn btn-small">${p.status === 'paid' ? 'Receipt' : 'Mark Paid'}</button></td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="7">No payments found</td></tr>';
    },

    // Filter payments by month
    filterPaymentsByMonth: function(month) {
        const payments = month === 'all' 
            ? DB.getPayments() 
            : DB.getPayments().filter(p => p.month === parseInt(month));
        this.renderPaymentsTable(payments);
    },

    // Helper functions
    formatDate: function(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    },

    formatTime: function(time24) {
        const [hours, minutes] = time24.split(':');
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes} ${period}`;
    },

    getMonthName: function(monthNumber) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months[monthNumber - 1] || '';
    }
};

// Initialize admin system when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    AdminSystem.init();
});