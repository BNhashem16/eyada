import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateServiceTypeDto, UpdateServiceTypeDto } from './dto';
import { ClinicServiceType, ServiceType } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    doctorUserId: string,
    clinicId: string,
    createDto: CreateServiceTypeDto,
  ): Promise<ClinicServiceType> {
    const doctorProfile = await this.verifyClinicOwnership(
      doctorUserId,
      clinicId,
    );

    // Check if this service type already exists for this clinic
    const existing = await this.prisma.clinicServiceType.findFirst({
      where: {
        clinicId,
        serviceType: createDto.serviceType as ServiceType,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Service type ${createDto.serviceType} already exists for this clinic`,
      );
    }

    return this.prisma.clinicServiceType.create({
      data: {
        doctorProfileId: doctorProfile.id,
        clinicId,
        serviceType: createDto.serviceType as ServiceType,
        name: createDto.name as any,
        price: createDto.price,
        duration: createDto.duration || 20,
        reVisitValidityDays: createDto.reVisitValidityDays,
        isActive: createDto.isActive ?? true,
      },
    });
  }

  async findByClinic(clinicId: string): Promise<ClinicServiceType[]> {
    return this.prisma.clinicServiceType.findMany({
      where: { clinicId },
      orderBy: { serviceType: 'asc' },
    });
  }

  async findById(id: string): Promise<ClinicServiceType> {
    const serviceType = await this.prisma.clinicServiceType.findUnique({
      where: { id },
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
              },
            },
          },
        },
      },
    });

    if (!serviceType) {
      throw new NotFoundException('Service type not found');
    }

    return serviceType;
  }

  async update(
    doctorUserId: string,
    serviceTypeId: string,
    updateDto: UpdateServiceTypeDto,
  ): Promise<ClinicServiceType> {
    const serviceType = await this.findServiceTypeWithOwnershipCheck(
      doctorUserId,
      serviceTypeId,
    );

    // If changing service type, check for duplicates
    if (
      updateDto.serviceType &&
      updateDto.serviceType !== serviceType.serviceType
    ) {
      const existing = await this.prisma.clinicServiceType.findFirst({
        where: {
          clinicId: serviceType.clinicId,
          serviceType: updateDto.serviceType as ServiceType,
          id: { not: serviceTypeId },
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Service type ${updateDto.serviceType} already exists for this clinic`,
        );
      }
    }

    return this.prisma.clinicServiceType.update({
      where: { id: serviceTypeId },
      data: {
        serviceType: updateDto.serviceType as ServiceType | undefined,
        name: updateDto.name as any,
        price: updateDto.price,
        duration: updateDto.duration,
        reVisitValidityDays: updateDto.reVisitValidityDays,
        isActive: updateDto.isActive,
      },
    });
  }

  async delete(doctorUserId: string, serviceTypeId: string): Promise<void> {
    await this.findServiceTypeWithOwnershipCheck(doctorUserId, serviceTypeId);

    // Check for appointments using this service type
    const appointmentsCount = await this.prisma.appointment.count({
      where: {
        serviceTypeId,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (appointmentsCount > 0) {
      throw new ForbiddenException(
        'Cannot delete service type with pending or confirmed appointments',
      );
    }

    await this.prisma.clinicServiceType.delete({
      where: { id: serviceTypeId },
    });
  }

  async toggleActive(
    doctorUserId: string,
    serviceTypeId: string,
  ): Promise<ClinicServiceType> {
    const serviceType = await this.findServiceTypeWithOwnershipCheck(
      doctorUserId,
      serviceTypeId,
    );

    return this.prisma.clinicServiceType.update({
      where: { id: serviceTypeId },
      data: { isActive: !serviceType.isActive },
    });
  }

  private async verifyClinicOwnership(doctorUserId: string, clinicId: string) {
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctorProfile) {
      throw new NotFoundException('Doctor profile not found');
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

    return doctorProfile;
  }

  private async findServiceTypeWithOwnershipCheck(
    doctorUserId: string,
    serviceTypeId: string,
  ): Promise<ClinicServiceType> {
    const serviceType = await this.prisma.clinicServiceType.findUnique({
      where: { id: serviceTypeId },
    });

    if (!serviceType) {
      throw new NotFoundException('Service type not found');
    }

    if (serviceType.clinicId) {
      await this.verifyClinicOwnership(doctorUserId, serviceType.clinicId);
    }

    return serviceType;
  }
}
