import React, { useState } from 'react';
import { ConversationList } from './ConversationList';
import { ContactsList } from './ContactsList';

export const ChatSidebar: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'messages' | 'contacts'>('contacts');

    return (
        <div className="flex flex-col h-full bg-white/30 backdrop-blur-sm">
            {/* Tabs */}
            <div className="flex p-2 gap-1 border-b border-gray-200/60 bg-white/50 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('contacts')}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap
                        ${activeTab === 'contacts'
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
                        }`}
                >
                    Contacts
                </button>
                <button
                    onClick={() => setActiveTab('messages')}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap
                        ${activeTab === 'messages'
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
                        }`}
                >
                    Messages
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'messages' && <ConversationList />}
                {activeTab === 'contacts' && <ContactsList />}
            </div>
        </div>
    );
};
