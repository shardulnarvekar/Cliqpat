const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const router = express.Router();

// Generate JWT Token
const generateToken = (userId, userType) => {
    return jwt.sign(
        { userId, userType },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '7d' }
    );
};

// Patient Registration
router.post('/patient/register', [
    body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit phone number'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('dateOfBirth').isISO8601().withMessage('Please enter a valid date of birth'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Please select a valid gender'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('pincode').trim().notEmpty().withMessage('Pincode is required'),
    body('emergencyContact.name').trim().notEmpty().withMessage('Emergency contact name is required'),
    body('emergencyContact.phone').matches(/^[6-9]\d{9}$/).withMessage('Emergency contact phone must be valid')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            firstName, lastName, email, phone, password, dateOfBirth, gender,
            address, bloodGroup, emergencyContact, medicalHistory, allergies,
            currentMedications
        } = req.body;

        // Check if patient already exists
        const existingPatient = await Patient.findOne({ email });
        if (existingPatient) {
            return res.status(400).json({
                success: false,
                message: 'Patient with this email already exists'
            });
        }

        // Create new patient
        const patient = new Patient({
            firstName,
            lastName,
            email,
            phone,
            password,
            dateOfBirth,
            gender,
            address: {
                street: address.street || '',
                city: address.city,
                state: address.state,
                pincode: address.pincode
            },
            bloodGroup,
            emergencyContact,
            medicalHistory: medicalHistory || [],
            allergies: allergies || [],
            currentMedications: currentMedications || []
        });

        await patient.save();

        // Generate token
        const token = generateToken(patient._id, 'patient');

        res.status(201).json({
            success: true,
            message: 'Patient registered successfully',
            data: {
                patient: patient.getPublicProfile(),
                token
            }
        });

    } catch (error) {
        console.error('Patient registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Doctor Registration
router.post('/doctor/register', [
    body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit phone number'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('specialization').isIn([
        'cardiology', 'dermatology', 'endocrinology', 'gastroenterology',
        'general', 'gynecology', 'neurology', 'oncology', 'orthopedics',
        'pediatrics', 'psychiatry', 'pulmonology', 'urology', 'other'
    ]).withMessage('Please select a valid specialization'),
    body('experience').isInt({ min: 0, max: 50 }).withMessage('Experience must be between 0 and 50 years'),
    body('qualifications').trim().notEmpty().withMessage('Qualifications are required'),
    body('clinicName').trim().notEmpty().withMessage('Clinic name is required'),
    body('clinicAddress.city').trim().notEmpty().withMessage('Clinic city is required'),
    body('clinicAddress.state').trim().notEmpty().withMessage('Clinic state is required'),
    body('clinicAddress.pincode').trim().notEmpty().withMessage('Clinic pincode is required'),
    body('consultationFee').isFloat({ min: 0 }).withMessage('Consultation fee must be positive'),
    body('registrationFee').isFloat({ min: 0 }).withMessage('Registration fee must be positive')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            firstName, lastName, email, phone, password, specialization, experience,
            qualifications, clinicName, clinicAddress, consultationFee, registrationFee,
            clinicTimings
        } = req.body;

        // Check if doctor already exists
        const existingDoctor = await Doctor.findOne({ email });
        if (existingDoctor) {
            return res.status(400).json({
                success: false,
                message: 'Doctor with this email already exists'
            });
        }

        // Create new doctor
        const doctor = new Doctor({
            firstName,
            lastName,
            email,
            phone,
            password,
            specialization,
            experience,
            qualifications,
            clinicName,
            clinicAddress: {
                street: clinicAddress.street || '',
                city: clinicAddress.city,
                state: clinicAddress.state,
                pincode: clinicAddress.pincode
            },
            consultationFee,
            registrationFee,
            clinicTimings: clinicTimings || {
                monday: { start: '09:00', end: '17:00', isOpen: true },
                tuesday: { start: '09:00', end: '17:00', isOpen: true },
                wednesday: { start: '09:00', end: '17:00', isOpen: true },
                thursday: { start: '09:00', end: '17:00', isOpen: true },
                friday: { start: '09:00', end: '17:00', isOpen: true },
                saturday: { start: '09:00', end: '13:00', isOpen: false },
                sunday: { start: '09:00', end: '13:00', isOpen: false }
            }
        });

        await doctor.save();

        res.status(201).json({
            success: true,
            message: 'Doctor registration submitted successfully. Awaiting verification.',
            data: {
                doctor: doctor.getPublicProfile()
            }
        });

    } catch (error) {
        console.error('Doctor registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Patient Login
router.post('/patient/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find patient
        const patient = await Patient.findOne({ email });
        if (!patient) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!patient.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Verify password
        const isPasswordValid = await patient.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        patient.lastLogin = new Date();
        await patient.save();

        // Generate token
        const token = generateToken(patient._id, 'patient');

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                patient: patient.getPublicProfile(),
                token
            }
        });

    } catch (error) {
        console.error('Patient login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Doctor Login
router.post('/doctor/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find doctor
        const doctor = await Doctor.findOne({ email });
        if (!doctor) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!doctor.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Check verification status
        if (doctor.verificationStatus !== 'approved') {
            return res.status(401).json({
                success: false,
                message: `Account verification is ${doctor.verificationStatus}. Please wait for approval.`
            });
        }

        // Verify password
        const isPasswordValid = await doctor.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        doctor.lastLogin = new Date();
        await doctor.save();

        // Generate token
        const token = generateToken(doctor._id, 'doctor');

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                doctor: doctor.getPublicProfile(),
                token
            }
        });

    } catch (error) {
        console.error('Doctor login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Verify Token
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        
        let user;
        if (decoded.userType === 'patient') {
            user = await Patient.findById(decoded.userId).select('-password');
        } else if (decoded.userType === 'doctor') {
            user = await Doctor.findById(decoded.userId).select('-password');
        } else {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Token verified',
            data: {
                user: user.getPublicProfile ? user.getPublicProfile() : user,
                userType: decoded.userType
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

module.exports = router;
