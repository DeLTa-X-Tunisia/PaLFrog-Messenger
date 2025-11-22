import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Visibility {
    PUBLIC = 'PUBLIC',
    CONTACTS = 'CONTACTS',
    PRIVATE = 'PRIVATE',
}

export class UpdateProfileDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    country?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    profession?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    maritalStatus?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @ApiProperty({ enum: Visibility, required: false })
    @IsOptional()
    @IsEnum(Visibility)
    firstNameVisibility?: Visibility;

    @ApiProperty({ enum: Visibility, required: false })
    @IsOptional()
    @IsEnum(Visibility)
    lastNameVisibility?: Visibility;

    @ApiProperty({ enum: Visibility, required: false })
    @IsOptional()
    @IsEnum(Visibility)
    countryVisibility?: Visibility;

    @ApiProperty({ enum: Visibility, required: false })
    @IsOptional()
    @IsEnum(Visibility)
    professionVisibility?: Visibility;

    @ApiProperty({ enum: Visibility, required: false })
    @IsOptional()
    @IsEnum(Visibility)
    maritalStatusVisibility?: Visibility;

    @ApiProperty({ enum: Visibility, required: false })
    @IsOptional()
    @IsEnum(Visibility)
    birthDateVisibility?: Visibility;

    @ApiProperty({ enum: Visibility, required: false })
    @IsOptional()
    @IsEnum(Visibility)
    genderVisibility?: Visibility;

    @ApiProperty({ enum: Visibility, required: false })
    @IsOptional()
    @IsEnum(Visibility)
    emailVisibility?: Visibility;

    @ApiProperty({ enum: Visibility, required: false })
    @IsOptional()
    @IsEnum(Visibility)
    phoneNumberVisibility?: Visibility;
}
