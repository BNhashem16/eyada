import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import {
  CreatePatientProfileDto,
  UpdatePatientProfileDto,
  AddFamilyMemberDto,
} from './dto';
import { PatientProfile, RelationshipType } from '@prisma/client';
import { encrypt, decrypt, encryptJson, decryptJson } from '../../common/utils';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PatientsService {
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('encryption.key') || '';
  }

  async createProfile(
    userId: string,
    createDto: CreatePatientProfileDto,
  ): Promise<PatientProfile> {
    // Check if profile already exists
    const existing = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new BadRequestException('Patient profile already exists');
    }

    return this.prisma.patientProfile.create({
      data: {
        userId,
        ...createDto,
        relationshipToHead: RelationshipType.SELF,
      },
    });
  }

  async findByUserId(userId: string): Promise<PatientProfile | null> {
    return this.prisma.patientProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
        familyMembers: {
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
  }

  async findById(id: string): Promise<PatientProfile | null> {
    return this.prisma.patientProfile.findUnique({
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
      },
    });
  }

  async updateProfile(
    userId: string,
    updateDto: UpdatePatientProfileDto,
  ): Promise<PatientProfile> {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }

    return this.prisma.patientProfile.update({
      where: { userId },
      data: updateDto,
    });
  }

  // Medical data (encrypted)
  async updateMedicalData(
    userId: string,
    data: {
      chronicDiseases?: string[];
      allergies?: string[];
    },
  ): Promise<PatientProfile> {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }

    const updateData: any = {};

    if (data.chronicDiseases) {
      updateData.chronicDiseasesEncrypted = encryptJson(
        data.chronicDiseases,
        this.encryptionKey,
      );
    }

    if (data.allergies) {
      updateData.allergiesEncrypted = encryptJson(
        data.allergies,
        this.encryptionKey,
      );
    }

    return this.prisma.patientProfile.update({
      where: { userId },
      data: updateData,
    });
  }

  async getMedicalData(userId: string): Promise<{
    chronicDiseases: string[];
    allergies: string[];
  }> {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }

    return {
      chronicDiseases: profile.chronicDiseasesEncrypted
        ? decryptJson<string[]>(
            profile.chronicDiseasesEncrypted,
            this.encryptionKey,
          )
        : [],
      allergies: profile.allergiesEncrypted
        ? decryptJson<string[]>(profile.allergiesEncrypted, this.encryptionKey)
        : [],
    };
  }

  // Family Management
  async addFamilyMember(
    headUserId: string,
    addFamilyMemberDto: AddFamilyMemberDto,
  ): Promise<PatientProfile> {
    const headProfile = await this.prisma.patientProfile.findUnique({
      where: { userId: headUserId },
    });

    if (!headProfile) {
      throw new NotFoundException('Your patient profile not found');
    }

    // Create a new user for the family member (without login credentials)
    const familyUser = await this.prisma.user.create({
      data: {
        email: `family_${Date.now()}@internal.eyada`,
        phoneNumber: `FAMILY_${Date.now()}`,
        passwordHash: 'FAMILY_MEMBER_NO_LOGIN',
        fullName: addFamilyMemberDto.fullName,
        role: 'PATIENT',
        isApproved: true,
      },
    });

    // Create patient profile linked to family head
    return this.prisma.patientProfile.create({
      data: {
        userId: familyUser.id,
        dateOfBirth: addFamilyMemberDto.dateOfBirth
          ? new Date(addFamilyMemberDto.dateOfBirth)
          : null,
        age: addFamilyMemberDto.age,
        gender: addFamilyMemberDto.gender as any,
        bloodType: addFamilyMemberDto.bloodType,
        familyHeadId: headProfile.id,
        relationshipToHead: addFamilyMemberDto.relationship as RelationshipType,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async getFamilyMembers(headUserId: string): Promise<PatientProfile[]> {
    const headProfile = await this.prisma.patientProfile.findUnique({
      where: { userId: headUserId },
    });

    if (!headProfile) {
      throw new NotFoundException('Patient profile not found');
    }

    return this.prisma.patientProfile.findMany({
      where: { familyHeadId: headProfile.id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async removeFamilyMember(
    headUserId: string,
    familyMemberId: string,
  ): Promise<void> {
    const headProfile = await this.prisma.patientProfile.findUnique({
      where: { userId: headUserId },
    });

    if (!headProfile) {
      throw new NotFoundException('Your patient profile not found');
    }

    const familyMember = await this.prisma.patientProfile.findFirst({
      where: {
        id: familyMemberId,
        familyHeadId: headProfile.id,
      },
    });

    if (!familyMember) {
      throw new NotFoundException('Family member not found');
    }

    // Delete the user and profile (cascade will handle profile)
    await this.prisma.user.delete({
      where: { id: familyMember.userId },
    });
  }
}
