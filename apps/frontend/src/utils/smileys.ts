export interface SmileyAsset {
    name: string;
    url: string;
}

const smileyModules = import.meta.glob<string>(
    '../../../../Icons/smiley_basic/*.gif',
    { eager: true, import: 'default' },
);

const toSmileyAsset = (entry: [string, string]): SmileyAsset => {
    const [filePath, assetUrl] = entry;
    const fileName = filePath.split('/').pop() ?? '';
    const name = fileName.replace(/\.gif$/i, '');
    return {
        name,
        url: assetUrl,
    };
};

export const SMILEY_ASSETS: SmileyAsset[] = Object.entries(smileyModules)
    .map(toSmileyAsset)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }));

export const DEFAULT_SMILEY = SMILEY_ASSETS.find((asset) => asset.name === '30') ?? SMILEY_ASSETS[0];

export const findSmileyByName = (name: string): SmileyAsset | undefined =>
    SMILEY_ASSETS.find((asset) => asset.name.toLowerCase() === name.toLowerCase());

export const toSmileyCode = (asset: SmileyAsset): string => `:smiley${asset.name}:`;

export const toSmileyMarkup = (asset: SmileyAsset): string =>
    `<img src="${asset.url}" alt="${toSmileyCode(asset)}" title="${toSmileyCode(asset)}" class="inline-smiley" />`;

export const replaceSmileyCodes = (content: string): string => {
    if (!content || !content.includes(':smiley')) {
        return content;
    }

    if (typeof document === 'undefined') {
        return content.replace(/:smiley([A-Za-z0-9_-]+):/gi, (match, name) => {
            const asset = findSmileyByName(name.trim());
            return asset ? toSmileyMarkup(asset) : match;
        });
    }

    const container = document.createElement('div');
    container.innerHTML = content;

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];

    while (walker.nextNode()) {
        const current = walker.currentNode as Text;
        if (current.nodeValue && current.nodeValue.includes(':smiley')) {
            nodes.push(current);
        }
    }

    nodes.forEach((textNode) => {
        const value = textNode.nodeValue ?? '';
        const fragment = document.createDocumentFragment();
        const regex = /:smiley([A-Za-z0-9_-]+):/gi;
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(value)) !== null) {
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(value.slice(lastIndex, match.index)));
            }

            const asset = findSmileyByName(match[1].trim());

            if (asset) {
                const img = document.createElement('img');
                const code = toSmileyCode(asset);
                img.src = asset.url;
                img.alt = code;
                img.title = code;
                img.className = 'inline-smiley';
                fragment.appendChild(img);
            } else {
                fragment.appendChild(document.createTextNode(match[0]));
            }

            lastIndex = regex.lastIndex;
        }

        if (lastIndex < value.length) {
            fragment.appendChild(document.createTextNode(value.slice(lastIndex)));
        }

        textNode.replaceWith(fragment);
    });

    return container.innerHTML;
};
