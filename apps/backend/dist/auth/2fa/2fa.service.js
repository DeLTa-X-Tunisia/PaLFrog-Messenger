"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorService = void 0;
const common_1 = require("@nestjs/common");
const otplib_1 = require("otplib");
const qrcode_1 = require("qrcode");
const prisma_service_1 = require("../../prisma/prisma.service");
let TwoFactorService = class TwoFactorService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateSecret(userId, email) {
        const secret = otplib_1.authenticator.generateSecret();
        const appName = 'Palfrog Secure Chat';
        const otpauthUrl = otplib_1.authenticator.keyuri(email, appName, secret);
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret }
        });
        const qrCodeUrl = await (0, qrcode_1.toDataURL)(otpauthUrl);
        return {
            secret,
            qrCodeUrl
        };
    }
    async verifyCode(userId, code) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true }
        });
        if (!(user === null || user === void 0 ? void 0 : user.twoFactorSecret)) {
            return false;
        }
        return otplib_1.authenticator.verify({
            token: code,
            secret: user.twoFactorSecret
        });
    }
    async enable2FA(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { isTwoFactorEnabled: true }
        });
    }
    async disable2FA(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                isTwoFactorEnabled: false,
                twoFactorSecret: null
            }
        });
    }
    async is2FAEnabled(userId) {
        var _a;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { isTwoFactorEnabled: true }
        });
        return (_a = user === null || user === void 0 ? void 0 : user.isTwoFactorEnabled) !== null && _a !== void 0 ? _a : false;
    }
};
exports.TwoFactorService = TwoFactorService;
exports.TwoFactorService = TwoFactorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TwoFactorService);
//# sourceMappingURL=2fa.service.js.map