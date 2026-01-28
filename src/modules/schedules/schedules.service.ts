import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateScheduleDto, UpdateScheduleDto } from './dto';
import { ClinicSchedule, DayOfWeek } from '@prisma/client';

export interface Shift {
  startTime: string;
  endTime: string;
  breakTime?: string;
}

export interface TimeSlot {
  time: string;
  isAvailable: boolean;
}

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    doctorUserId: string,
    clinicId: string,
    createDto: CreateScheduleDto,
  ): Promise<ClinicSchedule> {
    await this.verifyClinicOwnership(doctorUserId, clinicId);

    // Check if schedule already exists for this day
    const existingSchedule = await this.prisma.clinicSchedule.findFirst({
      where: {
        clinicId,
        dayOfWeek: createDto.dayOfWeek as DayOfWeek,
      },
    });

    if (existingSchedule) {
      throw new BadRequestException(
        'Schedule already exists for this day. Use update instead.',
      );
    }

    // Validate shifts
    const shifts = createDto.shifts || [
      { startTime: createDto.startTime, endTime: createDto.endTime },
    ];

    for (const shift of shifts) {
      if (
        shift.startTime &&
        shift.endTime &&
        shift.startTime >= shift.endTime
      ) {
        throw new BadRequestException('Start time must be before end time');
      }
    }

    return this.prisma.clinicSchedule.create({
      data: {
        clinicId,
        dayOfWeek: createDto.dayOfWeek as DayOfWeek,
        shifts: shifts as any,
        slotDuration: createDto.slotDuration || 20,
        isActive: createDto.isActive ?? true,
      },
    });
  }

  async findByClinic(clinicId: string): Promise<ClinicSchedule[]> {
    return this.prisma.clinicSchedule.findMany({
      where: { clinicId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async update(
    doctorUserId: string,
    scheduleId: string,
    updateDto: UpdateScheduleDto,
  ): Promise<ClinicSchedule> {
    const schedule = await this.findScheduleWithOwnershipCheck(
      doctorUserId,
      scheduleId,
    );

    // If updating shifts, validate them
    if (updateDto.shifts) {
      for (const shift of updateDto.shifts) {
        if (shift.startTime >= shift.endTime) {
          throw new BadRequestException('Start time must be before end time');
        }
      }
    }

    return this.prisma.clinicSchedule.update({
      where: { id: scheduleId },
      data: {
        dayOfWeek: updateDto.dayOfWeek as DayOfWeek | undefined,
        shifts: updateDto.shifts as any,
        slotDuration: updateDto.slotDuration,
        isActive: updateDto.isActive,
      },
    });
  }

  async delete(doctorUserId: string, scheduleId: string): Promise<void> {
    await this.findScheduleWithOwnershipCheck(doctorUserId, scheduleId);

    await this.prisma.clinicSchedule.delete({
      where: { id: scheduleId },
    });
  }

  // Get available time slots for a specific date
  async getAvailableSlots(clinicId: string, date: Date): Promise<TimeSlot[]> {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        schedules: true,
      },
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    // Get day of week from date
    const dayOfWeek = this.getDayOfWeek(date);

    // Find active schedules for this day
    const daySchedule = clinic.schedules.find(
      (s) => s.dayOfWeek === dayOfWeek && s.isActive,
    );

    if (!daySchedule) {
      return [];
    }

    // Get existing appointments for this date
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        clinicId,
        appointmentDate: date,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: {
        appointmentTime: true,
      },
    });

    const bookedTimes = new Set(
      existingAppointments.map((a) => a.appointmentTime),
    );

    // Generate all time slots from shifts
    const slots: TimeSlot[] = [];
    const shifts = daySchedule.shifts as unknown as Shift[];
    const slotDuration = daySchedule.slotDuration || 20;

    for (const shift of shifts) {
      const timeSlots = this.generateTimeSlots(
        shift.startTime,
        shift.endTime,
        slotDuration,
      );

      for (const time of timeSlots) {
        const isAvailable =
          !bookedTimes.has(time) && this.isTimeInFuture(date, time);
        slots.push({ time, isAvailable });
      }
    }

    // Sort by time
    slots.sort((a, b) => a.time.localeCompare(b.time));

    return slots;
  }

  private generateTimeSlots(
    startTime: string,
    endTime: string,
    durationMinutes: number,
  ): string[] {
    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes + durationMinutes <= endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const min = currentMinutes % 60;
      slots.push(
        `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
      );
      currentMinutes += durationMinutes;
    }

    return slots;
  }

  private isTimeInFuture(date: Date, time: string): boolean {
    const now = new Date();
    const [hour, min] = time.split(':').map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(hour, min, 0, 0);
    return slotDate > now;
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    return days[date.getDay()];
  }

  private async verifyClinicOwnership(
    doctorUserId: string,
    clinicId: string,
  ): Promise<void> {
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
  }

  private async findScheduleWithOwnershipCheck(
    doctorUserId: string,
    scheduleId: string,
  ): Promise<ClinicSchedule> {
    const schedule = await this.prisma.clinicSchedule.findUnique({
      where: { id: scheduleId },
      include: { clinic: true },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    await this.verifyClinicOwnership(doctorUserId, schedule.clinicId);

    return schedule;
  }
}
