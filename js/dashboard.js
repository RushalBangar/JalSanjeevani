// Sinnar Taluka, Maharashtra coordinates
const MAP_CENTER = [19.8450, 74.0000];
const MAP_ZOOM = 11;

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Map
  const map = L.map('map', {
    zoomControl: false // Move zoom control if needed
  }).setView(MAP_CENTER, MAP_ZOOM);

  // Add Zoom control to top right
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Dark mode basemap (CartoDB Dark Matter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // 2. Mock Data for Villages (Scarcity Heatmap)
  // Red = Critical (< 24h water), Yellow = Warning (< 7 days), Green = Safe
  const villages = [
    { name: "Pangari", coords: [19.85, 73.95], status: "critical", population: 2400, cattle: 800 },
    { name: "Wadgaon", coords: [19.81, 74.05], status: "warning", population: 1500, cattle: 450 },
    { name: "Khopadi", coords: [19.90, 74.10], status: "critical", population: 3200, cattle: 1200 },
    { name: "Nandur", coords: [19.78, 73.90], status: "safe", population: 4100, cattle: 1500 }
  ];

  // Render Village Markers (Circles)
  villages.forEach(v => {
    let color = v.status === "critical" ? "#ef4444" : v.status === "warning" ? "#f59e0b" : "#22c55e";
    
    L.circle(v.coords, {
      color: color,
      fillColor: color,
      fillOpacity: 0.4,
      radius: 1200 // 1.2km radius for visual effect
    }).bindPopup(`
      <h4>${v.name} Village</h4>
      <p>Status: <strong style="color:${color}">${v.status.toUpperCase()}</strong></p>
      <p>Pop: ${v.population} | Cattle: ${v.cattle}</p>
      <p>Req: ${(v.population * 40 + v.cattle * 70).toLocaleString()} L/day</p>
    `).addTo(map);
  });

  // 3. Mock Tanker Fleet Tracking
  // Tanker 07 has deviated
  const tankerIcon = L.divIcon({
    className: 'custom-tanker-icon',
    html: `<div style="background:#0ea5e9; border:2px solid #fff; border-radius:50%; width:16px; height:16px; box-shadow:0 0 10px #0ea5e9;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  const rogueTankerIcon = L.divIcon({
    className: 'custom-tanker-icon',
    html: `<div style="background:#ef4444; border:2px solid #fff; border-radius:50%; width:16px; height:16px; box-shadow:0 0 15px #ef4444; animation: pulse 1s infinite alternate;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  L.marker([19.83, 73.98], {icon: tankerIcon}).bindPopup("Tanker #12 (On Route)").addTo(map);
  L.marker([19.88, 74.02], {icon: tankerIcon}).bindPopup("Tanker #04 (On Route)").addTo(map);
  
  // Rogue tanker
  const rogueTanker = L.marker([19.75, 74.15], {icon: rogueTankerIcon}).bindPopup("<b>ALERT: Tanker #07</b><br>Off Route!").addTo(map);
  rogueTanker.openPopup();

  // 4. Simulate Emergency Allocation Action
  const btnAllocate = document.getElementById("btnAllocate");
  btnAllocate.addEventListener("click", () => {
    btnAllocate.innerHTML = "Computing OR-Tools Matrix...";
    btnAllocate.style.opacity = "0.7";
    btnAllocate.disabled = true;

    // Simulate backend solver delay
    setTimeout(() => {
      // Draw a simulated route line
      const routeCoords = [
        [19.83, 73.98], // Tanker #12
        [19.85, 73.95], // Pangari
        [19.90, 74.10]  // Khopadi
      ];
      
      L.polyline(routeCoords, {
        color: '#0ea5e9',
        weight: 3,
        dashArray: '5, 10',
        lineCap: 'square'
      }).addTo(map);

      btnAllocate.innerHTML = "Dispatch Sent ✓";
      btnAllocate.classList.remove("btn-primary");
      btnAllocate.style.background = "#22c55e";
      btnAllocate.style.opacity = "1";
    }, 1500);
  });
});

// Add a quick pulse animation for the rogue tanker marker in JS
const style = document.createElement('style');
style.innerHTML = `
  @keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 0 5px #ef4444; }
    100% { transform: scale(1.5); box-shadow: 0 0 20px #ef4444; }
  }
`;
document.head.appendChild(style);
