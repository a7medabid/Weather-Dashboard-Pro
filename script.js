async function getLiveWeather() {
    const lat = 31.04; const lon = 31.38; 
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m,surface_pressure,cloud_cover&daily=weathercode,temperature_2m_max&timezone=auto`);
        const data = await response.json();
        const weather = data.current_weather;

        document.getElementById('result-temp').innerText = Math.round(weather.temperature) + "°C";
        document.getElementById('stat-wind').innerHTML = Math.round(weather.windspeed) + " <span>km/h</span>";
        document.getElementById('stat-hum').innerHTML = data.hourly.relative_humidity_2m[0] + "<span>%</span>";
        document.getElementById('stat-press').innerHTML = Math.round(data.hourly.surface_pressure[0]) + " <span>hPa</span>";

        updateUI(weather.weathercode, weather.is_day);

        updateForecastUI(data.daily);

    } catch (e) { console.log("Live weather error"); }
}

async function getPrediction() {
    const data = {
        temperature: document.getElementById('temp_input').value || 0,
        humidity: document.getElementById('hum_input').value || 0,
        wind_speed: document.getElementById('wind_input').value || 0,
        precipitation: document.getElementById('precip_input').value || 0,
        cloud_cover: document.getElementById('cloud_input').value || 0,
        pressure: document.getElementById('press_input').value || 0
    };
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.status === "success") {
            document.getElementById('result-temp').innerText = data.temperature + "°C";
            document.getElementById('result-text').innerText = result.result;
            document.getElementById('result-conf').innerText = "AI Confidence: " + result.confidence + "%";
            
            document.getElementById('stat-wind').innerHTML = data.wind_speed + " <span>km/h</span>";
            document.getElementById('stat-hum').innerHTML = data.humidity + "<span>%</span>";
            document.getElementById('stat-precip').innerHTML = data.precipitation + " <span>%</span>";
            document.getElementById('stat-press').innerHTML = data.pressure + " <span>hPa</span>";
            
            let aiResultText = result.result.toLowerCase();
            let simulatedCode = 0; 
            
            if (aiResultText.includes("cloud")) simulatedCode = 3;
            else if (aiResultText.includes("rain") || aiResultText.includes("drizzle")) simulatedCode = 61;
            else if (aiResultText.includes("hurricane")) simulatedCode = 99; // للإعصار
            else if (aiResultText.includes("storm") || aiResultText.includes("thunder")) simulatedCode = 95;
            else if (aiResultText.includes("snow")) simulatedCode = 71;

            let currentHour = new Date().getHours();
            let isDay = (currentHour >= 6 && currentHour < 18) ? 1 : 0; 
            
            updateUI(simulatedCode, isDay);
        }
    } catch (e) { alert("Server error!"); }
}

function updateUI(weatherCode, isDay) {
    const body = document.body;
    const icon = document.getElementById('result-icon');
    
   
    body.className = ''; 

    if (weatherCode === 0) {
        if (isDay === 1) {
            body.classList.add('sunny-bg');
            icon.className = "fas fa-sun";
        } else {
            body.classList.add('clear-night-bg');
            icon.className = "fas fa-moon";
        }
    } 
    
    else if (weatherCode >= 1 && weatherCode <= 3) {
        if (isDay === 1) {
            body.classList.add('cloudy-day-bg');
            icon.className = "fas fa-cloud-sun";
        } else {
            body.classList.add('cloudy-night-bg');
            icon.className = "fas fa-cloud-moon";
        }
    } 
    
    else if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
        body.classList.add('rainy-bg');
        icon.className = "fas fa-cloud-rain";
    } 
    
    else if (weatherCode === 99) { 
        body.classList.add('hurricane-bg');
        icon.className = "fas fa-hurricane";
    }
    
    else if (weatherCode >= 95 && weatherCode <= 98) {
        body.classList.add('stormy-bg');
        icon.className = "fas fa-poo-storm";
    } 
    
    else if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode >= 85) {
        body.classList.add('snow-bg');
        icon.className = "fas fa-snowflake";
    } 
   
    else {
        body.classList.add('cloudy-day-bg');
        icon.className = "fas fa-cloud";
    }
}

function updateForecastUI(dailyData) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayElements = document.querySelectorAll('.f-day'); 

    for (let i = 0; i < 5; i++) {
        let dateObj = new Date(dailyData.time[i]); 
        let dayName = i === 0 ? "Today" : days[dateObj.getDay()]; 
        let maxTemp = Math.round(dailyData.temperature_2m_max[i]); 
        let iconClass = getWeatherIcon(dailyData.weathercode[i]); 

        dayElements[i].innerHTML = `<span>${dayName}</span><i class="${iconClass}"></i> ${maxTemp}°`;
    }
}

function getWeatherIcon(code) {
    if (code === 0) return "fas fa-sun"; 
    if (code > 0 && code <= 3) return "fas fa-cloud-sun"; 
    if (code >= 51 && code <= 67) return "fas fa-cloud-rain"; 
    if (code >= 71 && code <= 86) return "fas fa-snowflake"; 
    if (code >= 95) return "fas fa-bolt"; 
    return "fas fa-cloud"; 
}

window.onload = getLiveWeather;