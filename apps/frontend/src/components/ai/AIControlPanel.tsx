import React from 'react';
import { useAIStore } from '../../stores/ai.store';
import { useTranslation } from '../../hooks/useTranslation';

export const AIControlPanel: React.FC = () => {
    const { t } = useTranslation();
    const {
        isEnabled,
        isProcessing,
        enableAI,
        disableAI,
        preferences,
        toggleFeature,
        capabilities
    } = useAIStore();

    const getPreferenceForCapability = (capability: string) => {
        switch (capability) {
            case 'summarization': return 'autoSummarize';
            case 'translation': return 'autoTranslation';
            case 'sentiment': return 'sentimentAnalysis';
            case 'suggestions': return 'smartReplies';
            case 'smartReplies': return 'smartReplies';
            default: return null;
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    🤖 {t('ai.assistantTitle')}
                </h3>

                <button
                    onClick={() => isEnabled ? disableAI() : enableAI()}
                    disabled={isProcessing}
                    className={`relative inline-flex items-center w-12 h-6 focus:outline-none ${isProcessing ? 'opacity-50 cursor-wait' : ''}`}
                >
                    <div className={`
            w-12 h-6 rounded-full transition-colors duration-200
            ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}
          `}></div>
                    <div className={`
            absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm
            ${isEnabled ? 'transform translate-x-7' : 'transform translate-x-1'}
          `}></div>
                </button>
            </div>

            {isEnabled && (
                <div className="space-y-4">
                    {/* Capacités disponibles */}
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(capabilities).map(([capability, available]) => {
                            const prefKey = getPreferenceForCapability(capability);
                            const isEnabledPref = prefKey ? preferences[prefKey as keyof typeof preferences] : false;

                            return (
                                <button
                                    key={capability}
                                    onClick={() => available && prefKey && toggleFeature(prefKey as any)}
                                    disabled={!available}
                                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 w-full text-left ${available
                                        ? isEnabledPref
                                            ? 'bg-green-50 border-green-200 text-green-700 shadow-sm hover:bg-green-100'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                        : 'bg-gray-50 border-gray-200 text-gray-400 opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    <span>{available && isEnabledPref ? '✅' : available ? '⚪' : '❌'}</span>
                                    <span className="text-sm capitalize font-medium">
                                        {t(`ai.capabilities.${capability}`)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Préférences */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">{t('ai.preferences')}</h4>

                        {Object.entries(preferences).map(([feature, enabled]) => (
                            <div key={feature} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">
                                    {t(`ai.features.${feature}`)}
                                </span>
                                <button
                                    onClick={() => toggleFeature(feature as any)}
                                    className="relative inline-block w-10 h-5 focus:outline-none"
                                >
                                    <div className={`
                    w-10 h-5 rounded-full transition-colors duration-200
                    ${enabled ? 'bg-blue-500' : 'bg-gray-300'}
                  `}></div>
                                    <div className={`
                    absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm
                    ${enabled ? 'transform translate-x-5' : 'transform translate-x-0.5'}
                  `}></div>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Statut */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700">
                            {t('ai.privacyNote')}
                        </p>
                    </div>
                </div>
            )}

            {!isEnabled && (
                <div className="text-center py-6">
                    <p className="text-gray-600 mb-4">
                        {t('ai.enablePrompt')}
                    </p>
                    <button
                        onClick={enableAI}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                    >
                        {t('ai.enableAssistant')}
                    </button>
                </div>
            )}
        </div>
    );
};
