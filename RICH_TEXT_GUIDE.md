# 🎨 Guide d'utilisation - Rich Text Editor

## Interface de l'éditeur

```
┌─────────────────────────────────────────────────────────────────┐
│  [B] [I] [S] [</>] │ [●] [1.] │         Ctrl+Enter pour envoyer │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Écrivez votre message...                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Boutons de la toolbar

| Icône | Fonction | Raccourci |
|-------|----------|-----------|
| **B** | Gras | Ctrl+B |
| *I* | Italique | Ctrl+I |
| ~~S~~ | Barré | Ctrl+Shift+S |
| `</>` | Code inline | Ctrl+E |
| ● | Liste à puces | - |
| 1. | Liste numérotée | - |

---

## Exemples d'utilisation

### 1. Texte formaté simple

**Saisie** :
```
Ceci est un texte en **gras** et en *italique*.
```

**Rendu** :
> Ceci est un texte en **gras** et en *italique*.

---

### 2. Code inline

**Saisie** :
```
Pour installer, tapez `npm install` dans le terminal.
```

**Rendu** :
> Pour installer, tapez `npm install` dans le terminal.

---

### 3. Liste à puces

**Saisie** :
```
• Premier point
• Deuxième point
• Troisième point
```

**Rendu** :
> • Premier point  
> • Deuxième point  
> • Troisième point

---

### 4. Liste numérotée

**Saisie** :
```
1. Étape 1
2. Étape 2
3. Étape 3
```

**Rendu** :
> 1. Étape 1  
> 2. Étape 2  
> 3. Étape 3

---

### 5. Combinaison de formats

**Saisie** :
```
Je veux **vraiment** souligner que `console.log()` est ~~inutile~~ *très utile* pour déboguer !
```

**Rendu** :
> Je veux **vraiment** souligner que `console.log()` est ~~inutile~~ *très utile* pour déboguer !

---

## Raccourcis clavier essentiels

### Formatage rapide
- `Ctrl + B` : Mettre en **gras**
- `Ctrl + I` : Mettre en *italique*
- `Ctrl + Shift + S` : ~~Barrer~~ le texte
- `Ctrl + E` : Formater en `code inline`

### Actions
- `Ctrl + Enter` : **Envoyer le message**
- `Tab` : Naviguer dans la toolbar
- `Escape` : Quitter le focus de l'éditeur

---

## Mode DND (Ne pas déranger)

Lorsque le destinataire est en mode **Ne pas déranger** :

```
┌─────────────────────────────────────────────────────────────────┐
│  [B] [I] [S] [</>] │ [●] [1.] │         Ctrl+Enter pour envoyer │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🚫 Alice est en mode Ne pas déranger                            │
│     (Éditeur désactivé)                                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

L'éditeur est **désactivé** et affiché avec un fond rouge/gris pour indiquer que l'envoi n'est pas possible.

---

## Rendu des messages

### Message envoyé (vous)

```
┌─────────────────────────────────────────────────────────────────┐
│                                          ┌──────────────────────┐│
│                                          │ Salut ! **Comment**  ││
│                                          │ vas-tu ?             ││
│                                          │              14:30 ✓││
│                                          └──────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Message reçu (destinataire)

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────┐                                        │
│ │ Je vais bien ! Et    │                                        │
│ │ toi ? *Merci* !      │                                        │
│ │ 14:31                │                                        │
│ └──────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sécurité

### ✅ Protection XSS

Tous les messages sont **automatiquement sanitizés** avant affichage.

**Exemple bloqué** :
```html
<script>alert('XSS')</script>
```

**Résultat affiché** :
```
[contenu supprimé pour raisons de sécurité]
```

### ✅ Tags autorisés uniquement

Seules les balises suivantes sont autorisées :
- Formatage : `<p>`, `<br>`, `<strong>`, `<em>`, `<u>`, `<s>`, `<code>`, `<span>`
- Listes : `<ul>`, `<ol>`, `<li>`
- Liens : `<a>` (avec attributs `href`, `class`, `style`)

---

## Astuces & bonnes pratiques

### 1. Formater en un clic
Sélectionnez du texte et cliquez sur un bouton de la toolbar (B, I, S, etc.) pour formater instantanément.

### 2. Annuler rapidement
Utilisez `Ctrl + Z` pour annuler la dernière action.

### 3. Messages longs
L'éditeur s'adapte automatiquement jusqu'à 200px de hauteur, puis active le scrolling.

### 4. Copier-coller
Le formatage est préservé lors du copier-coller depuis d'autres applications (Word, Google Docs, etc.).

---

## Limitations actuelles

❌ **Pas encore implémenté** :
- Emojis cliquables (picker)
- Mentions @utilisateur avec autocomplétion
- Images inline
- Vidéos/GIFs
- Tableaux
- Citations (blockquotes)

✅ **Prévu pour les prochaines versions !**

---

## Dépannage

### L'éditeur ne s'affiche pas
1. Vérifier que le frontend est bien compilé
2. Vider le cache du navigateur (Ctrl+Shift+R)
3. Vérifier les erreurs dans la console DevTools

### Le formatage ne s'applique pas
1. Sélectionner le texte avant de cliquer sur un bouton
2. Vérifier que l'éditeur n'est pas désactivé (mode DND)

### Le raccourci Ctrl+Enter ne fonctionne pas
1. Cliquer dans l'éditeur pour lui donner le focus
2. Vérifier que le message n'est pas vide

---

**Bon chat avec PaLFroG ! 💬🐸**
