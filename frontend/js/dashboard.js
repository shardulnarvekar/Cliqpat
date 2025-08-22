// Dashboard JavaScript for Cliqpat

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    checkAuthentication();
    setupDashboardNavigation();
    setupDashboardFunctions();
    loadDashboardData();
}

// Check authentication
function checkAuthentication() {
    const userData = localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user');
    
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    const user = JSON.parse(userData);
    
    // Update user info in UI
    updateUserInfo(user);
    
    // Check if user is on the right dashboard
    const currentPage = window.location.pathname;
    if (user.type === 'patient' && !currentPage.includes('patient-dashboard')) {
        window.location.href = 'patient-dashboard.html';
    } else if (user.type === 'doctor' && !currentPage.includes('doctor-dashboard')) {
        window.location.href = 'doctor-dashboard.html';
    }
}

// Update user info in UI
function updateUserInfo(user) {
    const userNameElements = document.querySelectorAll('.user-name');
    const userAvatarElements = document.querySelectorAll('.user-avatar');
    
    userNameElements.forEach(element => {
        element.textContent = user.type === 'doctor' ? user.fullName || `Dr. ${user.firstName} ${user.lastName}` : user.fullName || `${user.firstName} ${user.lastName}`;
    });
    
    // Update avatar if available
    if (user.avatar) {
        userAvatarElements.forEach(element => {
            element.src = user.avatar;
        });
    }
}

// Setup dashboard navigation
function setupDashboardNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    const dashboardSections = document.querySelectorAll('.dashboard-section');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
            
            // Update active state
            sidebarLinks.forEach(l => l.parentElement.classList.remove('active'));
            this.parentElement.classList.add('active');
        });
    });
}

// Show dashboard section
function showSection(sectionId) {
    const sections = document.querySelectorAll('.dashboard-section');
    const targetSection = document.getElementById(sectionId);
    
    if (targetSection) {
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        targetSection.classList.add('active');
        
        // Load section-specific data
        loadSectionData(sectionId);
    }
}

// Load section-specific data
function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'clinics':
            loadClinicsData();
            break;
        case 'appointments':
            loadAppointmentsData();
            // Refresh appointments when section is shown
            const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
            if (userData && userData.type === 'doctor') {
                refreshDoctorAppointments();
            }
            break;
        case 'patients':
            loadPatientsData();
            break;
        case 'ai-reports':
            loadAIReportsData();
            break;
        case 'ehr':
            loadEHRData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
    }
}

// Setup dashboard functions
function setupDashboardFunctions() {
    // Setup logout
    const logoutButtons = document.querySelectorAll('a[href="index.html"]');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });
    
    // Setup user menu
    const menuToggles = document.querySelectorAll('.menu-toggle');
    menuToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const dropdown = this.nextElementSibling;
            dropdown.classList.toggle('active');
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-menu')) {
            const dropdowns = document.querySelectorAll('.dropdown-menu');
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });
}

// Load dashboard data
function loadDashboardData() {
    const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
    
    if (userData.type === 'patient') {
        loadPatientDashboardData();
    } else {
        loadDoctorDashboardData();
        startAutoRefresh(); // Start auto-refresh for doctors
    }
}

// Load patient dashboard data
async function loadPatientDashboardData() {
    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        
        // Load appointments
        const appointmentsResponse = await fetch('/api/appointments/patient', {
            headers: {
                'Authorization': `Bearer ${userData.token}`
            }
        });
        
        if (appointmentsResponse.ok) {
            const appointmentsData = await appointmentsResponse.json();
            updatePatientAppointments(appointmentsData.data.appointments);
        }
        
        // Load medical records
        const recordsResponse = await fetch('/api/patients/medical-records', {
            headers: {
                'Authorization': `Bearer ${userData.token}`
            }
        });
        
        if (recordsResponse.ok) {
            const recordsData = await recordsResponse.json();
            updateMedicalRecords(recordsData.data.records);
        }
        
    } catch (error) {
        console.error('Error loading patient dashboard data:', error);
    }
}

// Load doctor dashboard data
async function loadDoctorDashboardData() {
    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        
        // Load appointments
        const appointmentsResponse = await fetch('/api/appointments/doctor', {
            headers: {
                'Authorization': `Bearer ${userData.token}`
            }
        });
        
        if (appointmentsResponse.ok) {
            const appointmentsData = await appointmentsResponse.json();
            updateDoctorAppointments(appointmentsData.data.appointments);
        } else {
            console.error('Failed to load appointments:', appointmentsResponse.status);
        }
        
    } catch (error) {
        console.error('Error loading doctor dashboard data:', error);
    }
}

// Update patient appointments
function updatePatientAppointments(appointments) {
    const upcomingContainer = document.getElementById('upcomingAppointments');
    const pastContainer = document.getElementById('pastAppointments');
    
    if (!upcomingContainer || !pastContainer) return;
    
    const upcoming = appointments.filter(apt => apt.status === 'confirmed' || apt.status === 'scheduled');
    const past = appointments.filter(apt => apt.status === 'completed' || apt.status === 'cancelled');
    
    // Update upcoming appointments
    if (upcoming.length > 0) {
        upcomingContainer.innerHTML = upcoming.map(appointment => `
            <div class="appointment-card">
                <div class="appointment-header">
                    <div class="doctor-info">
                        <img src="images/doctor1.jpg" alt="Doctor" class="doctor-avatar">
                        <div>
                            <h3>${appointment.doctor.firstName} ${appointment.doctor.lastName}</h3>
                            <p>${appointment.doctor.specialization} • ${appointment.doctor.clinicName}</p>
                        </div>
                    </div>
                    <div class="appointment-status ${appointment.status}">
                        <i class="fas fa-check-circle"></i>
                        ${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </div>
                </div>
                <div class="appointment-details">
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span>${new Date(appointment.appointmentDate).toLocaleDateString()}, ${appointment.appointmentTime}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-rupee-sign"></i>
                        <span>₹${appointment.consultationFee} Consultation Fee</span>
                    </div>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-outline" onclick="rescheduleAppointment('${appointment._id}')">
                        <i class="fas fa-calendar-alt"></i>
                        Reschedule
                    </button>
                    <button class="btn btn-outline" onclick="cancelAppointment('${appointment._id}')">
                        <i class="fas fa-times"></i>
                        Cancel
                    </button>
                    <button class="btn btn-primary" onclick="viewAppointmentDetails('${appointment._id}')">
                        <i class="fas fa-eye"></i>
                        View Details
                    </button>
                    <button class="btn btn-success" onclick="initiateAICall('${appointment.doctor._id}')">
                        <i class="fas fa-phone"></i>
                        Call Doctor
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        upcomingContainer.innerHTML = '<p class="no-data">No upcoming appointments</p>';
    }
    
    // Update past appointments
    if (past.length > 0) {
        pastContainer.innerHTML = past.map(appointment => `
            <div class="appointment-card past">
                <div class="appointment-header">
                    <div class="doctor-info">
                        <img src="images/doctor2.jpg" alt="Doctor" class="doctor-avatar">
                        <div>
                            <h3>${appointment.doctor.firstName} ${appointment.doctor.lastName}</h3>
                            <p>${appointment.doctor.specialization} • ${appointment.doctor.clinicName}</p>
                        </div>
                    </div>
                    <div class="appointment-status ${appointment.status}">
                        <i class="fas fa-check-circle"></i>
                        ${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </div>
                </div>
                <div class="appointment-details">
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span>${new Date(appointment.appointmentDate).toLocaleDateString()}, ${appointment.appointmentTime}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-rupee-sign"></i>
                        <span>₹${appointment.consultationFee} Consultation Fee</span>
                    </div>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-outline" onclick="viewPrescription('${appointment._id}')">
                        <i class="fas fa-prescription"></i>
                        View Prescription
                    </button>
                    <button class="btn btn-primary" onclick="bookFollowUp('${appointment._id}')">
                        <i class="fas fa-calendar-plus"></i>
                        Book Follow-up
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        pastContainer.innerHTML = '<p class="no-data">No past appointments</p>';
    }
}

// Update doctor appointments
function updateDoctorAppointments(appointments) {
    console.log('Updating doctor appointments with:', appointments);
    
    const appointmentsList = document.querySelector('.appointments-list');
    if (!appointmentsList) {
        console.error('Appointments list element not found');
        return;
    }
    
    if (appointments && appointments.length > 0) {
        appointmentsList.innerHTML = appointments.map(appointment => `
            <div class="appointment-item">
                <div class="appointment-time">
                    <span class="time">${appointment.appointmentTime}</span>
                    <span class="status ${appointment.status}">${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
                </div>
                <div class="appointment-details">
                    <h4>${appointment.patient?.firstName && appointment.patient?.lastName ? 
                        `${appointment.patient.firstName} ${appointment.patient.lastName}` : 
                        'Patient Name Not Available'}</h4>
                    <p>${appointment.reason || 'No reason specified'}</p>
                    <div class="appointment-notes">
                        ${appointment.aiScreening?.isCompleted ? '<span class="ai-report">AI Report Available</span>' : ''}
                        <span class="ehr">EHR Updated</span>
                    </div>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-outline" onclick="rescheduleAppointment('${appointment._id}')">
                        <i class="fas fa-calendar-alt"></i>
                        Reschedule
                    </button>
                    <button class="btn btn-primary" onclick="startConsultation('${appointment._id}')">
                        <i class="fas fa-play"></i>
                        Start
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        appointmentsList.innerHTML = '<p class="no-data">No appointments found</p>';
    }
}

// Refresh doctor appointments
async function refreshDoctorAppointments() {
    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        
        const response = await fetch('/api/appointments/doctor', {
            headers: {
                'Authorization': `Bearer ${userData.token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateDoctorAppointments(data.data.appointments);
        }
    } catch (error) {
        console.error('Error refreshing doctor appointments:', error);
    }
}

// Auto-refresh doctor appointments every 2 minutes
function startAutoRefresh() {
    const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
    
    if (userData && userData.type === 'doctor') {
        setInterval(() => {
            refreshDoctorAppointments();
        }, 120000); // 2 minutes
    }
}

// Update medical records
function updateMedicalRecords(records) {
    const recordsGrid = document.getElementById('recordsGrid');
    if (!recordsGrid) return;
    
    if (records.length > 0) {
        recordsGrid.innerHTML = records.map(record => `
            <div class="record-card">
                <div class="record-icon">
                    <i class="fas fa-${getRecordIcon(record.type)}"></i>
                </div>
                <div class="record-info">
                    <h4>${record.title}</h4>
                    <p>${record.description || 'No description available'}</p>
                    <span class="record-date">${new Date(record.uploadDate).toLocaleDateString()}</span>
                </div>
                <div class="record-actions">
                    <button class="btn btn-outline small" onclick="viewRecord('${record._id}')">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                    <button class="btn btn-outline small" onclick="downloadRecord('${record._id}')">
                        <i class="fas fa-download"></i>
                        Download
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        recordsGrid.innerHTML = '<p class="no-data">No medical records found</p>';
    }
}

// Get record icon based on type
function getRecordIcon(type) {
    const iconMap = {
        'lab_report': 'flask',
        'prescription': 'prescription-bottle',
        'imaging': 'x-ray',
        'vaccination': 'syringe',
        'other': 'file-medical'
    };
    return iconMap[type] || 'file-medical';
}

// Load clinics data
async function loadClinicsData() {
    try {
        const response = await fetch('/api/doctors/search?limit=20');
        if (response.ok) {
            const data = await response.json();
            updateClinicsGrid(data.data.doctors);
        }
    } catch (error) {
        console.error('Error loading clinics:', error);
    }
}

// Update clinics grid
function updateClinicsGrid(doctors) {
    const clinicsGrid = document.getElementById('clinicsGrid');
    if (!clinicsGrid) return;
    
    if (doctors.length > 0) {
        clinicsGrid.innerHTML = doctors.map(doctor => `
            <div class="clinic-card">
                <div class="clinic-header">
                    <div class="clinic-avatar">
                        <i class="fas fa-stethoscope"></i>
                    </div>
                    <div class="clinic-info">
                        <h3>${doctor.clinicName}</h3>
                        <p class="doctor-name">${doctor.firstName} ${doctor.lastName}</p>
                        <p class="specialization">${doctor.specialization}</p>
                    </div>
                    <div class="clinic-rating">
                        <div class="stars">
                            ${generateStars(doctor.rating?.average || 0)}
                        </div>
                        <span class="rating-text">${doctor.rating?.average || 0}/5</span>
                    </div>
                </div>
                <div class="clinic-details">
                    <div class="detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${doctor.clinicAddress.city}, ${doctor.clinicAddress.state}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <span>${doctor.experience} years experience</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-rupee-sign"></i>
                        <span>₹<span class="fee">${doctor.consultationFee}</span> consultation fee</span>
                    </div>
                </div>
                <div class="clinic-actions">
                    <button class="btn btn-outline" onclick="viewClinicDetails('${doctor._id}')">
                        <i class="fas fa-eye"></i>
                        View Details
                    </button>
                    <button class="btn btn-primary" onclick="bookAppointment('${doctor._id}')">
                        <i class="fas fa-calendar-plus"></i>
                        Book Appointment
                    </button>
                </div>
                
                <!-- Weekly Slots View (Initially Hidden) -->
                <div class="weekly-slots" id="${doctor._id}-slots" style="display: none;">
                    <div class="slots-header">
                        <h4>Available This Week</h4>
                        <button class="close-slots" onclick="hideWeeklySlots('${doctor._id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="week-navigation">
                        <button class="week-nav-btn" onclick="previousWeek('${doctor._id}')">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span class="week-range" id="${doctor._id}-week-range">Loading...</span>
                        <button class="week-nav-btn" onclick="nextWeek('${doctor._id}')">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="daily-slots" id="${doctor._id}-daily-slots">
                        <!-- Daily slots will be populated here -->
                    </div>
                    <div class="slots-loading" id="${doctor._id}-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        Loading available slots...
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        clinicsGrid.innerHTML = '<p class="no-data">No clinics found</p>';
    }
}

// Generate stars for rating
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="fas fa-star-o"></i>';
    }
    
    return stars;
}

// Load appointments data
function loadAppointmentsData() {
    // This will be called when the appointments section is shown
    // Data is already loaded in loadDashboardData()
}

// Load patients data
function loadPatientsData() {
    // This will be called when the patients section is shown
    // Data is already loaded in loadDashboardData()
}

// Load AI reports data
function loadAIReportsData() {
    // This will be called when the AI reports section is shown
}

// Load EHR data
function loadEHRData() {
    // This will be called when the EHR section is shown
}

// Load analytics data
function loadAnalyticsData() {
    // This will be called when the analytics section is shown
}

// Appointment functions
function rescheduleAppointment(appointmentId) {
    // Implement reschedule functionality
    console.log('Reschedule appointment:', appointmentId);
}

function cancelAppointment(appointmentId) {
    // Implement cancel functionality
    console.log('Cancel appointment:', appointmentId);
}

function viewAppointmentDetails(appointmentId) {
    // Implement view details functionality
    console.log('View appointment details:', appointmentId);
}

function viewPrescription(appointmentId) {
    // Implement view prescription functionality
    console.log('View prescription:', appointmentId);
}

function bookFollowUp(appointmentId) {
    // Implement follow-up booking functionality
    console.log('Book follow-up:', appointmentId);
}

function startConsultation(appointmentId) {
    // Implement start consultation functionality
    console.log('Start consultation:', appointmentId);
}

// Clinic functions
function viewClinicDetails(doctorId) {
    // Implement view clinic details functionality
    console.log('View clinic details:', doctorId);
}

function bookAppointment(doctorId) {
    // Show weekly slots for the doctor
    showWeeklySlots(doctorId);
    currentDoctorId = doctorId;
}

// Record functions
function viewRecord(recordId) {
    // Implement view record functionality
    console.log('View record:', recordId);
}

function downloadRecord(recordId) {
    // Implement download record functionality
    console.log('Download record:', recordId);
}

// Weekly appointment slots functionality
let currentDoctorId = null;
let selectedSlotData = null;

// Show weekly slots for a doctor
function showWeeklySlots(doctorId) {
    const slotsContainer = document.getElementById(`${doctorId}-slots`);
    if (slotsContainer) {
        // Hide all other open slots
        document.querySelectorAll('.weekly-slots').forEach(slots => {
            if (slots.id !== `${doctorId}-slots`) {
                slots.style.display = 'none';
            }
        });
        
        slotsContainer.style.display = slotsContainer.style.display === 'block' ? 'none' : 'block';
        
        if (slotsContainer.style.display === 'block') {
            loadWeeklySlots(doctorId);
        }
    }
}

// Hide weekly slots
function hideWeeklySlots(doctorId) {
    const slotsContainer = document.getElementById(`${doctorId}-slots`);
    if (slotsContainer) {
        slotsContainer.style.display = 'none';
    }
}

// Load weekly slots from API
async function loadWeeklySlots(doctorId, startDate = null) {
    try {
        const url = `/api/appointments/weekly-slots/${doctorId}${startDate ? `?startDate=${startDate}` : ''}`;
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            updateWeeklySlotsUI(doctorId, data.data);
        } else {
            showError('Failed to load weekly slots');
        }
    } catch (error) {
        console.error('Error loading weekly slots:', error);
        showError('Error loading weekly slots');
    }
}

// Update weekly slots UI
function updateWeeklySlotsUI(doctorId, data) {
    const weekRangeElement = document.getElementById(`${doctorId}-week-range`);
    const dailySlotsContainer = document.getElementById(`${doctorId}-daily-slots`);
    const loadingElement = document.getElementById(`${doctorId}-loading`);
    
    if (loadingElement) loadingElement.style.display = 'none';
    
    if (weekRangeElement && data.weekSlots && dailySlotsContainer) {
        // Update week range display
        const weekSlotValues = Object.values(data.weekSlots);
        if (weekSlotValues.length > 0) {
            const firstDay = weekSlotValues[0];
            const lastDay = weekSlotValues[6] || weekSlotValues[weekSlotValues.length - 1];
            if (firstDay && lastDay) {
                weekRangeElement.textContent = `${firstDay.displayDate} - ${lastDay.displayDate}`;
            }
        }
        
        // Generate daily slots structure
        const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        dailySlotsContainer.innerHTML = daysOrder.map((day, index) => {
            const dayData = data.weekSlots[day];
            if (!dayData) return '';
            
            const date = new Date(dayData.date);
            const dayNumber = date.getDate();
            
            return `
                <div class="day-column">
                    <div class="day-header">
                        <span class="day-name">${dayNames[index]}</span>
                        <span class="day-date">${dayNumber}</span>
                    </div>
                    <div class="time-slots" id="${doctorId}-${day}-slots">
                        ${dayData.slots && dayData.slots.length > 0 ? 
                            dayData.slots.map(slot => `
                                <button class="time-slot ${slot.available ? 'available' : 'booked'}" 
                                        ${slot.available ? `onclick="bookSlot('${doctorId}', '${dayData.date}', '${slot.time}')"`  : 'disabled'}>
                                    ${slot.time}
                                </button>
                            `).join('') : 
                            '<div class="closed-notice">Closed</div>'
                        }
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Update day slots
function updateDaySlots(dayColumn, dayData) {
    const timeSlotsContainer = dayColumn.querySelector('.time-slots');
    const closedNotice = dayColumn.querySelector('.closed-notice');
    
    if (dayData.slots && dayData.slots.length > 0) {
        // Show time slots
        if (timeSlotsContainer) {
            timeSlotsContainer.style.display = 'block';
            timeSlotsContainer.innerHTML = dayData.slots.map(slot => {
                const isAvailable = slot.available;
                return `
                    <button class="time-slot ${isAvailable ? 'available' : 'booked'}" 
                            ${isAvailable ? `onclick="bookSlot('${currentDoctorId}', '${dayData.date}', '${slot.time}')"`  : 'disabled'}>
                        ${slot.time}
                    </button>
                `;
            }).join('');
        }
        if (closedNotice) closedNotice.style.display = 'none';
    } else {
        // Show closed notice
        if (timeSlotsContainer) timeSlotsContainer.style.display = 'none';
        if (closedNotice) closedNotice.style.display = 'block';
    }
}

// Book a specific time slot
function bookSlot(doctorId, date, time) {
    console.log('bookSlot called with:', doctorId, date, time);
    
    // First, show an alert to confirm the function is being called
    alert(`Booking slot for ${doctorId} on ${date} at ${time}`);
    
    try {
        selectedSlotData = {
            doctorId,
            date,
            time
        };
        
        // Get doctor details from the closest clinic card
        const slotsContainer = document.getElementById(`${doctorId}-slots`);
        console.log('Slots container found:', slotsContainer);
        
        if (!slotsContainer) {
            console.error('Slots container not found:', `${doctorId}-slots`);
            alert('Could not find doctor information. Please try again.');
            return;
        }
        
        const doctorCard = slotsContainer.closest('.clinic-card');
        console.log('Doctor card found:', doctorCard);
        
        if (!doctorCard) {
            console.error('Doctor card not found');
            alert('Could not find doctor card. Please try again.');
            return;
        }
        
        // Try to get doctor details with fallbacks
        const doctorNameElement = doctorCard.querySelector('h3');
        const doctorSpecialtyElement = doctorCard.querySelector('.clinic-info p, p');
        const consultationFeeElement = doctorCard.querySelector('.fee');
        
        console.log('Elements found:', { doctorNameElement, doctorSpecialtyElement, consultationFeeElement });
        
        if (!doctorNameElement) {
            console.error('Doctor name not found');
            alert('Could not find doctor name. Please try again.');
            return;
        }
        
        const doctorName = doctorNameElement.textContent.trim();
        const doctorSpecialty = doctorSpecialtyElement ? doctorSpecialtyElement.textContent.trim() : 'Medical Consultation';
        const consultationFee = consultationFeeElement ? consultationFeeElement.textContent.replace('₹', '').trim() : '500';
        
        console.log('Doctor details:', { doctorName, doctorSpecialty, consultationFee });
        
        // Show booking modal
        showBookingModal({
            doctorId,
            doctorName,
            doctorSpecialty,
            date,
            time,
            consultationFee
        });
        
    } catch (error) {
        console.error('Error in bookSlot function:', error);
        alert('An error occurred while booking: ' + error.message);
    }
}

// Show booking modal
function showBookingModal(slotData) {
    const modal = document.getElementById('bookingModal');
    const selectedSlotInfo = document.getElementById('selectedSlotInfo');
    const consultationFeeElement = document.getElementById('consultationFee');
    const totalAmountElement = document.getElementById('totalAmount');
    
    if (modal && selectedSlotInfo) {
        // Update slot information
        selectedSlotInfo.innerHTML = `
            <div class="selected-slot">
                <h4>${slotData.doctorName}</h4>
                <p>${slotData.doctorSpecialty}</p>
                <div class="slot-details">
                    <div class="slot-item">
                        <i class="fas fa-calendar"></i>
                        <span>${new Date(slotData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div class="slot-item">
                        <i class="fas fa-clock"></i>
                        <span>${slotData.time} - ${addOneHour(slotData.time)} (1 hour)</span>
                    </div>
                </div>
            </div>
        `;
        
        // Update fees
        if (consultationFeeElement) consultationFeeElement.textContent = `₹${slotData.consultationFee}`;
        if (totalAmountElement) {
            const total = parseInt(slotData.consultationFee) + 200; // Adding registration fee
            totalAmountElement.textContent = `₹${total}`;
        }
        
        modal.classList.add('active');
    }
}

// Close booking modal
function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.remove('active');
    }
    selectedSlotData = null;
}

// Confirm booking
async function confirmBooking() {
    if (!selectedSlotData) return;
    
    const reason = document.getElementById('appointmentReason').value;
    const type = document.getElementById('appointmentType').value;
    const notes = document.getElementById('appointmentNotes').value;
    
    if (!reason.trim()) {
        showError('Please provide a reason for the appointment');
        return;
    }
    
    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        
        const response = await fetch('/api/appointments/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token}`
            },
            body: JSON.stringify({
                doctorId: selectedSlotData.doctorId,
                appointmentDate: selectedSlotData.date,
                appointmentTime: selectedSlotData.time,
                reason: reason,
                type: type,
                notes: notes
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Show success message
            showSuccess('Appointment booked successfully!');
            
            // Show success with AI call option
            showBookingSuccessWithAI(result.data.appointment, selectedSlotData.doctorId);
            closeBookingModal();
            
            // Refresh the slots
            loadWeeklySlots(selectedSlotData.doctorId);
            
            // Refresh appointments data if on appointments section
            loadSectionData('appointments');
            
            // If current user is a doctor, refresh their appointments
            const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
            if (userData && userData.type === 'doctor') {
                setTimeout(() => {
                    refreshDoctorAppointments();
                }, 1000); // Small delay to ensure the appointment is saved
            }
        } else {
            showError(result.message || 'Failed to book appointment');
        }
    } catch (error) {
        console.error('Error booking appointment:', error);
        showError('Error booking appointment');
    }
}

// AI Call functionality
let currentAICallDoctorId = null;
let aiCallInterval = null;

// Initiate AI Call
function initiateAICall(doctorId) {
    currentAICallDoctorId = doctorId;
    
    // Get doctor details
    const doctorCard = document.querySelector(`[data-doctor-id="${doctorId}"]`) || 
                      document.querySelector('.clinic-card'); // Fallback to first clinic card
    const doctorName = doctorCard.querySelector('h3').textContent;
    const doctorSpecialty = doctorCard.querySelector('.clinic-info p').textContent;
    const doctorAvatar = doctorCard.querySelector('img').src;
    
    // Update modal with doctor info
    document.getElementById('callDoctorName').textContent = doctorName;
    document.getElementById('callDoctorSpecialty').textContent = doctorSpecialty;
    document.getElementById('callDoctorAvatar').src = doctorAvatar;
    
    // Show AI call modal
    const modal = document.getElementById('aiCallModal');
    if (modal) {
        modal.classList.add('active');
        // Reset modal state
        document.getElementById('callSetupForm').style.display = 'block';
        document.getElementById('activeCallInterface').style.display = 'none';
        document.getElementById('callResults').style.display = 'none';
    }
}

// Start AI Call
async function startAICall() {
    const symptoms = document.getElementById('callSymptoms').value;
    const urgency = document.getElementById('callUrgency').value;
    const duration = document.getElementById('callDuration').value;
    
    if (!symptoms.trim()) {
        showError('Please describe your symptoms or concerns');
        return;
    }
    
    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        
        // Show call interface
        document.getElementById('callSetupForm').style.display = 'none';
        document.getElementById('activeCallInterface').style.display = 'block';
        
        // Start AI call simulation
        simulateAICall();
        
        // Make API call
        const response = await fetch(`/api/appointments/ai-call/${currentAICallDoctorId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token}`
            },
            body: JSON.stringify({
                symptoms: symptoms.split(',').map(s => s.trim()),
                urgency: urgency,
                duration: duration
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Simulate call completion after 10 seconds
            setTimeout(() => {
                showAICallResults(result.data.callSession);
            }, 10000);
        } else {
            showError(result.message || 'Failed to initiate AI call');
            closeAICallModal();
        }
    } catch (error) {
        console.error('Error starting AI call:', error);
        showError('Error starting AI call');
        closeAICallModal();
    }
}

// Simulate AI call progress
function simulateAICall() {
    let progress = 0;
    const statusTexts = [
        'AI Assistant is analyzing your symptoms...',
        'Processing medical data...',
        'Generating preliminary assessment...',
        'Finalizing recommendations...'
    ];
    
    let textIndex = 0;
    
    aiCallInterval = setInterval(() => {
        progress += 10;
        
        // Update progress bar
        document.getElementById('callProgress').style.width = `${progress}%`;
        document.getElementById('callProgressText').textContent = `${progress}% Complete`;
        
        // Update status text
        if (progress % 25 === 0 && textIndex < statusTexts.length) {
            document.getElementById('callStatusText').textContent = statusTexts[textIndex];
            textIndex++;
        }
        
        if (progress >= 100) {
            clearInterval(aiCallInterval);
        }
    }, 500);
}

// Show AI call results
function showAICallResults(callSession) {
    clearInterval(aiCallInterval);
    
    // Hide call interface and show results
    document.getElementById('activeCallInterface').style.display = 'none';
    document.getElementById('callResults').style.display = 'block';
    
    // Mock AI assessment results
    const assessmentSummary = document.getElementById('assessmentSummary');
    const aiRecommendations = document.getElementById('aiRecommendations');
    const nextSteps = document.getElementById('nextSteps');
    
    // Generate mock assessment based on urgency
    const mockAssessment = generateMockAssessment(callSession.urgency);
    
    if (assessmentSummary) {
        assessmentSummary.innerHTML = `
            <div class="assessment-item">
                <span class="label">Risk Level:</span>
                <span class="value ${mockAssessment.riskLevel}">${mockAssessment.riskLevel.charAt(0).toUpperCase() + mockAssessment.riskLevel.slice(1)}</span>
            </div>
            <div class="assessment-item">
                <span class="label">Primary Assessment:</span>
                <span class="value">${mockAssessment.assessment}</span>
            </div>
        `;
    }
    
    if (aiRecommendations) {
        aiRecommendations.innerHTML = mockAssessment.recommendations.map(rec => `<li>${rec}</li>`).join('');
    }
    
    if (nextSteps) {
        nextSteps.innerHTML = mockAssessment.nextSteps;
    }
}

// Generate mock AI assessment
function generateMockAssessment(urgency) {
    const assessments = {
        normal: {
            riskLevel: 'low',
            assessment: 'Your symptoms appear to be minor and manageable. Regular monitoring is recommended.',
            recommendations: [
                'Monitor symptoms over the next 24-48 hours',
                'Stay hydrated and get adequate rest',
                'Consider over-the-counter medication if needed',
                'Schedule a routine consultation if symptoms persist'
            ],
            nextSteps: '<p>Based on your symptoms, a routine consultation would be beneficial. You can book an appointment at your convenience.</p>'
        },
        moderate: {
            riskLevel: 'medium',
            assessment: 'Your symptoms require attention and should be evaluated by a healthcare professional soon.',
            recommendations: [
                'Book an appointment within the next 24-48 hours',
                'Monitor symptoms closely and note any changes',
                'Avoid strenuous activities until evaluated',
                'Keep a symptom diary for the doctor'
            ],
            nextSteps: '<p><strong>Recommended:</strong> Book an appointment within the next 1-2 days for proper evaluation.</p>'
        },
        high: {
            riskLevel: 'high',
            assessment: 'Your symptoms indicate a condition that requires prompt medical attention.',
            recommendations: [
                'Seek immediate medical attention',
                'Book an urgent appointment today if possible',
                'Monitor symptoms closely',
                'Have someone accompany you to the appointment'
            ],
            nextSteps: '<p><strong>Urgent:</strong> We strongly recommend booking an emergency consultation or visiting the nearest emergency room if symptoms worsen.</p>'
        }
    };
    
    return assessments[urgency] || assessments.normal;
}

// Close AI call modal
function closeAICallModal() {
    const modal = document.getElementById('aiCallModal');
    if (modal) {
        modal.classList.remove('active');
    }
    
    // Clear interval
    if (aiCallInterval) {
        clearInterval(aiCallInterval);
        aiCallInterval = null;
    }
    
    // Reset form
    document.getElementById('callSymptoms').value = '';
    document.getElementById('callUrgency').value = 'normal';
    document.getElementById('callDuration').value = 'new';
    
    currentAICallDoctorId = null;
}

// End AI call
function endAICall() {
    closeAICallModal();
}

// Book appointment from AI results
function bookAppointmentFromAI() {
    if (currentAICallDoctorId) {
        closeAICallModal();
        // Show the weekly slots for quick booking
        showWeeklySlots(currentAICallDoctorId);
        // Scroll to the doctor card
        const doctorCard = document.querySelector(`#${currentAICallDoctorId}-slots`).closest('.clinic-card');
        if (doctorCard) {
            doctorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// Save AI report
function saveAIReport() {
    // Mock save functionality
    showSuccess('AI report saved to your health records');
}

// Share AI report
function shareAIReport() {
    // Mock share functionality
    showSuccess('AI report shared with doctor');
}

// Show booking success with AI call option
function showBookingSuccessWithAI(appointment, doctorId) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create success notification with AI call button
    const notification = document.createElement('div');
    notification.className = 'notification success booking-success';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="success-header">
                <i class="fas fa-check-circle"></i>
                <div class="success-text">
                    <h4>Appointment Booked Successfully!</h4>
                    <p>Your appointment with ${appointment.doctor.name || `${appointment.doctor.firstName} ${appointment.doctor.lastName}`} is confirmed for ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${appointment.appointmentTime}.</p>
                </div>
            </div>
            <div class="ai-call-option">
                <p>Would you like to have a preliminary AI health consultation before your appointment?</p>
                <div class="ai-call-actions">
                    <button class="btn btn-success" onclick="initiateAICall('${doctorId}')">
                        <i class="fas fa-robot"></i>
                        Call with AI
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('.notification').remove()">
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        background: white;
        border: 1px solid #e2e8f0;
        border-left: 4px solid #22c55e;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        padding: 20px;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 15 seconds if no action taken
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 15000);
}

// Quick book appointment
function quickBookAppointment(doctorId) {
    showWeeklySlots(doctorId);
}

// Previous week navigation
function previousWeek(doctorId) {
    // Implementation for previous week
    console.log('Previous week for doctor:', doctorId);
    // In a real implementation, this would load the previous week's data
}

// Next week navigation
function nextWeek(doctorId) {
    // Implementation for next week
    console.log('Next week for doctor:', doctorId);
    // In a real implementation, this would load the next week's data
}

// Utility function to add one hour to time
function addOneHour(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const newHours = (hours + 1) % 24;
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Show success message
function showSuccess(message) {
    // Create or update success notification
    showNotification(message, 'success');
}

// Show error message
function showError(message) {
    // Create or update error notification
    showNotification(message, 'error');
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Logout function
function logout() {
    localStorage.removeItem('cliqpat_user');
    sessionStorage.removeItem('cliqpat_user');
    window.location.href = 'index.html';
}

// Additional functions that are called from HTML
function searchClinics() {
    console.log('Searching clinics...');
    // Implementation for searching clinics
}

function showAppointmentTab(tab) {
    console.log('Showing appointment tab:', tab);
    const upcomingTab = document.getElementById('upcomingAppointments');
    const pastTab = document.getElementById('pastAppointments');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // Remove active class from all tabs
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Hide all tab content
    if (upcomingTab) upcomingTab.style.display = 'none';
    if (pastTab) pastTab.style.display = 'none';
    
    // Show selected tab and mark button as active
    if (tab === 'upcoming' && upcomingTab) {
        upcomingTab.style.display = 'block';
        document.querySelector('.tab-btn').classList.add('active');
    } else if (tab === 'past' && pastTab) {
        pastTab.style.display = 'block';
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    }
}

function showCategory(category) {
    console.log('Showing category:', category);
    // Implementation for showing record categories
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

function scheduleScreening() {
    console.log('Scheduling screening...');
    // Implementation for scheduling screening
    showSuccess('Screening scheduled successfully!');
}

function viewScreeningReport(id) {
    console.log('Viewing screening report:', id);
    // Implementation for viewing screening reports
}

function shareReport(id) {
    console.log('Sharing report:', id);
    // Implementation for sharing reports
}

// Make functions globally available
window.searchClinics = searchClinics;
window.showAppointmentTab = showAppointmentTab;
window.showCategory = showCategory;
window.scheduleScreening = scheduleScreening;
window.viewScreeningReport = viewScreeningReport;
window.shareReport = shareReport;
window.showWeeklySlots = showWeeklySlots;
window.hideWeeklySlots = hideWeeklySlots;
window.bookSlot = bookSlot;
window.previousWeek = previousWeek;
window.nextWeek = nextWeek;
window.quickBookAppointment = quickBookAppointment;
window.initiateAICall = initiateAICall;
window.closeBookingModal = closeBookingModal;
window.confirmBooking = confirmBooking;
window.closeAICallModal = closeAICallModal;
window.startAICall = startAICall;
window.endAICall = endAICall;
window.bookAppointmentFromAI = bookAppointmentFromAI;
window.saveAIReport = saveAIReport;
window.shareAIReport = shareAIReport;
window.rescheduleAppointment = rescheduleAppointment;
window.cancelAppointment = cancelAppointment;
window.viewAppointmentDetails = viewAppointmentDetails;
window.viewPrescription = viewPrescription;
window.bookFollowUp = bookFollowUp;
window.viewRecord = viewRecord;
window.downloadRecord = downloadRecord;

// Export functions for global use
window.DashboardUtils = {
    showSection,
    loadSectionData,
    rescheduleAppointment,
    cancelAppointment,
    viewAppointmentDetails,
    bookAppointment,
    logout
};

