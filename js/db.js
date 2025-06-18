// db.js - Simple localStorage database wrapper
const DB = {
    // Initialize database with sample data if empty
    init: function() {
        if (!localStorage.getItem('users')) {
            const users = [
                {
                    id: '1',
                    name: 'Admin',
                    email: 'admin@indorama.com',
                    phone: '9876543210',
                    password: 'admin123',
                    joinDate: new Date().toISOString(),
                    balance: 0,
                    isAdmin: true
                }
            ];
            localStorage.setItem('users', JSON.stringify(users));
        }

        if (!localStorage.getItem('bookings')) {
            localStorage.setItem('bookings', JSON.stringify([]));
        }

        if (!localStorage.getItem('payments')) {
            localStorage.setItem('payments', JSON.stringify([]));
        }
    },

    // User methods
    getUsers: function() {
        return JSON.parse(localStorage.getItem('users')) || [];
    },

    addUser: function(user) {
        const users = this.getUsers();
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
    },

    // Booking methods
    getBookings: function() {
        return JSON.parse(localStorage.getItem('bookings')) || [];
    },

    addBooking: function(booking) {
        const bookings = this.getBookings();
        bookings.push(booking);
        localStorage.setItem('bookings', JSON.stringify(bookings));
    },

    getBookingsByDate: function(date) {
        return this.getBookings().filter(b => b.date === date);
    },

    // Payment methods
    getPayments: function() {
        return JSON.parse(localStorage.getItem('payments')) || [];
    },

    addPayment: function(payment) {
        const payments = this.getPayments();
        payments.push(payment);
        localStorage.setItem('payments', JSON.stringify(payments));
    }
};

// Initialize database when this file loads
DB.init();