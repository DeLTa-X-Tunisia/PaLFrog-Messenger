import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
    SERVER_MASTER = 'SERVER_MASTER',
    SERVER_SUPER_ADMIN = 'SERVER_SUPER_ADMIN',
    SERVER_ADMIN = 'SERVER_ADMIN',
    SERVER_MODERATOR = 'SERVER_MODERATOR',
    SERVER_HELPER = 'SERVER_HELPER',
    SERVER_EDITOR = 'SERVER_EDITOR',
    POWER_USER_A = 'POWER_USER_A',
    POWER_USER_B = 'POWER_USER_B',
    POWER_USER_C = 'POWER_USER_C',
    USER = 'USER',
    GUEST = 'GUEST'
}

export class UserEntity {
    @ApiProperty()
    id: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    username: string;

    @ApiProperty({ enum: UserRole })
    role: UserRole;

    @ApiProperty({ required: false, nullable: true })
    birthDate?: Date;

    @ApiProperty({ required: false, nullable: true })
    gender?: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ required: false, nullable: true })
    avatarUrl?: string;

    @ApiProperty({ required: false, nullable: true })
    firstName?: string;

    @ApiProperty({ required: false, nullable: true })
    lastName?: string;

    @ApiProperty({ required: false, nullable: true })
    bio?: string;

    constructor(partial: Partial<UserEntity> & { profile?: any }) {
        Object.assign(this, partial);

        // Flatten profile fields if they exist in the partial object (from Prisma include)
        if (partial.profile) {
            this.avatarUrl = partial.profile.avatarUrl;
            this.firstName = partial.profile.firstName;
            this.lastName = partial.profile.lastName;
            this.bio = partial.profile.bio;
        }
    }
}
