import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
    imports: [
        WebSocketModule,
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || (() => {
                throw new Error('🔴 FATAL: JWT_SECRET environment variable must be defined!');
            })(),
            signOptions: { expiresIn: '7d' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, PrismaService],
    exports: [AuthService],
})
export class AuthModule { }
