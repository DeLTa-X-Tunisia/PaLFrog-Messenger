import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SecurityBadge } from '../security/SecurityBadge';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';

interface User {
    id: string;
    username: string;
    email?: string;
    birthDate?: string | Date;
    gender?: string;
    createdAt?: string | Date;
    // Extended fields
    firstName?: string;
    lastName?: string;
    country?: string;
    profession?: string;
    maritalStatus?: string;
    avatarUrl?: string;
    bio?: string;
    age?: number;
    phoneNumber?: string;
    status?: 'online' | 'busy' | 'away' | 'dnd' | 'offline';
    // Visibilities
    firstNameVisibility?: 'PUBLIC' | 'CONTACTS' | 'PRIVATE';
    lastNameVisibility?: 'PUBLIC' | 'CONTACTS' | 'PRIVATE';
    countryVisibility?: 'PUBLIC' | 'CONTACTS' | 'PRIVATE';
    professionVisibility?: 'PUBLIC' | 'CONTACTS' | 'PRIVATE';
    maritalStatusVisibility?: 'PUBLIC' | 'CONTACTS' | 'PRIVATE';
    birthDateVisibility?: 'PUBLIC' | 'CONTACTS' | 'PRIVATE';
    genderVisibility?: 'PUBLIC' | 'CONTACTS' | 'PRIVATE';
    emailVisibility?: 'PUBLIC' | 'CONTACTS' | 'PRIVATE';
    phoneNumberVisibility?: 'PUBLIC' | 'CONTACTS' | 'PRIVATE';
}

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    isOnline: boolean;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user: initialUser, isOnline }) => {
    const [user, setUser] = useState<User | null>(initialUser);
    const [loading, setLoading] = useState(false);
    const currentUser = useAuthStore(state => state.user);
    const updateUser = useAuthStore(state => state.updateUser);
    const isOwnProfile = currentUser?.id === initialUser?.id;
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<User>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && initialUser?.id) {
            setLoading(true);
            authAPI.getVisibleProfile(initialUser.id)
                .then((data) => {
                    setUser(prev => ({ ...prev, ...data }));
                    setEditForm({ ...initialUser, ...data });
                })
                .catch(err => console.error("Failed to fetch profile", err))
                .finally(() => setLoading(false));
        } else {
            setUser(initialUser);
            setEditForm(initialUser || {});
        }
    }, [isOpen, initialUser]);

    const handleSave = async () => {
        if (!user) return;
        try {
            setLoading(true);
            
            // Filtrer uniquement les champs autorisés par le backend UpdateProfileDto
            const allowedFields = {
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                country: editForm.country,
                profession: editForm.profession,
                maritalStatus: editForm.maritalStatus,
                phoneNumber: editForm.phoneNumber,
                bio: editForm.bio,
                avatarUrl: editForm.avatarUrl,
                firstNameVisibility: editForm.firstNameVisibility,
                lastNameVisibility: editForm.lastNameVisibility,
                countryVisibility: editForm.countryVisibility,
                professionVisibility: editForm.professionVisibility,
                maritalStatusVisibility: editForm.maritalStatusVisibility,
                birthDateVisibility: editForm.birthDateVisibility,
                genderVisibility: editForm.genderVisibility,
                emailVisibility: editForm.emailVisibility,
                phoneNumberVisibility: editForm.phoneNumberVisibility,
            };
            
            // Supprimer les valeurs undefined pour ne pas les envoyer
            const cleanedData = Object.fromEntries(
                Object.entries(allowedFields).filter(([_, value]) => value !== undefined)
            );
            
            const updatedProfile = await authAPI.updateProfile(cleanedData);
            setUser(prev => ({ ...prev, ...updatedProfile }));

            // Update global store if it's the current user's profile
            if (isOwnProfile) {
                updateUser(updatedProfile);
            }

            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof User, value: any) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleInputChange('avatarUrl', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    if (!isOpen || !user) return null;

    // Mock data generation based on user ID for consistency
    const getMockData = (id: string) => {
        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const friendCount = 10 + (hash % 150);
        const securityScore = 60 + (hash % 40);

        // Generate a random date within the last 2 years
        const date = new Date();
        date.setDate(date.getDate() - (hash % 730));
        const joinDate = date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return { friendCount, securityScore, joinDate };
    };

    const { friendCount, securityScore } = getMockData(user.id);

    // Use real join date if available, otherwise mock
    const joinDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
        : getMockData(user.id).joinDate;

    const calculateAge = (birthDate?: string | Date) => {
        if (!birthDate) return null;
        const birth = new Date(birthDate);
        if (isNaN(birth.getTime())) return null;

        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const formatGender = (gender?: string) => {
        if (!gender) return null;
        // Capitalize first letter
        return gender.charAt(0).toUpperCase() + gender.slice(1);
    };

    const age = user.age !== undefined ? user.age : calculateAge(user.birthDate);
    const displayGender = formatGender(user.gender);

    const renderVisibilityToggle = (field: string, currentVisibility: string | undefined) => {
        const visibilityField = `${field}Visibility` as keyof User;
        return (
            <select
                value={currentVisibility || 'PUBLIC'}
                onChange={(e) => handleInputChange(visibilityField, e.target.value)}
                className="text-xs border rounded p-1 ml-2"
            >
                <option value="PUBLIC">Public</option>
                <option value="CONTACTS">Contacts</option>
                <option value="PRIVATE">Privé</option>
            </select>
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200 relative text-left"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header with gradient background */}
                    <div className="h-32 bg-gradient-to-r from-primary-500 to-accent-500 relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-colors z-20"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                        {isOwnProfile && !isEditing && (
                            <button
                                onClick={() => {
                                    setEditForm(user || {});
                                    setIsEditing(true);
                                }}
                                className="absolute top-4 left-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-colors z-20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Profile Content */}
                    <div className="px-6 pb-6 relative flex flex-col items-center">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        {/* Avatar */}
                        <div
                            className="-mt-16 mb-6 z-10 relative group"
                            onClick={isEditing ? triggerFileInput : undefined}
                        >
                            <div className={`w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center text-4xl font-bold text-primary-600 bg-gradient-to-br from-primary-100 to-accent-100 relative overflow-hidden ${isEditing ? 'cursor-pointer' : ''}`}>
                                {editForm.avatarUrl || user.avatarUrl ? (
                                    <img src={editForm.avatarUrl || user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{user.username[0].toUpperCase()}</span>
                                )}
                                {isOnline && (
                                    <div className={`absolute bottom-2 right-2 w-6 h-6 ${(user.status === 'busy' ? 'bg-red-500' :
                                        user.status === 'away' ? 'bg-yellow-500' :
                                            user.status === 'dnd' ? 'bg-red-600' :
                                                'bg-green-500')
                                        } border-4 border-white rounded-full`} title={
                                            user.status === 'busy' ? 'Occupé(e)' :
                                                user.status === 'away' ? 'Absent(e)' :
                                                    user.status === 'dnd' ? 'Ne pas déranger' :
                                                        'En ligne'
                                        }></div>
                                )}
                                {isEditing && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100">
                                        <div className="text-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-white text-xs font-medium">Modifier</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>                        {isEditing ? (
                            <div className="w-full space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Photo de profil (URL)</label>
                                    <input
                                        type="text"
                                        value={editForm.avatarUrl || ''}
                                        onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                        placeholder="https://example.com/photo.jpg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Prénom</label>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            value={editForm.firstName || ''}
                                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                        />
                                        {renderVisibilityToggle('firstName', editForm.firstNameVisibility)}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nom</label>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            value={editForm.lastName || ''}
                                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                        />
                                        {renderVisibilityToggle('lastName', editForm.lastNameVisibility)}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                                    <textarea
                                        value={editForm.bio || ''}
                                        onChange={(e) => handleInputChange('bio', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Profession</label>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            value={editForm.profession || ''}
                                            onChange={(e) => handleInputChange('profession', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                        />
                                        {renderVisibilityToggle('profession', editForm.professionVisibility)}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Pays</label>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            value={editForm.country || ''}
                                            onChange={(e) => handleInputChange('country', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                        />
                                        {renderVisibilityToggle('country', editForm.countryVisibility)}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            value={editForm.phoneNumber || ''}
                                            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                            placeholder="+33 6 12 34 56 78"
                                        />
                                        {renderVisibilityToggle('phoneNumber', editForm.phoneNumberVisibility)}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Situation amoureuse</label>
                                    <div className="flex">
                                        <select
                                            value={editForm.maritalStatus || ''}
                                            onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                        >
                                            <option value="">Non renseigné</option>
                                            <option value="Célibataire">Célibataire</option>
                                            <option value="En couple">En couple</option>
                                            <option value="Marié(e)">Marié(e)</option>
                                            <option value="Compliqué">C'est compliqué</option>
                                        </select>
                                        {renderVisibilityToggle('maritalStatus', editForm.maritalStatusVisibility)}
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                    >
                                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* User Info */}
                                <div className="text-center w-full">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-1">
                                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                                    </h2>
                                    {user.firstName && user.lastName && (
                                        <p className="text-sm text-gray-500 mb-2">@{user.username}</p>
                                    )}

                                    {user.profession && (
                                        <p className="text-primary-600 font-medium mb-2">{user.profession}</p>
                                    )}

                                    {user.bio && (
                                        <p className="text-gray-600 text-sm italic mb-4 px-4">"{user.bio}"</p>
                                    )}

                                    <div className="flex items-center justify-center mb-6">
                                        {isOnline ? (
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${user.status === 'busy' ? 'bg-red-100 text-red-700' :
                                                user.status === 'away' ? 'bg-yellow-100 text-yellow-700' :
                                                    user.status === 'dnd' ? 'bg-red-100 text-red-800' :
                                                        'bg-green-100 text-green-700'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full animate-pulse ${user.status === 'busy' ? 'bg-red-500' :
                                                    user.status === 'away' ? 'bg-yellow-500' :
                                                        user.status === 'dnd' ? 'bg-red-600' :
                                                            'bg-green-500'
                                                    }`}></span>
                                                {
                                                    user.status === 'busy' ? 'Occupé(e)' :
                                                        user.status === 'away' ? 'Absent(e)' :
                                                            user.status === 'dnd' ? 'Ne pas déranger' :
                                                                'En ligne'
                                                }
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">
                                                Hors ligne
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex justify-center mb-8">
                                        <div className="w-full max-w-xs transform transition-transform hover:scale-105">
                                            <SecurityBadge score={securityScore} />
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="text-gray-500 text-sm font-medium mb-1">Amis</div>
                                            <div className="text-2xl font-bold text-gray-800">{friendCount}</div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="text-gray-500 text-sm font-medium mb-1">Membre depuis</div>
                                            <div className="text-lg font-bold text-gray-800">{joinDate}</div>
                                        </div>
                                    </div>

                                    {/* Additional Info */}
                                    <div className="mt-6 space-y-3 text-left w-full max-w-xs mx-auto">
                                        {user.country && (
                                            <div className="flex items-center gap-3 text-gray-600 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                                <span className="text-xl">🌍</span>
                                                <span className="text-sm">{user.country}</span>
                                            </div>
                                        )}

                                        {user.maritalStatus && (
                                            <div className="flex items-center gap-3 text-gray-600 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                                <span className="text-xl">❤️</span>
                                                <span className="text-sm">{user.maritalStatus}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 text-gray-600 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                            <span className="text-xl">📧</span>
                                            <span className="text-sm truncate">{user.email || 'Email masqué'}</span>
                                        </div>

                                        {user.phoneNumber && (
                                            <div className="flex items-center gap-3 text-gray-600 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                                <span className="text-xl">📞</span>
                                                <span className="text-sm">{user.phoneNumber}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 text-gray-600 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                            <span className="text-xl">⚧️</span>
                                            <span className="text-sm">
                                                Genre : {displayGender || <span className="text-gray-400 italic">Non renseigné</span>}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 text-gray-600 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                            <span className="text-xl">🎂</span>
                                            <span className="text-sm">
                                                Âge : {age !== null && age !== undefined ? `${age} ans` : <span className="text-gray-400 italic">Non renseigné</span>}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 text-gray-600 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                            <span className="text-xl">🛡️</span>
                                            <span className="text-sm">Niveau de sécurité: {securityScore}/100</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-8 flex gap-3">
                                        <button
                                            onClick={onClose}
                                            className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                                        >
                                            Fermer
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
