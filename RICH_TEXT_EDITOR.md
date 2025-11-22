# Éditeur Rich Text - PaLFroG

## 📝 Vue d'ensemble

L'éditeur rich text a été intégré dans le composant de chat de PaLFroG, permettant aux utilisateurs d'envoyer des messages formatés avec du texte enrichi.

## 🎯 Fonctionnalités

### Formatage de texte
- **Gras** : Ctrl+B
- *Italique* : Ctrl+I
- ~~Barré~~ : Ctrl+Shift+S
- `Code inline` : Ctrl+E

### Listes
- **Liste à puces** : Insertion de listes non ordonnées
- **Liste numérotée** : Insertion de listes ordonnées

### Raccourcis clavier
- **Ctrl+Enter** : Envoyer le message
- **Ctrl+B** : Gras
- **Ctrl+I** : Italique
- **Ctrl+Shift+S** : Barré
- **Ctrl+E** : Code inline

## 🔧 Architecture technique

### Composants

#### `RichTextMessageInput.tsx`
Composant principal de l'éditeur, basé sur **Tiptap** (éditeur WYSIWYG moderne pour React).

**Props** :
```typescript
interface RichTextMessageInputProps {
    value: string;           // Contenu HTML du message
    onChange: (value: string) => void; // Callback lors de la modification
    onSubmit: () => void;    // Callback pour l'envoi (Ctrl+Enter)
    placeholder?: string;    // Texte du placeholder
    disabled?: boolean;      // État désactivé (mode DND)
    className?: string;      // Classes CSS additionnelles
}
```

**Extensions Tiptap utilisées** :
- `StarterKit` : Formatage de base (gras, italique, listes, etc.)
- `Placeholder` : Affichage du placeholder
- `Link` : Support des liens hypertextes

### Utilitaires de sécurité

#### `html-sanitizer.ts`
Utilitaires pour sanitizer le HTML et prévenir les attaques XSS.

**Fonctions** :
```typescript
// Nettoie le HTML pour autoriser uniquement les balises sûres
sanitizeHtml(html: string): string

// Convertit HTML en texte brut
htmlToPlainText(html: string): string

// Vérifie si un message est vide (uniquement des espaces/tags vides)
isMessageEmpty(html: string): boolean
```

**Tags autorisés** :
- Formatage : `<p>`, `<br>`, `<strong>`, `<em>`, `<u>`, `<s>`, `<code>`, `<span>`
- Listes : `<ul>`, `<ol>`, `<li>`
- Liens : `<a>` (avec attributs `href`, `class`, `style`)

## 🎨 Styles CSS

### Styles de l'éditeur (`.ProseMirror`)
Définis dans `index.css` pour l'éditeur Tiptap :
- Placeholder en gris clair (`#9ca3af`)
- Formatage du texte (gras, italique, code)
- Styles des listes
- Liens cliquables

### Styles de rendu des messages (`.prose`)
Appliqués aux messages affichés dans le chat :
- Cohérence visuelle avec l'éditeur
- Support du texte blanc sur fond coloré (messages envoyés)
- Marges réduites pour un affichage compact

## 🔒 Sécurité

### Protection XSS
- **DOMPurify** : Sanitization du HTML avant affichage
- **Whitelist stricte** : Seules les balises sûres sont autorisées
- **Pas d'attributs data-*** : Prévention de l'exécution de scripts

### Validation
- **Vérification côté client** : `isMessageEmpty()` empêche l'envoi de messages vides
- **Nettoyage automatique** : Suppression des balises dangereuses

## 📦 Dépendances

```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/pm": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-placeholder": "^2.x",
  "@tiptap/extension-mention": "^2.x",
  "@tiptap/extension-link": "^2.x",
  "dompurify": "^3.x",
  "@types/dompurify": "^3.x"
}
```

## 🚀 Utilisation

### Intégration dans ChatRoom.tsx

```tsx
<RichTextMessageInput
    value={inputValue}
    onChange={handleInputChange}
    onSubmit={handleSubmit}
    placeholder="Écrivez votre message..."
    disabled={isRecipientDND}
/>
```

### Affichage des messages

```tsx
<div 
    className="prose prose-sm max-w-none"
    dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.content) }}
/>
```

## 🎯 Améliorations futures possibles

### Extensions Tiptap
- **Mentions** : @utilisateur avec autocomplétion
- **Emojis** : Sélecteur d'emojis intégré
- **Images** : Support d'images inline
- **Tables** : Insertion de tableaux
- **Markdown** : Support de la syntaxe Markdown

### UX
- **Prévisualisation** : Mode prévisualisation avant envoi
- **Historique** : Historique des messages avec Ctrl+↑/↓
- **Raccourcis** : Palette de commandes (/)
- **Thèmes** : Mode sombre pour l'éditeur

### Performance
- **Lazy loading** : Chargement différé des extensions lourdes
- **Debouncing** : Réduction des mises à jour lors de la frappe
- **Virtual scrolling** : Pour les très longues conversations

## 📝 Notes de développement

### Compatibilité
- ✅ **React 18**
- ✅ **Electron** (via electron-forge)
- ✅ **TypeScript** (strict mode)
- ✅ **Tailwind CSS 3**

### Tests recommandés
1. Envoi de messages avec formatage complexe
2. Validation XSS (tentative d'injection de `<script>`)
3. Gestion du mode DND (désactivation de l'éditeur)
4. Raccourcis clavier dans différents contextes
5. Performance avec de longs messages

### Maintenance
- **Tiptap** : Suivre les mises à jour de la v2.x
- **DOMPurify** : Vérifier régulièrement les nouvelles vulnérabilités
- **CSS** : Harmoniser avec le design system PaLFroG

---

**Dernière mise à jour** : 22 novembre 2025  
**Version** : 1.0.0  
**Auteur** : Claude (GitHub Copilot) & Équipe PaLFroG
