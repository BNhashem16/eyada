import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma';
import { CreateCityDto, UpdateCityDto } from './dto';
import { City } from '@prisma/client';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCityDto: CreateCityDto): Promise<City> {
    // Verify state exists
    const state = await this.prisma.state.findUnique({
      where: { id: createCityDto.stateId },
    });

    if (!state) {
      throw new NotFoundException('State not found');
    }

    return this.prisma.city.create({
      data: {
        name: createCityDto.name as any,
        stateId: createCityDto.stateId,
        isActive: createCityDto.isActive,
        sortOrder: createCityDto.sortOrder,
      },
    });
  }

  async findAll(options?: {
    isActive?: boolean;
    stateId?: string;
  }): Promise<City[]> {
    const where = {
      ...(options?.isActive !== undefined && { isActive: options.isActive }),
      ...(options?.stateId && { stateId: options.stateId }),
    };

    return this.prisma.city.findMany({
      where,
      include: { state: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findByState(stateId: string, isActive?: boolean): Promise<City[]> {
    return this.findAll({ stateId, isActive });
  }

  async findById(id: string): Promise<City> {
    const city = await this.prisma.city.findUnique({
      where: { id },
      include: { state: true },
    });

    if (!city) {
      throw new NotFoundException('City not found');
    }

    return city;
  }

  async update(id: string, updateCityDto: UpdateCityDto): Promise<City> {
    await this.findById(id);

    if (updateCityDto.stateId) {
      const state = await this.prisma.state.findUnique({
        where: { id: updateCityDto.stateId },
      });

      if (!state) {
        throw new NotFoundException('State not found');
      }
    }

    return this.prisma.city.update({
      where: { id },
      data: {
        name: updateCityDto.name as any,
        stateId: updateCityDto.stateId,
        isActive: updateCityDto.isActive,
        sortOrder: updateCityDto.sortOrder,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);

    // Check if any clinics are using this city
    const clinicsCount = await this.prisma.clinic.count({
      where: { cityId: id },
    });

    if (clinicsCount > 0) {
      // Soft delete
      await this.prisma.city.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      await this.prisma.city.delete({
        where: { id },
      });
    }
  }
}
