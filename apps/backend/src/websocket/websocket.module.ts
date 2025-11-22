import { Module } from '@nestjs/common';
import { WebRTCGateway } from './websocket.gateway';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || (() => {
                throw new Error('🔴 FATAL: JWT_SECRET environment variable must be defined!');
            })(),
            signOptions: { expiresIn: '7d' },
        }),
        PrismaModule,
    ],
    providers: [WebRTCGateway],
    exports: [WebRTCGateway],
})
export class WebSocketModule { }
