export const ar = {
  // Auth errors
  INVALID_ROLE_REGISTRATION: 'دور غير صالح للتسجيل',
  INVALID_CREDENTIALS: 'بيانات الدخول غير صحيحة',
  ACCOUNT_DEACTIVATED: 'الحساب معطل',
  ACCOUNT_PENDING_APPROVAL: 'حسابك في انتظار الموافقة',
  INVALID_REFRESH_TOKEN: 'رمز التحديث غير صالح',
  REFRESH_TOKEN_REVOKED: 'تم إلغاء رمز التحديث',
  REFRESH_TOKEN_EXPIRED: 'انتهت صلاحية رمز التحديث',
  CURRENT_PASSWORD_INCORRECT: 'كلمة المرور الحالية غير صحيحة',
  USER_NOT_FOUND: 'المستخدم غير موجود',
  USER_NOT_AUTHENTICATED: 'المستخدم غير مصادق عليه',
  ACCESS_DENIED: 'تم رفض الوصول. الأدوار المطلوبة: {roles}',
  DOCTOR_PENDING_APPROVAL: 'حساب الطبيب في انتظار الموافقة',

  // User errors
  EMAIL_ALREADY_REGISTERED: 'البريد الإلكتروني مسجل مسبقاً',
  PHONE_ALREADY_REGISTERED: 'رقم الهاتف مسجل مسبقاً',

  // Doctor errors
  DOCTOR_PROFILE_EXISTS: 'الملف الشخصي للطبيب موجود مسبقاً',
  DOCTOR_NOT_PENDING: 'الطبيب ليس في حالة الانتظار',
  DOCTOR_NOT_FOUND: 'الطبيب غير موجود',
  DOCTOR_PROFILE_NOT_FOUND: 'الملف الشخصي للطبيب غير موجود',
  DOCTOR_NOT_AVAILABLE: 'الطبيب غير متاح للحجز',
  DOCTOR_PROFILE_INCOMPLETE: 'يرجى إكمال ملفك الشخصي كطبيب أولاً قبل إدارة العيادات',

  // Patient errors
  PATIENT_PROFILE_EXISTS: 'الملف الشخصي للمريض موجود مسبقاً',
  PATIENT_PROFILE_NOT_FOUND: 'الملف الشخصي للمريض غير موجود',
  YOUR_PATIENT_PROFILE_NOT_FOUND: 'ملفك الشخصي كمريض غير موجود',
  FAMILY_MEMBER_NOT_FOUND: 'فرد العائلة غير موجود',
  CANNOT_BOOK_FOR_PATIENT: 'لا يمكن الحجز لهذا المريض. ليس من أفراد عائلتك.',

  // Clinic errors
  CLINIC_NOT_FOUND: 'العيادة غير موجودة',
  CLINIC_NOT_ACTIVE: 'العيادة غير موجودة أو غير نشطة',
  CLINIC_NOT_OWNED: 'أنت لا تملك هذه العيادة',
  CLINIC_NO_ACCESS: 'ليس لديك صلاحية الوصول لهذه العيادة',
  CLINIC_NOT_OPEN: 'العيادة مغلقة في هذا اليوم',
  CANNOT_DELETE_CLINIC: 'لا يمكن حذف العيادة مع وجود مواعيد معلقة أو مؤكدة',

  // Appointment errors
  APPOINTMENT_NOT_FOUND: 'الموعد غير موجود',
  CANNOT_BOOK_PAST: 'لا يمكن حجز مواعيد في الماضي',
  TIME_SLOT_BOOKED: 'هذا الوقت محجوز مسبقاً',
  CANNOT_CANCEL_APPOINTMENT: 'يمكن إلغاء المواعيد المعلقة أو المؤكدة فقط',
  CANNOT_CANCEL_THIS_APPOINTMENT: 'لا يمكنك إلغاء هذا الموعد',
  CANNOT_VIEW_APPOINTMENT: 'لا يمكنك عرض هذا الموعد',
  INVALID_STATUS_TRANSITION: 'لا يمكن التغيير من {currentStatus} إلى {newStatus}',
  MEDICAL_NOTES_INVALID_STATUS: 'يمكن تحديث الملاحظات الطبية للمواعيد المسجلة أو المكتملة فقط',

  // Schedule errors
  SCHEDULE_NOT_FOUND: 'الجدول غير موجود',
  SCHEDULE_EXISTS: 'الجدول موجود مسبقاً لهذا اليوم. استخدم التحديث بدلاً من ذلك.',
  START_BEFORE_END: 'وقت البداية يجب أن يكون قبل وقت النهاية',

  // Service errors
  SERVICE_NOT_FOUND: 'نوع الخدمة غير موجود',
  SERVICE_NOT_ACTIVE: 'نوع الخدمة غير موجود أو غير نشط',
  SERVICE_EXISTS: 'نوع الخدمة موجود مسبقاً لهذه العيادة',
  CANNOT_DELETE_SERVICE: 'لا يمكن حذف نوع الخدمة مع وجود مواعيد معلقة أو مؤكدة',

  // Rating errors
  CAN_ONLY_RATE_COMPLETED: 'يمكن تقييم المواعيد المكتملة فقط',
  ALREADY_RATED: 'لقد قمت بتقييم هذا الموعد مسبقاً',
  CANNOT_RATE_APPOINTMENT: 'لا يمكنك تقييم هذا الموعد',

  // Location errors
  STATE_NOT_FOUND: 'المحافظة غير موجودة',
  STATE_CODE_EXISTS: 'كود المحافظة موجود مسبقاً',
  CITY_NOT_FOUND: 'المدينة غير موجودة',

  // Specialty errors
  SPECIALTY_NOT_FOUND: 'التخصص غير موجود',

  // Success messages
  LOGGED_OUT: 'تم تسجيل الخروج بنجاح',
  LOGGED_OUT_ALL: 'تم تسجيل الخروج من جميع الأجهزة',
  PASSWORD_CHANGED: 'تم تغيير كلمة المرور بنجاح',
} as const;

export const validationAr = {
  PHONE_INVALID: 'رقم الهاتف يجب أن يكون رقم مصري صالح',
  WHATSAPP_INVALID: 'رقم الواتساب يجب أن يكون رقم مصري صالح',
  TIME_FORMAT: 'الوقت يجب أن يكون بصيغة HH:mm',
  APPOINTMENT_TIME_FORMAT: 'وقت الموعد يجب أن يكون بصيغة HH:mm',
  START_TIME_FORMAT: 'وقت البداية يجب أن يكون بصيغة HH:mm',
  END_TIME_FORMAT: 'وقت النهاية يجب أن يكون بصيغة HH:mm',
  BREAK_TIME_FORMAT: 'وقت الاستراحة يجب أن يكون بصيغة HH:mm',
} as const;
