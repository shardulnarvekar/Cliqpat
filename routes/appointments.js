const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// Get available slots for a doctor on a specific date
router.get('/available-slots/:doctorId/:date', async (req, res) => {
    try {
        const { doctorId, date } = req.params;

        // Validate doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Check if doctor is verified
        if (doctor.verificationStatus !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Doctor is not verified yet'
            });
        }

        // Get available slots
        const availableSlots = await Appointment.getAvailableSlots(doctorId, date);

        res.json({
            success: true,
            message: 'Available slots retrieved successfully',
            data: {
                doctor: {
                    id: doctor._id,
                    name: doctor.fullName,
                    specialization: doctor.specialization,
                    clinicName: doctor.clinicName,
                    consultationFee: doctor.consultationFee,
                    registrationFee: doctor.registrationFee
                },
                date: date,
                availableSlots
            }
        });

    } catch (error) {
        console.error('Get available slots error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Book an appointment
router.post('/book', authenticateToken, [
    body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
    body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
    body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid appointment time is required'),
    body('reason').trim().notEmpty().withMessage('Appointment reason is required'),
    body('type').optional().isIn(['consultation', 'follow_up', 'emergency', 'routine_checkup']).withMessage('Invalid appointment type')
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

        const { doctorId, appointmentDate, appointmentTime, reason, type, notes, symptoms } = req.body;
        const patientId = req.user.userId;

        // Verify user is a patient
        if (req.user.userType !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Only patients can book appointments'
            });
        }

        // Check if patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Check if doctor exists and is verified
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        if (doctor.verificationStatus !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Doctor is not verified yet'
            });
        }

        // Check availability
        const availability = await Appointment.checkAvailability(doctorId, appointmentDate, appointmentTime);
        if (!availability.available) {
            return res.status(400).json({
                success: false,
                message: availability.reason
            });
        }

        // Create appointment
        const appointment = new Appointment({
            doctor: doctorId,
            patient: patientId,
            appointmentDate,
            appointmentTime,
            reason,
            type: type || 'consultation',
            notes,
            symptoms: symptoms || [],
            consultationFee: doctor.consultationFee,
            registrationFee: doctor.registrationFee
        });

        await appointment.save();

        // Update doctor statistics
        await Doctor.findByIdAndUpdate(doctorId, {
            $inc: { totalAppointments: 1 }
        });

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            data: {
                appointment: {
                    id: appointment._id,
                    doctor: {
                        id: doctor._id,
                        name: doctor.fullName,
                        specialization: doctor.specialization,
                        clinicName: doctor.clinicName
                    },
                    patient: {
                        id: patient._id,
                        name: patient.fullName
                    },
                    appointmentDate,
                    appointmentTime,
                    reason,
                    type: appointment.type,
                    status: appointment.status,
                    consultationFee: appointment.consultationFee,
                    registrationFee: appointment.registrationFee,
                    totalAmount: appointment.totalAmount
                }
            }
        });

    } catch (error) {
        console.error('Book appointment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Get patient's appointments
router.get('/patient', authenticateToken, async (req, res) => {
    try {
        // Verify user is a patient
        if (req.user.userType !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const patientId = req.user.userId;
        const { status, page = 1, limit = 10 } = req.query;

        // Build query
        const query = { patient: patientId };
        if (status && status !== 'all') {
            query.status = status;
        }

        // Pagination
        const skip = (page - 1) * limit;

        const appointments = await Appointment.find(query)
            .populate('doctor', 'firstName lastName specialization clinicName')
            .sort({ appointmentDate: -1, appointmentTime: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Appointment.countDocuments(query);

        res.json({
            success: true,
            message: 'Patient appointments retrieved successfully',
            data: {
                appointments,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalAppointments: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get patient appointments error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Get doctor's appointments
router.get('/doctor', authenticateToken, async (req, res) => {
    try {
        // Verify user is a doctor
        if (req.user.userType !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const doctorId = req.user.userId;
        const { status, date, page = 1, limit = 10 } = req.query;

        // Build query
        const query = { doctor: doctorId };
        if (status && status !== 'all') {
            query.status = status;
        }
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            query.appointmentDate = { $gte: startDate, $lt: endDate };
        }

        // Pagination
        const skip = (page - 1) * limit;

        const appointments = await Appointment.find(query)
            .populate('patient', 'firstName lastName phone')
            .sort({ appointmentDate: 1, appointmentTime: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Appointment.countDocuments(query);

        res.json({
            success: true,
            message: 'Doctor appointments retrieved successfully',
            data: {
                appointments,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalAppointments: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get doctor appointments error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Update appointment status
router.patch('/:appointmentId/status', authenticateToken, [
    body('status').isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Invalid status')
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

        const { appointmentId } = req.params;
        const { status, notes } = req.body;
        const userId = req.user.userId;
        const userType = req.user.userType;

        // Find appointment
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Check permissions
        if (userType === 'doctor' && appointment.doctor.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own appointments'
            });
        }

        if (userType === 'patient' && appointment.patient.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own appointments'
            });
        }

        // Update appointment
        appointment.status = status;
        if (notes) {
            appointment.notes = notes;
        }

        await appointment.save();

        res.json({
            success: true,
            message: 'Appointment status updated successfully',
            data: {
                appointment: {
                    id: appointment._id,
                    status: appointment.status,
                    notes: appointment.notes,
                    updatedAt: appointment.updatedAt
                }
            }
        });

    } catch (error) {
        console.error('Update appointment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Cancel appointment
router.patch('/:appointmentId/cancel', authenticateToken, async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { reason } = req.body;
        const userId = req.user.userId;
        const userType = req.user.userType;

        // Find appointment
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Check permissions
        if (userType === 'doctor' && appointment.doctor.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only cancel your own appointments'
            });
        }

        if (userType === 'patient' && appointment.patient.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only cancel your own appointments'
            });
        }

        // Check if appointment can be cancelled
        if (appointment.status === 'completed' || appointment.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Appointment cannot be cancelled'
            });
        }

        // Cancel appointment
        appointment.status = 'cancelled';
        if (reason) {
            appointment.notes = reason;
        }

        await appointment.save();

        res.json({
            success: true,
            message: 'Appointment cancelled successfully',
            data: {
                appointment: {
                    id: appointment._id,
                    status: appointment.status,
                    notes: appointment.notes,
                    updatedAt: appointment.updatedAt
                }
            }
        });

    } catch (error) {
        console.error('Cancel appointment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Get appointment details
router.get('/:appointmentId', authenticateToken, async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const userId = req.user.userId;
        const userType = req.user.userType;

        // Find appointment with populated data
        const appointment = await Appointment.findById(appointmentId)
            .populate('doctor', 'firstName lastName specialization clinicName clinicAddress consultationFee registrationFee')
            .populate('patient', 'firstName lastName phone dateOfBirth gender');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Check permissions
        if (userType === 'doctor' && appointment.doctor._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (userType === 'patient' && appointment.patient._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            message: 'Appointment details retrieved successfully',
            data: { appointment }
        });

    } catch (error) {
        console.error('Get appointment details error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

module.exports = router;
