import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/enums';
import { ValidationMessages } from '../../../common';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '01012345678', description: 'Egyptian mobile number' })
  @IsString()
  @Matches(/^01[0125][0-9]{8}$/, {
    message: JSON.stringify(ValidationMessages.PHONE_INVALID),
  })
  phoneNumber: string;

  @ApiProperty({ example: 'password123', minLength: 8, maxLength: 50 })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;

  @ApiProperty({ example: 'Ahmed Mohamed', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiPropertyOptional({ enum: Role, default: Role.PATIENT })
  @IsOptional()
  @IsEnum(Role)
  role?: Role = Role.PATIENT;
}
