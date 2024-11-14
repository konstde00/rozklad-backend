import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async createUser(data: CreateUserDto) {
    const { password, ...rest } = data;

    const password_hash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    try {
      const user = await this.prisma.user.create({
        data: {
          ...rest,
          password_hash,
        },
      });

      const { password_hash: _, ...result } = user;
      return result;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const password_hash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && user.password_hash === password_hash) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id.toString(), role: user.role };
    return {
      role: user.role,
      access_token: this.jwtService.sign(payload),
    };
  }
}
