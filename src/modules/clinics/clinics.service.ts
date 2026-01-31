import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateClinicDto, UpdateClinicDto } from './dto';
import { Clinic } from '@prisma/client';

@Injectable()
export class ClinicsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    doctorUserId: string,
    createDto: CreateClinicDto,
  ): Promise<Clinic> {
    // Get doctor profile
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctorProfile) {
      throw new HttpException(
        {
          message: 'Please complete your doctor profile first before managing clinics',
          error: 'Profile Incomplete',
          errorCode: 'DOCTOR_PROFILE_INCOMPLETE',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    return this.prisma.clinic.create({
      data: {
        doctorProfileId: doctorProfile.id,
        cityId: createDto.cityId,
        name: createDto.name as any,
        address: createDto.address as any,
        latitude: createDto.latitude,
        longitude: createDto.longitude,
        isActive: createDto.isActive ?? true,
      },
      include: {
        city: {
          include: {
            state: true,
          },
        },
        schedules: true,
        serviceTypes: true,
      },
    });
  }

  async findByDoctor(doctorUserId: string): Promise<Clinic[]> {
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctorProfile) {
      throw new HttpException(
        {
          message: 'Please complete your doctor profile first before managing clinics',
          error: 'Profile Incomplete',
          errorCode: 'DOCTOR_PROFILE_INCOMPLETE',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    return this.prisma.clinic.findMany({
      where: { doctorProfileId: doctorProfile.id },
      include: {
        city: {
          include: {
            state: true,
          },
        },
        schedules: true,
        serviceTypes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Clinic> {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id },
      include: {
        doctorProfile: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
              },
            },
            specialty: true,
          },
        },
        city: {
          include: {
            state: true,
          },
        },
        schedules: {
          orderBy: { dayOfWeek: 'asc' },
        },
        serviceTypes: {
          where: { isActive: true },
        },
      },
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    return clinic;
  }

  async update(
    doctorUserId: string,
    clinicId: string,
    updateDto: UpdateClinicDto,
  ): Promise<Clinic> {
    const clinic = await this.verifyOwnership(doctorUserId, clinicId);

    return this.prisma.clinic.update({
      where: { id: clinic.id },
      data: {
        name: updateDto.name as any,
        address: updateDto.address as any,
        cityId: updateDto.cityId,
        latitude: updateDto.latitude,
        longitude: updateDto.longitude,
        isActive: updateDto.isActive,
      },
      include: {
        city: {
          include: {
            state: true,
          },
        },
        schedules: true,
        serviceTypes: true,
      },
    });
  }

  async delete(doctorUserId: string, clinicId: string): Promise<void> {
    const clinic = await this.verifyOwnership(doctorUserId, clinicId);

    // Check for future appointments
    const futureAppointments = await this.prisma.appointment.count({
      where: {
        clinicId: clinic.id,
        appointmentDate: { gte: new Date() },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (futureAppointments > 0) {
      throw new ForbiddenException(
        'Cannot delete clinic with pending or confirmed appointments',
      );
    }

    await this.prisma.clinic.delete({
      where: { id: clinic.id },
    });
  }

  async toggleActive(doctorUserId: string, clinicId: string): Promise<Clinic> {
    const clinic = await this.verifyOwnership(doctorUserId, clinicId);

    return this.prisma.clinic.update({
      where: { id: clinic.id },
      data: { isActive: !clinic.isActive },
    });
  }

  // Public methods for searching clinics
  async findAll(filters: {
    cityId?: string;
    specialtyId?: string;
    isActive?: boolean;
  }): Promise<Clinic[]> {
    const where: any = {
      isActive: filters.isActive ?? true,
    };

    if (filters.cityId) {
      where.cityId = filters.cityId;
    }

    if (filters.specialtyId) {
      where.doctorProfile = {
        specialtyId: filters.specialtyId,
        status: 'APPROVED',
      };
    } else {
      where.doctorProfile = {
        status: 'APPROVED',
      };
    }

    return this.prisma.clinic.findMany({
      where,
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
          include: {
            state: true,
          },
        },
        serviceTypes: {
          where: { isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async verifyOwnership(
    doctorUserId: string,
    clinicId: string,
  ): Promise<Clinic> {
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctorProfile) {
      throw new HttpException(
        {
          message: 'Please complete your doctor profile first before managing clinics',
          error: 'Profile Incomplete',
          errorCode: 'DOCTOR_PROFILE_INCOMPLETE',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    if (clinic.doctorProfileId !== doctorProfile.id) {
      throw new ForbiddenException('You do not own this clinic');
    }

    return clinic;
  }
}
