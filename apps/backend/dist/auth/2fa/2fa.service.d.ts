import { PrismaService } from '../../prisma/prisma.service';
export declare class TwoFactorService {
    private prisma;
    constructor(prisma: PrismaService);
    generateSecret(userId: string, email: string): Promise<{
        secret: string;
        qrCodeUrl: string;
    }>;
    verifyCode(userId: string, code: string): Promise<boolean>;
    enable2FA(userId: string): Promise<void>;
    disable2FA(userId: string): Promise<void>;
    is2FAEnabled(userId: string): Promise<boolean>;
}
