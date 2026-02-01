import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import {
  CreateDoctorProfileDto,
  UpdateDoctorProfileDto,
  DoctorSearchDto,
} from './dto';
import { DoctorProfile, DoctorStatus } from '@prisma/client';
import { PaginatedResult } from '../../common/interfaces';
import {
  ErrorMessages,
  BilingualBadRequestException,
  BilingualNotFoundException,
  BilingualHttpException,
} from '../../common';

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
      throw new BilingualBadRequestException(ErrorMessages.DOCTOR_PROFILE_EXISTS);
    }

    // Verify specialty exists
    const specialty = await this.prisma.specialty.findUnique({
      where: { id: createDto.specialtyId },
    });

    if (!specialty) {
      throw new BilingualNotFoundException(ErrorMessages.SPECIALTY_NOT_FOUND);
    }

    return this.prisma.doctorProfile.create({
      data: {
        userId,
        specialtyId: createDto.specialtyId,
        licenseNumber: createDto.licenseNumber,
        yearsOfExperience: createDto.yearsOfExperience,
        qualifications: createDto.qualifications as any,
        bio: createDto.bio as any,
        profileImage: createDto.profileImage,
        showPhoneNumber: createDto.showPhoneNumber,
        showWhatsappNumber: createDto.showWhatsappNumber,
        whatsappNumbers: createDto.whatsappNumbers,
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
      priceMin,
      priceMax,
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

    // If filtering by city, state, or price, we need to check clinics
    if (cityId || stateId || priceMin !== undefined || priceMax !== undefined) {
      const clinicFilter: any = {
        isActive: true,
      };

      if (cityId) {
        clinicFilter.cityId = cityId;
      }

      if (stateId) {
        clinicFilter.city = { stateId };
      }

      // Filter by price range through service types
      if (priceMin !== undefined || priceMax !== undefined) {
        clinicFilter.serviceTypes = {
          some: {
            isActive: true,
            ...(priceMin !== undefined && { price: { gte: priceMin } }),
            ...(priceMax !== undefined && { price: { lte: priceMax } }),
          },
        };
      }

      where.clinics = { some: clinicFilter };
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
              serviceTypes: {
                where: { isActive: true },
                orderBy: { price: 'asc' },
              },
            },
          },
        },
        orderBy: [{ averageRating: 'desc' }, { totalAppointments: 'desc' }],
      }),
      this.prisma.doctorProfile.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Add min/max price to each doctor
    const doctorsWithPrices = doctors.map((doctor) => {
      const allPrices = doctor.clinics.flatMap((clinic) =>
        clinic.serviceTypes.map((st) => Number(st.price)),
      );
      return {
        ...doctor,
        minPrice: allPrices.length > 0 ? Math.min(...allPrices) : null,
        maxPrice: allPrices.length > 0 ? Math.max(...allPrices) : null,
      };
    });

    return {
      data: doctorsWithPrices,
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
      throw new BilingualNotFoundException(ErrorMessages.DOCTOR_NOT_FOUND);
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
      throw new BilingualNotFoundException(ErrorMessages.DOCTOR_PROFILE_NOT_FOUND);
    }

    if (updateDto.specialtyId) {
      const specialty = await this.prisma.specialty.findUnique({
        where: { id: updateDto.specialtyId },
      });

      if (!specialty) {
        throw new BilingualNotFoundException(ErrorMessages.SPECIALTY_NOT_FOUND);
      }
    }

    return this.prisma.doctorProfile.update({
      where: { userId },
      data: {
        specialtyId: updateDto.specialtyId,
        licenseNumber: updateDto.licenseNumber,
        yearsOfExperience: updateDto.yearsOfExperience,
        qualifications: updateDto.qualifications as any,
        bio: updateDto.bio as any,
        profileImage: updateDto.profileImage,
        showPhoneNumber: updateDto.showPhoneNumber,
        showWhatsappNumber: updateDto.showWhatsappNumber,
        whatsappNumbers: updateDto.whatsappNumbers,
      },
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
      throw new BilingualNotFoundException(ErrorMessages.DOCTOR_NOT_FOUND);
    }

    if (profile.status !== DoctorStatus.PENDING) {
      throw new BilingualBadRequestException(ErrorMessages.DOCTOR_NOT_PENDING);
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
      throw new BilingualNotFoundException(ErrorMessages.DOCTOR_NOT_FOUND);
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
      throw new BilingualNotFoundException(ErrorMessages.DOCTOR_NOT_FOUND);
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
