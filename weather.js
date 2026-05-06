// API Configuration
const API_KEY = 'b6fd43b8f86e4c6ea593374ca2521513'; // Free tier OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const errorMessage = document.getElementById('errorMessage');
const loadingSpinner = document.getElementById('loadingSpinner');
const weatherContent = document.getElementById('weatherContent');

// Event Listeners
searchBtn.addEventListener('click', searchWeather);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});
locationBtn.addEventListener('click', getLocationWeather);

// Search Weather by City
function searchWeather() {
    const city = searchInput.value.trim();
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    fetchWeatherData(city);
}

// Get Weather by Current Location
function getLocationWeather() {
    if (navigator.geolocation) {
        showLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                showError('Unable to access your location: ' + error.message);
                showLoading(false);
            }
        );
    } else {
        showError('Geolocation is not supported by your browser');
    }
}

// Fetch Weather Data
async function fetchWeatherData(city) {
    showLoading(true);
    clearError();
    try {
        const response = await fetch(
            `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        if (!response.ok) {
            throw new Error('City not found');
        }
        const data = await response.json();
        displayCurrentWeather(data);
        fetchForecastData(data.coord.lat, data.coord.lon);
        fetchUVIndex(data.coord.lat, data.coord.lon);
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// Fetch Weather by Coordinates
async function fetchWeatherByCoords(lat, lon) {
    showLoading(true);
    clearError();
    try {
        const response = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const data = await response.json();
        displayCurrentWeather(data);
        fetchForecastData(lat, lon);
        fetchUVIndex(lat, lon);
    } catch (error) {
        showError('Unable to fetch weather data');
    } finally {
        showLoading(false);
    }
}

// Fetch 5-Day Forecast
async function fetchForecastData(lat, lon) {
    try {
        const response = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const data = await response.json();
        displayForecast(data.list);
    } catch (error) {
        console.error('Error fetching forecast:', error);
    }
}

// Fetch UV Index
async function fetchUVIndex(lat, lon) {
    try {
        const response = await fetch(
            `${BASE_URL}/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );
        const data = await response.json();
        document.getElementById('uvIndex').textContent = Math.round(data.value);
    } catch (error) {
        console.error('Error fetching UV index:', error);
    }
}

// Display Current Weather
function displayCurrentWeather(data) {
    const { name, sys, main, weather, wind, clouds, visibility } = data;
    
    // City and Date
    document.getElementById('cityName').textContent = `${name}, ${sys.country}`;
    document.getElementById('dateTime').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Temperature and Weather
    document.getElementById('temperature').textContent = Math.round(main.temp) + '°C';
    document.getElementById('weatherIcon').src = getWeatherIcon(weather[0].icon);
    document.getElementById('weatherDescription').textContent = weather[0].description;

    // Weather Details
    document.getElementById('feelsLike').textContent = Math.round(main.feels_like) + '°C';
    document.getElementById('humidity').textContent = main.humidity + '%';
    document.getElementById('windSpeed').textContent = (wind.speed * 3.6).toFixed(1) + ' km/h';
    document.getElementById('pressure').textContent = main.pressure + ' hPa';
    document.getElementById('visibility').textContent = (visibility / 1000).toFixed(1) + ' km';

    // Sunrise and Sunset
    const sunrise = new Date(sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const sunset = new Date(sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('sunrise').textContent = sunrise;
    document.getElementById('sunset').textContent = sunset;

    // Day Length
    const dayLength = ((sys.sunset - sys.sunrise) / 3600).toFixed(1);
    document.getElementById('dayLength').textContent = dayLength + ' hours';

    // Show weather content
    weatherContent.style.display = 'block';
}

// Display 5-Day Forecast
function displayForecast(forecastList) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';

    // Get forecast for every 8th item (24-hour intervals)
    const dailyForecasts = forecastList.filter((_, index) => index % 8 === 0).slice(0, 5);

    dailyForecasts.forEach((forecast) => {
        const date = new Date(forecast.dt * 1000);
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="forecast-day">${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            <img src="${getWeatherIcon(forecast.weather[0].icon)}" class="forecast-icon" alt="${forecast.weather[0].description}">
            <div class="forecast-temp">${Math.round(forecast.main.temp)}°C</div>
            <div class="forecast-desc">${forecast.weather[0].main}</div>
        `;
        forecastContainer.appendChild(card);
    });
}

// Get Weather Icon URL
function getWeatherIcon(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
}

// Utility Functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

function clearError() {
    errorMessage.textContent = '';
    errorMessage.classList.remove('show');
}

function showLoading(show) {
    loadingSpinner.classList.toggle('show', show);
}

// Initialize - Load default city
window.addEventListener('load', () => {
    fetchWeatherData('London');
});