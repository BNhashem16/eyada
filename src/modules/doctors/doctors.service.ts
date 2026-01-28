import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import {
  CreateDoctorProfileDto,
  UpdateDoctorProfileDto,
  DoctorSearchDto,
} from './dto';
import { DoctorProfile, DoctorStatus } from '@prisma/client';
import { PaginatedResult } from '../../common/interfaces';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(
    userId: string,
    createDto: CreateDoctorProfileDto,
  ): Promise<DoctorProfile> {
    // Check if user already has a doctor profile
    const existing = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new BadRequestException('Doctor profile already exists');
    }

    // Verify specialty exists
    const specialty = await this.prisma.specialty.findUnique({
      where: { id: createDto.specialtyId },
    });

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    return this.prisma.doctorProfile.create({
      data: {
        userId,
        ...createDto,
        status: DoctorStatus.PENDING,
      },
    });
  }

  async findAll(searchDto: DoctorSearchDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 20,
      specialtyId,
      cityId,
      stateId,
      search,
      minRating,
    } = searchDto;
    const skip = (page - 1) * limit;

    // Build where clause for approved and active doctors
    const where: any = {
      status: DoctorStatus.APPROVED,
      user: { isActive: true },
    };

    if (specialtyId) {
      where.specialtyId = specialtyId;
    }

    if (minRating) {
      where.averageRating = { gte: minRating };
    }

    if (search) {
      where.user = {
        ...where.user,
        fullName: { contains: search, mode: 'insensitive' },
      };
    }

    // If filtering by city or state, we need to check clinics
    if (cityId || stateId) {
      where.clinics = {
        some: {
          isActive: true,
          ...(cityId && { cityId }),
          ...(stateId && { city: { stateId } }),
        },
      };
    }

    const [doctors, total] = await Promise.all([
      this.prisma.doctorProfile.findMany({
        where,
        skip,
        take: limit,
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
          clinics: {
            where: { isActive: true },
            include: {
              city: {
                include: { state: true },
              },
            },
          },
        },
        orderBy: [{ averageRating: 'desc' }, { totalAppointments: 'desc' }],
      }),
      this.prisma.doctorProfile.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: doctors,
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

  async findById(id: string): Promise<any> {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
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
        clinics: {
          where: { isActive: true },
          include: {
            city: { include: { state: true } },
            schedules: { where: { isActive: true } },
            serviceTypes: { where: { isActive: true } },
          },
        },
        ratings: {
          where: { isVisible: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async findByUserId(userId: string): Promise<DoctorProfile | null> {
    return this.prisma.doctorProfile.findUnique({
      where: { userId },
      include: {
        specialty: true,
        clinics: {
          include: {
            city: { include: { state: true } },
            schedules: true,
            serviceTypes: true,
          },
        },
      },
    });
  }

  async updateProfile(
    userId: string,
    updateDto: UpdateDoctorProfileDto,
  ): Promise<DoctorProfile> {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    if (updateDto.specialtyId) {
      const specialty = await this.prisma.specialty.findUnique({
        where: { id: updateDto.specialtyId },
      });

      if (!specialty) {
        throw new NotFoundException('Specialty not found');
      }
    }

    return this.prisma.doctorProfile.update({
      where: { userId },
      data: updateDto,
    });
  }

  // Admin functions
  async getPendingDoctors(): Promise<DoctorProfile[]> {
    return this.prisma.doctorProfile.findMany({
      where: { status: DoctorStatus.PENDING },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            createdAt: true,
          },
        },
        specialty: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveDoctor(id: string, adminId: string): Promise<DoctorProfile> {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException('Doctor not found');
    }

    if (profile.status !== DoctorStatus.PENDING) {
      throw new BadRequestException('Doctor is not in pending status');
    }

    // Update both the profile and user
    const [updatedProfile] = await this.prisma.$transaction([
      this.prisma.doctorProfile.update({
        where: { id },
        data: {
          status: DoctorStatus.APPROVED,
          approvedAt: new Date(),
          approvedBy: adminId,
        },
      }),
      this.prisma.user.update({
        where: { id: profile.userId },
        data: { isApproved: true },
      }),
    ]);

    return updatedProfile;
  }

  async rejectDoctor(id: string): Promise<DoctorProfile> {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException('Doctor not found');
    }

    return this.prisma.doctorProfile.update({
      where: { id },
      data: { status: DoctorStatus.REJECTED },
    });
  }

  async suspendDoctor(id: string): Promise<DoctorProfile> {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException('Doctor not found');
    }

    const [updatedProfile] = await this.prisma.$transaction([
      this.prisma.doctorProfile.update({
        where: { id },
        data: { status: DoctorStatus.SUSPENDED },
      }),
      this.prisma.user.update({
        where: { id: profile.userId },
        data: { isApproved: false },
      }),
    ]);

    return updatedProfile;
  }
}
