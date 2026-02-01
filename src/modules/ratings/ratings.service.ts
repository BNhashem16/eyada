import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateRatingDto } from './dto';
import { Rating } from '@prisma/client';
import {
  ErrorMessages,
  BilingualNotFoundException,
  BilingualForbiddenException,
  BilingualBadRequestException,
} from '../../common';

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    patientUserId: string,
    createDto: CreateRatingDto,
  ): Promise<Rating> {
    // Get patient profile
    const patientProfile = await this.prisma.patientProfile.findUnique({
      where: { userId: patientUserId },
      include: { familyMembers: true },
    });

    if (!patientProfile) {
      throw new BilingualNotFoundException(ErrorMessages.PATIENT_PROFILE_NOT_FOUND);
    }

    // Get appointment
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: createDto.appointmentId },
      include: {
        clinic: {
          include: { doctorProfile: true },
        },
      },
    });

    if (!appointment) {
      throw new BilingualNotFoundException(ErrorMessages.APPOINTMENT_NOT_FOUND);
    }

    // Verify the patient owns this appointment
    const authorizedPatientIds = [
      patientProfile.id,
      ...patientProfile.familyMembers.map((fm) => fm.id),
    ];

    if (!authorizedPatientIds.includes(appointment.bookedForPatientId)) {
      throw new BilingualForbiddenException(ErrorMessages.CANNOT_RATE_APPOINTMENT);
    }

    // Check if appointment is completed
    if (appointment.status !== 'COMPLETED') {
      throw new BilingualBadRequestException(ErrorMessages.CAN_ONLY_RATE_COMPLETED);
    }

    // Check if already rated
    const existingRating = await this.prisma.rating.findUnique({
      where: { appointmentId: createDto.appointmentId },
    });

    if (existingRating) {
      throw new BilingualBadRequestException(ErrorMessages.ALREADY_RATED);
    }

    // Create rating
    const rating = await this.prisma.rating.create({
      data: {
        patientProfileId: patientProfile.id,
        doctorProfileId: appointment.doctorProfileId,
        appointmentId: createDto.appointmentId,
        rating: createDto.rating,
        review: createDto.review,
      },
      include: {
        patientProfile: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
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
    });

    // Update doctor's average rating
    await this.updateDoctorAverageRating(appointment.doctorProfileId);

    return rating;
  }

  async findByDoctor(doctorProfileId: string): Promise<Rating[]> {
    return this.prisma.rating.findMany({
      where: { doctorProfileId },
      include: {
        patientProfile: {
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDoctorPublic(
    doctorProfileId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ ratings: Rating[]; total: number; average: number }> {
    const [ratings, total, doctor] = await Promise.all([
      this.prisma.rating.findMany({
        where: { doctorProfileId, isVisible: true },
        include: {
          patientProfile: {
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
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.rating.count({ where: { doctorProfileId, isVisible: true } }),
      this.prisma.doctorProfile.findUnique({
        where: { id: doctorProfileId },
        select: { averageRating: true },
      }),
    ]);

    return {
      ratings,
      total,
      average: doctor?.averageRating || 0,
    };
  }

  async getMyRatings(doctorUserId: string): Promise<Rating[]> {
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctorProfile) {
      throw new BilingualNotFoundException(ErrorMessages.DOCTOR_PROFILE_NOT_FOUND);
    }

    return this.findByDoctor(doctorProfile.id);
  }

  private async updateDoctorAverageRating(
    doctorProfileId: string,
  ): Promise<void> {
    const result = await this.prisma.rating.aggregate({
      where: { doctorProfileId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await this.prisma.doctorProfile.update({
      where: { id: doctorProfileId },
      data: {
        averageRating: result._avg?.rating || 0,
        totalRatings: result._count?._all || 0,
      },
    });
  }
}
