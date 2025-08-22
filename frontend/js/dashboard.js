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
    const appointmentsList = document.querySelector('.appointments-list');
    if (!appointmentsList) return;
    
    if (appointments.length > 0) {
        appointmentsList.innerHTML = appointments.map(appointment => `
            <div class="appointment-item">
                <div class="appointment-time">
                    <span class="time">${appointment.appointmentTime}</span>
                    <span class="status ${appointment.status}">${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
                </div>
                <div class="appointment-details">
                    <h4>${appointment.patient.firstName} ${appointment.patient.lastName}</h4>
                    <p>${appointment.reason}</p>
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
        appointmentsList.innerHTML = '<p class="no-data">No appointments for today</p>';
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
                        <span>₹${doctor.consultationFee} consultation fee</span>
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
    // Implement book appointment functionality
    console.log('Book appointment:', doctorId);
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

// Logout function
function logout() {
    localStorage.removeItem('cliqpat_user');
    sessionStorage.removeItem('cliqpat_user');
    window.location.href = 'index.html';
}

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

