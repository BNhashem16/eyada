import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma';
import { CreateStateDto, UpdateStateDto } from './dto';
import { State } from '@prisma/client';
import {
  ErrorMessages,
  BilingualNotFoundException,
  BilingualConflictException,
} from '../../../common';

@Injectable()
export class StatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createStateDto: CreateStateDto): Promise<State> {
    // Check if code already exists
    const existing = await this.prisma.state.findUnique({
      where: { code: createStateDto.code },
    });

    if (existing) {
      throw new BilingualConflictException(ErrorMessages.STATE_CODE_EXISTS);
    }

    return this.prisma.state.create({
      data: {
        ...createStateDto,
        name: createStateDto.name as any,
      },
    });
  }

  async findAll(options?: { isActive?: boolean }): Promise<State[]> {
    const where = {
      ...(options?.isActive !== undefined && { isActive: options.isActive }),
    };

    return this.prisma.state.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findById(id: string): Promise<State> {
    const state = await this.prisma.state.findUnique({
      where: { id },
    });

    if (!state) {
      throw new BilingualNotFoundException(ErrorMessages.STATE_NOT_FOUND);
    }

    return state;
  }

  async findByCode(code: string): Promise<State> {
    const state = await this.prisma.state.findUnique({
      where: { code },
    });

    if (!state) {
      throw new BilingualNotFoundException(ErrorMessages.STATE_NOT_FOUND);
    }

    return state;
  }

  async update(id: string, updateStateDto: UpdateStateDto): Promise<State> {
    await this.findById(id);

    if (updateStateDto.code) {
      const existing = await this.prisma.state.findFirst({
        where: { code: updateStateDto.code, NOT: { id } },
      });

      if (existing) {
        throw new BilingualConflictException(ErrorMessages.STATE_CODE_EXISTS);
      }
    }

    return this.prisma.state.update({
      where: { id },
      data: {
        ...updateStateDto,
        name: updateStateDto.name as any,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);

    // Check if any cities are using this state
    const citiesCount = await this.prisma.city.count({
      where: { stateId: id },
    });

    if (citiesCount > 0) {
      // Soft delete
      await this.prisma.state.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      await this.prisma.state.delete({
        where: { id },
      });
    }
  }
}
