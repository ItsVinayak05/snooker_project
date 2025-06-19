// Admin system
const Admin = {
    init: function() {
        this.currentUser = Auth.currentUser;
        if (!this.currentUser || !this.currentUser.isAdmin) {
            window.location.href = 'login.html';
            return;
        }

        this.loadStats();
        this.loadAllBookings();
        this.setupEventListeners();
    },

    loadStats: function() {
        const users = DB.getUsers().filter(user => !user.isAdmin);
        const bookings = DB.getBookings();
        const today = new Date().toISOString().split('T')[0];
        
        document.getElementById('totalMembers').textContent = users.length;
        document.getElementById('todayBookings').textContent = bookings.filter(booking => booking.date === today).length;
        
        const currentMonth = new Date().getMonth() + 1;
        const monthRevenue = bookings
            .filter(booking => {
                const [year, month] = booking.date.split('-');
                return parseInt(month) === currentMonth;
            })
            .reduce((sum, booking) => sum + booking.amount, 0);
        
        document.getElementById('monthlyRevenue').textContent = `₹${monthRevenue.toFixed(2)}`;
    },

    loadAllBookings: function() {
        const bookings = DB.getBookings();
        const users = DB.getUsers();
        
        const tableBody = document.getElementById('bookingsTable');
        tableBody.innerHTML = '';

        if (bookings.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8">No bookings found</td></tr>';
            return;
        }

        bookings.sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time))
            .forEach(booking => {
                const user = users.find(u => u.id === booking.userId);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${booking.id.slice(-6)}</td>
                    <td>${user?.name || 'Unknown'}</td>
                    <td>${this.formatDate(booking.date)}</td>
                    <td>${this.formatTime(booking.time)}</td>
                    <td>${booking.duration} hr</td>
                    <td>${booking.partnerName || '-'}</td>
                    <td>₹${booking.amount.toFixed(2)}</td>
                    <td><span class="status-badge confirmed">Confirmed</span></td>
                `;
                tableBody.appendChild(row);
            });
    },

    setupEventListeners: function() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const tabId = e.target.getAttribute('data-tab');
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(`${tabId}Tab`).classList.add('active');
                
                if (tabId === 'members') this.loadAllMembers();
                if (tabId === 'payments') this.loadAllPayments();
            });
        });

        // Booking date filter
        document.getElementById('filterBookingsBtn').addEventListener('click', () => {
            const date = document.getElementById('bookingDateFilter').value;
            this.filterBookings(date);
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
            this.filterPayments(month);
        });
    },

    loadAllMembers: function() {
        const users = DB.getUsers().filter(user => !user.isAdmin);
        this.renderMembersTable(users);
    },

    searchMembers: function(searchTerm) {
        const users = DB.getUsers().filter(user => 
            !user.isAdmin && (
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phone.includes(searchTerm)
            )
        );
        this.renderMembersTable(users);
    },

    renderMembersTable: function(users) {
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
                <td>${this.formatDate(user.joinDate)}</td>
                <td>₹${user.balance.toFixed(2)}</td>
                <td><button class="btn btn-small">View</button></td>
            `;
            tableBody.appendChild(row);
        });
    },

    loadAllPayments: function() {
        const payments = DB.getPayments();
        const users = DB.getUsers();
        
        const tableBody = document.getElementById('paymentsTable');
        tableBody.innerHTML = '';

        if (payments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">No payments found</td></tr>';
            return;
        }

        payments.forEach(payment => {
            const user = users.find(u => u.id === payment.userId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${payment.id.slice(-6)}</td>
                <td>${user?.name || 'Unknown'}</td>
                <td>${this.getMonthName(payment.month)} ${payment.year}</td>
                <td>${payment.hours}</td>
                <td>₹${payment.amount.toFixed(2)}</td>
                <td><span class="status-badge ${payment.status}">${payment.status}</span></td>
                <td><button class="btn btn-small">${payment.status === 'paid' ? 'Receipt' : 'Mark Paid'}</button></td>
            `;
            tableBody.appendChild(row);
        });
    },

    filterBookings: function(date) {
        const bookings = date ? DB.getBookings().filter(booking => booking.date === date) : DB.getBookings();
        this.renderBookingsTable(bookings);
    },

    filterPayments: function(month) {
        const payments = month === 'all' 
            ? DB.getPayments() 
            : DB.getPayments().filter(payment => payment.month === parseInt(month));
        this.renderPaymentsTable(payments);
    },

    renderBookingsTable: function(bookings) {
        const users = DB.getUsers();
        const tableBody = document.getElementById('bookingsTable');
        tableBody.innerHTML = '';

        if (bookings.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8">No bookings found</td></tr>';
            return;
        }

        bookings.sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time))
            .forEach(booking => {
                const user = users.find(u => u.id === booking.userId);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${booking.id.slice(-6)}</td>
                    <td>${user?.name || 'Unknown'}</td>
                    <td>${this.formatDate(booking.date)}</td>
                    <td>${this.formatTime(booking.time)}</td>
                    <td>${booking.duration} hr</td>
                    <td>${booking.partnerName || '-'}</td>
                    <td>₹${booking.amount.toFixed(2)}</td>
                    <td><span class="status-badge confirmed">Confirmed</span></td>
                `;
                tableBody.appendChild(row);
            });
    },

    renderPaymentsTable: function(payments) {
        const users = DB.getUsers();
        const tableBody = document.getElementById('paymentsTable');
        tableBody.innerHTML = '';

        if (payments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">No payments found</td></tr>';
            return;
        }

        payments.forEach(payment => {
            const user = users.find(u => u.id === payment.userId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${payment.id.slice(-6)}</td>
                <td>${user?.name || 'Unknown'}</td>
                <td>${this.getMonthName(payment.month)} ${payment.year}</td>
                <td>${payment.hours}</td>
                <td>₹${payment.amount.toFixed(2)}</td>
                <td><span class="status-badge ${payment.status}">${payment.status}</span></td>
                <td><button class="btn btn-small">${payment.status === 'paid' ? 'Receipt' : 'Mark Paid'}</button></td>
            `;
            tableBody.appendChild(row);
        });
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

// Initialize admin system
document.addEventListener('DOMContentLoaded', function() {
    Admin.init();
});