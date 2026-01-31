# Eyada Clinic Booking API - Postman Documentation

## Overview

This folder contains complete Postman collections for the Eyada Clinic Booking API with examples for all success and error cases.

## Collections

| File | Description |
|------|-------------|
| `Eyada_API_Collection.postman_collection.json` | Health Check, Auth, Specialties, Locations (States & Cities) |
| `Eyada_Part2_Doctors_Patients_Clinics.postman_collection.json` | Doctors, Patients, Clinics, Schedules, Services |
| `Eyada_Part3_Appointments.postman_collection.json` | Patient, Doctor, and Secretary Appointments |

## How to Import

1. Open Postman
2. Click **Import** button
3. Drag all 3 JSON files or select them
4. Collections will appear in sidebar

## Variables

All collections use these variables (auto-populated via test scripts):

| Variable | Description |
|----------|-------------|
| `baseUrl` | API base URL (default: `http://localhost:3000`) |
| `accessToken` | JWT access token (auto-set on login/register) |
| `refreshToken` | JWT refresh token |
| `userId` | Current user ID |
| `doctorId` | Doctor ID |
| `patientId` | Patient ID |
| `clinicId` | Clinic ID |
| `appointmentId` | Appointment ID |
| `specialtyId` | Specialty ID |
| `stateId` | State/Governorate ID |
| `cityId` | City ID |
| `serviceId` | Service type ID |
| `scheduleId` | Schedule ID |
| `familyMemberId` | Family member ID |

## Quick Start

### 1. Start the server
```bash
npm run start:dev
```

### 2. Register/Login
Run one of these requests first to get tokens:
- `Auth > Register - Patient`
- `Auth > Register - Doctor`
- `Auth > Login`

Tokens are automatically saved to collection variables.

### 3. Make authenticated requests
All subsequent requests will use the saved `accessToken`.

## API Roles

| Role | Description | Access |
|------|-------------|--------|
| **ADMIN** | System administrator | All admin endpoints, approve/reject doctors |
| **DOCTOR** | Medical doctor | Own profile, clinics, schedules, appointments |
| **SECRETARY** | Clinic secretary | Clinic appointments, booking for patients |
| **PATIENT** | Patient/Client | Own profile, booking, family members |

## Response Examples

Each request includes multiple response examples:
- **Success** - Expected successful response
- **Error - Validation** - Invalid input (400)
- **Error - Unauthorized** - Missing/invalid token (401)
- **Error - Forbidden** - Insufficient permissions (403)
- **Error - Not Found** - Resource doesn't exist (404)
- **Error - Conflict** - Duplicate/conflict (409)

## Validation Rules

### Password
- Min 8 characters, max 50
- Must contain: uppercase, lowercase, number or special character

### Egyptian Phone Number
- Format: `01[0125]XXXXXXXX`
- Examples: `01012345678`, `01112345678`, `01212345678`, `01512345678`

### Time Format
- 24-hour format: `HH:mm`
- Examples: `09:00`, `14:30`, `21:00`

### Date Format
- ISO 8601: `YYYY-MM-DD`
- Example: `2024-01-20`

## Rate Limits

| Type | Limit |
|------|-------|
| Short | 3 requests / 1 second |
| Medium | 20 requests / 10 seconds |
| Long | 100 requests / 60 seconds |
| Login | 10 attempts / hour |

## Token Expiry

| Token | Validity |
|-------|----------|
| Access Token | 15 minutes |
| Refresh Token | 7 days |

## Common Endpoints

### Public (No Auth)
- `GET /` - Welcome
- `GET /health` - Health check
- `GET /specialties` - List specialties
- `GET /states` - List states
- `GET /cities` - List cities
- `GET /doctors` - Search doctors
- `GET /clinics` - Search clinics
- `GET /clinics/:id/available-slots` - Get available slots

### Auth Required
- `GET /auth/me` - Current user
- `POST /auth/logout` - Logout
- `POST /auth/change-password` - Change password

### Patient Only
- `GET /patients/profile` - Get profile
- `POST /patients/appointments` - Book appointment
- `POST /patients/ratings` - Rate doctor

### Doctor Only
- `GET /doctors/profile/me` - Get profile
- `POST /doctors/clinics` - Create clinic
- `PATCH /doctors/appointments/:id/status` - Update appointment

### Admin Only
- `POST /specialties` - Create specialty
- `GET /admin/doctors/pending` - Pending doctors
- `PATCH /admin/doctors/:id/approve` - Approve doctor

## Tips

1. **Auto Token Refresh**: Login/Register requests automatically save tokens
2. **Test Scripts**: Many requests save IDs automatically for chaining
3. **Disabled Params**: Query params can be enabled by unchecking "disabled"
4. **Arabic Support**: All name/description fields support Arabic and English

## Need Help?

Check the API source code in:
- `src/modules/auth/` - Authentication
- `src/modules/doctors/` - Doctor endpoints
- `src/modules/patients/` - Patient endpoints
- `src/modules/clinics/` - Clinic management
- `src/modules/appointments/` - Appointments
