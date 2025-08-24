const express = require('express');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { generatePatientReport, createSummaryReport } = require('../services/aiService');
const router = express.Router();

/**
 * ElevenLabs webhook endpoint
 * This endpoint receives data when a conversation is completed
 */
router.post('/elevenlabs-conversation', async (req, res) => {
    try {
        console.log('ElevenLabs webhook received:', JSON.stringify(req.body, null, 2));
        
        // Extract data from ElevenLabs webhook
        const {
            appointment_id,
            conversation_transcript,
            patient_name,
            patient_age,
            patient_gender,
            chief_complaint,
            symptoms,
            duration_of_symptoms,
            severity,
            previous_medical_history,
            current_medications,
            allergies,
            social_history,
            family_history,
            additional_notes,
            conversation_duration,
            conversation_id,
            agent_id
        } = req.body;

        // Validate required fields
        if (!appointment_id) {
            return res.status(400).json({
                success: false,
                message: 'appointment_id is required'
            });
        }

        if (!conversation_transcript) {
            return res.status(400).json({
                success: false,
                message: 'conversation_transcript is required'
            });
        }

        // Find the appointment
        const appointment = await Appointment.findById(appointment_id).populate(['doctor', 'patient']);
        
        if (!appointment) {
            console.error('Appointment not found:', appointment_id);
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        console.log('Processing AI report for appointment:', appointment_id);

        // Update appointment with conversation data
        appointment.aiConversationReport.status = 'in_progress';
        appointment.aiConversationReport.conversationTranscript = conversation_transcript;
        appointment.aiConversationReport.webhookData = req.body;
        appointment.aiConversationReport.extractedPatientInfo = {
            appointment_id,
            patient_name: patient_name || appointment.patient.fullName,
            patient_age: patient_age || appointment.patient.age,
            patient_gender: patient_gender || appointment.patient.gender,
            chief_complaint: chief_complaint || '',
            symptoms: Array.isArray(symptoms) ? symptoms : (symptoms ? symptoms.split(',').map(s => s.trim()) : []),
            duration_of_symptoms: duration_of_symptoms || '',
            severity: severity || 'mild',
            previous_medical_history: previous_medical_history || '',
            current_medications: current_medications || '',
            allergies: allergies || '',
            social_history: social_history || '',
            family_history: family_history || '',
            additional_notes: additional_notes || ''
        };

        await appointment.save();
        console.log('Appointment updated with initial conversation data');

        // Generate AI report in the background
        setImmediate(async () => {
            try {
                console.log('Starting AI report generation...');
                
                // Prepare appointment context for AI
                const appointmentContext = {
                    appointmentId: appointment._id,
                    appointmentDate: appointment.appointmentDate,
                    appointmentTime: appointment.appointmentTime,
                    reason: appointment.reason,
                    patientInfo: {
                        name: appointment.patient.fullName,
                        age: appointment.patient.age,
                        gender: appointment.patient.gender,
                        phone: appointment.patient.phone
                    },
                    doctorInfo: {
                        name: appointment.doctor.fullName,
                        specialization: appointment.doctor.specialization,
                        clinicName: appointment.doctor.clinicName
                    }
                };

                // Generate comprehensive report using Gemini AI
                const reportResult = await generatePatientReport(conversation_transcript, appointmentContext);
                
                if (reportResult.success) {
                    // Update appointment with generated report
                    const updatedAppointment = await Appointment.findById(appointment_id);
                    updatedAppointment.aiConversationReport.status = 'completed';
                    updatedAppointment.aiConversationReport.generatedReport = reportResult.generatedReport;
                    updatedAppointment.aiConversationReport.reportGeneratedAt = new Date();
                    
                    // Merge extracted patient info from AI with webhook data
                    if (reportResult.extractedPatientInfo && Object.keys(reportResult.extractedPatientInfo).length > 0) {
                        updatedAppointment.aiConversationReport.extractedPatientInfo = {
                            ...updatedAppointment.aiConversationReport.extractedPatientInfo,
                            ...reportResult.extractedPatientInfo
                        };
                    }
                    
                    await updatedAppointment.save();
                    console.log('AI report generated and saved successfully');
                } else {
                    // Mark as failed if AI generation failed
                    const updatedAppointment = await Appointment.findById(appointment_id);
                    updatedAppointment.aiConversationReport.status = 'failed';
                    updatedAppointment.aiConversationReport.generatedReport = `Report generation failed: ${reportResult.error}`;
                    await updatedAppointment.save();
                    console.error('AI report generation failed:', reportResult.error);
                }
            } catch (error) {
                console.error('Error in background AI report generation:', error);
                // Update status to failed
                try {
                    const updatedAppointment = await Appointment.findById(appointment_id);
                    updatedAppointment.aiConversationReport.status = 'failed';
                    updatedAppointment.aiConversationReport.generatedReport = `Report generation error: ${error.message}`;
                    await updatedAppointment.save();
                } catch (saveError) {
                    console.error('Error saving failed status:', saveError);
                }
            }
        });

        // Send immediate response to ElevenLabs
        res.status(200).json({
            success: true,
            message: 'Conversation data received successfully',
            data: {
                appointment_id: appointment_id,
                status: 'processing',
                report_generation: 'in_progress'
            }
        });

    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

/**
 * Get AI conversation report for an appointment
 */
router.get('/ai-report/:appointmentId', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        
        const appointment = await Appointment.findById(appointmentId)
            .populate('doctor', 'firstName lastName specialization clinicName')
            .populate('patient', 'firstName lastName');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.json({
            success: true,
            message: 'AI report retrieved successfully',
            data: {
                appointmentId: appointment._id,
                patientName: appointment.patient.fullName,
                doctorName: appointment.doctor.fullName,
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.appointmentTime,
                aiReport: {
                    status: appointment.aiConversationReport.status,
                    generatedReport: appointment.aiConversationReport.generatedReport,
                    extractedPatientInfo: appointment.aiConversationReport.extractedPatientInfo,
                    reportGeneratedAt: appointment.aiConversationReport.reportGeneratedAt,
                    conversationTranscript: appointment.aiConversationReport.conversationTranscript
                }
            }
        });

    } catch (error) {
        console.error('Get AI report error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

/**
 * Regenerate AI report for an appointment
 */
router.post('/regenerate-ai-report/:appointmentId', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        
        const appointment = await Appointment.findById(appointmentId).populate(['doctor', 'patient']);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        if (!appointment.aiConversationReport.conversationTranscript) {
            return res.status(400).json({
                success: false,
                message: 'No conversation transcript available for this appointment'
            });
        }

        // Set status to in progress
        appointment.aiConversationReport.status = 'in_progress';
        await appointment.save();

        // Generate report in background
        setImmediate(async () => {
            try {
                const appointmentContext = {
                    appointmentId: appointment._id,
                    appointmentDate: appointment.appointmentDate,
                    appointmentTime: appointment.appointmentTime,
                    reason: appointment.reason,
                    patientInfo: {
                        name: appointment.patient.fullName,
                        age: appointment.patient.age,
                        gender: appointment.patient.gender
                    },
                    doctorInfo: {
                        name: appointment.doctor.fullName,
                        specialization: appointment.doctor.specialization
                    }
                };

                const reportResult = await generatePatientReport(
                    appointment.aiConversationReport.conversationTranscript, 
                    appointmentContext
                );
                
                const updatedAppointment = await Appointment.findById(appointmentId);
                
                if (reportResult.success) {
                    updatedAppointment.aiConversationReport.status = 'completed';
                    updatedAppointment.aiConversationReport.generatedReport = reportResult.generatedReport;
                    updatedAppointment.aiConversationReport.reportGeneratedAt = new Date();
                    
                    if (reportResult.extractedPatientInfo) {
                        updatedAppointment.aiConversationReport.extractedPatientInfo = {
                            ...updatedAppointment.aiConversationReport.extractedPatientInfo,
                            ...reportResult.extractedPatientInfo
                        };
                    }
                } else {
                    updatedAppointment.aiConversationReport.status = 'failed';
                    updatedAppointment.aiConversationReport.generatedReport = `Regeneration failed: ${reportResult.error}`;
                }
                
                await updatedAppointment.save();
            } catch (error) {
                console.error('Error regenerating report:', error);
                const updatedAppointment = await Appointment.findById(appointmentId);
                updatedAppointment.aiConversationReport.status = 'failed';
                await updatedAppointment.save();
            }
        });

        res.json({
            success: true,
            message: 'AI report regeneration started',
            data: {
                appointmentId: appointmentId,
                status: 'in_progress'
            }
        });

    } catch (error) {
        console.error('Regenerate AI report error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

module.exports = router;
