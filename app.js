class WeatherApp {
    constructor() {
        this.baseUrl = 'http://localhost:3000/api/weather';
        this.currentUnit = 'metric';
        // ADD THIS LINE for disaster alerts
        this.alertsSystem = new DisasterAlerts(this);
        this.init();
    }

    init() {
        document.getElementById('searchBtn').addEventListener('click', () => this.searchWeather());
        document.getElementById('cityInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchWeather();
        });
        document.getElementById('locationBtn').addEventListener('click', () => this.getLocationWeather());
        document.getElementById('unitC').addEventListener('click', () => this.switchUnit('metric'));
        document.getElementById('unitF').addEventListener('click', () => this.switchUnit('imperial'));
        
        // Load default city weather
        this.getWeatherByCity('London');
    }

    async getWeatherByCity(city) {
        this.showLoading(true);
        try {
            const response = await fetch(`${this.baseUrl}/city/${city}?units=${this.currentUnit}`);
            
            if (!response.ok) throw new Error('City not found');
            
            const result = await response.json();
            
            if (result.success) {
                this.displayCurrentWeather(result.data);
                await this.getForecast(city);
                // to check for disaster alerts
                await this.alertsSystem.checkForAlerts(city);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async getWeatherByCoords(lat, lon) {
        this.showLoading(true);
        try {
            const response = await fetch(
                `${this.baseUrl}/coordinates?lat=${lat}&lon=${lon}&units=${this.currentUnit}`
            );
            
            if (!response.ok) throw new Error('Location not found');
            
            const result = await response.json();
            
            if (result.success) {
                this.displayCurrentWeather(result.data);
                await this.getForecast(result.data.name);
                //  to check for disaster alerts
                await this.alertsSystem.checkForAlerts(result.data.name);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async getForecast(city) {
        try {
            const response = await fetch(`${this.baseUrl}/forecast/${city}?units=${this.currentUnit}`);
            const result = await response.json();
            
            if (result.success) {
                this.displayForecast(result.data);
                if (typeof weatherCharts !== 'undefined') {
                    weatherCharts.displayCharts(result.data);
                }
            }
        } catch (error) {
            console.error('Forecast error:', error);
        }
    }

    //  to update background based on weather
    updateWeatherBackground(weatherData) {
        const weatherMain = weatherData.weather[0].main.toLowerCase();
        const body = document.body;
        
        // to Remove all weather background classes
        body.classList.remove(
            'weather-bg-clear', 'weather-bg-clouds', 'weather-bg-rain',
            'weather-bg-thunderstorm', 'weather-bg-snow', 'weather-bg-mist',
            'weather-bg-default'
        );
        
        // Add appropriate background class
        switch(weatherMain) {
            case 'clear':
                body.classList.add('weather-bg-clear');
                break;
            case 'clouds':
                body.classList.add('weather-bg-clouds');
                break;
            case 'rain':
            case 'drizzle':
                body.classList.add('weather-bg-rain');
                break;
            case 'thunderstorm':
                body.classList.add('weather-bg-thunderstorm');
                break;
            case 'snow':
                body.classList.add('weather-bg-snow');
                break;
            case 'mist':
            case 'fog':
            case 'haze':
                body.classList.add('weather-bg-mist');
                break;
            default:
                body.classList.add('weather-bg-default');
        }
    }

    // Enhanced method with weather icons
    getWeatherIcon(weatherMain, isDay = true) {
        const icons = {
            'Clear': isDay ? '☀️' : '🌙',
            'Clouds': isDay ? '⛅' : '☁️',
            'Rain': '🌧️',
            'Drizzle': '🌦️',
            'Thunderstorm': '⛈️',
            'Snow': '❄️',
            'Mist': '🌫️',
            'Fog': '🌫️',
            'Haze': '🌫️'
        };
        return icons[weatherMain] || '🌈';
    }

    // Enhanced current weather display
    displayCurrentWeather(data) {
        document.getElementById('currentWeather').classList.remove('d-none');
        
        const isDay = data.weather[0].icon.includes('d');
        const weatherIcon = this.getWeatherIcon(data.weather[0].main, isDay);
        
        // Update background based on weather
        this.updateWeatherBackground(data);
        
        document.getElementById('currentWeatherIcon').textContent = weatherIcon;
        document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
        document.getElementById('currentTemp').textContent = `${Math.round(data.main.temp)}°${this.currentUnit === 'metric' ? 'C' : 'F'}`;
        document.getElementById('weatherDesc').textContent = data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        document.getElementById('windSpeed').textContent = `${data.wind.speed} ${this.currentUnit === 'metric' ? 'm/s' : 'mph'}`;
        document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
        document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°${this.currentUnit === 'metric' ? 'C' : 'F'}`;
        
        document.getElementById('error').classList.add('d-none');
    }

    // Enhanced forecast display
    displayForecast(data) {
        const forecastElement = document.getElementById('forecast');
        forecastElement.classList.remove('d-none');
        
        const dailyForecasts = data.list.filter((item, index) => index % 8 === 0);
        const forecastContainer = document.getElementById('forecastContainer');
        
        let forecastHTML = '';
        
        dailyForecasts.forEach(day => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString('en', { weekday: 'short' });
            const isDay = day.weather[0].icon.includes('d');
            const weatherIcon = this.getWeatherIcon(day.weather[0].main, isDay);
            
            forecastHTML += `
                <div class="col">
                    <div class="forecast-day">
                        <h6 class="fw-bold">${dayName}</h6>
                        <div class="forecast-icon">${weatherIcon}</div>
                        <div class="forecast-temp">${Math.round(day.main.temp)}°</div>
                        <small class="text-muted">${day.weather[0].description}</small>
                    </div>
                </div>
            `;
        });
        
        forecastContainer.innerHTML = forecastHTML;
    }

    searchWeather() {
        const city = document.getElementById('cityInput').value.trim();
        if (city) {
            this.getWeatherByCity(city);
        }
    }

    getLocationWeather() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    this.getWeatherByCoords(latitude, longitude);
                },
                (error) => {
                    this.showError('Geolocation failed: ' + error.message);
                }
            );
        } else {
            this.showError('Geolocation is not supported by this browser.');
        }
    }

    switchUnit(unit) {
        this.currentUnit = unit;
        
        document.getElementById('unitC').classList.toggle('active', unit === 'metric');
        document.getElementById('unitF').classList.toggle('active', unit === 'imperial');
        
        const currentCity = document.getElementById('cityName').textContent.split(',')[0];
        if (currentCity) {
            this.getWeatherByCity(currentCity);
        }
    }

    showLoading(show) {
        document.getElementById('loading').classList.toggle('d-none', !show);
    }

    showError(message) {
        const errorElement = document.getElementById('error');
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorElement.classList.remove('d-none');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});