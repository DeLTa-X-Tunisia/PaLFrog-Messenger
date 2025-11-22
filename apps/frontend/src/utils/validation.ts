export const validateMessage = (content: string): { isValid: boolean; error?: string } => {
    if (!content || content.trim().length === 0) {
        return { isValid: false, error: 'Le message ne peut pas être vide' };
    }

    if (content.length > 10000) {
        return { isValid: false, error: 'Le message est trop long' };
    }

    // Protection contre les injections basiques
    const dangerousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(content)) {
            return { isValid: false, error: 'Contenu non autorisé détecté' };
        }
    }

    return { isValid: true };
};

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
        return { isValid: false, error: 'Fichier trop volumineux' };
    }

    if (!allowedTypes.includes(file.type) && !file.type.startsWith('text/')) {
        return { isValid: false, error: 'Type de fichier non autorisé' };
    }

    return { isValid: true };
};

export const sanitizeFilename = (filename: string): string => {
    return filename
        .replace(/[^a-zA-Z0-9.\-_]/g, '_')
        .substring(0, 255);
};
