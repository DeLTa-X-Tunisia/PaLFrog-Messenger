import React, { useEffect } from 'react';
import { useSecurityStore } from '../../stores/security.store';
import { securityAlertsService } from '../../services/security-alerts.service';
import { SecurityBadge } from '../security/SecurityBadge';
import { SecurityAlerts } from '../security/SecurityAlerts';

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { calculateScore } = useSecurityStore();

    useEffect(() => {
        // Calcul initial du score
        calculateScore();

        // Vérifications de sécurité périodiques
        const interval = setInterval(() => {
            securityAlertsService.checkForSecurityIssues();
        }, 5 * 60 * 1000); // Toutes les 5 minutes

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            {children}
            <SecurityAlerts />
        </>
    );
};
