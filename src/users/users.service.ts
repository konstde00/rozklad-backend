import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllExceptSuperAdmin() {
    const users = await this.prisma.user.findMany({
      where: {
        role: {
          not: UserRole.system_admin,
        },
      },
    });
    return users.map((user) => {
      const { password_hash, ...result } = user;
      return result;
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateRole(id: number, role: UserRole) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: {
        role,
      },
    });
  }
}
