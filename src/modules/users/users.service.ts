import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateUserDto, UpdateUserDto } from './dto';
import { hashPassword } from '../../common/utils';
import { Role } from '../../common/enums';
import { User } from '@prisma/client';
import {
  ErrorMessages,
  BilingualConflictException,
  BilingualNotFoundException,
} from '../../common';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const { email, phoneNumber, password, fullName, role } = createUserDto;

    // Check if email or phone already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new BilingualConflictException(ErrorMessages.EMAIL_ALREADY_REGISTERED);
      }
      throw new BilingualConflictException(ErrorMessages.PHONE_ALREADY_REGISTERED);
    }

    const passwordHash = await hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        phoneNumber,
        passwordHash,
        fullName,
        role: role || Role.PATIENT,
        isApproved: role === Role.PATIENT || role === Role.ADMIN, // Patients auto-approved, doctors need approval
      },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByPhone(phoneNumber: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phoneNumber },
    });
  }

  async findById(id: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new BilingualNotFoundException(ErrorMessages.USER_NOT_FOUND);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    const { passwordHash: _, ...result } = updatedUser;
    return result;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    role?: Role;
    isActive?: boolean;
  }): Promise<{ data: Omit<User, 'passwordHash'>[]; total: number }> {
    const { page = 1, limit = 20, role, isActive } = options;
    const skip = (page - 1) * limit;

    const where = {
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map(({ passwordHash: _, ...user }) => user);
    return { data, total };
  }
}
