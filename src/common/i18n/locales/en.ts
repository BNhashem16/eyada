export const en = {
  // Auth errors
  INVALID_ROLE_REGISTRATION: 'Invalid role for registration',
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCOUNT_DEACTIVATED: 'Account is deactivated',
  ACCOUNT_PENDING_APPROVAL: 'Your account is pending approval',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  REFRESH_TOKEN_REVOKED: 'Refresh token has been revoked',
  REFRESH_TOKEN_EXPIRED: 'Refresh token has expired',
  CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect',
  USER_NOT_FOUND: 'User not found',
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  ACCESS_DENIED: 'Access denied. Required roles: {roles}',
  DOCTOR_PENDING_APPROVAL: 'Doctor account pending approval',

  // User errors
  EMAIL_ALREADY_REGISTERED: 'Email already registered',
  PHONE_ALREADY_REGISTERED: 'Phone number already registered',

  // Doctor errors
  DOCTOR_PROFILE_EXISTS: 'Doctor profile already exists',
  DOCTOR_NOT_PENDING: 'Doctor is not in pending status',
  DOCTOR_NOT_FOUND: 'Doctor not found',
  DOCTOR_PROFILE_NOT_FOUND: 'Doctor profile not found',
  DOCTOR_NOT_AVAILABLE: 'Doctor is not available for appointments',
  DOCTOR_PROFILE_INCOMPLETE: 'Please complete your doctor profile first before managing clinics',

  // Patient errors
  PATIENT_PROFILE_EXISTS: 'Patient profile already exists',
  PATIENT_PROFILE_NOT_FOUND: 'Patient profile not found',
  YOUR_PATIENT_PROFILE_NOT_FOUND: 'Your patient profile not found',
  FAMILY_MEMBER_NOT_FOUND: 'Family member not found',
  CANNOT_BOOK_FOR_PATIENT: 'Cannot book for this patient. They are not in your family.',

  // Clinic errors
  CLINIC_NOT_FOUND: 'Clinic not found',
  CLINIC_NOT_ACTIVE: 'Clinic not found or not active',
  CLINIC_NOT_OWNED: 'You do not own this clinic',
  CLINIC_NO_ACCESS: 'You do not have access to this clinic',
  CLINIC_NOT_OPEN: 'Clinic is not open on this day',
  CANNOT_DELETE_CLINIC: 'Cannot delete clinic with pending or confirmed appointments',

  // Appointment errors
  APPOINTMENT_NOT_FOUND: 'Appointment not found',
  CANNOT_BOOK_PAST: 'Cannot book appointments in the past',
  TIME_SLOT_BOOKED: 'This time slot is already booked',
  CANNOT_CANCEL_APPOINTMENT: 'Can only cancel pending or confirmed appointments',
  CANNOT_CANCEL_THIS_APPOINTMENT: 'You cannot cancel this appointment',
  CANNOT_VIEW_APPOINTMENT: 'You cannot view this appointment',
  INVALID_STATUS_TRANSITION: 'Cannot transition from {currentStatus} to {newStatus}',
  MEDICAL_NOTES_INVALID_STATUS: 'Can only update medical notes for checked-in or completed appointments',

  // Schedule errors
  SCHEDULE_NOT_FOUND: 'Schedule not found',
  SCHEDULE_EXISTS: 'Schedule already exists for this day. Use update instead.',
  START_BEFORE_END: 'Start time must be before end time',

  // Service errors
  SERVICE_NOT_FOUND: 'Service type not found',
  SERVICE_NOT_ACTIVE: 'Service type not found or not active',
  SERVICE_EXISTS: 'Service type already exists for this clinic',
  CANNOT_DELETE_SERVICE: 'Cannot delete service type with pending or confirmed appointments',

  // Rating errors
  CAN_ONLY_RATE_COMPLETED: 'Can only rate completed appointments',
  ALREADY_RATED: 'You have already rated this appointment',
  CANNOT_RATE_APPOINTMENT: 'You cannot rate this appointment',

  // Location errors
  STATE_NOT_FOUND: 'State not found',
  STATE_CODE_EXISTS: 'State code already exists',
  CITY_NOT_FOUND: 'City not found',

  // Specialty errors
  SPECIALTY_NOT_FOUND: 'Specialty not found',

  // Success messages
  LOGGED_OUT: 'Logged out successfully',
  LOGGED_OUT_ALL: 'Logged out from all devices',
  PASSWORD_CHANGED: 'Password changed successfully',
} as const;

export const validationEn = {
  PHONE_INVALID: 'Phone number must be a valid Egyptian mobile number',
  WHATSAPP_INVALID: 'WhatsApp number must be a valid Egyptian mobile number',
  TIME_FORMAT: 'Time must be in HH:mm format',
  APPOINTMENT_TIME_FORMAT: 'Appointment time must be in HH:mm format',
  START_TIME_FORMAT: 'Start time must be in HH:mm format',
  END_TIME_FORMAT: 'End time must be in HH:mm format',
  BREAK_TIME_FORMAT: 'Break time must be in HH:mm format',
} as const;
