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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
const user_entity_1 = require("./entities/user.entity");
const bcrypt = require("bcrypt");
let AuthService = class AuthService {
    constructor(prisma, jwtService, webRTCGateway) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.webRTCGateway = webRTCGateway;
    }
    async signUp(signUpDto) {
        const { email, username, password, birthDate, gender } = signUpDto;
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email or username already exists');
        }
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const user = await this.prisma.user.create({
            data: {
                email,
                username,
                passwordHash,
                role: 'USER',
                birthDate: birthDate ? new Date(birthDate) : undefined,
                gender,
                profile: {
                    create: {}
                }
            },
            include: { profile: true }
        });
        const accessToken = this.generateToken(user);
        return {
            user: new user_entity_1.UserEntity(user),
            accessToken,
        };
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { profile: true }
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const accessToken = this.generateToken(user);
        return {
            user: new user_entity_1.UserEntity(user),
            accessToken,
        };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true }
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return new user_entity_1.UserEntity(user);
    }
    async updateProfile(userId, updateProfileDto) {
        var _a;
        const { firstName, lastName, country, profession, maritalStatus, phoneNumber, avatarUrl, bio, firstNameVisibility, lastNameVisibility, countryVisibility, professionVisibility, maritalStatusVisibility, birthDateVisibility, genderVisibility, emailVisibility, phoneNumberVisibility } = updateProfileDto;
        const profileData = {
            firstName, lastName, country, profession, maritalStatus, phoneNumber, avatarUrl, bio,
            firstNameVisibility, lastNameVisibility, countryVisibility, professionVisibility,
            maritalStatusVisibility, birthDateVisibility, genderVisibility, emailVisibility, phoneNumberVisibility
        };
        Object.keys(profileData).forEach(key => profileData[key] === undefined && delete profileData[key]);
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                profile: {
                    upsert: {
                        create: Object.assign({}, profileData),
                        update: Object.assign({}, profileData)
                    }
                }
            },
            include: { profile: true }
        });
        this.webRTCGateway.server.emit('profile-updated', {
            userId: user.id,
            avatarUrl: (_a = user.profile) === null || _a === void 0 ? void 0 : _a.avatarUrl,
            username: user.username,
        });
        return new user_entity_1.UserEntity(user);
    }
    async getVisibleProfile(targetUserId, viewerUserId) {
        const user = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            include: { profile: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const isSelf = targetUserId === viewerUserId;
        let isFriend = false;
        if (!isSelf) {
            const friendship = await this.prisma.friend.findUnique({
                where: {
                    userId_friendId: {
                        userId: viewerUserId,
                        friendId: targetUserId,
                    },
                },
            });
            isFriend = (friendship === null || friendship === void 0 ? void 0 : friendship.status) === 'ACCEPTED';
        }
        const checkVisibility = (visibility) => {
            if (isSelf)
                return true;
            if (visibility === 'PUBLIC')
                return true;
            if (visibility === 'CONTACTS' && isFriend)
                return true;
            return false;
        };
        const profile = user.profile || {};
        const visibleProfile = {
            id: user.id,
            username: user.username,
            createdAt: user.createdAt,
            role: user.role,
            isOnline: true,
        };
        if (checkVisibility(profile.emailVisibility || 'PRIVATE'))
            visibleProfile.email = user.email;
        if (checkVisibility(profile.birthDateVisibility || 'CONTACTS') && user.birthDate) {
            visibleProfile.birthDate = user.birthDate;
            const today = new Date();
            const birth = new Date(user.birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            visibleProfile.age = age;
        }
        if (checkVisibility(profile.genderVisibility || 'PUBLIC'))
            visibleProfile.gender = user.gender;
        if (checkVisibility(profile.firstNameVisibility || 'PUBLIC'))
            visibleProfile.firstName = profile.firstName;
        if (checkVisibility(profile.lastNameVisibility || 'PUBLIC'))
            visibleProfile.lastName = profile.lastName;
        if (checkVisibility(profile.countryVisibility || 'PUBLIC'))
            visibleProfile.country = profile.country;
        if (checkVisibility(profile.professionVisibility || 'PUBLIC'))
            visibleProfile.profession = profile.profession;
        if (checkVisibility(profile.maritalStatusVisibility || 'CONTACTS'))
            visibleProfile.maritalStatus = profile.maritalStatus;
        if (checkVisibility('PUBLIC'))
            visibleProfile.avatarUrl = profile.avatarUrl;
        if (checkVisibility('PUBLIC'))
            visibleProfile.bio = profile.bio;
        return visibleProfile;
    }
    generateToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
            role: user.role
        };
        return this.jwtService.sign(payload);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        websocket_gateway_1.WebRTCGateway])
], AuthService);
//# sourceMappingURL=auth.service.js.map