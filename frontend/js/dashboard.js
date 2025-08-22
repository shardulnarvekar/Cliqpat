// Dashboard Handler
class Dashboard {
    constructor() {
        this.currentSection = 'overview';
        this.userData = this.getUserData();
        this.init();
    }

    init() {
        this.setupNavigation();
        this.loadDashboardData();
        this.setupEventListeners();
        this.showSection(this.currentSection);
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.sidebar-nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
                this.updateActiveNav(link);
            });
        });
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }

        // Quick action buttons
        const quickActions = document.querySelectorAll('.quick-action');
        quickActions.forEach(action => {
            action.addEventListener('click', (e) => {
                const actionType = action.getAttribute('data-action');
                this.handleQuickAction(actionType);
            });
        });

        // Clinic cards
        const clinicCards = document.querySelectorAll('.clinic-card');
        clinicCards.forEach(card => {
            card.addEventListener('click', () => {
                const clinicId = card.getAttribute('data-clinic-id');
                this.showClinicDetails(clinicId);
            });
        });

        // Appointment actions
        const appointmentActions = document.querySelectorAll('.appointment-action');
        appointmentActions.forEach(action => {
            action.addEventListener('click', (e) => {
                e.stopPropagation();
                const actionType = action.getAttribute('data-action');
                const appointmentId = action.closest('.appointment-item').getAttribute('data-appointment-id');
                this.handleAppointmentAction(actionType, appointmentId);
            });
        });

        // File upload
        const fileUploads = document.querySelectorAll('.file-upload');
        fileUploads.forEach(upload => {
            upload.addEventListener('change', (e) => {
                this.handleFileUpload(e);
            });
        });

        // AI Screening
        const screeningBtn = document.querySelector('.schedule-screening');
        if (screeningBtn) {
            screeningBtn.addEventListener('click', () => {
                this.scheduleAIScreening();
            });
        }

        // Logout
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    showSection(section) {
        this.currentSection = section;
        const sections = document.querySelectorAll('.dashboard-section');
        const sectionElement = document.querySelector(`#${section}-section`);

        sections.forEach(s => s.style.display = 'none');
        if (sectionElement) {
            sectionElement.style.display = 'block';
            this.loadSectionData(section);
        }
    }

    updateActiveNav(activeLink) {
        const navLinks = document.querySelectorAll('.sidebar-nav a');
        navLinks.forEach(link => link.classList.remove('active'));
        activeLink.classList.add('active');
    }

    loadDashboardData() {
        // Load user data and stats
        this.updateUserInfo();
        this.loadStats();
    }

    loadSectionData(section) {
        switch (section) {
            case 'overview':
                this.loadOverviewData();
                break;
            case 'clinics':
                this.loadClinicsData();
                break;
            case 'appointments':
                this.loadAppointmentsData();
                break;
            case 'records':
                this.loadHealthRecordsData();
                break;
            case 'screening':
                this.loadAIScreeningData();
                break;
            case 'reports':
                this.loadReportsData();
                break;
            case 'profile':
                this.loadProfileData();
                break;
            case 'patients':
                this.loadPatientsData();
                break;
            case 'ai-reports':
                this.loadAIReportsData();
                break;
            case 'ehr':
                this.loadEHRData();
                break;
            case 'analytics':
                this.loadAnalyticsData();
                break;
        }
    }

    loadOverviewData() {
        // Load overview statistics and recent activity
        this.updateStats();
        this.loadRecentActivity();
    }

    loadClinicsData() {
        const clinicsContainer = document.querySelector('#clinics-section .clinics-grid');
        if (!clinicsContainer) return;

        const clinics = this.getMockClinics();
        clinicsContainer.innerHTML = '';

        clinics.forEach(clinic => {
            const clinicCard = this.createClinicCard(clinic);
            clinicsContainer.appendChild(clinicCard);
        });
    }

    loadAppointmentsData() {
        const appointmentsContainer = document.querySelector('#appointments-section .appointments-list');
        if (!appointmentsContainer) return;

        const appointments = this.getMockAppointments();
        appointmentsContainer.innerHTML = '';

        appointments.forEach(appointment => {
            const appointmentItem = this.createAppointmentItem(appointment);
            appointmentsContainer.appendChild(appointmentItem);
        });
    }

    loadHealthRecordsData() {
        const recordsContainer = document.querySelector('#records-section .records-list');
        if (!recordsContainer) return;

        const records = this.getMockHealthRecords();
        recordsContainer.innerHTML = '';

        records.forEach(record => {
            const recordItem = this.createHealthRecordItem(record);
            recordsContainer.appendChild(recordItem);
        });
    }

    loadAIScreeningData() {
        const screeningContainer = document.querySelector('#screening-section .screening-status');
        if (!screeningContainer) return;

        const screeningData = this.getMockScreeningData();
        screeningContainer.innerHTML = this.createScreeningStatusHTML(screeningData);
    }

    loadReportsData() {
        const reportsContainer = document.querySelector('#reports-section .reports-grid');
        if (!reportsContainer) return;

        const reports = this.getMockReports();
        reportsContainer.innerHTML = '';

        reports.forEach(report => {
            const reportCard = this.createReportCard(report);
            reportsContainer.appendChild(reportCard);
        });
    }

    loadProfileData() {
        const profileForm = document.querySelector('#profile-section .profile-form');
        if (!profileForm) return;

        // Populate form with user data
        const fields = profileForm.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            if (this.userData[field.name]) {
                field.value = this.userData[field.name];
            }
        });
    }

    loadPatientsData() {
        const patientsContainer = document.querySelector('#patients-section .patients-list');
        if (!patientsContainer) return;

        const patients = this.getMockPatients();
        patientsContainer.innerHTML = '';

        patients.forEach(patient => {
            const patientItem = this.createPatientItem(patient);
            patientsContainer.appendChild(patientItem);
        });
    }

    loadAIReportsData() {
        const reportsContainer = document.querySelector('#ai-reports-section .ai-reports-list');
        if (!reportsContainer) return;

        const reports = this.getMockAIReports();
        reportsContainer.innerHTML = '';

        reports.forEach(report => {
            const reportItem = this.createAIReportItem(report);
            reportsContainer.appendChild(reportItem);
        });
    }

    loadEHRData() {
        const ehrContainer = document.querySelector('#ehr-section .ehr-list');
        if (!ehrContainer) return;

        const ehrRecords = this.getMockEHRRecords();
        ehrContainer.innerHTML = '';

        ehrRecords.forEach(record => {
            const ehrItem = this.createEHRItem(record);
            ehrContainer.appendChild(ehrItem);
        });
    }

    loadAnalyticsData() {
        const analyticsContainer = document.querySelector('#analytics-section .analytics-content');
        if (!analyticsContainer) return;

        const analyticsData = this.getMockAnalyticsData();
        analyticsContainer.innerHTML = this.createAnalyticsHTML(analyticsData);
    }

    // Mock Data Methods
    getUserData() {
        const isPatient = window.location.pathname.includes('patient');
        return {
            name: isPatient ? 'John Doe' : 'Dr. Sarah Johnson',
            email: isPatient ? 'john.doe@email.com' : 'dr.sarah@clinic.com',
            phone: '+91 98765 43210',
            type: isPatient ? 'patient' : 'doctor',
            avatar: isPatient ? '👤' : '👩‍⚕️'
        };
    }

    getMockClinics() {
        return [
            {
                id: 1,
                name: 'City Medical Center',
                doctor: 'Dr. Sarah Johnson',
                specialization: 'General Medicine',
                rating: 4.8,
                distance: '2.5 km',
                consultationFee: '₹500',
                availableSlots: 5,
                image: '🏥'
            },
            {
                id: 2,
                name: 'Health First Clinic',
                doctor: 'Dr. Michael Chen',
                specialization: 'Cardiology',
                rating: 4.6,
                distance: '3.2 km',
                consultationFee: '₹800',
                availableSlots: 3,
                image: '💊'
            },
            {
                id: 3,
                name: 'Family Care Clinic',
                doctor: 'Dr. Emily Brown',
                specialization: 'Pediatrics',
                rating: 4.9,
                distance: '1.8 km',
                consultationFee: '₹400',
                availableSlots: 8,
                image: '👨‍👩‍👧‍👦'
            }
        ];
    }

    getMockAppointments() {
        return [
            {
                id: 1,
                clinic: 'City Medical Center',
                doctor: 'Dr. Sarah Johnson',
                date: '2024-01-15',
                time: '10:00 AM',
                status: 'confirmed',
                type: 'General Checkup'
            },
            {
                id: 2,
                clinic: 'Health First Clinic',
                doctor: 'Dr. Michael Chen',
                date: '2024-01-18',
                time: '2:30 PM',
                status: 'pending',
                type: 'Cardiac Consultation'
            }
        ];
    }

    getMockHealthRecords() {
        return [
            {
                id: 1,
                title: 'Blood Test Report',
                date: '2024-01-10',
                type: 'PDF',
                size: '2.3 MB',
                uploaded: true
            },
            {
                id: 2,
                title: 'X-Ray Report',
                date: '2024-01-08',
                type: 'PDF',
                size: '1.8 MB',
                uploaded: true
            }
        ];
    }

    getMockScreeningData() {
        return {
            status: 'scheduled',
            scheduledDate: '2024-01-16',
            scheduledTime: '11:00 AM',
            duration: '2-3 minutes',
            questions: 15
        };
    }

    getMockReports() {
        return [
            {
                id: 1,
                title: 'AI Screening Report',
                date: '2024-01-14',
                status: 'completed',
                summary: 'Patient shows symptoms of common cold'
            },
            {
                id: 2,
                title: 'Health Assessment',
                date: '2024-01-12',
                status: 'completed',
                summary: 'Overall health is good, minor concerns noted'
            }
        ];
    }

    getMockPatients() {
        return [
            {
                id: 1,
                name: 'John Doe',
                age: 35,
                phone: '+91 98765 43210',
                lastVisit: '2024-01-10',
                nextAppointment: '2024-01-15'
            },
            {
                id: 2,
                name: 'Jane Smith',
                age: 28,
                phone: '+91 98765 43211',
                lastVisit: '2024-01-08',
                nextAppointment: '2024-01-18'
            }
        ];
    }

    getMockAIReports() {
        return [
            {
                id: 1,
                patient: 'John Doe',
                date: '2024-01-14',
                duration: '2:30',
                symptoms: 'Fever, cough, fatigue',
                recommendations: 'Rest, fluids, monitor temperature'
            },
            {
                id: 2,
                patient: 'Jane Smith',
                date: '2024-01-12',
                duration: '2:15',
                symptoms: 'Headache, nausea',
                recommendations: 'Avoid bright lights, stay hydrated'
            }
        ];
    }

    getMockEHRRecords() {
        return [
            {
                id: 1,
                patient: 'John Doe',
                recordType: 'Medical History',
                date: '2024-01-10',
                status: 'uploaded',
                size: '1.2 MB'
            },
            {
                id: 2,
                patient: 'Jane Smith',
                recordType: 'Lab Reports',
                date: '2024-01-08',
                status: 'uploaded',
                size: '2.1 MB'
            }
        ];
    }

    getMockAnalyticsData() {
        return {
            totalPatients: 150,
            totalAppointments: 45,
            averageConsultationTime: '12 minutes',
            patientSatisfaction: '4.8/5',
            monthlyGrowth: '+15%'
        };
    }

    // UI Creation Methods
    createClinicCard(clinic) {
        const card = document.createElement('div');
        card.className = 'clinic-card';
        card.setAttribute('data-clinic-id', clinic.id);
        
        card.innerHTML = `
            <div class="clinic-image">${clinic.image}</div>
            <div class="clinic-info">
                <h3>${clinic.name}</h3>
                <p class="doctor-name">${clinic.doctor}</p>
                <p class="specialization">${clinic.specialization}</p>
                <div class="clinic-meta">
                    <span class="rating">⭐ ${clinic.rating}</span>
                    <span class="distance">📍 ${clinic.distance}</span>
                </div>
                <div class="clinic-footer">
                    <span class="fee">${clinic.consultationFee}</span>
                    <span class="slots">${clinic.availableSlots} slots available</span>
                </div>
            </div>
            <div class="clinic-actions">
                <button class="btn btn-primary" onclick="dashboard.bookAppointment(${clinic.id})">
                    Book Appointment
                </button>
                <button class="btn btn-secondary" onclick="dashboard.viewClinicDetails(${clinic.id})">
                    View Details
                </button>
            </div>
        `;
        
        return card;
    }

    createAppointmentItem(appointment) {
        const item = document.createElement('div');
        item.className = 'appointment-item';
        item.setAttribute('data-appointment-id', appointment.id);
        
        item.innerHTML = `
            <div class="appointment-info">
                <h4>${appointment.clinic}</h4>
                <p class="doctor">${appointment.doctor}</p>
                <p class="datetime">${appointment.date} at ${appointment.time}</p>
                <p class="type">${appointment.type}</p>
            </div>
            <div class="appointment-status ${appointment.status}">
                <span class="status-badge">${appointment.status}</span>
            </div>
            <div class="appointment-actions">
                <button class="btn btn-sm btn-primary appointment-action" data-action="reschedule">
                    Reschedule
                </button>
                <button class="btn btn-sm btn-secondary appointment-action" data-action="cancel">
                    Cancel
                </button>
            </div>
        `;
        
        return item;
    }

    createHealthRecordItem(record) {
        const item = document.createElement('div');
        item.className = 'record-item';
        
        item.innerHTML = `
            <div class="record-info">
                <h4>${record.title}</h4>
                <p class="date">${record.date}</p>
                <p class="type">${record.type} • ${record.size}</p>
            </div>
            <div class="record-actions">
                <button class="btn btn-sm btn-primary" onclick="dashboard.viewRecord(${record.id})">
                    View
                </button>
                <button class="btn btn-sm btn-secondary" onclick="dashboard.downloadRecord(${record.id})">
                    Download
                </button>
            </div>
        `;
        
        return item;
    }

    createScreeningStatusHTML(data) {
        return `
            <div class="screening-card">
                <div class="screening-header">
                    <h3>AI Screening Status</h3>
                    <span class="status-badge ${data.status}">${data.status}</span>
                </div>
                <div class="screening-details">
                    <p><strong>Scheduled:</strong> ${data.scheduledDate} at ${data.scheduledTime}</p>
                    <p><strong>Duration:</strong> ${data.duration}</p>
                    <p><strong>Questions:</strong> ${data.questions}</p>
                </div>
                <div class="screening-actions">
                    <button class="btn btn-primary" onclick="dashboard.rescheduleScreening()">
                        Reschedule
                    </button>
                    <button class="btn btn-secondary" onclick="dashboard.viewScreeningDetails()">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }

    createReportCard(report) {
        const card = document.createElement('div');
        card.className = 'report-card';
        
        card.innerHTML = `
            <div class="report-header">
                <h4>${report.title}</h4>
                <span class="date">${report.date}</span>
            </div>
            <div class="report-content">
                <p class="summary">${report.summary}</p>
                <span class="status-badge ${report.status}">${report.status}</span>
            </div>
            <div class="report-actions">
                <button class="btn btn-sm btn-primary" onclick="dashboard.viewReport(${report.id})">
                    View Full Report
                </button>
            </div>
        `;
        
        return card;
    }

    createPatientItem(patient) {
        const item = document.createElement('div');
        item.className = 'patient-item';
        
        item.innerHTML = `
            <div class="patient-info">
                <h4>${patient.name}</h4>
                <p class="age">Age: ${patient.age}</p>
                <p class="phone">${patient.phone}</p>
            </div>
            <div class="patient-visits">
                <p><strong>Last Visit:</strong> ${patient.lastVisit}</p>
                <p><strong>Next Appointment:</strong> ${patient.nextAppointment}</p>
            </div>
            <div class="patient-actions">
                <button class="btn btn-sm btn-primary" onclick="dashboard.viewPatientDetails(${patient.id})">
                    View Details
                </button>
                <button class="btn btn-sm btn-secondary" onclick="dashboard.viewPatientEHR(${patient.id})">
                    View EHR
                </button>
            </div>
        `;
        
        return item;
    }

    createAIReportItem(report) {
        const item = document.createElement('div');
        item.className = 'ai-report-item';
        
        item.innerHTML = `
            <div class="report-header">
                <h4>${report.patient}</h4>
                <span class="date">${report.date}</span>
            </div>
            <div class="report-details">
                <p><strong>Duration:</strong> ${report.duration} minutes</p>
                <p><strong>Symptoms:</strong> ${report.symptoms}</p>
                <p><strong>Recommendations:</strong> ${report.recommendations}</p>
            </div>
            <div class="report-actions">
                <button class="btn btn-sm btn-primary" onclick="dashboard.viewAIReport(${report.id})">
                    View Full Report
                </button>
            </div>
        `;
        
        return item;
    }

    createEHRItem(record) {
        const item = document.createElement('div');
        item.className = 'ehr-item';
        
        item.innerHTML = `
            <div class="ehr-info">
                <h4>${record.patient}</h4>
                <p class="record-type">${record.recordType}</p>
                <p class="date">${record.date}</p>
            </div>
            <div class="ehr-meta">
                <span class="status-badge ${record.status}">${record.status}</span>
                <span class="size">${record.size}</span>
            </div>
            <div class="ehr-actions">
                <button class="btn btn-sm btn-primary" onclick="dashboard.viewEHR(${record.id})">
                    View
                </button>
                <button class="btn btn-sm btn-secondary" onclick="dashboard.downloadEHR(${record.id})">
                    Download
                </button>
            </div>
        `;
        
        return item;
    }

    createAnalyticsHTML(data) {
        return `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <h3>Total Patients</h3>
                    <p class="number">${data.totalPatients}</p>
                </div>
                <div class="analytics-card">
                    <h3>Total Appointments</h3>
                    <p class="number">${data.totalAppointments}</p>
                </div>
                <div class="analytics-card">
                    <h3>Avg. Consultation Time</h3>
                    <p class="number">${data.averageConsultationTime}</p>
                </div>
                <div class="analytics-card">
                    <h3>Patient Satisfaction</h3>
                    <p class="number">${data.patientSatisfaction}</p>
                </div>
                <div class="analytics-card">
                    <h3>Monthly Growth</h3>
                    <p class="number positive">${data.monthlyGrowth}</p>
                </div>
            </div>
        `;
    }

    // Action Handlers
    handleSearch(query) {
        // Implement search functionality based on current section
        console.log('Searching for:', query);
        this.showNotification(`Searching for: ${query}`, 'info');
    }

    handleQuickAction(actionType) {
        switch (actionType) {
            case 'find-clinic':
                this.showSection('clinics');
                break;
            case 'book-appointment':
                this.showSection('appointments');
                break;
            case 'upload-records':
                this.showSection('records');
                break;
            case 'schedule-screening':
                this.scheduleAIScreening();
                break;
            case 'view-reports':
                this.showSection('reports');
                break;
            case 'manage-patients':
                this.showSection('patients');
                break;
            case 'view-ehr':
                this.showSection('ehr');
                break;
        }
    }

    handleAppointmentAction(actionType, appointmentId) {
        switch (actionType) {
            case 'reschedule':
                this.rescheduleAppointment(appointmentId);
                break;
            case 'cancel':
                this.cancelAppointment(appointmentId);
                break;
        }
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.uploadFile(file);
        }
    }

    // Specific Action Methods
    bookAppointment(clinicId) {
        this.showNotification('Redirecting to appointment booking...', 'info');
        setTimeout(() => {
            // Simulate navigation to booking page
            this.showNotification('Appointment booking feature will be implemented soon!', 'success');
        }, 1000);
    }

    viewClinicDetails(clinicId) {
        this.showNotification('Loading clinic details...', 'info');
        setTimeout(() => {
            this.showNotification('Clinic details feature will be implemented soon!', 'success');
        }, 1000);
    }

    rescheduleAppointment(appointmentId) {
        this.showNotification('Opening reschedule form...', 'info');
        setTimeout(() => {
            this.showNotification('Reschedule feature will be implemented soon!', 'success');
        }, 1000);
    }

    cancelAppointment(appointmentId) {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            this.showNotification('Cancelling appointment...', 'info');
            setTimeout(() => {
                this.showNotification('Appointment cancelled successfully!', 'success');
            }, 1000);
        }
    }

    viewRecord(recordId) {
        this.showNotification('Opening health record...', 'info');
        setTimeout(() => {
            this.showNotification('Health record viewer will be implemented soon!', 'success');
        }, 1000);
    }

    downloadRecord(recordId) {
        this.showNotification('Downloading record...', 'info');
        setTimeout(() => {
            this.showNotification('Record downloaded successfully!', 'success');
        }, 2000);
    }

    scheduleAIScreening() {
        this.showNotification('Scheduling AI screening call...', 'info');
        setTimeout(() => {
            this.showNotification('AI screening scheduled successfully!', 'success');
        }, 2000);
    }

    rescheduleScreening() {
        this.showNotification('Opening reschedule form...', 'info');
        setTimeout(() => {
            this.showNotification('Screening rescheduled successfully!', 'success');
        }, 1000);
    }

    viewScreeningDetails() {
        this.showNotification('Loading screening details...', 'info');
        setTimeout(() => {
            this.showNotification('Screening details feature will be implemented soon!', 'success');
        }, 1000);
    }

    viewReport(reportId) {
        this.showNotification('Opening report...', 'info');
        setTimeout(() => {
            this.showNotification('Report viewer will be implemented soon!', 'success');
        }, 1000);
    }

    viewPatientDetails(patientId) {
        this.showNotification('Loading patient details...', 'info');
        setTimeout(() => {
            this.showNotification('Patient details feature will be implemented soon!', 'success');
        }, 1000);
    }

    viewPatientEHR(patientId) {
        this.showNotification('Loading patient EHR...', 'info');
        setTimeout(() => {
            this.showNotification('Patient EHR viewer will be implemented soon!', 'success');
        }, 1000);
    }

    viewAIReport(reportId) {
        this.showNotification('Opening AI report...', 'info');
        setTimeout(() => {
            this.showNotification('AI report viewer will be implemented soon!', 'success');
        }, 1000);
    }

    viewEHR(recordId) {
        this.showNotification('Opening EHR record...', 'info');
        setTimeout(() => {
            this.showNotification('EHR viewer will be implemented soon!', 'success');
        }, 1000);
    }

    downloadEHR(recordId) {
        this.showNotification('Downloading EHR record...', 'info');
        setTimeout(() => {
            this.showNotification('EHR record downloaded successfully!', 'success');
        }, 2000);
    }

    uploadFile(file) {
        this.showNotification('Uploading file...', 'info');
        setTimeout(() => {
            this.showNotification('File uploaded successfully!', 'success');
        }, 2000);
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            this.showNotification('Logging out...', 'info');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }

    // Utility Methods
    updateUserInfo() {
        const userName = document.querySelector('.user-name');
        const userEmail = document.querySelector('.user-email');
        const userAvatar = document.querySelector('.user-avatar');

        if (userName) userName.textContent = this.userData.name;
        if (userEmail) userEmail.textContent = this.userData.email;
        if (userAvatar) userAvatar.textContent = this.userData.avatar;
    }

    updateStats() {
        const stats = document.querySelectorAll('.stat-number');
        stats.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            this.animateCounter(stat, target);
        });
    }

    animateCounter(element, target) {
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 20);
    }

    loadRecentActivity() {
        const activityContainer = document.querySelector('.recent-activity');
        if (!activityContainer) return;

        const activities = [
            { text: 'Appointment booked with Dr. Sarah Johnson', time: '2 hours ago' },
            { text: 'Health records uploaded', time: '1 day ago' },
            { text: 'AI screening completed', time: '2 days ago' }
        ];

        activityContainer.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <p>${activity.text}</p>
                <span class="time">${activity.time}</span>
            </div>
        `).join('');
    }

    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a dashboard page
    if (window.location.pathname.includes('dashboard')) {
        window.dashboard = new Dashboard();
    }
});

// Export for use in other files
window.Dashboard = Dashboard;

