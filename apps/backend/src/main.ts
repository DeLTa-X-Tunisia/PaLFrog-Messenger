import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Reasonable body limit (protection contre DoS)
    app.use(json({ limit: '5mb' }));
    app.use(urlencoded({ extended: true, limit: '5mb' }));

    // Swagger configuration
    const config = new DocumentBuilder()
        .setTitle('Palfrog Chat API')
        .setDescription('Peer-to-peer chat application API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);

    // Validation stricte avec whitelist
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    // CORS sécurisé avec validation stricte
    app.enableCors({
        origin: (origin, callback) => {
            const allowedOrigins = [
                'http://localhost:5173',
                'http://localhost:3000',
                'http://localhost:9000'
            ];

            // Autoriser pas d'origine (Electron) ou origines listées
            if (!origin || allowedOrigins.includes(origin) || origin === 'electron://.') {
                callback(null, true);
            } else {
                console.warn(`⚠️ CORS blocked: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization',
    });

    await app.listen(3001);
    console.log('Application is listening on port 3001');
}
bootstrap().catch(err => {
    console.error('Bootstrap error:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
