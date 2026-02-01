import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma';
import { CreateCityDto, UpdateCityDto } from './dto';
import { City } from '@prisma/client';
import {
  ErrorMessages,
  BilingualNotFoundException,
} from '../../../common';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCityDto: CreateCityDto): Promise<City> {
    // Verify state exists
    const state = await this.prisma.state.findUnique({
      where: { id: createCityDto.stateId },
    });

    if (!state) {
      throw new BilingualNotFoundException(ErrorMessages.STATE_NOT_FOUND);
    }

    return this.prisma.city.create({
      data: {
        ...createCityDto,
        name: createCityDto.name as any,
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
      throw new BilingualNotFoundException(ErrorMessages.CITY_NOT_FOUND);
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
        throw new BilingualNotFoundException(ErrorMessages.STATE_NOT_FOUND);
      }
    }

    return this.prisma.city.update({
      where: { id },
      data: {
        ...updateCityDto,
        name: updateCityDto.name as any,
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
