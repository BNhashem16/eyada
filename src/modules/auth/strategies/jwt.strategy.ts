import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma';
import { JwtPayload, JwtUserPayload } from '../../../common/interfaces';
import {
  ErrorMessages,
  BilingualUnauthorizedException,
} from '../../../common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUserPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isApproved: true,
      },
    });

    if (!user) {
      throw new BilingualUnauthorizedException(ErrorMessages.USER_NOT_FOUND);
    }

    if (!user.isActive) {
      throw new BilingualUnauthorizedException(ErrorMessages.ACCOUNT_DEACTIVATED);
    }

    // For doctors, check if approved
    if (user.role === 'DOCTOR' && !user.isApproved) {
      throw new BilingualUnauthorizedException(ErrorMessages.DOCTOR_PENDING_APPROVAL);
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as any,
    };
  }
}
