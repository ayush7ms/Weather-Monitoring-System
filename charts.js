class WeatherCharts {
    constructor() {
        this.tempChart = null;
        this.humidityChart = null;
    }

    displayCharts(forecastData) {
        document.getElementById('charts').classList.remove('d-none');
        
        const dailyData = forecastData.list.filter((item, index) => index % 8 === 0);
        this.createTemperatureChart(dailyData);
        this.createHumidityChart(dailyData);
    }

    createTemperatureChart(data) {
        const ctx = document.getElementById('tempChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.tempChart) {
            this.tempChart.destroy();
        }

        const labels = data.map(item => {
            return new Date(item.dt * 1000).toLocaleDateString('en', { weekday: 'short' });
        });

        const temperatures = data.map(item => Math.round(item.main.temp));
        const minTemperatures = data.map(item => Math.round(item.main.temp_min));
        const maxTemperatures = data.map(item => Math.round(item.main.temp_max));

        this.tempChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Max Temp (°C)',
                        data: maxTemperatures,
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Avg Temp (°C)',
                        data: temperatures,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Min Temp (°C)',
                        data: minTemperatures,
                        borderColor: '#74b9ff',
                        backgroundColor: 'rgba(116, 185, 255, 0.1)',
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Temperature Forecast',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Temperature (°C)'
                        }
                    }
                }
            }
        });
    }

    createHumidityChart(data) {
        const ctx = document.getElementById('humidityChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.humidityChart) {
            this.humidityChart.destroy();
        }

        const labels = data.map(item => {
            return new Date(item.dt * 1000).toLocaleDateString('en', { weekday: 'short' });
        });

        const humidity = data.map(item => item.main.humidity);
        const feelsLike = data.map(item => Math.round(item.main.feels_like));

        this.humidityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Humidity (%)',
                        data: humidity,
                        backgroundColor: 'rgba(86, 204, 242, 0.7)',
                        borderColor: '#56ccf2',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Feels Like (°C)',
                        data: feelsLike,
                        type: 'line',
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.4,
                        fill: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Humidity & Feels Like',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Humidity (%)'
                        },
                        min: 0,
                        max: 100
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Feels Like (°C)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }
}

// Initialize charts globally
const weatherCharts = new WeatherCharts();