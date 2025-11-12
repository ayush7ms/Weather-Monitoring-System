const express = require('express');
const axios = require('axios');
const router = express.Router();

const OWM_API_KEY = process.env.API_KEY;
const WEATHERAPI_KEY = process.env.WEATHERAPI_KEY;

// Helper function to convert WeatherAPI severity to standard levels
function getSeverityLevel(severity) {
    const severityMap = {
        'Extreme': 'High',
        'Severe': 'High',
        'Moderate': 'Medium',
        'Minor': 'Low'
    };
    return severityMap[severity] || 'Medium';
}

// Helper function to analyze OpenWeatherMap data for potential disasters
function analyzeWeatherForAlerts(weatherData) {
    const alerts = [];
    
    weatherData.list.forEach((period) => {
        const condition = period.weather[0].main;
        const tempKelvin = period.main.temp;
        const tempCelsius = tempKelvin - 273.15; // Convert from Kelvin to Celsius
        const windSpeed = period.wind.speed;
        const description = period.weather[0].description;
        
        // Thunderstorm detection
        if (condition === 'Thunderstorm') {
            alerts.push({
                type: 'Thunderstorm',
                severity: windSpeed > 15 ? 'High' : 'Medium',
                time: new Date(period.dt * 1000),
                description: `Thunderstorm: ${description}`,
                advice: 'Stay indoors, avoid using electrical appliances, and stay away from windows.',
                certainty: 'Detected',
                source: 'OpenWeatherMap Analysis'
            });
        }
        
        // High wind detection
        if (windSpeed > 10) {
            alerts.push({
                type: 'High Winds',
                severity: windSpeed > 15 ? 'High' : 'Medium',
                time: new Date(period.dt * 1000),
                description: `Strong winds: ${windSpeed} m/s`,
                advice: 'Secure outdoor objects and avoid wooded areas.',
                certainty: 'Detected',
                source: 'OpenWeatherMap Analysis'
            });
        }
        
        // Extreme temperature detection (using Celsius)
        if (tempCelsius > 35) {
            alerts.push({
                type: 'Heat Wave',
                severity: 'Medium',
                time: new Date(period.dt * 1000),
                description: `Extreme heat: ${Math.round(tempCelsius)}°C`,
                advice: 'Stay hydrated, avoid prolonged sun exposure, and check on vulnerable people.',
                certainty: 'Detected',
                source: 'OpenWeatherMap Analysis'
            });
        }
        
        if (tempCelsius < -10) {
            alerts.push({
                type: 'Extreme Cold',
                severity: 'Medium',
                time: new Date(period.dt * 1000),
                description: `Extreme cold: ${Math.round(tempCelsius)}°C`,
                advice: 'Dress warmly, limit time outdoors, and protect pipes from freezing.',
                certainty: 'Detected',
                source: 'OpenWeatherMap Analysis'
            });
        }
        
        // Heavy rain detection
        if (condition === 'Rain' && period.rain && period.rain['3h'] > 10) {
            alerts.push({
                type: 'Heavy Rain',
                severity: 'Medium',
                time: new Date(period.dt * 1000),
                description: `Heavy rainfall: ${period.rain['3h']}mm in 3 hours`,
                advice: 'Avoid flooded areas and monitor local warnings.',
                certainty: 'Detected',
                source: 'OpenWeatherMap Analysis'
            });
        }
    });
    
    return alerts;
}

// Helper function to remove duplicate alerts
function removeDuplicateAlerts(alerts) {
    const seen = new Set();
    return alerts
        .filter(alert => {
            const key = `${alert.type}-${alert.time.getTime()}-${alert.severity}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .sort((a, b) => {
            const severityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
}

// Get current weather by city name
router.get('/city/:cityName', async (req, res) => {
    try {
        const { cityName } = req.params;
        const units = req.query.units || 'metric';
        
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=${units}&appid=${OWM_API_KEY}`
        );
        
        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Weather API Error:', error.response?.data);
        res.status(500).json({
            success: false,
            error: error.response?.data?.message || 'Failed to fetch weather data'
        });
    }
});

// Get weather by coordinates
router.get('/coordinates', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        const units = req.query.units || 'metric';
        
        if (!lat || !lon) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required'
            });
        }

        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${OWM_API_KEY}`
        );
        
        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Weather API Error:', error.response?.data);
        res.status(500).json({
            success: false,
            error: error.response?.data?.message || 'Failed to fetch weather data'
        });
    }
});

// Get 5-day forecast
router.get('/forecast/:cityName', async (req, res) => {
    try {
        const { cityName } = req.params;
        const units = req.query.units || 'metric';
        
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&units=${units}&appid=${OWM_API_KEY}`
        );
        
        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Forecast API Error:', error.response?.data);
        res.status(500).json({
            success: false,
            error: error.response?.data?.message || 'Failed to fetch forecast data'
        });
    }
});

// WEATHERAPI.COM ALERTS ENDPOINT
router.get('/alerts/:cityName', async (req, res) => {
    try {
        const { cityName } = req.params;
        
        if (!WEATHERAPI_KEY) {
            return res.status(400).json({
                success: false,
                error: 'WeatherAPI key not configured'
            });
        }

        const response = await axios.get(
            `http://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${cityName}&days=3&alerts=yes`
        );
        
        const alerts = response.data.alerts?.alert || [];
        
        // Format alerts for frontend
        const formattedAlerts = alerts.map(alert => ({
            type: alert.event,
            severity: getSeverityLevel(alert.severity),
            time: new Date(alert.effective),
            description: alert.headline || alert.desc,
            advice: alert.instruction || 'Take necessary precautions and stay safe.',
            certainty: 'Official Alert',
            area: alert.areas,
            expires: new Date(alert.expires),
            source: 'WeatherAPI'
        }));
        
        res.json({
            success: true,
            alerts: formattedAlerts,
            source: 'WeatherAPI',
            total: formattedAlerts.length
        });
        
    } catch (error) {
        console.error('WeatherAPI Alerts Error:', error.response?.data);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch weather alerts'
        });
    }
});

// COMPREHENSIVE ALERTS (Combined OpenWeatherMap + WeatherAPI)
router.get('/comprehensive-alerts/:cityName', async (req, res) => {
    try {
        const { cityName } = req.params;
        const allAlerts = [];
        
        // 1. Get OpenWeatherMap data and analyze for potential issues
        try {
            const owmResponse = await axios.get(
                `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${OWM_API_KEY}`
            );
            const owmAlerts = analyzeWeatherForAlerts(owmResponse.data);
            allAlerts.push(...owmAlerts);
        } catch (owmError) {
            console.log('OpenWeatherMap analysis failed:', owmError.message);
        }
        
        // 2. Get official alerts from WeatherAPI
        if (WEATHERAPI_KEY) {
            try {
                const waResponse = await axios.get(
                    `http://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${cityName}&days=3&alerts=yes`
                );
                const waAlerts = waResponse.data.alerts?.alert || [];
                const formattedWaAlerts = waAlerts.map(alert => ({
                    type: alert.event,
                    severity: getSeverityLevel(alert.severity),
                    time: new Date(alert.effective),
                    description: alert.headline || alert.desc,
                    advice: alert.instruction || 'Take necessary precautions and stay safe.',
                    certainty: 'Official',
                    area: alert.areas,
                    expires: new Date(alert.expires),
                    source: 'WeatherAPI'
                }));
                allAlerts.push(...formattedWaAlerts);
            } catch (waError) {
                console.log('WeatherAPI alerts not available');
            }
        }
        
        // Remove duplicates and sort by severity
        const uniqueAlerts = removeDuplicateAlerts(allAlerts);
        
        res.json({
            success: true,
            alerts: uniqueAlerts,
            total: uniqueAlerts.length
        });
        
    } catch (error) {
        console.error('Comprehensive Alerts Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch comprehensive alerts'
        });
    }
});

module.exports = router;