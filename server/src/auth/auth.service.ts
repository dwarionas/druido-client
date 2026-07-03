import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UpdateProfileDto, ChangePasswordDto } from './dto/profile.dto';
import { seedDemoUser, resetDemoUser, DEMO_EMAIL } from '../seed-demo';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase().trim() },
        });

        if (existing) {
            throw new ConflictException('Registration failed');
        }

        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase().trim(),
                passwordHash,
                name: dto.name,
            },
        });

        const token = this.signToken(user.id);
        return { user, token };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase().trim() },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = this.signToken(user.id);
        return { user, token };
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                xp: true,
                streak: true,
                dailyGoal: true,
                lastStudiedAt: true,
                createdAt: true,
            },
        });

        if (!user) {
            return null;
        }

        return { ...user, isDemo: user.email === DEMO_EMAIL };
    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.dailyGoal !== undefined && { dailyGoal: dto.dailyGoal }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                xp: true,
                streak: true,
                dailyGoal: true,
                lastStudiedAt: true,
            },
        });
    }

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        return { success: true };
    }

    async loginAsDemo() {
        const user = await seedDemoUser(this.prisma);
        const token = this.signToken(user.id);
        return { user, token };
    }

    async resetDemo(userId: string) {
        const user = await resetDemoUser(this.prisma);
        const token = this.signToken(user.id);
        return { user, token };
    }

    private signToken(userId: string): string {
        return this.jwt.sign({ sub: userId });
    }
}
