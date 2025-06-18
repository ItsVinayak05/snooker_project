// dashboard.js - Complete Dashboard System
const Dashboard = {
    // Initialize dashboard
    init: function() {
        this.user = Auth.getCurrentUser();
        if (!this.user) {
            window.location.href = 'login.html';
            return;
        }

        this.displayUserInfo();
        this.loadUpcomingBookings();
        this.loadMonthlySummary();
        this.loadRecentActivity();
        this.setupEventListeners();
    },

    // Display user information
    displayUserInfo: function() {
        document.getElementById('userName').textContent = this.user.name;
    },

    // Load upcoming bookings
    loadUpcomingBookings: function() {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toLocaleTimeString('en-IN', {hour12: false}).slice(0,5);
        
        const upcoming = DB.getBookings()
            .filter(b => b.userId === this.user.id && 
                        (b.date > today || (b.date === today && b.time >= now)))
            .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

        const container = document.getElementById('upcomingBookings');
        container.innerHTML = upcoming.slice(0, 3).map(b => `
            <div class="upcoming-booking">
                <p><strong>${this.formatDate(b.date)}</strong></p>
                <p>${this.formatTime(b.time)} (${b.duration} hr${b.duration > 1 ? 's' : ''})</p>
                ${b.partnerName ? `<p>With: ${b.partnerName}</p>` : ''}
                <p>Amount: ₹${b.amount.toFixed(2)}</p>
            </div>
        `).join('') || '<p class="no-bookings">No upcoming bookings</p>';

        if (upcoming.length > 3) {
            const moreEl = document.createElement('p');
            moreEl.className = 'more-bookings';
            moreEl.textContent = `+ ${upcoming.length - 3} more`;
            container.appendChild(moreEl);
        }
    },

    // Load monthly summary
    loadMonthlySummary: function() {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const monthBookings = DB.getBookings().filter(b => {
            const [year, month] = b.date.split('-');
            return b.userId === this.user.id && 
                   parseInt(month) === currentMonth && 
                   parseInt(year) === currentYear;
        });

        const totalHours = monthBookings.reduce((sum, b) => sum + b.duration, 0);
        
        document.getElementById('totalHours').textContent = totalHours;
        document.getElementById('amountDue').textContent = `₹${(totalHours * 7.5).toFixed(2)}`;

        // Last payment
        const payments = DB.getPayments().filter(p => p.userId === this.user.id);
        document.getElementById('lastPayment').textContent = payments.length 
            ? this.formatDate(payments[0].date) 
            : 'No payments yet';
    },

    // Load recent activity
    loadRecentActivity: function() {
        const recent = DB.getBookings()
            .filter(b => b.userId === this.user.id)
            .sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time))
            .slice(0, 5);

        document.getElementById('activityTable').innerHTML = recent.map(b => `
            <tr>
                <td>${this.formatDate(b.date)}</td>
                <td>${this.formatTime(b.time)}</td>
                <td>${b.partnerName || '-'}</td>
                <td>${b.duration} hr${b.duration > 1 ? 's' : ''}</td>
                <td>₹${b.amount.toFixed(2)}</td>
            </tr>
        `).join('') || '<tr><td colspan="5">No recent activity</td></tr>';
    },

    // Setup event listeners
    setupEventListeners: function() {
        // Quick book button
        document.querySelector('.quick-book .btn').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'booking.html';
        });
    },

    // Helper functions
    formatDate: function(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    },

    formatTime: function(time24) {
        const [hours, minutes] = time24.split(':');
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes} ${period}`;
    }
};

// Initialize dashboard when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    Dashboard.init();
});