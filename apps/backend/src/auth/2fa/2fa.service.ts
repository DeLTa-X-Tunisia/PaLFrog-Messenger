import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TwoFactorService {
    constructor(private prisma: PrismaService) { }

    async generateSecret(userId: string, email: string) {
        const secret = authenticator.generateSecret();
        const appName = 'Palfrog Secure Chat';

        const otpauthUrl = authenticator.keyuri(email, appName, secret);

        // Sauvegarder le secret (chiffré en production)
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret }
        });

        // Générer le QR Code
        const qrCodeUrl = await toDataURL(otpauthUrl);

        return {
            secret,
            qrCodeUrl
        };
    }

    async verifyCode(userId: string, code: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true }
        });

        if (!user?.twoFactorSecret) {
            return false;
        }

        return authenticator.verify({
            token: code,
            secret: user.twoFactorSecret
        });
    }

    async enable2FA(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { isTwoFactorEnabled: true }
        });
    }

    async disable2FA(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                isTwoFactorEnabled: false,
                twoFactorSecret: null
            }
        });
    }

    async is2FAEnabled(userId: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { isTwoFactorEnabled: true }
        });

        return user?.isTwoFactorEnabled ?? false;
    }
}
