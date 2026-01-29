import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateSpecialtyDto, UpdateSpecialtyDto } from './dto';
import { Specialty } from '@prisma/client';

@Injectable()
export class SpecialtiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSpecialtyDto: CreateSpecialtyDto): Promise<Specialty> {
    return this.prisma.specialty.create({
      data: {
        ...createSpecialtyDto,
        name: createSpecialtyDto.name as any,
        description: createSpecialtyDto.description as any,
      },
    });
  }

  async findAll(options?: { isActive?: boolean }): Promise<Specialty[]> {
    const where = {
      ...(options?.isActive !== undefined && { isActive: options.isActive }),
    };

    return this.prisma.specialty.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findById(id: string): Promise<Specialty> {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id },
    });

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    return specialty;
  }

  async update(
    id: string,
    updateSpecialtyDto: UpdateSpecialtyDto,
  ): Promise<Specialty> {
    await this.findById(id); // Ensure it exists

    return this.prisma.specialty.update({
      where: { id },
      data: {
        ...updateSpecialtyDto,
        name: updateSpecialtyDto.name as any,
        description: updateSpecialtyDto.description as any,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id); // Ensure it exists

    // Check if any doctors are using this specialty
    const doctorsCount = await this.prisma.doctorProfile.count({
      where: { specialtyId: id },
    });

    if (doctorsCount > 0) {
      // Soft delete by deactivating
      await this.prisma.specialty.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      await this.prisma.specialty.delete({
        where: { id },
      });
    }
  }
}
