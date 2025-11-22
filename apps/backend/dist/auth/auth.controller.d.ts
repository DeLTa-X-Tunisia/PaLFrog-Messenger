import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserEntity } from './entities/user.entity';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signUp(signUpDto: SignUpDto): Promise<{
        user: UserEntity;
        accessToken: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: UserEntity;
        accessToken: string;
    }>;
    getProfile(user: {
        userId: string;
    }): Promise<UserEntity>;
    updateProfile(user: {
        userId: string;
    }, updateProfileDto: UpdateProfileDto): Promise<UserEntity>;
    getVisibleProfile(userId: string, currentUser: {
        userId: string;
    }): Promise<any>;
}
