"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const express_1 = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, express_1.json)({ limit: '5mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '5mb' }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Palfrog Chat API')
        .setDescription('Peer-to-peer chat application API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api-docs', app, document);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: (origin, callback) => {
            const allowedOrigins = [
                'http://localhost:5173',
                'http://localhost:3000',
                'http://localhost:9000'
            ];
            if (!origin || allowedOrigins.includes(origin) || origin === 'electron://.') {
                callback(null, true);
            }
            else {
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
//# sourceMappingURL=main.js.map