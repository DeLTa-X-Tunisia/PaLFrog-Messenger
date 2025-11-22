import DOMPurify from 'dompurify';
import { replaceSmileyCodes } from './smileys';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Allows safe rich text formatting: bold, color, font-size
 * Adds !important to inline styles to override Tailwind classes
 */
const ALLOWED_IMG_SRC = /^(https?:|data:image\/|\.\.?(?:\/|$)|\/)/i;

export const sanitizeHtml = (html: string): string => {
    const htmlWithSmileys = replaceSmileyCodes(html);

    // Hook pour valider les attributs style
    DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
        if (data.attrName === 'style') {
            const style = data.attrValue;
            
            // Autoriser uniquement color et font-size avec !important
            const allowedStyles: string[] = [];
            
            // Vérifier color
            const colorMatch = style.match(/color:\s*(#[0-9A-Fa-f]{3,6}|rgb\([^)]+\))/);
            if (colorMatch) {
                allowedStyles.push(`color: ${colorMatch[1]} !important`);
            }
            
            // Vérifier font-size
            const sizeMatch = style.match(/font-size:\s*(\d+px)/);
            if (sizeMatch) {
                allowedStyles.push(`font-size: ${sizeMatch[1]} !important`);
            }
            
            // Remplacer par les styles autorisés uniquement
            data.attrValue = allowedStyles.join('; ');
            
            // Si aucun style autorisé, supprimer l'attribut
            if (allowedStyles.length === 0) {
                data.keepAttr = false;
            }
        }

        if (node.nodeName === 'IMG') {
            if (data.attrName === 'class') {
                const allowedClasses = data.attrValue
                    .split(/\s+/)
                    .filter((className) => className === 'inline-smiley');

                if (allowedClasses.length > 0) {
                    data.attrValue = allowedClasses.join(' ');
                } else {
                    data.keepAttr = false;
                }
            }

            if (data.attrName === 'src') {
                if (!ALLOWED_IMG_SRC.test(data.attrValue)) {
                    data.keepAttr = false;
                }
            }
        }
    });

    const cleaned = DOMPurify.sanitize(htmlWithSmileys, {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'span', 'img'
        ],
        ALLOWED_ATTR: ['style', 'src', 'alt', 'title', 'class'],
        ALLOW_DATA_ATTR: false,
        ALLOWED_URI_REGEXP: ALLOWED_IMG_SRC,
    });

    // Nettoyer le hook après utilisation
    DOMPurify.removeAllHooks();

    return cleaned;
};

/**
 * Convert HTML to plain text for validation
 */
export const htmlToPlainText = (html: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = replaceSmileyCodes(html);

    temp.querySelectorAll('img').forEach((img) => {
        const alt = img.getAttribute('alt')?.trim();
        const replacement = alt && alt.length > 0 ? alt : ' [emoji] ';
        img.replaceWith(document.createTextNode(replacement));
    });
    return temp.textContent || temp.innerText || '';
};

/**
 * Check if message content is empty (only whitespace or empty tags)
 */
export const isMessageEmpty = (html: string): boolean => {
    const plainText = htmlToPlainText(html);
    return !plainText.trim();
};
