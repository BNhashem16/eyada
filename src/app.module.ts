import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { configuration } from './config';
import { HttpExceptionFilter, PrismaExceptionFilter } from './common/filters';
import { TransformInterceptor } from './common/interceptors';
import { JwtAuthGuard } from './common/guards';
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { SpecialtiesModule } from './modules/specialties';
import { LocationsModule } from './modules/locations';
import { DoctorsModule } from './modules/doctors';
import { PatientsModule } from './modules/patients';
import { ClinicsModule } from './modules/clinics';
import { SchedulesModule } from './modules/schedules';
import { ServicesModule } from './modules/services';
import { AppointmentsModule } from './modules/appointments';
import { RatingsModule } from './modules/ratings';
import { NotificationsModule } from './modules/notifications';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 20,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 500,
      },
    ]),

    // Database
    PrismaModule,

    // Authentication
    AuthModule,

    // Users
    UsersModule,

    // Phase 3: Lookup Data & Profiles
    SpecialtiesModule,
    LocationsModule,
    PatientsModule,

    // Phase 4: Clinics & Appointments
    // IMPORTANT: All modules with /doctors/* routes must come BEFORE DoctorsModule
    // because DoctorsModule has /doctors/:id which catches everything
    ClinicsModule,        // /doctors/clinics
    SchedulesModule,      // /doctors/clinics/:clinicId/schedules
    ServicesModule,       // /doctors/clinics/:clinicId/services
    AppointmentsModule,   // /doctors/appointments
    RatingsModule,        // /doctors/ratings
    DoctorsModule,        // /doctors/:id (must be last)

    // Phase 5: Notifications
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // Global JWT Auth Guard (endpoints are protected by default)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Global Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Global Exception Filters
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },

    // Global Response Transform
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
