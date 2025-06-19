// Booking functionality with all fixes

// Helper functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes} ${period}`;
}

function addHours(time, hours) {
    const [h, m] = time.split(':').map(Number);
    const newHour = h + hours;
    return `${newHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function isTimeBetween(time, startTime, endTime) {
    const [h, m] = time.split(':').map(Number);
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    const totalMinutes = h * 60 + m;
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    
    return totalMinutes >= startTotal && totalMinutes < endTotal;
}

// Update booking summary
function updateBookingSummary() {
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('startTime').value;
    const duration = document.getElementById('duration').value;
    
    if (!date || !time || !duration) return;
    
    document.getElementById('summaryDate').textContent = formatDate(date);
    document.getElementById('summaryTime').textContent = formatTime(time);
    document.getElementById('summaryDuration').textContent = `${duration} hour${duration > 1 ? 's' : ''}`;
    document.getElementById('summaryAmount').textContent = `₹${(duration * 7.5).toFixed(2)}`;
}

// Generate time slots
function generateTimeSlots(startHour, endHour) {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
        const time12 = hour >= 12 ? 
            `${hour === 12 ? 12 : hour-12}:00 PM` : 
            `${hour}:00 AM`;
        const time24 = `${hour.toString().padStart(2, '0')}:00`;
        slots.push({ time: time12, time24 });
    }
    return slots;
}

// Load time slots
function loadTimeSlots(date) {
    const timeSlotsContainer = document.getElementById('timeSlots');
    timeSlotsContainer.innerHTML = '';
    
    // Club timings - morning 8-11, evening 4-9
    const morningSlots = generateTimeSlots(8, 11);
    const eveningSlots = generateTimeSlots(16, 21);
    
    // Add closed hours notice
    if (morningSlots.length > 0 && eveningSlots.length > 0) {
        const closedNotice = document.createElement('div');
        closedNotice.className = 'closed-hours';
        closedNotice.textContent = 'Club closed between 11 AM to 4 PM';
        timeSlotsContainer.appendChild(closedNotice);
    }
    
    const allSlots = [...morningSlots, ...eveningSlots];
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Get bookings for this date
    const dateBookings = bookings.filter(b => b.date === date);
    
    allSlots.forEach(slot => {
        const slotElement = document.createElement('div');
        slotElement.className = 'time-slot';
        slotElement.textContent = slot.time;
        slotElement.setAttribute('data-time', slot.time24);
        
        // Check if this slot is booked
        const slotBookings = dateBookings.filter(b => {
            const bookingEndTime = addHours(b.time, b.duration);
            return isTimeBetween(slot.time24, b.time, bookingEndTime);
        });
        
        if (slotBookings.length > 0) {
            slotElement.classList.add('booked');
            const booking = slotBookings[0];
            const user = users.find(u => u.id === booking.userId);
            const partnerText = booking.partnerName ? ` with ${booking.partnerName}` : '';
            slotElement.setAttribute('data-tooltip', `Booked by ${user ? user.name : 'Unknown'}${partnerText}`);
        } else {
            slotElement.addEventListener('click', function() {
                document.querySelectorAll('.time-slot').forEach(s => {
                    s.classList.remove('selected');
                });
                this.classList.add('selected');
                document.getElementById('startTime').value = slot.time24;
                updateBookingSummary();
            });
        }
        
        timeSlotsContainer.appendChild(slotElement);
    });
}

// Submit booking
function submitBooking(userId) {
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('startTime').value;
    const duration = parseInt(document.getElementById('duration').value);
    const partnerName = document.getElementById('partnerName').value;
    const gameType = document.getElementById('gameType').value;
    
    if (!date || !time || !duration) {
        alert('Please fill all required fields!');
        return;
    }
    
    // Validate club timings
    const [hours] = time.split(':').map(Number);
    const isMorningSlot = hours >= 8 && hours < 11;
    const isEveningSlot = hours >= 16 && hours < 21;
    const bookingEndTime = addHours(time, duration);
    
    if (!isMorningSlot && !isEveningSlot) {
        alert('Booking outside club hours! Club is open 8-11 AM and 4-9 PM.');
        return;
    }
    
    // Check slot availability
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    const dateBookings = bookings.filter(b => b.date === date);
    
    const isSlotAvailable = !dateBookings.some(b => {
        const existingEnd = addHours(b.time, b.duration);
        return (time >= b.time && time < existingEnd) || 
               (bookingEndTime > b.time && bookingEndTime <= existingEnd) ||
               (b.time >= time && b.time < bookingEndTime);
    });
    
    if (!isSlotAvailable) {
        alert('This time slot is no longer available. Please choose another time.');
        return;
    }
    
    // Create new booking
    const newBooking = {
        id: Date.now().toString(),
        userId,
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
    bookings.push(newBooking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    // Update user's balance
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        users[userIndex].balance += newBooking.amount;
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update current user
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            currentUser.balance = users[userIndex].balance;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    }
    
    alert('Booking confirmed!');
    window.location.href = 'dashboard.html';
}

// Dashboard functions
function updateUpcomingBookings(userId) {
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toLocaleTimeString('en-IN', {hour12: false}).slice(0,5);
    
    const userBookings = bookings.filter(b => {
        return b.userId === userId && 
               (b.date > today || (b.date === today && b.time >= now));
    }).sort((a, b) => {
        if (a.date === b.date) return a.time.localeCompare(b.time);
        return a.date.localeCompare(b.date);
    });

    const container = document.getElementById('upcomingBookings');
    container.innerHTML = '';

    if (userBookings.length === 0) {
        container.innerHTML = '<p class="no-bookings">No upcoming bookings</p>';
        return;
    }

    userBookings.slice(0, 3).forEach(booking => {
        const bookingEl = document.createElement('div');
        bookingEl.className = 'upcoming-booking';
        bookingEl.innerHTML = `
            <p><strong>${formatDate(booking.date)}</strong></p>
            <p>${formatTime(booking.time)} (${booking.duration} hr${booking.duration > 1 ? 's' : ''})</p>
            ${booking.partnerName ? `<p>With: ${booking.partnerName}</p>` : ''}
            <p>Amount: ₹${booking.amount.toFixed(2)}</p>
        `;
        container.appendChild(bookingEl);
    });

    if (userBookings.length > 3) {
        const moreEl = document.createElement('p');
        moreEl.className = 'more-bookings';
        moreEl.textContent = `+ ${userBookings.length - 3} more`;
        container.appendChild(moreEl);
    }
}

function updateMonthlySummary(userId) {
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const monthBookings = bookings.filter(b => {
        const [year, month] = b.date.split('-');
        return b.userId === userId && 
               parseInt(month) === currentMonth && 
               parseInt(year) === currentYear;
    });

    const totalHours = monthBookings.reduce((sum, b) => sum + b.duration, 0);
    const amountDue = totalHours * 7.5;

    document.getElementById('totalHours').textContent = totalHours;
    document.getElementById('amountDue').textContent = `₹${amountDue.toFixed(2)}`;
    
    // Get last payment
    const payments = JSON.parse(localStorage.getItem('payments')) || [];
    const userPayments = payments.filter(p => p.userId === userId);
    if (userPayments.length > 0) {
        const lastPayment = userPayments.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        document.getElementById('lastPayment').textContent = formatDate(lastPayment.date);
    } else {
        document.getElementById('lastPayment').textContent = 'No payments yet';
    }
}

function updateRecentActivity(userId) {
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    const userBookings = bookings.filter(b => b.userId === userId)
                               .sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));
    
    const tableBody = document.getElementById('activityTable');
    tableBody.innerHTML = '';

    if (userBookings.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">No recent activity</td></tr>';
        return;
    }

    userBookings.slice(0, 5).forEach(booking => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(booking.date)}</td>
            <td>${formatTime(booking.time)}</td>
            <td>${booking.partnerName || '-'}</td>
            <td>${booking.duration} hr${booking.duration > 1 ? 's' : ''}</td>
            <td>₹${booking.amount.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Initialize booking page
function initializeBookingPage() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('bookingDate');
    dateInput.value = today;
    dateInput.min = today;

    // Set default time to next available hour
    const now = new Date();
    let defaultHour = now.getHours() + 1;
    if (defaultHour < 8) defaultHour = 8;
    if (defaultHour >= 11 && defaultHour < 16) defaultHour = 16;
    if (defaultHour >= 21) defaultHour = 8; // Next day
    
    document.getElementById('startTime').value = `${defaultHour.toString().padStart(2, '0')}:00`;

    // Initialize summary
    updateBookingSummary();

    // Update summary when inputs change
    dateInput.addEventListener('change', function() {
        updateBookingSummary();
        loadTimeSlots(this.value);
    });

    document.getElementById('startTime').addEventListener('change', updateBookingSummary);
    document.getElementById('duration').addEventListener('change', updateBookingSummary);

    // Form submission
    document.getElementById('bookingForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitBooking(user.id);
    });

    // Load today's availability
    loadTimeSlots(today);
}

// Initialize dashboard
function initializeDashboard() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('userName').textContent = user.name;
    updateUpcomingBookings(user.id);
    updateMonthlySummary(user.id);
    updateRecentActivity(user.id);
}