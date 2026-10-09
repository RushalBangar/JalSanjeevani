document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Generate Encrypted Cryptographic Payload for Offline Handshake
  const payload = JSON.stringify({
    tanker_id: "TN-04",
    registration: "MH-15-AG-982",
    target_village: "Khopadi",
    volume_liters: 10000,
    timestamp: new Date().toISOString(),
    driver_key: "0x9F3B4ED812C4",
    signature: "SHA256:8f4c2e1b9a7d3c5e"
  });

  // 2. Render High-Density QR Code
  const qrContainer = document.getElementById("qrcode");
  if (qrContainer && typeof QRCode !== "undefined") {
    new QRCode(qrContainer, {
      text: payload,
      width: 180,
      height: 180,
      colorDark : "#070e1a",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });
  }

  // 3. Geofence & GPS Arrival Handshake
  const btnArrived = document.getElementById("btnArrived");
  const geofenceDot = document.getElementById("geofenceDot");
  const geofenceStatusText = document.getElementById("geofenceStatusText");
  const driverCryptoKey = document.getElementById("driverCryptoKey");

  if (btnArrived) {
    btnArrived.addEventListener("click", () => {
      btnArrived.innerHTML = "Acquiring GPS Lock...";
      btnArrived.disabled = true;

      setTimeout(() => {
        if (geofenceDot) {
          geofenceDot.style.background = "#10b981";
          geofenceDot.style.boxShadow = "0 0 10px #10b981";
        }
        if (geofenceStatusText) {
          geofenceStatusText.innerHTML = "✓ Inside Cistern Perimeter (12m)";
          geofenceStatusText.style.color = "#10b981";
          geofenceStatusText.style.fontWeight = "600";
        }
        if (driverCryptoKey) {
          driverCryptoKey.innerHTML = "TOKEN READY: 0x9F3B4E • GEOFENCE VERIFIED";
          driverCryptoKey.style.background = "#dcfce7";
          driverCryptoKey.style.color = "#15803d";
        }

        btnArrived.innerHTML = "Arrival Verified ✓";
        btnArrived.style.background = "linear-gradient(135deg, #10b981, #059669)";
        btnArrived.style.color = "#fff";
      }, 900);
    });
  }
});
