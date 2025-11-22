import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { WebRTCGateway } from '../websocket/websocket.gateway';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserEntity } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private webRTCGateway: WebRTCGateway,
    ) { }

    async signUp(signUpDto: SignUpDto): Promise<{ user: UserEntity; accessToken: string }> {
        const { email, username, password, birthDate, gender } = signUpDto;

        // Vérifier si l'email existe déjà
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        if (existingUser) {
            throw new ConflictException('Email or username already exists');
        }

        // Hasher le mot de passe
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Créer l'utilisateur
        const user = await this.prisma.user.create({
            data: {
                email,
                username,
                passwordHash,
                role: 'USER', // Par défaut
                birthDate: birthDate ? new Date(birthDate) : undefined,
                gender,
                profile: {
                    create: {}
                }
            },
            include: { profile: true }
        });

        // Générer le token JWT
        const accessToken = this.generateToken(user);

        return {
            user: new UserEntity(user as any),
            accessToken,
        };
    }

    async login(loginDto: LoginDto): Promise<{ user: UserEntity; accessToken: string }> {
        const { email, password } = loginDto;

        // Trouver l'utilisateur
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { profile: true }
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Générer le token JWT
        const accessToken = this.generateToken(user);

        return {
            user: new UserEntity(user as any),
            accessToken,
        };
    }

    async getProfile(userId: string): Promise<UserEntity> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true }
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return new UserEntity(user as any);
    }

    async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserEntity> {
        const {
            firstName, lastName, country, profession, maritalStatus, phoneNumber, avatarUrl, bio,
            firstNameVisibility, lastNameVisibility, countryVisibility, professionVisibility,
            maritalStatusVisibility, birthDateVisibility, genderVisibility, emailVisibility, phoneNumberVisibility
        } = updateProfileDto;

        const profileData = {
            firstName, lastName, country, profession, maritalStatus, phoneNumber, avatarUrl, bio,
            firstNameVisibility, lastNameVisibility, countryVisibility, professionVisibility,
            maritalStatusVisibility, birthDateVisibility, genderVisibility, emailVisibility, phoneNumberVisibility
        };

        // Remove undefined fields to avoid overwriting with undefined if partial update
        Object.keys(profileData).forEach(key => profileData[key] === undefined && delete profileData[key]);

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                profile: {
                    upsert: {
                        create: {
                            ...profileData
                        },
                        update: {
                            ...profileData
                        }
                    }
                }
            },
            include: { profile: true }
        });

        // Notify connected clients about the profile update
        this.webRTCGateway.server.emit('profile-updated', {
            userId: user.id,
            avatarUrl: user.profile?.avatarUrl,
            username: user.username, // In case it changed (though it's not in updateProfileDto currently)
            // Add other visible fields if needed
        });

        return new UserEntity(user as any);
    }

    async getVisibleProfile(targetUserId: string, viewerUserId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            include: { profile: true },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
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
            isFriend = friendship?.status === 'ACCEPTED';
        }

        // Helper to check visibility
        const checkVisibility = (visibility: string) => {
            if (isSelf) return true;
            if (visibility === 'PUBLIC') return true;
            if (visibility === 'CONTACTS' && isFriend) return true;
            return false;
        };

        const profile = user.profile || {} as any;

        // Construct visible profile
        const visibleProfile: any = {
            id: user.id,
            username: user.username, // Always visible
            createdAt: user.createdAt, // Always visible
            role: user.role, // Always visible? Maybe.
            isOnline: true, // Mocked for now
        };

        if (checkVisibility(profile.emailVisibility || 'PRIVATE')) visibleProfile.email = user.email;
        if (checkVisibility(profile.birthDateVisibility || 'CONTACTS') && user.birthDate) {
            visibleProfile.birthDate = user.birthDate;
            // Calculate age dynamically
            const today = new Date();
            const birth = new Date(user.birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            visibleProfile.age = age;
        }
        if (checkVisibility(profile.genderVisibility || 'PUBLIC')) visibleProfile.gender = user.gender;

        if (checkVisibility(profile.firstNameVisibility || 'PUBLIC')) visibleProfile.firstName = profile.firstName;
        if (checkVisibility(profile.lastNameVisibility || 'PUBLIC')) visibleProfile.lastName = profile.lastName;
        if (checkVisibility(profile.countryVisibility || 'PUBLIC')) visibleProfile.country = profile.country;
        if (checkVisibility(profile.professionVisibility || 'PUBLIC')) visibleProfile.profession = profile.profession;
        if (checkVisibility(profile.maritalStatusVisibility || 'CONTACTS')) visibleProfile.maritalStatus = profile.maritalStatus;
        if (checkVisibility('PUBLIC')) visibleProfile.avatarUrl = profile.avatarUrl; // Avatar usually public
        if (checkVisibility('PUBLIC')) visibleProfile.bio = profile.bio;

        return visibleProfile;
    }

    private generateToken(user: any): string {
        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
            role: user.role
        };

        return this.jwtService.sign(payload);
    }
}
