import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { ConfigService } from '@nestjs/config';
import {
  CreateAppointmentDto,
  CreateSecretaryAppointmentDto,
  UpdateAppointmentStatusDto,
  UpdateMedicalNotesDto,
  UpdatePaymentStatusDto,
  PatientAppointmentFilterDto,
  AppointmentFilterDto,
} from './dto';
import { PaginatedResult } from '../../common/interfaces';
import {
  Appointment,
  AppointmentStatus,
  PaymentStatus,
  DayOfWeek,
} from '@prisma/client';
import { encrypt, decrypt } from '../../common/utils';
import {
  ErrorMessages,
  formatMessage,
  BilingualNotFoundException,
  BilingualForbiddenException,
  BilingualBadRequestException,
} from '../../common';

@Injectable()
export class AppointmentsService {
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('encryption.key') || '';
  }

  // Patient books an appointment
  async create(
    patientUserId: string,
    createDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    // Get patient profile
    const patientProfile = await this.prisma.patientProfile.findUnique({
      where: { userId: patientUserId },
      include: { user: true },
    });

    if (!patientProfile) {
      throw new BilingualNotFoundException(ErrorMessages.PATIENT_PROFILE_NOT_FOUND);
    }

    // Determine which profile to book for (self or family member)
    let bookingForPatientId = patientProfile.id;
    let patientName = patientProfile.user.fullName;
    let patientAge = patientProfile.age;

    if (createDto.patientProfileId) {
      // Check if this is a valid family member
      const familyMember = await this.prisma.patientProfile.findFirst({
        where: {
          id: createDto.patientProfileId,
          familyHeadId: patientProfile.id,
        },
        include: { user: true },
      });

      if (!familyMember) {
        throw new BilingualForbiddenException(ErrorMessages.CANNOT_BOOK_FOR_PATIENT);
      }
      bookingForPatientId = familyMember.id;
      patientName = familyMember.user.fullName;
      patientAge = familyMember.age;
    }

    // Get clinic with doctor info
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: createDto.clinicId },
      include: {
        doctorProfile: true,
        schedules: true,
      },
    });

    if (!clinic || !clinic.isActive) {
      throw new BilingualNotFoundException(ErrorMessages.CLINIC_NOT_ACTIVE);
    }

    if (clinic.doctorProfile.status !== 'APPROVED') {
      throw new BilingualBadRequestException(ErrorMessages.DOCTOR_NOT_AVAILABLE);
    }

    // Get service type
    const serviceType = await this.prisma.clinicServiceType.findFirst({
      where: {
        id: createDto.serviceTypeId,
        clinicId: createDto.clinicId,
        isActive: true,
      },
    });

    if (!serviceType) {
      throw new BilingualNotFoundException(ErrorMessages.SERVICE_NOT_ACTIVE);
    }

    // Validate appointment date and time
    const appointmentDate = new Date(createDto.appointmentDate);
    appointmentDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      throw new BilingualBadRequestException(ErrorMessages.CANNOT_BOOK_PAST);
    }

    // Check if the day is a working day
    const dayOfWeek = this.getDayOfWeek(appointmentDate);
    const daySchedules = clinic.schedules.filter(
      (s) => s.dayOfWeek === dayOfWeek && s.isActive,
    );

    if (daySchedules.length === 0) {
      throw new BilingualBadRequestException(ErrorMessages.CLINIC_NOT_OPEN);
    }

    // Check for existing appointment at this time
    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        clinicId: createDto.clinicId,
        appointmentDate,
        appointmentTime: createDto.appointmentTime,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (existingAppointment) {
      throw new BilingualBadRequestException(ErrorMessages.TIME_SLOT_BOOKED);
    }

    // Get queue number for the day
    const queueNumber = await this.getNextQueueNumber(
      createDto.clinicId,
      appointmentDate,
    );

    // Generate booking number
    const bookingNumber = await this.generateBookingNumber();

    // Create appointment with snapshot data
    return this.prisma.appointment.create({
      data: {
        bookingNumber,
        clinicId: createDto.clinicId,
        doctorProfileId: clinic.doctorProfileId,
        patientProfileId: patientProfile.id,
        bookedForPatientId: bookingForPatientId,
        serviceTypeId: createDto.serviceTypeId,
        appointmentDate,
        appointmentTime: createDto.appointmentTime,
        queueNumber,
        status: AppointmentStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        // Snapshot data
        patientName,
        patientAge,
        serviceName: serviceType.name || { ar: '', en: '' },
        price: serviceType.price,
        patientNotes: createDto.notes,
        bookedBy: 'patient',
        bookedById: patientUserId,
      },
      include: {
        patientProfile: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        },
        clinic: {
          include: {
            doctorProfile: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
                specialty: true,
              },
            },
            city: {
              include: { state: true },
            },
          },
        },
        serviceType: true,
      },
    });
  }

  // Get patient's appointments with full filtering
  async findByPatient(
    patientUserId: string,
    filterDto: PatientAppointmentFilterDto,
  ): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      dateFrom,
      dateTo,
      clinicId,
      doctorId,
      upcoming,
      forFamilyMember,
    } = filterDto;
    const skip = (page - 1) * limit;

    const patientProfile = await this.prisma.patientProfile.findUnique({
      where: { userId: patientUserId },
      include: {
        familyMembers: true,
      },
    });

    if (!patientProfile) {
      throw new BilingualNotFoundException(ErrorMessages.PATIENT_PROFILE_NOT_FOUND);
    }

    // Determine which patient IDs to include
    let patientIds: string[];
    if (forFamilyMember === true) {
      // Only family members
      patientIds = patientProfile.familyMembers.map((fm) => fm.id);
    } else if (forFamilyMember === false) {
      // Only self
      patientIds = [patientProfile.id];
    } else {
      // Both self and family members
      patientIds = [
        patientProfile.id,
        ...patientProfile.familyMembers.map((fm) => fm.id),
      ];
    }

    const where: any = {
      bookedForPatientId: { in: patientIds },
    };

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by payment status
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.appointmentDate = {};
      if (dateFrom) {
        where.appointmentDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.appointmentDate.lte = new Date(dateTo);
      }
    }

    // Filter upcoming only
    if (upcoming) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.appointmentDate = { ...where.appointmentDate, gte: today };
    }

    // Filter by clinic
    if (clinicId) {
      where.clinicId = clinicId;
    }

    // Filter by doctor
    if (doctorId) {
      where.doctorProfileId = doctorId;
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          bookedForPatient: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
          clinic: {
            include: {
              doctorProfile: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                    },
                  },
                  specialty: true,
                },
              },
              city: {
                include: { state: true },
              },
            },
          },
          serviceType: true,
        },
        orderBy: [{ appointmentDate: 'desc' }, { appointmentTime: 'desc' }],
      }),
      this.prisma.appointment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: appointments,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  // Get doctor's appointments with full filtering
  async findByDoctor(
    doctorUserId: string,
    filterDto: AppointmentFilterDto,
  ): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 20,
      clinicId,
      status,
      paymentStatus,
      date,
      dateFrom,
      dateTo,
      search,
      serviceTypeId,
      upcoming,
    } = filterDto;
    const skip = (page - 1) * limit;

    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
      include: {
        clinics: true,
      },
    });

    if (!doctorProfile) {
      throw new BilingualNotFoundException(ErrorMessages.DOCTOR_PROFILE_NOT_FOUND);
    }

    const clinicIds = doctorProfile.clinics.map((c) => c.id);

    const where: any = {
      clinicId: { in: clinicIds },
    };

    // Filter by specific clinic
    if (clinicId) {
      if (!clinicIds.includes(clinicId)) {
        throw new BilingualForbiddenException(ErrorMessages.CLINIC_NOT_OWNED);
      }
      where.clinicId = clinicId;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by payment status
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Filter by single date
    if (date) {
      const appointmentDate = new Date(date);
      appointmentDate.setHours(0, 0, 0, 0);
      where.appointmentDate = appointmentDate;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.appointmentDate = {};
      if (dateFrom) {
        where.appointmentDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.appointmentDate.lte = new Date(dateTo);
      }
    }

    // Filter upcoming only
    if (upcoming) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.appointmentDate = { ...where.appointmentDate, gte: today };
    }

    // Filter by service type
    if (serviceTypeId) {
      where.serviceTypeId = serviceTypeId;
    }

    // Search by patient name or booking number
    if (search) {
      where.OR = [
        { bookingNumber: { contains: search, mode: 'insensitive' } },
        { patientName: { contains: search, mode: 'insensitive' } },
        {
          bookedForPatient: {
            user: {
              fullName: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          bookedForPatient: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  phoneNumber: true,
                },
              },
            },
          },
          clinic: true,
          serviceType: true,
        },
        orderBy: [{ appointmentDate: 'asc' }, { queueNumber: 'asc' }],
      }),
      this.prisma.appointment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: appointments,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  // Get appointment by ID
  async findById(id: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        bookedForPatient: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
        },
        clinic: {
          include: {
            doctorProfile: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
                specialty: true,
              },
            },
            city: {
              include: { state: true },
            },
          },
        },
        serviceType: true,
      },
    });

    if (!appointment) {
      throw new BilingualNotFoundException(ErrorMessages.APPOINTMENT_NOT_FOUND);
    }

    return appointment;
  }

  // Patient cancels appointment
  async cancelByPatient(
    patientUserId: string,
    appointmentId: string,
    reason?: string,
  ): Promise<Appointment> {
    const appointment = await this.findById(appointmentId);

    // Verify patient ownership
    const patientProfile = await this.prisma.patientProfile.findUnique({
      where: { userId: patientUserId },
      include: { familyMembers: true },
    });

    if (!patientProfile) {
      throw new BilingualNotFoundException(ErrorMessages.PATIENT_PROFILE_NOT_FOUND);
    }

    const authorizedPatientIds = [
      patientProfile.id,
      ...patientProfile.familyMembers.map((fm) => fm.id),
    ];

    if (!authorizedPatientIds.includes(appointment.bookedForPatientId)) {
      throw new BilingualForbiddenException(ErrorMessages.CANNOT_CANCEL_THIS_APPOINTMENT);
    }

    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      throw new BilingualBadRequestException(ErrorMessages.CANNOT_CANCEL_APPOINTMENT);
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancellationReason: reason,
        cancelledById: patientUserId,
        cancelledAt: new Date(),
      },
    });
  }

  // Doctor updates appointment status
  async updateStatus(
    doctorUserId: string,
    appointmentId: string,
    updateDto: UpdateAppointmentStatusDto,
  ): Promise<Appointment> {
    const appointment = await this.findById(appointmentId);

    // Verify doctor ownership
    await this.verifyDoctorOwnership(doctorUserId, appointment.clinicId);

    // Validate status transitions
    const validTransitions: { [key: string]: AppointmentStatus[] } = {
      PENDING: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
      CONFIRMED: [
        AppointmentStatus.CHECKED_IN,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
      ],
      CHECKED_IN: [AppointmentStatus.COMPLETED],
      COMPLETED: [],
      CANCELLED: [],
      NO_SHOW: [],
    };

    const currentStatus = appointment.status as string;
    const newStatus = updateDto.status as AppointmentStatus;

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BilingualBadRequestException(
        formatMessage(ErrorMessages.INVALID_STATUS_TRANSITION, {
          currentStatus,
          newStatus,
        }),
      );
    }

    const updateData: any = {
      status: newStatus,
    };

    if (updateDto.cancellationReason) {
      updateData.cancellationReason = updateDto.cancellationReason;
      updateData.cancelledById = doctorUserId;
      updateData.cancelledAt = new Date();
    }

    if (newStatus === AppointmentStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        bookedForPatient: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        },
        clinic: true,
        serviceType: true,
      },
    });
  }

  // Doctor updates medical notes (encrypted)
  async updateMedicalNotes(
    doctorUserId: string,
    appointmentId: string,
    updateDto: UpdateMedicalNotesDto,
  ): Promise<Appointment> {
    const appointment = await this.findById(appointmentId);

    await this.verifyDoctorOwnership(doctorUserId, appointment.clinicId);

    if (
      appointment.status !== 'CHECKED_IN' &&
      appointment.status !== 'COMPLETED'
    ) {
      throw new BilingualBadRequestException(ErrorMessages.MEDICAL_NOTES_INVALID_STATUS);
    }

    const updateData: any = {};

    if (updateDto.diagnosis) {
      updateData.diagnosisEncrypted = encrypt(
        updateDto.diagnosis,
        this.encryptionKey,
      );
    }

    if (updateDto.prescription) {
      updateData.prescriptionEncrypted = encrypt(
        updateDto.prescription,
        this.encryptionKey,
      );
    }

    if (updateDto.notes) {
      updateData.doctorNotesEncrypted = encrypt(
        updateDto.notes,
        this.encryptionKey,
      );
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
    });
  }

  // Get decrypted medical notes (for doctor or patient)
  async getMedicalNotes(
    userId: string,
    appointmentId: string,
    userRole: string,
  ): Promise<{
    diagnosis?: string;
    prescription?: string;
    notes?: string;
  }> {
    const appointment = await this.findById(appointmentId);

    // Verify access
    if (userRole === 'DOCTOR') {
      await this.verifyDoctorOwnership(userId, appointment.clinicId);
    } else if (userRole === 'PATIENT') {
      const patientProfile = await this.prisma.patientProfile.findUnique({
        where: { userId },
        include: { familyMembers: true },
      });

      if (!patientProfile) {
        throw new BilingualNotFoundException(ErrorMessages.PATIENT_PROFILE_NOT_FOUND);
      }

      const authorizedPatientIds = [
        patientProfile.id,
        ...patientProfile.familyMembers.map((fm) => fm.id),
      ];

      if (!authorizedPatientIds.includes(appointment.bookedForPatientId)) {
        throw new BilingualForbiddenException(ErrorMessages.CANNOT_VIEW_APPOINTMENT);
      }
    }

    return {
      diagnosis: appointment.diagnosisEncrypted
        ? decrypt(appointment.diagnosisEncrypted, this.encryptionKey)
        : undefined,
      prescription: appointment.prescriptionEncrypted
        ? decrypt(appointment.prescriptionEncrypted, this.encryptionKey)
        : undefined,
      notes: appointment.doctorNotesEncrypted
        ? decrypt(appointment.doctorNotesEncrypted, this.encryptionKey)
        : undefined,
    };
  }

  // Update payment status
  async updatePaymentStatus(
    doctorUserId: string,
    appointmentId: string,
    updateDto: UpdatePaymentStatusDto,
  ): Promise<Appointment> {
    const appointment = await this.findById(appointmentId);

    await this.verifyDoctorOwnership(doctorUserId, appointment.clinicId);

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: updateDto.paymentStatus as PaymentStatus,
        paymentMethod: updateDto.paymentMethod,
      },
    });
  }

  // Secretary books an appointment on behalf of a patient
  async createBySecretary(
    secretaryUserId: string,
    createDto: CreateSecretaryAppointmentDto,
  ): Promise<Appointment> {
    // Verify secretary has access to this clinic
    await this.verifySecretaryAccess(secretaryUserId, createDto.clinicId);

    // Get patient profile
    const patientProfile = await this.prisma.patientProfile.findUnique({
      where: { id: createDto.patientProfileId },
      include: { user: true },
    });

    if (!patientProfile) {
      throw new BilingualNotFoundException(ErrorMessages.PATIENT_PROFILE_NOT_FOUND);
    }

    // Get clinic with doctor info
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: createDto.clinicId },
      include: {
        doctorProfile: true,
        schedules: true,
      },
    });

    if (!clinic || !clinic.isActive) {
      throw new BilingualNotFoundException(ErrorMessages.CLINIC_NOT_ACTIVE);
    }

    if (clinic.doctorProfile.status !== 'APPROVED') {
      throw new BilingualBadRequestException(ErrorMessages.DOCTOR_NOT_AVAILABLE);
    }

    // Get service type
    const serviceType = await this.prisma.clinicServiceType.findFirst({
      where: {
        id: createDto.serviceTypeId,
        clinicId: createDto.clinicId,
        isActive: true,
      },
    });

    if (!serviceType) {
      throw new BilingualNotFoundException(ErrorMessages.SERVICE_NOT_ACTIVE);
    }

    // Validate appointment date and time
    const appointmentDate = new Date(createDto.appointmentDate);
    appointmentDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      throw new BilingualBadRequestException(ErrorMessages.CANNOT_BOOK_PAST);
    }

    // Check if the day is a working day
    const dayOfWeek = this.getDayOfWeek(appointmentDate);
    const daySchedules = clinic.schedules.filter(
      (s) => s.dayOfWeek === dayOfWeek && s.isActive,
    );

    if (daySchedules.length === 0) {
      throw new BilingualBadRequestException(ErrorMessages.CLINIC_NOT_OPEN);
    }

    // Check for existing appointment at this time
    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        clinicId: createDto.clinicId,
        appointmentDate,
        appointmentTime: createDto.appointmentTime,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (existingAppointment) {
      throw new BilingualBadRequestException(ErrorMessages.TIME_SLOT_BOOKED);
    }

    // Get queue number for the day
    const queueNumber = await this.getNextQueueNumber(
      createDto.clinicId,
      appointmentDate,
    );

    // Generate booking number
    const bookingNumber = await this.generateBookingNumber();

    // Create appointment with snapshot data
    return this.prisma.appointment.create({
      data: {
        bookingNumber,
        clinicId: createDto.clinicId,
        doctorProfileId: clinic.doctorProfileId,
        patientProfileId: patientProfile.id,
        bookedForPatientId: patientProfile.id,
        serviceTypeId: createDto.serviceTypeId,
        appointmentDate,
        appointmentTime: createDto.appointmentTime,
        queueNumber,
        status: AppointmentStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        // Snapshot data
        patientName: patientProfile.user.fullName,
        patientAge: patientProfile.age,
        serviceName: serviceType.name || { ar: '', en: '' },
        price: serviceType.price,
        patientNotes: createDto.notes,
        symptoms: createDto.symptoms,
        bookedBy: 'secretary',
        bookedById: secretaryUserId,
      },
      include: {
        patientProfile: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        },
        clinic: {
          include: {
            doctorProfile: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
                specialty: true,
              },
            },
            city: {
              include: { state: true },
            },
          },
        },
        serviceType: true,
      },
    });
  }

  // Get appointments for secretary's clinic(s) with full filtering
  async findBySecretary(
    secretaryUserId: string,
    filterDto: AppointmentFilterDto,
  ): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 20,
      clinicId,
      status,
      paymentStatus,
      date,
      dateFrom,
      dateTo,
      search,
      serviceTypeId,
      upcoming,
    } = filterDto;
    const skip = (page - 1) * limit;

    // Get secretary's assigned clinics
    const secretaryAssignments = await this.prisma.clinicSecretary.findMany({
      where: {
        userId: secretaryUserId,
        isActive: true,
      },
    });

    if (secretaryAssignments.length === 0) {
      throw new BilingualForbiddenException(ErrorMessages.CLINIC_NO_ACCESS);
    }

    const clinicIds = secretaryAssignments.map((s) => s.clinicId);

    const where: any = {
      clinicId: { in: clinicIds },
    };

    // Filter by specific clinic
    if (clinicId) {
      if (!clinicIds.includes(clinicId)) {
        throw new BilingualForbiddenException(ErrorMessages.CLINIC_NO_ACCESS);
      }
      where.clinicId = clinicId;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by payment status
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Filter by single date
    if (date) {
      const appointmentDate = new Date(date);
      appointmentDate.setHours(0, 0, 0, 0);
      where.appointmentDate = appointmentDate;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.appointmentDate = {};
      if (dateFrom) {
        where.appointmentDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.appointmentDate.lte = new Date(dateTo);
      }
    }

    // Filter upcoming only
    if (upcoming) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.appointmentDate = { ...where.appointmentDate, gte: today };
    }

    // Filter by service type
    if (serviceTypeId) {
      where.serviceTypeId = serviceTypeId;
    }

    // Search by patient name or booking number
    if (search) {
      where.OR = [
        { bookingNumber: { contains: search, mode: 'insensitive' } },
        { patientName: { contains: search, mode: 'insensitive' } },
        {
          bookedForPatient: {
            user: {
              fullName: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          bookedForPatient: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  phoneNumber: true,
                },
              },
            },
          },
          clinic: {
            include: {
              doctorProfile: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                    },
                  },
                },
              },
            },
          },
          serviceType: true,
        },
        orderBy: [{ appointmentDate: 'asc' }, { queueNumber: 'asc' }],
      }),
      this.prisma.appointment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: appointments,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  // Get secretary's assigned clinics
  async getSecretaryClinics(secretaryUserId: string) {
    const secretaryAssignments = await this.prisma.clinicSecretary.findMany({
      where: {
        userId: secretaryUserId,
        isActive: true,
      },
      include: {
        clinic: {
          include: {
            doctorProfile: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
                specialty: true,
              },
            },
            city: {
              include: { state: true },
            },
            serviceTypes: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return secretaryAssignments.map((s) => s.clinic);
  }

  // Secretary updates appointment status (limited transitions)
  async updateStatusBySecretary(
    secretaryUserId: string,
    appointmentId: string,
    updateDto: UpdateAppointmentStatusDto,
  ): Promise<Appointment> {
    const appointment = await this.findById(appointmentId);

    // Verify secretary has access to this clinic
    await this.verifySecretaryAccess(secretaryUserId, appointment.clinicId);

    // Secretary can only do limited status transitions
    const validTransitions: { [key: string]: AppointmentStatus[] } = {
      PENDING: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
      CONFIRMED: [AppointmentStatus.CHECKED_IN, AppointmentStatus.CANCELLED],
    };

    const currentStatus = appointment.status as string;
    const newStatus = updateDto.status as AppointmentStatus;

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BilingualBadRequestException(
        formatMessage(ErrorMessages.INVALID_STATUS_TRANSITION, {
          currentStatus,
          newStatus,
        }),
      );
    }

    const updateData: any = {
      status: newStatus,
    };

    if (updateDto.cancellationReason) {
      updateData.cancellationReason = updateDto.cancellationReason;
      updateData.cancelledById = secretaryUserId;
      updateData.cancelledAt = new Date();
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        bookedForPatient: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        },
        clinic: true,
        serviceType: true,
      },
    });
  }

  // Secretary updates payment status
  async updatePaymentStatusBySecretary(
    secretaryUserId: string,
    appointmentId: string,
    updateDto: UpdatePaymentStatusDto,
  ): Promise<Appointment> {
    const appointment = await this.findById(appointmentId);

    await this.verifySecretaryAccess(secretaryUserId, appointment.clinicId);

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: updateDto.paymentStatus as PaymentStatus,
        paymentMethod: updateDto.paymentMethod,
      },
    });
  }

  private async verifySecretaryAccess(
    secretaryUserId: string,
    clinicId: string,
  ): Promise<void> {
    const secretaryAssignment = await this.prisma.clinicSecretary.findFirst({
      where: {
        userId: secretaryUserId,
        clinicId,
        isActive: true,
      },
    });

    if (!secretaryAssignment) {
      throw new BilingualForbiddenException(ErrorMessages.CLINIC_NO_ACCESS);
    }
  }

  private async generateBookingNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.appointment.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    });
    return `APT-${dateStr}-${String(count + 1).padStart(3, '0')}`;
  }

  private async getNextQueueNumber(
    clinicId: string,
    date: Date,
  ): Promise<number> {
    const lastAppointment = await this.prisma.appointment.findFirst({
      where: {
        clinicId,
        appointmentDate: date,
      },
      orderBy: { queueNumber: 'desc' },
    });

    return (lastAppointment?.queueNumber || 0) + 1;
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    return days[date.getDay()];
  }

  private async verifyDoctorOwnership(
    doctorUserId: string,
    clinicId: string,
  ): Promise<void> {
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctorProfile) {
      throw new BilingualNotFoundException(ErrorMessages.DOCTOR_PROFILE_NOT_FOUND);
    }

    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic || clinic.doctorProfileId !== doctorProfile.id) {
      throw new BilingualForbiddenException(ErrorMessages.CLINIC_NOT_OWNED);
    }
  }
}
