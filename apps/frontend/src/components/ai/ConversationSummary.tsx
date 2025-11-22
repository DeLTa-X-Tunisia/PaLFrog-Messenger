import React, { useState, useEffect } from 'react';
import { useAIStore } from '../../stores/ai.store';
import { useTranslation } from '../../hooks/useTranslation';
import { sanitizeHtml } from '../../utils/html-sanitizer';

interface ConversationSummaryProps {
    messages: any[];
    conversationId: string;
    participantName?: string;
}

export const ConversationSummary: React.FC<ConversationSummaryProps> = ({
    messages,
    conversationId,
    participantName = 'Correspondant'
}) => {
    const { t } = useTranslation();
    const { summarizeConversation, preferences } = useAIStore();
    const [summary, setSummary] = useState('');
    // Charger l'état depuis localStorage ou fermé par défaut
    const [isExpanded, setIsExpanded] = useState(() => {
        const saved = localStorage.getItem(`summary-expanded-${conversationId}`);
        return saved ? JSON.parse(saved) : false;
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDetached, setIsDetached] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (preferences.autoSummarize && messages.length >= 5) {
            generateSummary();
        }
    }, [messages, preferences.autoSummarize]);

    // Mémoriser l'état ouvert/fermé du résumé
    useEffect(() => {
        localStorage.setItem(`summary-expanded-${conversationId}`, JSON.stringify(isExpanded));
    }, [isExpanded, conversationId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };

        if (isExportMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isExportMenuOpen]);

    const generateSummary = async () => {
        if (messages.length < 2) return;

        setIsGenerating(true);
        try {
            const newSummary = await summarizeConversation(messages, participantName);
            setSummary(newSummary);
        } catch (error) {
            console.error('Failed to generate summary:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleClearSummary = () => {
        if (window.confirm(t('ai.confirmClearSummary') || 'Voulez-vous vraiment supprimer ce résumé ?')) {
            setSummary('');
            setIsExpanded(false);
            localStorage.removeItem(`summary-expanded-${conversationId}`);
        }
    };

    const handleExportTxt = () => {
        // Convertir le HTML en texte brut pour l'export TXT
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = summary;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';
        
        const element = document.createElement("a");
        const file = new Blob([plainText], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `resume_conversation_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleExportPdf = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            // Sanitizer le HTML pour la sécurité
            const sanitizedSummary = sanitizeHtml(summary);
            
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Résumé de la conversation</title>
                        <style>
                            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                            h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                            .summary { line-height: 1.6; color: #34495e; background: #f8f9fa; padding: 20px; border-radius: 8px; }
                            .summary p { margin: 0.5em 0; }
                            .summary strong { font-weight: 700; }
                            .summary span[style*="color"] { /* Couleur inline préservée */ }
                            .summary span[style*="font-size"] { line-height: 1.5; }
                            .footer { margin-top: 30px; font-size: 12px; color: #7f8c8d; text-align: center; }
                        </style>
                    </head>
                    <body>
                        <h1>Résumé de la conversation</h1>
                        <div class="summary">${sanitizedSummary}</div>
                        <div class="footer">Généré par PalFroG le ${new Date().toLocaleString()}</div>
                        <script>
                            window.onload = function() { window.print(); window.close(); }
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    if (!summary && !isGenerating) {
        return null;
    }

    const containerClass = isDetached
        ? "fixed top-24 right-4 w-80 z-50 shadow-2xl animate-fade-in"
        : "mb-4";

    return (
        <div className={`bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200 p-4 transition-all duration-300 ${containerClass}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <span className="font-medium text-green-800 text-sm">
                        {t('ai.conversationSummary')}
                    </span>
                </div>

                <div className="flex items-center space-x-1">
                    <div className="relative" ref={exportMenuRef}>
                        <button
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                            className={`p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors ${isExportMenuOpen ? 'bg-green-100 text-green-800' : ''}`}
                            title="Exporter"
                        >
                            📤
                        </button>
                        {isExportMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl z-50 border border-gray-100 overflow-hidden animate-fade-in-up">
                                <div className="py-1">
                                    <button
                                        onClick={() => { handleExportTxt(); setIsExportMenuOpen(false); }}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors flex items-center gap-3"
                                    >
                                        <span className="text-lg">📄</span>
                                        <span className="font-medium">Exporter en .TXT</span>
                                    </button>
                                    <button
                                        onClick={() => { handleExportPdf(); setIsExportMenuOpen(false); }}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors flex items-center gap-3 border-t border-gray-50"
                                    >
                                        <span className="text-lg">📑</span>
                                        <span className="font-medium">Exporter en .PDF</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={generateSummary}
                        disabled={isGenerating}
                        className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                        title={t('ai.regenerateSummary')}
                    >
                        🔄
                    </button>

                    <button
                        onClick={handleClearSummary}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Nettoyer le résumé"
                    >
                        🗑️
                    </button>

                    <button
                        onClick={() => setIsDetached(!isDetached)}
                        className={`p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors ${isDetached ? 'bg-green-100' : ''}`}
                        title={isDetached ? "Attacher" : "Détacher"}
                    >
                        {isDetached ? '📌' : '🔓'}
                    </button>

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                    >
                        {isExpanded ? '▼' : '▶'}
                    </button>
                </div>
            </div>

            {isGenerating ? (
                <div className="flex items-center space-x-2 text-green-700 py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                    <span className="text-sm">{t('ai.generatingSummary')}</span>
                </div>
            ) : (
                <div 
                    className={`text-green-800 text-sm leading-relaxed transition-all duration-300 prose prose-sm max-w-none ${isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-0 overflow-hidden'}`}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(summary) }}
                />
            )}
        </div>
    );
};
