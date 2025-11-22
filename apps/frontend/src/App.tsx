import { Suspense } from 'react'
import { LoginForm } from './components/auth/LoginForm'
import { SignupForm } from './components/auth/SignupForm'
import { AppLayout } from './components/layout/AppLayout'
import { useAuthStore } from './stores/auth.store'
import { WebRTCManager } from './components/chat/WebRTCManager'
import { ChatRoom } from './components/chat/ChatRoom'
import { ChatSidebar } from './components/chat/ChatSidebar'
import { ContactsList } from './components/chat/ContactsList'
import { NotificationSettings } from './components/settings/NotificationSettings'
import { DeviceTestCard } from './components/settings/DeviceTestCard'
import { CallInterface, FileTransferList, SecuritySettings, LoadingFallback } from './components/lazy/LazyComponents'
import { BridgeSettings } from './components/settings/BridgeSettings'
import { GamificationDashboard } from './components/gamification/GamificationDashboard'
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard'
import { SecurityProvider } from './components/providers/SecurityProvider'
import { IncomingCallModal } from './components/call/IncomingCallModal'
import { UserGuide } from './components/help/UserGuide'
import PricingPage from './components/subscription/PricingPage'
import { useTheme } from './hooks/useTheme'
import './styles/theme.css'
// Import services to ensure they are initialized
import './services/file-transfer-manager';

import { FriendSearch } from './components/chat/FriendSearch'
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useSubscriptionStore } from './stores/subscription.store';

function App() {
    const { isAuthenticated, ui, setShowSignup, getProfile, setCurrentView } = useAuthStore();
    const showSignup = ui.showSignup;
    const { currentTier } = useSubscriptionStore();
    useTheme(); // Initialize theme

    useEffect(() => {
        if (isAuthenticated) {
            getProfile().catch(console.error);
        }
    }, [isAuthenticated, getProfile]);

    if (!isAuthenticated) {
        return (
            <div>
                {showSignup ? <SignupForm /> : <LoginForm />}
                <div className="fixed bottom-8 right-8 z-50">
                    <button
                        onClick={() => setShowSignup(!showSignup)}
                        className="group flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200"
                    >
                        <span className="text-sm font-medium text-gray-600 group-hover:text-primary-600 transition-colors">
                            {showSignup ? 'Déjà un compte ? Connectez-vous' : 'Pas encore de compte ? Créez-en un ici'}
                        </span>
                        <span className="text-lg group-hover:translate-x-1 transition-transform duration-300">
                            {showSignup ? '👈' : '👉'}
                        </span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <SecurityProvider>
            <AppLayout>
                <Toaster position="top-right" toastOptions={{
                    className: '',
                    style: {
                        background: '#fff',
                        color: '#333',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        borderRadius: '12px',
                        padding: '16px',
                        fontSize: '14px',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10B981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#EF4444',
                            secondary: '#fff',
                        },
                    },
                }} />
                <Suspense fallback={<LoadingFallback />}>
                    <WebRTCManager />
                    <CallInterface />
                    <IncomingCallModal />
                    {/* <FileTransferList /> - Désactivé car intégré dans le chat */}
                    {ui.currentView === 'chat' && (
                        <div className="flex h-full">
                            <div className="w-80 border-r border-gray-200/60 hidden md:block bg-white/30 backdrop-blur-sm">
                                <ChatSidebar />
                            </div>
                            <div className="flex-1 flex flex-col min-w-0">
                                <ChatRoom />
                            </div>
                        </div>
                    )}
                    {ui.currentView === 'contacts' && (
                        <div className="p-6 h-full flex flex-col">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Tous les contacts</h2>
                            <div className="flex-1 bg-white/30 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden">
                                <ContactsList />
                            </div>
                        </div>
                    )}
                    {ui.currentView === 'friend-search' && (
                        <div className="p-6 h-full flex flex-col">
                            <div className="flex-1 bg-white/30 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden">
                                <FriendSearch />
                            </div>
                        </div>
                    )}
                    {ui.currentView === 'bridge' && (
                        <div className="p-6 h-full overflow-y-auto">
                            <BridgeSettings />
                        </div>
                    )}
                    {ui.currentView === 'social' && (
                        <div className="p-6 h-full overflow-y-auto">
                            <GamificationDashboard />
                        </div>
                    )}
                    {ui.currentView === 'analytics' && (
                        <div className="p-6 h-full overflow-y-auto">
                            <AnalyticsDashboard />
                        </div>
                    )}
                    {ui.currentView === 'settings' && (
                        <div className="p-6 h-full overflow-y-auto">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Paramètres</h2>
                            <div className="mx-auto w-full max-w-4xl space-y-6">
                                {currentTier === 'free' && (
                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg transform transition-all hover:scale-[1.01]">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-xl mb-2">Passez à Pro 🚀</h3>
                                                <p className="text-indigo-100 mb-4 max-w-md">
                                                    Débloquez l'IA illimitée, le stockage étendu et des fonctionnalités exclusives pour booster votre productivité.
                                                </p>
                                            </div>
                                            <div className="hidden sm:block text-4xl">💎</div>
                                        </div>
                                        <button
                                            onClick={() => setCurrentView('pricing')}
                                            className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-sm"
                                        >
                                            Voir les plans disponibles
                                        </button>
                                    </div>
                                )}
                                <DeviceTestCard />
                                <NotificationSettings />
                                <SecuritySettings />
                            </div>
                        </div>
                    )}
                    {ui.currentView === 'security' && (
                        <div className="p-6 h-full overflow-y-auto">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Sécurité</h2>
                            <div className="mx-auto w-full max-w-4xl space-y-6">
                                <SecuritySettings />
                            </div>
                        </div>
                    )}
                    {ui.currentView === 'pricing' && (
                        <div className="p-6 h-full overflow-y-auto">
                            <PricingPage />
                        </div>
                    )}
                </Suspense>
            </AppLayout>
        </SecurityProvider>
    )
}

export default App