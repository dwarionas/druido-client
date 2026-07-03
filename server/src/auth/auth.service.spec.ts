import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { DEMO_EMAIL } from '../seed-demo';

describe('AuthService', () => {
    let service: AuthService;
    let prisma: any;
    let jwt: any;

    beforeEach(() => {
        prisma = {
            user: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
        };
        jwt = { sign: jest.fn().mockReturnValue('signed-token') };
        service = new AuthService(prisma, jwt);
    });

    describe('register', () => {
        it('rejects an already registered email', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

            await expect(
                service.register({ email: 'a@b.c', password: 'secret1' }),
            ).rejects.toThrow(ConflictException);
        });

        it('normalizes the email and hashes the password', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'u1', ...data }));

            const { user, token } = await service.register({
                email: '  New@User.COM ',
                password: 'secret1',
            });

            expect(user.email).toBe('new@user.com');
            expect(user.passwordHash).not.toBe('secret1');
            expect(await bcrypt.compare('secret1', user.passwordHash)).toBe(true);
            expect(token).toBe('signed-token');
        });
    });

    describe('login', () => {
        it('rejects an unknown email', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(
                service.login({ email: 'ghost@nowhere.com', password: 'whatever' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('rejects a wrong password', async () => {
            const passwordHash = await bcrypt.hash('correct', 4);
            prisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash });

            await expect(
                service.login({ email: 'a@b.c', password: 'wrong' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('returns the user and a token for valid credentials', async () => {
            const passwordHash = await bcrypt.hash('correct', 4);
            prisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash });

            const { user, token } = await service.login({ email: 'a@b.c', password: 'correct' });

            expect(user.id).toBe('u1');
            expect(token).toBe('signed-token');
            expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1' });
        });
    });

    describe('getProfile', () => {
        it('flags the shared demo account', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: DEMO_EMAIL });

            const profile = await service.getProfile('u1');

            expect(profile?.isDemo).toBe(true);
        });

        it('does not flag regular users', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 'u2', email: 'me@example.com' });

            const profile = await service.getProfile('u2');

            expect(profile?.isDemo).toBe(false);
        });
    });
});
