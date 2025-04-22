import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from './email.service';
import { GoogleSignInDto } from './dto/google-signin.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {
    this.initiateSuperAdminAccount();
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  public async initiateSuperAdminAccount(): Promise<void> {
    const email = this.configService.get('SUPER_ADMIN_EMAIL');
    const adminPassword = this.configService.get('SUPER_ADMIN_PASSWORD');
    const exist = await this.prisma.user.findUnique({
      where: { email },
    });

    const passwordHash = this.hashPassword(adminPassword);

    if (!exist) {
      await this.prisma.user.create({
        data: {
          username: email + '-admin',
          email: email,
          password_hash: passwordHash,
          is_active: true,
          code: 'null',
          role: 'system_admin',
        },
      });
    }
  }

  async login(email: string, password: string): Promise<any> {
    const passwordHash = this.hashPassword(password);

    const user = await this.prisma.user.findUnique({
      where: { email, is_active: true },
    });

    if (user && user.password_hash === passwordHash && user.is_active) {
      const { password_hash, ...result } = user;
      const token = this.jwtService.sign({ email: user.email, sub: user.id });
      return { user: result, token };
    }

    if (user && user.google_uid && user.code == 'aaaaaaaaaa') {
      throw new ConflictException('User registered using Google provider');
    }

    throw new NotFoundException('Invalid credentials or inactive account');
  }

  async logout(): Promise<string> {
    return 'Logged out successfully';
  }

  async signup(data: CreateUserDto): Promise<any> {
    const passwordHash = this.hashPassword(data.password);
    const confirmationCode = crypto.randomBytes(5).toString('hex');

    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (user && user.google_uid) {
      throw new ConflictException('User registered using Google provider');
    }

    if (user && !user.is_active) {
      // TODO: configure to delete not confirmed user only if it exists more than 10 minutes, to save it from conflicts
      await this.prisma.user.delete({
        where: { email: data.email, is_active: false },
      });
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          username: data.username || 'default_username',
          email: data.email,
          password_hash: passwordHash,
          is_active: false,
          code: confirmationCode,
          role: data.role || 'student',
        },
      });

      await this.emailService.sendRegister(confirmationCode, data.email);

      const { password_hash, ...result } = user;
      return { user: result, confirmationCode };
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

  async googleSignIn(data: GoogleSignInDto): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { email: data.email },
    });

    if (user) {
      if (!user.google_uid) {
        await this.prisma.user.update({
          where: {
            email: data.email,
          },
          data: {
            google_uid: data.uid,
          },
        });
      }
      const token = this.jwtService.sign({ email: user.email, sub: user.id });
      const { password_hash, ...result } = user;
      console.log('Google user found', result);
      return { user: result, token };
    } else {
      const passwordHash = this.hashPassword(
        crypto.randomBytes(20).toString('hex'),
      );
      const createdUser = await this.prisma.user.create({
        data: {
          username: data.username || 'default_username',
          email: data.email,
          password_hash: passwordHash,
          is_active: true,
          code: 'aaaaaaaaaa',
          role: 'student',
          google_uid: data.uid,
        },
      });
      const token = this.jwtService.sign({
        email: createdUser.email,
        sub: createdUser.id,
      });
      const { password_hash, ...result } = createdUser;
      console.log('Google user created', result);
      return { user: result, token };
    }
  }

  async confirmSignup(email: string, code: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    console.log(user.code);
    if (!user || user.code !== code) {
      throw new NotFoundException('Invalid confirmation code');
    }
    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: { is_active: true, code: 'null' },
    });

    const { password_hash, ...result } = updatedUser;
    const token = this.jwtService.sign({
      email: updatedUser.email,
      sub: updatedUser.id,
    });

    return { user: result, token };
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || this.hashPassword(oldPassword) !== user.password_hash) {
      throw new NotFoundException('Invalid old password or user not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { password_hash: this.hashPassword(newPassword) },
    });

    const { password_hash, ...result } = updatedUser;
    const token = this.jwtService.sign({
      email: updatedUser.email,
      sub: updatedUser.id,
    });

    return { user: result, token };
  }
}
