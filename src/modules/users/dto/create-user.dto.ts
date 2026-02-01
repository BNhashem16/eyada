import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';
import { Role } from '../../../common/enums';
import { ValidationMessages } from '../../../common';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^01[0125][0-9]{8}$/, {
    message: JSON.stringify(ValidationMessages.PHONE_INVALID),
  })
  phoneNumber: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role = Role.PATIENT;
}
