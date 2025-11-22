import React, { useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';

export const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const { login, isLoading } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Échec de la connexion');
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Section illustration */}
            <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-600 via-primary-500 to-accent-400 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10 flex flex-col justify-center px-12 text-white">
                    <h1 className="text-5xl font-bold mb-6">
                        Connectez-vous<br />
                        <span className="text-primary-100">librement</span>
                    </h1>
                    <p className="text-xl text-primary-100 opacity-90">
                        Chattez en peer-to-peer avec une sécurité maximale et une interface fluide.
                    </p>
                    <div className="mt-12 flex space-x-4">
                        <div className="w-4 h-4 bg-white rounded-full animate-bounce"></div>
                        <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                </div>
            </div>

            {/* Section formulaire */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-md">
                    <div className="text-center lg:text-left">
                        {/* Logo mobile */}
                        <div className="lg:hidden flex justify-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-accent-400 rounded-2xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-2xl">P</span>
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900">
                            Content de vous revoir
                        </h2>
                        <p className="mt-3 text-gray-600">
                            Connectez-vous à votre compte Palfrog
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-xl bg-red-50 border border-red-200 p-4 animate-shake">
                                <div className="flex items-center space-x-2 text-red-700">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm font-medium">{error}</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                        placeholder="votre@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <div className="absolute right-3 top-3 text-gray-400">
                                        ✉️
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Mot de passe
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 pr-10"
                                        placeholder="Votre mot de passe"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                        title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-base font-medium rounded-2xl text-white bg-gradient-to-r from-primary-500 to-accent-400 hover:from-primary-600 hover:to-accent-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                {isLoading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Connexion...
                                    </span>
                                ) : (
                                    'Se connecter'
                                )}
                            </button>
                        </div>

                        <div className="text-center">
                            <a href="#" className="text-primary-600 hover:text-primary-500 text-sm font-medium transition-colors duration-200">
                                Mot de passe oublié ?
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
