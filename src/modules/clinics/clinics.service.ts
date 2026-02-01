import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateClinicDto, UpdateClinicDto, ClinicSearchDto } from './dto';
import { Clinic } from '@prisma/client';
import { PaginatedResult } from '../../common/interfaces';
import {
  ErrorMessages,
  BilingualNotFoundException,
  BilingualForbiddenException,
  BilingualHttpException,
} from '../../common';

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
      throw new BilingualForbiddenException(
        ErrorMessages.DOCTOR_PROFILE_INCOMPLETE,
        'DOCTOR_PROFILE_INCOMPLETE',
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
      throw new BilingualForbiddenException(
        ErrorMessages.DOCTOR_PROFILE_INCOMPLETE,
        'DOCTOR_PROFILE_INCOMPLETE',
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
      throw new BilingualNotFoundException(ErrorMessages.CLINIC_NOT_FOUND);
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
      throw new BilingualForbiddenException(ErrorMessages.CANNOT_DELETE_CLINIC);
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

  // Public methods for searching clinics with full filtering
  async findAll(searchDto: ClinicSearchDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 20,
      cityId,
      stateId,
      specialtyId,
      search,
      priceMin,
      priceMax,
      minRating,
      latitude,
      longitude,
      radiusKm,
    } = searchDto;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
      doctorProfile: {
        status: 'APPROVED',
        user: { isActive: true },
      },
    };

    // Filter by city
    if (cityId) {
      where.cityId = cityId;
    }

    // Filter by state (through city)
    if (stateId) {
      where.city = { stateId };
    }

    // Filter by specialty
    if (specialtyId) {
      where.doctorProfile = {
        ...where.doctorProfile,
        specialtyId,
      };
    }

    // Filter by doctor's minimum rating
    if (minRating) {
      where.doctorProfile = {
        ...where.doctorProfile,
        averageRating: { gte: minRating },
      };
    }

    // Search by clinic name, doctor name, or address
    if (search) {
      where.OR = [
        { name: { path: ['en'], string_contains: search } },
        { name: { path: ['ar'], string_contains: search } },
        { address: { path: ['en'], string_contains: search } },
        { address: { path: ['ar'], string_contains: search } },
        {
          doctorProfile: {
            user: {
              fullName: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    // Filter by price range (check service types)
    if (priceMin !== undefined || priceMax !== undefined) {
      where.serviceTypes = {
        some: {
          isActive: true,
          ...(priceMin !== undefined && { price: { gte: priceMin } }),
          ...(priceMax !== undefined && { price: { lte: priceMax } }),
        },
      };
    }

    const [clinics, total] = await Promise.all([
      this.prisma.clinic.findMany({
        where,
        skip,
        take: limit,
        include: {
          doctorProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
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
          serviceTypes: {
            where: { isActive: true },
            orderBy: { price: 'asc' },
          },
        },
        orderBy: [
          { doctorProfile: { averageRating: 'desc' } },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.clinic.count({ where }),
    ]);

    // If distance-based filtering is requested, calculate distances
    let filteredClinics = clinics;
    if (latitude && longitude && radiusKm) {
      filteredClinics = clinics.filter((clinic) => {
        if (!clinic.latitude || !clinic.longitude) return false;
        const distance = this.calculateDistance(
          latitude,
          longitude,
          clinic.latitude,
          clinic.longitude,
        );
        return distance <= radiusKm;
      });
    }

    const totalPages = Math.ceil(total / limit);

    return {
      data: filteredClinics.map((clinic) => ({
        ...clinic,
        minPrice: clinic.serviceTypes.length > 0
          ? Math.min(...clinic.serviceTypes.map((s) => Number(s.price)))
          : null,
        maxPrice: clinic.serviceTypes.length > 0
          ? Math.max(...clinic.serviceTypes.map((s) => Number(s.price)))
          : null,
      })),
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

  // Haversine formula for distance calculation
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private async verifyOwnership(
    doctorUserId: string,
    clinicId: string,
  ): Promise<Clinic> {
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctorProfile) {
      throw new BilingualForbiddenException(
        ErrorMessages.DOCTOR_PROFILE_INCOMPLETE,
        'DOCTOR_PROFILE_INCOMPLETE',
      );
    }

    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic) {
      throw new BilingualNotFoundException(ErrorMessages.CLINIC_NOT_FOUND);
    }

    if (clinic.doctorProfileId !== doctorProfile.id) {
      throw new BilingualForbiddenException(ErrorMessages.CLINIC_NOT_OWNED);
    }

    return clinic;
  }
}
