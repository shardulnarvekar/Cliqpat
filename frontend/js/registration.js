// Registration Form Handler
class RegistrationForm {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.formData = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateProgressBar();
        this.setupFileUploads();
        this.setupPasswordValidation();
    }

    setupEventListeners() {
        // Next/Previous buttons
        const nextButtons = document.querySelectorAll('.btn-next');
        const prevButtons = document.querySelectorAll('.btn-prev');

        nextButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextStep();
            });
        });

        prevButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.prevStep();
            });
        });

        // Form submission
        const submitBtn = document.querySelector('.btn-submit');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.submitForm();
            });
        }

        // Input validation on blur
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // File upload validation
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => this.handleFileUpload(e));
        });
    }

    setupFileUploads() {
        const fileAreas = document.querySelectorAll('.file-upload-area');
        
        fileAreas.forEach(area => {
            const input = area.querySelector('input[type="file"]');
            const preview = area.querySelector('.file-preview');
            const label = area.querySelector('.file-label');

            if (input && preview && label) {
                input.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        this.displayFilePreview(file, preview, label);
                    }
                });

                // Drag and drop functionality
                area.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    area.classList.add('drag-over');
                });

                area.addEventListener('dragleave', () => {
                    area.classList.remove('drag-over');
                });

                area.addEventListener('drop', (e) => {
                    e.preventDefault();
                    area.classList.remove('drag-over');
                    const file = e.dataTransfer.files[0];
                    if (file) {
                        input.files = e.dataTransfer.files;
                        this.displayFilePreview(file, preview, label);
                    }
                });
            }
        });
    }

    displayFilePreview(file, preview, label) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        
        if (!allowedTypes.includes(file.type)) {
            this.showFieldError(input, 'Please upload PDF, JPG, or PNG files only');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.showFieldError(input, 'File size should be less than 5MB');
            return;
        }

        label.textContent = file.name;
        preview.innerHTML = '';

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.style.maxWidth = '100px';
            img.style.maxHeight = '100px';
            preview.appendChild(img);
        } else {
            const icon = document.createElement('i');
            icon.className = 'fas fa-file-pdf';
            icon.style.fontSize = '2rem';
            icon.style.color = '#e74c3c';
            preview.appendChild(icon);
        }

        preview.style.display = 'block';
    }

    setupPasswordValidation() {
        const passwordInput = document.querySelector('input[name="password"]');
        const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]');
        const strengthMeter = document.querySelector('.password-strength');

        if (passwordInput && strengthMeter) {
            passwordInput.addEventListener('input', (e) => {
                const strength = this.checkPasswordStrength(e.target.value);
                this.updatePasswordStrength(strength, strengthMeter);
            });
        }

        if (confirmPasswordInput && passwordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                this.validatePasswordMatch(passwordInput, confirmPasswordInput);
            });
        }
    }

    checkPasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score < 2) return 'weak';
        if (score < 4) return 'medium';
        return 'strong';
    }

    updatePasswordStrength(strength, meter) {
        meter.className = `password-strength ${strength}`;
        const text = meter.querySelector('.strength-text');
        if (text) {
            text.textContent = `Password Strength: ${strength.charAt(0).toUpperCase() + strength.slice(1)}`;
        }
    }

    validatePasswordMatch(passwordInput, confirmInput) {
        if (passwordInput.value !== confirmInput.value) {
            this.showFieldError(confirmInput, 'Passwords do not match');
        } else {
            this.clearFieldError(confirmInput);
        }
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            this.collectStepData();
            this.currentStep++;
            this.updateProgressBar();
            this.showStep(this.currentStep);
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateProgressBar();
            this.showStep(this.currentStep);
        }
    }

    validateCurrentStep() {
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        const requiredFields = currentStepElement.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const name = field.name;

        // Clear previous error
        this.clearFieldError(field);

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, 'This field is required');
            return false;
        }

        // Email validation
        if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showFieldError(field, 'Please enter a valid email address');
                return false;
            }
        }

        // Phone validation
        if (name === 'phone' && value) {
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(value)) {
                this.showFieldError(field, 'Please enter a valid 10-digit phone number');
                return false;
            }
        }

        // Pincode validation
        if (name === 'pincode' && value) {
            const pincodeRegex = /^[0-9]{6}$/;
            if (!pincodeRegex.test(value)) {
                this.showFieldError(field, 'Please enter a valid 6-digit pincode');
                return false;
            }
        }

        // File validation
        if (type === 'file' && field.files.length > 0) {
            const file = field.files[0];
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            
            if (!allowedTypes.includes(file.type)) {
                this.showFieldError(field, 'Please upload PDF, JPG, or PNG files only');
                return false;
            }

            if (file.size > 5 * 1024 * 1024) {
                this.showFieldError(field, 'File size should be less than 5MB');
                return false;
            }
        }

        return true;
    }

    showFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message') || 
                           document.createElement('div');
        
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        if (!formGroup.querySelector('.error-message')) {
            formGroup.appendChild(errorElement);
        }
        
        field.classList.add('error');
    }

    clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        
        if (errorElement) {
            errorElement.remove();
        }
        
        field.classList.remove('error');
    }

    collectStepData() {
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        const fields = currentStepElement.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            if (field.type === 'file') {
                if (field.files.length > 0) {
                    this.formData[field.name] = field.files[0];
                }
            } else {
                this.formData[field.name] = field.value;
            }
        });
    }

    updateProgressBar() {
        const progressBar = document.querySelector('.progress-bar');
        const progressText = document.querySelector('.progress-text');
        
        if (progressBar) {
            const progress = (this.currentStep / this.totalSteps) * 100;
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `Step ${this.currentStep} of ${this.totalSteps}`;
        }
    }

    showStep(step) {
        const steps = document.querySelectorAll('.form-step');
        const nextBtn = document.querySelector('.btn-next');
        const prevBtn = document.querySelector('.btn-prev');
        const submitBtn = document.querySelector('.btn-submit');

        steps.forEach((s, index) => {
            if (index + 1 === step) {
                s.style.display = 'block';
                s.classList.add('active');
            } else {
                s.style.display = 'none';
                s.classList.remove('active');
            }
        });

        // Update button visibility
        if (prevBtn) {
            prevBtn.style.display = step === 1 ? 'none' : 'inline-block';
        }
        
        if (nextBtn) {
            nextBtn.style.display = step === this.totalSteps ? 'none' : 'inline-block';
        }
        
        if (submitBtn) {
            submitBtn.style.display = step === this.totalSteps ? 'inline-block' : 'none';
        }
    }

    async submitForm() {
        if (!this.validateCurrentStep()) {
            return;
        }

        this.collectStepData();
        this.showLoadingModal();

        try {
            // Simulate API call
            await this.simulateApiCall();
            
            this.hideLoadingModal();
            this.showSuccessModal();
            
            // Redirect after success
            setTimeout(() => {
                const isPatient = window.location.pathname.includes('patient');
                const redirectUrl = isPatient ? 'patient-dashboard.html' : 'doctor-dashboard.html';
                window.location.href = redirectUrl;
            }, 2000);

        } catch (error) {
            this.hideLoadingModal();
            this.showErrorNotification('Registration failed. Please try again.');
        }
    }

    async simulateApiCall() {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate processing time
                resolve();
            }, 3000);
        });
    }

    showLoadingModal() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideLoadingModal() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    showErrorNotification(message) {
        // Use the notification system from main.js
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }
}

// Initialize registration forms when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a registration page
    if (window.location.pathname.includes('register')) {
        new RegistrationForm();
    }
});

// Export for use in other files
window.RegistrationForm = RegistrationForm;

