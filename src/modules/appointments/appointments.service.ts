import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { ConfigService } from '@nestjs/config';
import {
  CreateAppointmentDto,
  CreateSecretaryAppointmentDto,
  UpdateAppointmentStatusDto,
  UpdateMedicalNotesDto,
  UpdatePaymentStatusDto,
} from './dto';
import {
  Appointment,
  AppointmentStatus,
  PaymentStatus,
  DayOfWeek,
} from '@prisma/client';
import { encrypt, decrypt } from '../../common/utils';

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
      throw new NotFoundException(
        'Patient profile not found. Please create your profile first.',
      );
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
        throw new ForbiddenException(
          'Cannot book for this patient. They are not in your family.',
        );
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
      throw new NotFoundException('Clinic not found or not active');
    }

    if (clinic.doctorProfile.status !== 'APPROVED') {
      throw new BadRequestException('Doctor is not available for appointments');
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
      throw new NotFoundException('Service type not found or not active');
    }

    // Validate appointment date and time
    const appointmentDate = new Date(createDto.appointmentDate);
    appointmentDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      throw new BadRequestException('Cannot book appointments in the past');
    }

    // Check if the day is a working day
    const dayOfWeek = this.getDayOfWeek(appointmentDate);
    const daySchedules = clinic.schedules.filter(
      (s) => s.dayOfWeek === dayOfWeek && s.isActive,
    );

    if (daySchedules.length === 0) {
      throw new BadRequestException('Clinic is not open on this day');
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
      throw new BadRequestException('This time slot is already booked');
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

  // Get patient's appointments
  async findByPatient(
    patientUserId: string,
    status?: AppointmentStatus,
  ): Promise<Appointment[]> {
    const patientProfile = await this.prisma.patientProfile.findUnique({
      where: { userId: patientUserId },
      include: {
        familyMembers: true,
      },
    });

    if (!patientProfile) {
      throw new NotFoundException('Patient profile not found');
    }

    // Get appointments for self and family members
    const patientIds = [
      patientProfile.id,
      ...patientProfile.familyMembers.map((fm) => fm.id),
    ];

    const where: any = {
      bookedForPatientId: { in: patientIds },
    };

    if (status) {
      where.status = status;
    }

    return this.prisma.appointment.findMany({
      where,
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
    });
  }

  // Get doctor's appointments
  async findByDoctor(
    doctorUserId: string,
    filters: {
      clinicId?: string;
      date?: Date;
      status?: AppointmentStatus;
    },
  ): Promise<Appointment[]> {
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
      include: {
        clinics: true,
      },
    });

    if (!doctorProfile) {
      throw new NotFoundException('Doctor profile not found');
    }

    const clinicIds = doctorProfile.clinics.map((c) => c.id);

    const where: any = {
      clinicId: { in: clinicIds },
    };

    if (filters.clinicId) {
      if (!clinicIds.includes(filters.clinicId)) {
        throw new ForbiddenException('You do not own this clinic');
      }
      where.clinicId = filters.clinicId;
    }

    if (filters.date) {
      where.appointmentDate = filters.date;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return this.prisma.appointment.findMany({
      where,
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
    });
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
      throw new NotFoundException('Appointment not found');
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
      throw new NotFoundException('Patient profile not found');
    }

    const authorizedPatientIds = [
      patientProfile.id,
      ...patientProfile.familyMembers.map((fm) => fm.id),
    ];

    if (!authorizedPatientIds.includes(appointment.bookedForPatientId)) {
      throw new ForbiddenException('You cannot cancel this appointment');
    }

    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      throw new BadRequestException(
        'Can only cancel pending or confirmed appointments',
      );
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
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
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
      throw new BadRequestException(
        'Can only update medical notes for checked-in or completed appointments',
      );
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
        throw new NotFoundException('Patient profile not found');
      }

      const authorizedPatientIds = [
        patientProfile.id,
        ...patientProfile.familyMembers.map((fm) => fm.id),
      ];

      if (!authorizedPatientIds.includes(appointment.bookedForPatientId)) {
        throw new ForbiddenException('You cannot view this appointment');
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
      throw new NotFoundException('Patient profile not found');
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
      throw new NotFoundException('Clinic not found or not active');
    }

    if (clinic.doctorProfile.status !== 'APPROVED') {
      throw new BadRequestException('Doctor is not available for appointments');
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
      throw new NotFoundException('Service type not found or not active');
    }

    // Validate appointment date and time
    const appointmentDate = new Date(createDto.appointmentDate);
    appointmentDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      throw new BadRequestException('Cannot book appointments in the past');
    }

    // Check if the day is a working day
    const dayOfWeek = this.getDayOfWeek(appointmentDate);
    const daySchedules = clinic.schedules.filter(
      (s) => s.dayOfWeek === dayOfWeek && s.isActive,
    );

    if (daySchedules.length === 0) {
      throw new BadRequestException('Clinic is not open on this day');
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
      throw new BadRequestException('This time slot is already booked');
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

  // Get appointments for secretary's clinic(s)
  async findBySecretary(
    secretaryUserId: string,
    filters: {
      clinicId?: string;
      date?: Date;
      status?: AppointmentStatus;
    },
  ): Promise<Appointment[]> {
    // Get secretary's assigned clinics
    const secretaryAssignments = await this.prisma.clinicSecretary.findMany({
      where: {
        userId: secretaryUserId,
        isActive: true,
      },
    });

    if (secretaryAssignments.length === 0) {
      throw new ForbiddenException(
        'You are not assigned to any clinic as a secretary',
      );
    }

    const clinicIds = secretaryAssignments.map((s) => s.clinicId);

    const where: any = {
      clinicId: { in: clinicIds },
    };

    if (filters.clinicId) {
      if (!clinicIds.includes(filters.clinicId)) {
        throw new ForbiddenException('You do not have access to this clinic');
      }
      where.clinicId = filters.clinicId;
    }

    if (filters.date) {
      where.appointmentDate = filters.date;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return this.prisma.appointment.findMany({
      where,
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
    });
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
      throw new BadRequestException(
        `Secretary cannot transition from ${currentStatus} to ${newStatus}`,
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
      throw new ForbiddenException('You do not have access to this clinic');
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
      throw new NotFoundException('Doctor profile not found');
    }

    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic || clinic.doctorProfileId !== doctorProfile.id) {
      throw new ForbiddenException('You do not own this clinic');
    }
  }
}
