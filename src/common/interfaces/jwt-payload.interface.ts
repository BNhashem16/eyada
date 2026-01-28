import { Role } from '../enums';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface JwtUserPayload {
  id: string;
  email: string;
  role: Role;
}
