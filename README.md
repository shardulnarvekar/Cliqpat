# Cliqpat - Smart Clinic Management System

A comprehensive healthcare management system that connects patients with doctors, featuring AI-powered preliminary screening, appointment booking, and electronic health records.

## 🚀 Features

### For Patients
- **User Registration & Authentication** - Secure patient registration with medical history
- **Find Clinics** - Search and filter doctors by specialization, location, and rating
- **Book Appointments** - Easy appointment booking with real-time availability
- **Health Records Management** - Upload and manage medical documents
- **AI Health Screening** - Schedule AI-powered preliminary health assessments
- **Appointment History** - Track past and upcoming appointments

### For Doctors
- **Clinic Registration** - Professional clinic registration with verification
- **Patient Management** - Comprehensive patient database and records
- **Appointment Scheduling** - Manage clinic schedule and appointments
- **AI Reports Review** - Access AI-generated preliminary health assessments
- **EHR System** - Electronic health records management
- **Analytics Dashboard** - Clinic performance insights and metrics

### Core System Features
- **Real-time Availability** - Dynamic appointment slot management
- **Secure Authentication** - JWT-based secure login system
- **Responsive Design** - Mobile-friendly interface
- **MongoDB Integration** - Scalable cloud database
- **RESTful API** - Clean and efficient backend architecture

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with animations
- **JavaScript (ES6+)** - Interactive functionality
- **Font Awesome** - Icon library
- **Google Fonts** - Typography

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v14 or higher)
- **npm** or **yarn** package manager
- **MongoDB Atlas** account (for cloud database)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cliqpat
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `config.env` file in the root directory:

```env
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/cliqpat?retryWrites=true&w=majority

# JWT Secret Key
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads/
```

### 4. MongoDB Atlas Setup

#### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (free tier recommended)

#### Step 2: Configure Database Access
1. Go to **Database Access** in the left sidebar
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Set username and password
5. Select **Read and write to any database**
6. Click **Add User**

#### Step 3: Configure Network Access
1. Go to **Network Access** in the left sidebar
2. Click **Add IP Address**
3. For development, click **Allow Access from Anywhere** (0.0.0.0/0)
4. Click **Confirm**

#### Step 4: Get Connection String
1. Go to **Clusters** in the left sidebar
2. Click **Connect**
3. Choose **Connect your application**
4. Copy the connection string
5. Replace `<username>`, `<password>`, and `<dbname>` in your `config.env`

### 5. Run the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The application will be available at:
- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api

## 📱 Usage Guide

### Patient Flow
1. **Register** - Create account with personal and medical information
2. **Login** - Access patient dashboard
3. **Find Clinics** - Search for doctors by specialization and location
4. **Book Appointment** - Select available time slots
5. **Manage Health** - Upload medical records and track appointments

### Doctor Flow
1. **Register Clinic** - Submit clinic information for verification
2. **Wait for Approval** - Admin verifies documents (24-48 hours)
3. **Login** - Access doctor dashboard after approval
4. **Manage Patients** - View patient records and appointments
5. **Review AI Reports** - Access preliminary health assessments

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/patient/register` - Patient registration
- `POST /api/auth/doctor/register` - Doctor registration
- `POST /api/auth/patient/login` - Patient login
- `POST /api/auth/doctor/login` - Doctor login
- `GET /api/auth/verify` - Verify JWT token

### Appointments
- `GET /api/appointments/available-slots/:doctorId/:date` - Get available slots
- `POST /api/appointments/book` - Book appointment
- `GET /api/appointments/patient` - Get patient appointments
- `GET /api/appointments/doctor` - Get doctor appointments
- `PATCH /api/appointments/:id/status` - Update appointment status
- `PATCH /api/appointments/:id/cancel` - Cancel appointment

### Doctors
- `GET /api/doctors/search` - Search doctors with filters
- `GET /api/doctors/:id` - Get doctor details
- `GET /api/doctors/specializations/list` - Get specializations
- `GET /api/doctors/cities/list` - Get cities with doctors

### Patients
- `GET /api/patients/profile` - Get patient profile
- `PUT /api/patients/profile` - Update patient profile
- `POST /api/patients/medical-records` - Add medical record
- `GET /api/patients/medical-records` - Get medical records

## 🗄️ Database Schema

### Patient Collection
- Personal information (name, email, phone, DOB, gender)
- Address details
- Medical history, allergies, current medications
- Medical records (lab reports, prescriptions, etc.)
- Authentication credentials

### Doctor Collection
- Personal and professional information
- Clinic details and timings
- Specialization and experience
- Verification documents and status
- Consultation fees and ratings

### Appointment Collection
- Doctor and patient references
- Date, time, and duration
- Status tracking (scheduled, confirmed, completed, etc.)
- AI screening results
- Prescriptions and follow-up information

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt encryption for passwords
- **Input Validation** - Comprehensive form validation
- **CORS Protection** - Cross-origin resource sharing security
- **Environment Variables** - Secure configuration management

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
1. Set `NODE_ENV=production` in environment
2. Use production MongoDB cluster
3. Set strong JWT secret
4. Configure proper CORS settings
5. Use PM2 or similar process manager

```bash
npm start
```

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Error
- Verify connection string in `config.env`
- Check network access settings in Atlas
- Ensure database user has correct permissions

#### JWT Token Issues
- Verify JWT_SECRET is set in environment
- Check token expiration settings
- Ensure proper Authorization header format

#### Port Already in Use
- Change PORT in `config.env`
- Kill existing process: `lsof -ti:5000 | xargs kill -9`

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Email: support@cliqpat.com
- Documentation: [Project Wiki]
- Issues: [GitHub Issues]

## 🔮 Future Enhancements

- **Video Consultations** - Integrated video calling
- **Payment Integration** - Online payment processing
- **Mobile App** - React Native mobile application
- **AI Chatbot** - Intelligent patient assistance
- **Analytics Dashboard** - Advanced reporting and insights
- **Multi-language Support** - Internationalization
- **Telemedicine Features** - Remote consultation tools

---

**Built with ❤️ for better healthcare management**
