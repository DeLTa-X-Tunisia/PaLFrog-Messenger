import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'john.doe@email.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SecurePassword123!' })
    @IsString()
    password: string;
}
