import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { WebRTCGateway } from '../websocket/websocket.gateway';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserEntity } from './entities/user.entity';
export declare class AuthService {
    private prisma;
    private jwtService;
    private webRTCGateway;
    constructor(prisma: PrismaService, jwtService: JwtService, webRTCGateway: WebRTCGateway);
    signUp(signUpDto: SignUpDto): Promise<{
        user: UserEntity;
        accessToken: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: UserEntity;
        accessToken: string;
    }>;
    getProfile(userId: string): Promise<UserEntity>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserEntity>;
    getVisibleProfile(targetUserId: string, viewerUserId: string): Promise<any>;
    private generateToken;
}
