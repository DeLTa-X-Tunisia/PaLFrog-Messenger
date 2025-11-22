import React from 'react';

// Lazy loading pour les composants lourds
const CallInterface = React.lazy(() =>
    import('../call/CallInterface').then(module => ({ default: module.CallInterface }))
);

const FileTransferList = React.lazy(() =>
    import('../files/FileTransferList').then(module => ({ default: module.FileTransferList }))
);

const SecuritySettings = React.lazy(() =>
    import('../settings/SecuritySettings').then(module => ({ default: module.SecuritySettings }))
);

// Composant de fallback
export const LoadingFallback: React.FC = () => (
    <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
);

// HOC pour le lazy loading avec Suspense
export const withLazyLoading = <P extends object>(
    Component: React.ComponentType<P>
) => {
    return (props: P) => (
        <React.Suspense fallback={<LoadingFallback />}>
            <Component {...props} />
        </React.Suspense>
    );
};

export { CallInterface, FileTransferList, SecuritySettings };
