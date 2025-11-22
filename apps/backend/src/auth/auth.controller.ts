import { Controller, Post, Body, Get, Put, UseGuards, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserEntity } from './entities/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('signup')
    @ApiOperation({ summary: 'Create a new user account' })
    @ApiResponse({ status: 201, description: 'User successfully created' })
    @ApiResponse({ status: 409, description: 'Email or username already exists' })
    async signUp(@Body() signUpDto: SignUpDto) {
        return this.authService.signUp(signUpDto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Login to user account' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile retrieved', type: UserEntity })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getProfile(@CurrentUser() user: { userId: string }) {
        return this.authService.getProfile(user.userId);
    }

    @Put('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({ status: 200, description: 'Profile updated', type: UserEntity })
    async updateProfile(@CurrentUser() user: { userId: string }, @Body() updateProfileDto: UpdateProfileDto) {
        return this.authService.updateProfile(user.userId, updateProfileDto);
    }

    @Get('profile/:userId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get visible profile of another user' })
    @ApiResponse({ status: 200, description: 'Visible profile retrieved' })
    async getVisibleProfile(@Param('userId') userId: string, @CurrentUser() currentUser: { userId: string }) {
        return this.authService.getVisibleProfile(userId, currentUser.userId);
    }
}
