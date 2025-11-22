import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontSize } from '../../extensions/FontSize';
import Image from '@tiptap/extension-image';
import { DEFAULT_SMILEY, SMILEY_ASSETS, toSmileyCode } from '../../utils/smileys';
import type { SmileyAsset } from '../../utils/smileys';

interface RichTextMessageInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export const RichTextMessageInput: React.FC<RichTextMessageInputProps> = ({
    value,
    onChange,
    onSubmit,
    placeholder = "Écrivez votre message...",
    disabled = false,
    className = "",
}) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showSizePicker, setShowSizePicker] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const colorPickerRef = useRef<HTMLDivElement | null>(null);
    const sizePickerRef = useRef<HTMLDivElement | null>(null);
    const emojiPickerRef = useRef<HTMLDivElement | null>(null);

    // Fermer les pickers au clic en dehors
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (colorPickerRef.current?.contains(target)) {
                return;
            }
            if (sizePickerRef.current?.contains(target)) {
                return;
            }
            if (emojiPickerRef.current?.contains(target)) {
                return;
            }

            setShowColorPicker(false);
            setShowSizePicker(false);
            setShowEmojiPicker(false);
        };

        if (showColorPicker || showSizePicker || showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showColorPicker, showSizePicker, showEmojiPicker]);

    const smileys = SMILEY_ASSETS;
    const defaultSmileyIcon = DEFAULT_SMILEY?.url ?? '';

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // Désactiver toutes les fonctionnalités sauf le paragraphe et le gras
                heading: false,
                codeBlock: false,
                code: false,
                horizontalRule: false,
                blockquote: false,
                bulletList: false,
                orderedList: false,
                listItem: false,
                italic: false,
                strike: false,
                // Désactiver le comportement par défaut de Enter dans HardBreak
                hardBreak: false,
            }),
            Placeholder.configure({
                placeholder,
            }),
            TextStyle,
            Color,
            FontSize,
            Image.configure({
                inline: true,
                HTMLAttributes: {
                    class: 'inline-smiley align-middle',
                },
            }),
        ],
        content: value,
        editable: !disabled,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[44px] max-h-[200px] overflow-y-auto px-4 py-3',
            },
            handleKeyDown: (view, event) => {
                // Enter seul : envoyer le message
                if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
                    event.preventDefault();
                    onSubmit();
                    return true; // Empêcher le comportement par défaut de Tiptap
                }
                // Shift+Enter : insérer un saut de ligne (<br>)
                if (event.key === 'Enter' && event.shiftKey) {
                    event.preventDefault();
                    view.dispatch(view.state.tr.replaceSelectionWith(view.state.schema.nodes.hardBreak.create()).scrollIntoView());
                    return true;
                }
                return false; // Laisser Tiptap gérer les autres touches
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            // Si le contenu est juste un paragraphe vide, retourner une chaîne vide
            if (html === '<p></p>') {
                onChange('');
            } else {
                onChange(html);
            }
        },
    });

    // Mettre à jour l'éditeur quand la valeur externe change
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || '');
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    const handleSmileySelect = (asset: SmileyAsset) => {
        editor
            .chain()
            .focus()
            .insertContent({
                type: 'image',
                attrs: {
                    src: asset.url,
                    alt: toSmileyCode(asset),
                    title: toSmileyCode(asset),
                },
            })
            .run();
        setShowEmojiPicker(false);
    };

    const colors = [
        { name: 'Noir', value: '#000000' },
        { name: 'Gris', value: '#6B7280' },
        { name: 'Rouge', value: '#EF4444' },
        { name: 'Orange', value: '#F97316' },
        { name: 'Jaune', value: '#EAB308' },
        { name: 'Vert', value: '#10B981' },
        { name: 'Bleu', value: '#3B82F6' },
        { name: 'Violet', value: '#8B5CF6' },
        { name: 'Rose', value: '#EC4899' },
    ];

    const sizes = [
        { name: 'Petit', value: '14px' },
        { name: 'Normal', value: '16px' },
        { name: 'Grand', value: '20px' },
        { name: 'Très grand', value: '24px' },
    ];

    const ToolbarButton: React.FC<{
        onClick: () => void;
        isActive?: boolean;
        icon: React.ReactNode;
        title: string;
        disabled?: boolean;
    }> = ({ onClick, isActive, icon, title, disabled }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-2 rounded-lg transition-all ${
                isActive
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
            {icon}
        </button>
    );

    return (
        <div className={`flex-1 border rounded-xl bg-white shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed border-red-200 bg-red-50' : 'border-gray-200 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100'} ${className}`}>
            {/* Toolbar minimaliste */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                {/* Gras */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    disabled={disabled}
                    icon={<span className="font-bold text-sm">B</span>}
                    title="Gras (Ctrl+B)"
                />

                {/* Taille du texte */}
                <div className="relative" ref={sizePickerRef}>
                    <button
                        type="button"
                        onClick={() => {
                            const next = !showSizePicker;
                            setShowSizePicker(next);
                            if (next) {
                                setShowColorPicker(false);
                                setShowEmojiPicker(false);
                            }
                        }}
                        disabled={disabled}
                        title="Taille du texte"
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10M7 21v-2m10 2v-2M7 3h10M7 3v2m10-2v2M3 7h18M3 17h18M7 9h10v6H7V9z" />
                        </svg>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    {showSizePicker && !disabled && (
                        <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
                            {sizes.map((size) => (
                                <button
                                    key={size.value}
                                    type="button"
                                    onClick={() => {
                                        editor.chain().focus().setFontSize(size.value).run();
                                        setShowSizePicker(false);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm transition-colors"
                                    style={{ fontSize: size.value }}
                                >
                                    {size.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Couleur du texte */}
                <div className="relative" ref={colorPickerRef}>
                    <button
                        type="button"
                        onClick={() => {
                            const next = !showColorPicker;
                            setShowColorPicker(next);
                            if (next) {
                                setShowSizePicker(false);
                                setShowEmojiPicker(false);
                            }
                        }}
                        disabled={disabled}
                        title="Couleur du texte"
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    {showColorPicker && !disabled && (
                        <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2 grid grid-cols-3 gap-2">
                            {colors.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => {
                                        editor.chain().focus().setColor(color.value).run();
                                        setShowColorPicker(false);
                                    }}
                                    title={color.name}
                                    className="w-8 h-8 rounded border-2 border-gray-200 hover:border-primary-400 transition-all"
                                    style={{ backgroundColor: color.value }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Smileys */}
                <div className="relative" ref={emojiPickerRef}>
                    <button
                        type="button"
                        onClick={() => {
                            const next = !showEmojiPicker;
                            setShowEmojiPicker(next);
                            if (next) {
                                setShowColorPicker(false);
                                setShowSizePicker(false);
                            }
                        }}
                        disabled={disabled || smileys.length === 0}
                        title="Insérer un smiley"
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {defaultSmileyIcon ? (
                            <img src={defaultSmileyIcon} alt="smiley" className="w-5 h-5 rounded" draggable={false} />
                        ) : (
                            <span className="text-lg">🙂</span>
                        )}
                    </button>
                    {showEmojiPicker && !disabled && smileys.length > 0 && (
                        <div
                            className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-3 w-64 max-h-60 overflow-y-auto grid grid-cols-6 gap-2 origin-bottom-right"
                            style={{ animation: 'fadeScaleIn 120ms ease-out forwards' }}
                        >
                            {smileys.map((smiley) => (
                                <button
                                    key={smiley.url}
                                    type="button"
                                    onClick={() => handleSmileySelect(smiley)}
                                    title={smiley.name}
                                    className="rounded-lg border border-transparent hover:border-primary-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1 transition duration-150"
                                >
                                    <img
                                        src={smiley.url}
                                        alt={smiley.name}
                                        className="w-8 h-8 object-contain"
                                        draggable={false}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1" />
                <span className="text-xs text-gray-400">Enter pour envoyer • Shift+Enter pour nouvelle ligne</span>
            </div>

            {/* Editor */}
            <EditorContent 
                editor={editor} 
                className={disabled ? 'pointer-events-none' : ''}
            />
        </div>
    );
};
