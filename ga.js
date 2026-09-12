document.addEventListener('DOMContentLoaded', () => {
  // Navigation Routing
  const navItems = document.querySelectorAll('.nav-item');
  const tabs = document.querySelectorAll('.tab-content');

  window.switchTab = (tabId) => {
    navItems.forEach(item => item.classList.toggle('active', item.dataset.tab === tabId));
    tabs.forEach(tab => tab.classList.toggle('active-tab', tab.id === tabId));

    if (tabId === 'live-map' && leafletMap) {
      setTimeout(() => leafletMap.invalidateSize(), 200);
    }
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

  // Clock
  setInterval(() => {
    document.getElementById('liveClock').innerText = new Date().toLocaleTimeString();
  }, 1000);

  // ---------------------------------------------------------------------------
  // DATA STORE
  // ---------------------------------------------------------------------------
  const zones = [
    { id: 'shillong', name: 'Shillong Zone', risk: 85, status: 'CRITICAL', rain: 86, moisture: 75, movement: 7.0, tilt: 3.5, coords: [25.5788, 91.8933], polygon: [[25.56, 91.87], [25.60, 91.88], [25.59, 91.92], [25.55, 91.90]] },
    { id: 'aizawl', name: 'Aizawl Sector', risk: 68, status: 'HIGH', rain: 64, moisture: 62, movement: 4.2, tilt: 2.1, coords: [23.7271, 92.7176], polygon: [[23.70, 92.70], [23.75, 92.71], [23.74, 92.74], [23.69, 92.73]] },
    { id: 'imphal', name: 'Imphal East', risk: 62, status: 'HIGH', rain: 58, moisture: 60, movement: 3.8, tilt: 1.8, coords: [24.8170, 93.9368], polygon: [[24.80, 93.91], [24.83, 93.92], [24.82, 93.96], [24.78, 93.94]] },
    { id: 'gangtok', name: 'Gangtok Ridge', risk: 45, status: 'MODERATE', rain: 30, moisture: 42, movement: 1.5, tilt: 0.9, coords: [27.3389, 88.6065], polygon: [[27.32, 88.59], [27.35, 88.60], [27.34, 88.62], [27.31, 88.61]] },
    { id: 'nagaon', name: 'Nagaon Lowlands', risk: 24, status: 'LOW', rain: 12, moisture: 30, movement: 0.2, tilt: 0.1, coords: [26.3452, 92.6840], polygon: [[26.32, 92.66], [26.36, 92.67], [26.35, 92.70], [26.31, 92.69]] }
  ];

  let selectedZone = zones[0];

  // Render Zone List Sidebar
  const zoneListContainer = document.getElementById('zoneListContainer');
  function buildZoneList() {
    zoneListContainer.innerHTML = '';
    zones.forEach(zone => {
      const row = document.createElement('div');
      row.className = 'zone-row';
      row.innerHTML = `
        <div>
          <strong>${zone.name}</strong><br>
          <small class="sub-text">UPDATE</small>
        </div>
        <span class="badge badge-${zone.status.toLowerCase()}">${zone.status} - ${zone.risk}</span>
      `;
      row.addEventListener('click', () => updateActiveZone(zone));
      zoneListContainer.appendChild(row);
    });
  }
  buildZoneList();

  function updateActiveZone(zone) {
    selectedZone = zone;

    // Update Dashboard Metrics
    document.getElementById('zoneNameText').innerText = zone.name;
    document.getElementById('riskScoreVal').innerText = zone.risk;
    document.getElementById('statRain').innerHTML = `${zone.rain} <small>mm</small>`;
    document.getElementById('statMoisture').innerHTML = `${zone.moisture} <small>%</small>`;
    document.getElementById('statMovement').innerHTML = `${zone.movement} <small>mm</small>`;

    // Alert Message Voice Content Update
    const msg = `Attention: ${zone.name} is currently under ${zone.status} landslide risk with an index of ${zone.risk} out of 100. Recorded rainfall is ${zone.rain} millimeters.`;
    document.getElementById('bannerMessage').innerText = msg;

    // Map Details Update
    document.getElementById('mapZoneTitle').innerText = zone.name;
    document.getElementById('mapRiskScore').innerText = zone.risk;
    document.getElementById('mapStatus').innerText = zone.status;
    document.getElementById('mapRain').innerText = `${zone.rain} mm`;
    document.getElementById('mapMoisture').innerText = `${zone.moisture} %`;
    document.getElementById('mapMovement').innerText = `${zone.movement} mm`;
    document.getElementById('mapTilt').innerText = `${zone.tilt}°`;
  }

  // ---------------------------------------------------------------------------
  // VOICE MESSAGE (SPEECH SYNTHESIS)
  // ---------------------------------------------------------------------------
  const synth = window.speechSynthesis;
  let isSpeaking = false;

  function speakMessage() {
    const alertBtn = document.getElementById('voiceAlertBtn');
    
    if (isSpeaking) {
      synth.cancel();
      isSpeaking = false;
      alertBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> Voice Alert`;
      return;
    }

    const lang = document.getElementById('languageSelect').value;
    const alertText = document.getElementById('bannerMessage').innerText;

    const speech = new SpeechSynthesisUtterance(alertText);
    speech.lang = lang;
    speech.rate = 0.9;

    speech.onend = () => {
      isSpeaking = false;
      alertBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> Voice Alert`;
    };

    synth.speak(speech);
    isSpeaking = true;
    alertBtn.innerHTML = `<i class="fa-solid fa-square"></i> Stop Reading`;
  }

  document.getElementById('voiceAlertBtn').addEventListener('click', speakMessage);
  document.getElementById('mapVoiceBtn').addEventListener('click', speakMessage);

  // ---------------------------------------------------------------------------
  // LEAFLET MAP & POLYGONS INTEGRATION
  // ---------------------------------------------------------------------------
  const leafletMap = L.map('map').setView([25.5788, 91.8933], 7);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
  }).addTo(leafletMap);

  function getZoneColor(status) {
    if (status === 'CRITICAL') return '#ef4444';
    if (status === 'HIGH') return '#f97316';
    if (status === 'MODERATE') return '#eab308';
    return '#22c55e';
  }

  zones.forEach(zone => {
    const color = getZoneColor(zone.status);

    // Color Polygons
    const poly = L.polygon(zone.polygon, {
      color: color,
      fillColor: color,
      fillOpacity: 0.5,
      weight: 2
    }).addTo(leafletMap);

    // Marker inside Polygon
    const marker = L.circleMarker(zone.coords, {
      radius: 8,
      fillColor: color,
      color: '#ffffff',
      weight: 2,
      fillOpacity: 0.9
    }).addTo(leafletMap);

    const clickAction = () => {
      updateActiveZone(zone);
      leafletMap.panTo(zone.coords);
    };

    poly.on('click', clickAction);
    marker.on('click', clickAction);
  });

  // ---------------------------------------------------------------------------
  // CHART.JS INTEGRATION
  // ---------------------------------------------------------------------------
  const ctx = document.getElementById('sensorChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['7:30 PM', '7:31 PM', '7:32 PM', '7:33 PM', '7:34 PM', '7:35 PM'],
      datasets: [
        { label: 'Rainfall (mm)', data: [80, 82, 85, 86, 88, 92], borderColor: '#0284c7', tension: 0.3 },
        { label: 'Soil Moisture (%)', data: [70, 71, 73, 75, 78, 80], borderColor: '#8b5cf6', tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
});