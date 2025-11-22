import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Headers de sécurité
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        // CSP pour l'application Electron
        res.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ws: wss:;"
        );

        next();
    }
}

// Rate limiting pour les endpoints critiques
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives max
    message: {
        error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const apiRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requêtes par minute
    message: {
        error: 'Trop de requêtes. Réessayez dans une minute.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
