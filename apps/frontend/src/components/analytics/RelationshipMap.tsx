import React from 'react';

interface RelationshipMapProps {
    data: {
        contacts: {
            id: string;
            name: string;
            messageCount: number;
            lastInteraction: Date;
            strength: number;
            sentiment: 'positive' | 'negative' | 'neutral';
            commonTopics: string[];
        }[];
        groups: any[];
    };
}

export const RelationshipMap: React.FC<RelationshipMapProps> = ({ data }) => {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Carte des Relations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.contacts.map((contact) => (
                    <div key={contact.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{contact.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${contact.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                                    contact.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                }`}>
                                {contact.sentiment}
                            </span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Force:</span>
                                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{ width: `${contact.strength}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <span>Messages:</span>
                                <span>{contact.messageCount}</span>
                            </div>
                            <div>
                                <span className="block mb-1">Sujets communs:</span>
                                <div className="flex flex-wrap gap-1">
                                    {contact.commonTopics.map((topic, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
