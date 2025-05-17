import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.user.create({
      data
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  async update(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data
    });
  }
}