import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class SignUpDto {
    @ApiProperty({ example: 'john.doe@email.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'johndoe' })
    @IsString()
    @MinLength(3)
    @MaxLength(20)
    @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers and underscores' })
    username: string;

    @ApiProperty({ example: 'SecurePassword123!' })
    @IsString()
    @MinLength(8)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    })
    password: string;

    @ApiProperty({ example: '2000-01-01', required: false })
    @IsString()
    birthDate?: string;

    @ApiProperty({ example: 'Homme', required: false })
    @IsString()
    gender?: string;
}
