// booking.js - Complete Booking System
const BookingSystem = {
    // Initialize booking system
    init: function() {
        this.user = Auth.getCurrentUser();
        if (!this.user) {
            window.location.href = 'login.html';
            return;
        }

        this.setupEventListeners();
        this.initializeForm();
        this.loadTimeSlots(new Date().toISOString().split('T')[0]);
    },

    // Setup all booking event listeners
    setupEventListeners: function() {
        // Date change listener
        document.getElementById('bookingDate').addEventListener('change', (e) => {
            this.updateBookingSummary();
            this.loadTimeSlots(e.target.value);
        });

        // Time and duration change listeners
        document.getElementById('startTime').addEventListener('change', () => this.updateBookingSummary());
        document.getElementById('duration').addEventListener('change', () => this.updateBookingSummary());

        // Form submission
        document.getElementById('bookingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitBooking();
        });
    },

    // Initialize form with default values
    initializeForm: function() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('bookingDate').value = today;
        document.getElementById('bookingDate').min = today;

        // Set default time to next available slot
        const now = new Date();
        let defaultHour = now.getHours() + 1;
        if (defaultHour < 8) defaultHour = 8;
        if (defaultHour >= 11 && defaultHour < 16) defaultHour = 16;
        if (defaultHour >= 21) defaultHour = 8; // Next day
        
        document.getElementById('startTime').value = `${defaultHour.toString().padStart(2, '0')}:00`;
        this.updateBookingSummary();
    },

    // Update booking summary section
    updateBookingSummary: function() {
        const date = document.getElementById('bookingDate').value;
        const time = document.getElementById('startTime').value;
        const duration = document.getElementById('duration').value;

        if (!date || !time || !duration) return;

        document.getElementById('summaryDate').textContent = this.formatDate(date);
        document.getElementById('summaryTime').textContent = this.formatTime(time);
        document.getElementById('summaryDuration').textContent = `${duration} hour${duration > 1 ? 's' : ''}`;
        document.getElementById('summaryAmount').textContent = `₹${(duration * 7.5).toFixed(2)}`;
    },

    // Load available time slots for a date
    loadTimeSlots: function(date) {
        const timeSlotsContainer = document.getElementById('timeSlots');
        timeSlotsContainer.innerHTML = '';

        // Club timings - morning 8-11, evening 4-9
        const morningSlots = this.generateTimeSlots(8, 11);
        const eveningSlots = this.generateTimeSlots(16, 21);

        // Add closed hours notice between sessions
        if (morningSlots.length > 0 && eveningSlots.length > 0) {
            const closedNotice = document.createElement('div');
            closedNotice.className = 'closed-hours';
            closedNotice.textContent = 'Club closed between 11 AM to 4 PM';
            timeSlotsContainer.appendChild(closedNotice);
        }

        const allSlots = [...morningSlots, ...eveningSlots];
        const dateBookings = DB.getBookingsByDate(date);

        allSlots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = 'time-slot';
            slotElement.textContent = slot.time;
            slotElement.setAttribute('data-time', slot.time24);

            // Check if slot is booked
            const isBooked = dateBookings.some(b => {
                const bookingEnd = this.addHours(b.time, b.duration);
                return this.isTimeBetween(slot.time24, b.time, bookingEnd);
            });

            if (isBooked) {
                slotElement.classList.add('booked');
                const booking = dateBookings.find(b => 
                    this.isTimeBetween(slot.time24, b.time, this.addHours(b.time, b.duration))
                );
                const user = DB.getUsers().find(u => u.id === booking.userId);
                slotElement.setAttribute('data-tooltip', 
                    `Booked by ${user?.name || 'Unknown'}${booking.partnerName ? ` with ${booking.partnerName}` : ''}`);
            } else {
                slotElement.addEventListener('click', () => {
                    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                    slotElement.classList.add('selected');
                    document.getElementById('startTime').value = slot.time24;
                    this.updateBookingSummary();
                });
            }

            timeSlotsContainer.appendChild(slotElement);
        });
    },

    // Submit a new booking
    submitBooking: function() {
        const date = document.getElementById('bookingDate').value;
        const time = document.getElementById('startTime').value;
        const duration = parseInt(document.getElementById('duration').value);
        const partnerName = document.getElementById('partnerName').value.trim();
        const gameType = document.getElementById('gameType').value;

        // Validate inputs
        if (!date || !time || !duration) {
            alert('Please fill all required fields!');
            return;
        }

        // Validate club timings
        const [hours] = time.split(':').map(Number);
        const isMorningSlot = hours >= 8 && hours < 11;
        const isEveningSlot = hours >= 16 && hours < 21;
        const bookingEnd = this.addHours(time, duration);

        if (!isMorningSlot && !isEveningSlot) {
            alert('Club is open 8-11 AM and 4-9 PM only!');
            return;
        }

        // Check if booking spans across sessions
        if ((isMorningSlot && bookingEnd > '11:00') || (isEveningSlot && bookingEnd > '21:00')) {
            alert('Booking cannot span across club sessions!');
            return;
        }

        // Check slot availability
        const dateBookings = DB.getBookingsByDate(date);
        const isAvailable = !dateBookings.some(b => {
            const existingEnd = this.addHours(b.time, b.duration);
            return (time >= b.time && time < existingEnd) || 
                   (bookingEnd > b.time && bookingEnd <= existingEnd);
        });

        if (!isAvailable) {
            alert('This slot is already booked! Please choose another time.');
            return;
        }

        // Create booking
        const booking = {
            id: Date.now().toString(),
            userId: this.user.id,
            date,
            time,
            duration,
            partnerName,
            gameType,
            amount: duration * 7.5,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        // Save booking
        DB.addBooking(booking);
        
        // Update user balance
        const users = DB.getUsers();
        const userIndex = users.findIndex(u => u.id === this.user.id);
        if (userIndex !== -1) {
            users[userIndex].balance += booking.amount;
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(users[userIndex]));
        }

        alert('Booking confirmed!');
        window.location.href = 'dashboard.html';
    },

    // Helper functions
    generateTimeSlots: function(startHour, endHour) {
        const slots = [];
        for (let hour = startHour; hour < endHour; hour++) {
            const time12 = hour >= 12 ? 
                `${hour === 12 ? 12 : hour-12}:00 PM` : 
                `${hour}:00 AM`;
            const time24 = `${hour.toString().padStart(2, '0')}:00`;
            slots.push({ time: time12, time24 });
        }
        return slots;
    },

    addHours: function(time, hours) {
        const [h, m] = time.split(':').map(Number);
        const newHour = h + hours;
        return `${newHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    },

    isTimeBetween: function(time, start, end) {
        const [h, m] = time.split(':').map(Number);
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        
        const total = h * 60 + m;
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;
        
        return total >= startTotal && total < endTotal;
    },

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

// Initialize booking system when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    BookingSystem.init();
});