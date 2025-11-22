import React, { useState } from 'react';

interface GuideStep {
    title: string;
    content: string;
    image?: string;
}

export const UserGuide: React.FC<{ trigger?: React.ReactNode }> = ({ trigger }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const guideSteps: GuideStep[] = [
        {
            title: "Bienvenue sur Palfrog",
            content: "Palfrog est une application de chat sécurisée peer-to-peer avec chiffrement de bout en bout."
        },
        {
            title: "Connexion Sécurisée",
            content: "Vos messages sont chiffrés avec AES-256. Seuls vous et votre destinataire pouvez les lire."
        },
        {
            title: "Appels Audio/Video",
            content: "Passez des appels directs P2P sans intermédiaire. Qualité optimisée automatiquement."
        },
        {
            title: "Partage de Fichiers",
            content: "Envoyez des fichiers jusqu'à 100MB directement entre appareils."
        },
        {
            title: "Mode Hors Ligne",
            content: "Vos messages sont sauvegardés localement et synchronisés à la reconnexion."
        }
    ];

    if (!isOpen) {
        return (
            <div onClick={() => setIsOpen(true)} className="cursor-pointer">
                {trigger || (
                    <button
                        className="fixed bottom-4 left-4 w-12 h-12 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-all duration-200 flex items-center justify-center z-30"
                        title="Guide d'utilisation"
                    >
                        ?
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-40">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-96 overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            {guideSteps[currentStep].title}
                        </h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="mb-6">
                        <p className="text-gray-700 leading-relaxed">
                            {guideSteps[currentStep].content}
                        </p>
                    </div>

                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                            disabled={currentStep === 0}
                            className="px-4 py-2 text-gray-600 disabled:opacity-50 hover:text-gray-800 transition-colors"
                        >
                            Précédent
                        </button>

                        <div className="flex space-x-2">
                            {guideSteps.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full ${index === currentStep ? 'bg-primary-500' : 'bg-gray-300'
                                        }`}
                                />
                            ))}
                        </div>

                        {currentStep < guideSteps.length - 1 ? (
                            <button
                                onClick={() => setCurrentStep(prev => prev + 1)}
                                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                            >
                                Suivant
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                                Commencer
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
