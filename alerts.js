class DisasterAlerts {
    constructor(weatherApp) {
        this.weatherApp = weatherApp;
        this.alerts = [];
    }

    async checkForAlerts(city) {
        try {
            console.log('🔍 Checking alerts for:', city);
            
            const response = await fetch(`${this.weatherApp.baseUrl}/comprehensive-alerts/${city}`);
            const result = await response.json();
            
            console.log('📡 Alerts API response:', result);
            
            if (result.success && result.alerts && result.alerts.length > 0) {
                this.alerts = result.alerts;
                this.displayAlerts();
                this.showCriticalAlerts();
            } else {
                this.hideAlerts();
            }
        } catch (error) {
            console.error('❌ Alert check failed:', error);
            this.hideAlerts();
        }
    }

    displayAlerts() {
        const alertsElement = document.getElementById('alerts');
        const container = document.getElementById('alertsContainer');
        
        if (!alertsElement || !container) {
            console.log('❌ Alert HTML elements not found');
            return;
        }
        
        alertsElement.classList.remove('d-none');
        
        let alertsHTML = '';
        this.alerts.forEach(alert => {
            const severityClass = `alert-${alert.severity.toLowerCase()}`;
            const icon = this.getAlertIcon(alert.type);
            
            alertsHTML += `
                <div class="alert-item ${severityClass}">
                    <div class="d-flex align-items-center">
                        <div class="alert-icon">${icon}</div>
                        <div class="flex-grow-1">
                            <h6 class="mb-1 fw-bold">${alert.type}</h6>
                            <p class="mb-1">${alert.description}</p>
                            <small class="text-muted">
                                🕒 ${new Date(alert.time).toLocaleString()} | 📍 Source: ${alert.source}
                            </small>
                        </div>
                        <span class="alert-badge bg-${this.getSeverityColor(alert.severity)}">
                            ${alert.severity}
                        </span>
                    </div>
                    <div class="mt-2 p-2 bg-light rounded">
                        <strong>🛡️ Safety Advice:</strong> ${alert.advice}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = alertsHTML;
        console.log('✅ Alerts displayed:', this.alerts.length);
    }

    showCriticalAlerts() {
        const criticalAlerts = this.alerts.filter(alert => alert.severity === 'High');
        
        if (criticalAlerts.length > 0) {
            console.log('🚨 Critical alerts found:', criticalAlerts);
            
            // Show browser notification if available
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🚨 Weather Alert!', {
                    body: `${criticalAlerts[0].type}: ${criticalAlerts[0].description}`,
                    icon: '/favicon.ico'
                });
            }
        }
    }

    getAlertIcon(alertType) {
        const icons = {
            'Thunderstorm': '⛈️',
            'High Winds': '💨',
            'Heat Wave': '🔥',
            'Extreme Cold': '🥶',
            'Heavy Rain': '🌧️',
            'Flood': '🌊',
            'Tornado': '🌪️',
            'Hurricane': '🌀'
        };
        return icons[alertType] || '⚠️';
    }

    getSeverityColor(severity) {
        const colors = {
            'High': 'danger',
            'Medium': 'warning',
            'Low': 'info'
        };
        return colors[severity] || 'secondary';
    }

    hideAlerts() {
        const alertsElement = document.getElementById('alerts');
        if (alertsElement) {
            alertsElement.classList.add('d-none');
        }
    }
}

// Global function for reminder setting
function setReminder() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                alert('🔔 Reminders enabled! You will receive notifications for severe weather.');
            } else {
                alert('❌ Notifications blocked. Please enable them in browser settings.');
            }
        });
    } else {
        alert('❌ Browser notifications not supported.');
    }
}