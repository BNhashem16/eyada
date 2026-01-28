import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsNotification {
  to: string;
  message: string;
}

export interface NotificationPayload {
  type:
    | 'APPOINTMENT_BOOKED'
    | 'APPOINTMENT_CONFIRMED'
    | 'APPOINTMENT_CANCELLED'
    | 'APPOINTMENT_REMINDER';
  recipientPhone: string;
  recipientName: string;
  data: {
    appointmentDate?: string;
    appointmentTime?: string;
    doctorName?: string;
    clinicName?: string;
    queueNumber?: number;
    reason?: string;
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly smsEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.smsEnabled = this.configService.get<boolean>(
      'notifications.smsEnabled',
      false,
    );
  }

  async sendNotification(payload: NotificationPayload): Promise<void> {
    const message = this.buildMessage(payload);

    if (this.smsEnabled) {
      await this.sendSms({
        to: payload.recipientPhone,
        message,
      });
    } else {
      // Log notification for development
      this.logger.log(`[SMS STUB] To: ${payload.recipientPhone}`);
      this.logger.log(`[SMS STUB] Message: ${message}`);
    }
  }

  async sendAppointmentBooked(params: {
    patientPhone: string;
    patientName: string;
    doctorName: string;
    clinicName: string;
    date: string;
    time: string;
    queueNumber: number;
  }): Promise<void> {
    await this.sendNotification({
      type: 'APPOINTMENT_BOOKED',
      recipientPhone: params.patientPhone,
      recipientName: params.patientName,
      data: {
        doctorName: params.doctorName,
        clinicName: params.clinicName,
        appointmentDate: params.date,
        appointmentTime: params.time,
        queueNumber: params.queueNumber,
      },
    });
  }

  async sendAppointmentConfirmed(params: {
    patientPhone: string;
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
  }): Promise<void> {
    await this.sendNotification({
      type: 'APPOINTMENT_CONFIRMED',
      recipientPhone: params.patientPhone,
      recipientName: params.patientName,
      data: {
        doctorName: params.doctorName,
        appointmentDate: params.date,
        appointmentTime: params.time,
      },
    });
  }

  async sendAppointmentCancelled(params: {
    patientPhone: string;
    patientName: string;
    doctorName: string;
    date: string;
    reason?: string;
  }): Promise<void> {
    await this.sendNotification({
      type: 'APPOINTMENT_CANCELLED',
      recipientPhone: params.patientPhone,
      recipientName: params.patientName,
      data: {
        doctorName: params.doctorName,
        appointmentDate: params.date,
        reason: params.reason,
      },
    });
  }

  async sendAppointmentReminder(params: {
    patientPhone: string;
    patientName: string;
    doctorName: string;
    clinicName: string;
    date: string;
    time: string;
  }): Promise<void> {
    await this.sendNotification({
      type: 'APPOINTMENT_REMINDER',
      recipientPhone: params.patientPhone,
      recipientName: params.patientName,
      data: {
        doctorName: params.doctorName,
        clinicName: params.clinicName,
        appointmentDate: params.date,
        appointmentTime: params.time,
      },
    });
  }

  private buildMessage(payload: NotificationPayload): string {
    const { type, recipientName, data } = payload;

    switch (type) {
      case 'APPOINTMENT_BOOKED':
        return `مرحباً ${recipientName}، تم حجز موعدك بنجاح مع ${data.doctorName} في ${data.clinicName} يوم ${data.appointmentDate} الساعة ${data.appointmentTime}. رقم الدور: ${data.queueNumber}. - عيادة`;

      case 'APPOINTMENT_CONFIRMED':
        return `مرحباً ${recipientName}، تم تأكيد موعدك مع ${data.doctorName} يوم ${data.appointmentDate} الساعة ${data.appointmentTime}. - عيادة`;

      case 'APPOINTMENT_CANCELLED':
        return `مرحباً ${recipientName}، تم إلغاء موعدك مع ${data.doctorName} يوم ${data.appointmentDate}. ${data.reason ? `السبب: ${data.reason}` : ''} - عيادة`;

      case 'APPOINTMENT_REMINDER':
        return `تذكير: موعدك غداً مع ${data.doctorName} في ${data.clinicName} الساعة ${data.appointmentTime}. - عيادة`;

      default:
        return '';
    }
  }

  private async sendSms(notification: SmsNotification): Promise<void> {
    // TODO: Integrate with actual SMS provider (e.g., Twilio, MessageBird, local Egyptian provider)
    // For now, this is a stub that logs the SMS
    this.logger.log(
      `Sending SMS to ${notification.to}: ${notification.message}`,
    );

    // Example implementation with a hypothetical SMS provider:
    // const smsProvider = this.configService.get('notifications.smsProvider');
    // const apiKey = this.configService.get('notifications.smsApiKey');
    //
    // await fetch(`https://${smsProvider}/api/send`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     to: notification.to,
    //     message: notification.message,
    //   }),
    // });
  }
}
