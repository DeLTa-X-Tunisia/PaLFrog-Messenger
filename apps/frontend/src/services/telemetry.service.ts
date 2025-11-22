interface TelemetryEvent {
    type: string;
    timestamp: number;
    data?: any;
}

class TelemetryService {
    private events: TelemetryEvent[] = [];
    private isEnabled = process.env.NODE_ENV === 'production';
    private maxEvents = 1000;

    track(eventType: string, data?: any) {
        if (!this.isEnabled) return;

        const event: TelemetryEvent = {
            type: eventType,
            timestamp: Date.now(),
            data
        };

        this.events.push(event);

        // Garder seulement les N derniers événements
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }

        // Envoyer par lots périodiquement
        if (this.events.length % 10 === 0) {
            this.flush();
        }
    }

    trackError(error: Error, context?: string) {
        this.track('error', {
            message: error.message,
            stack: error.stack,
            context,
            userAgent: navigator.userAgent
        });
    }

    trackPerformance(metric: string, value: number) {
        this.track('performance', { metric, value });
    }

    trackUserAction(action: string, details?: any) {
        this.track('user_action', { action, ...details });
    }

    private async flush() {
        if (this.events.length === 0) return;

        try {
            // Envoyer les événements au backend
            const eventsToSend = [...this.events];
            this.events = [];

            // Implémentation d'envoi sécurisé
            await this.sendToBackend(eventsToSend);
        } catch (error) {
            console.warn('Failed to send telemetry:', error);
            // Remettre les événements dans la queue en cas d'échec
            this.events.unshift(...this.events);
        }
    }

    private async sendToBackend(events: TelemetryEvent[]) {
        // Implémentation sécurisée d'envoi des données
        // (à adapter selon votre infrastructure)
        const response = await fetch('/api/telemetry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ events })
        });

        if (!response.ok) {
            throw new Error('Telemetry send failed');
        }
    }

    // Nettoyage
    destroy() {
        this.flush();
        this.events = [];
    }
}

export const telemetryService = new TelemetryService();
