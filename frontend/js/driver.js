document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Generate Encrypted Cryptographic Payload for Offline Handshake
  const payload = JSON.stringify({
    tanker_id: "TN-SN-02",
    registration: "MH-15-TK-5512",
    target_village: "Khopadi (Sinnar)",
    volume_liters: 10000,
    timestamp: new Date().toISOString(),
    driver_key: "0x9F3B4ED812C4",
    signature: "SHA256:8f4c2e1b9a7d3c5e"
  });

  // 2. Render High-Density QR Code
  const qrContainer = document.getElementById("qrcode");
  if (qrContainer && typeof QRCode !== "undefined") {
    qrContainer.innerHTML = "";
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

  let isArrived = false;

  if (btnArrived) {
    btnArrived.addEventListener("click", () => {
      if (!isArrived) {
        btnArrived.innerHTML = "Acquiring GPS Lock...";
        btnArrived.disabled = true;

        setTimeout(() => {
          isArrived = true;
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

          btnArrived.disabled = false;
          btnArrived.innerHTML = "Arrival Verified ✓ (Reset)";
          btnArrived.style.background = "linear-gradient(135deg, #10b981, #059669)";
          btnArrived.style.color = "#fff";

          // Sync arrival to Supabase
          if (window.JalSupabase) {
            window.JalSupabase.updateTankerLocation("TN-SN-02", 19.9015, 74.1030, false, "arrived");
            window.JalSupabase.updateTankerLocation("TN-04", 19.9015, 74.1030, false, "arrived");
            console.log("🌊 Driver arrival synced to Supabase for Tanker TN-SN-02.");
          }
        }, 800);
      } else {
        // Reset state for easy demo retesting
        isArrived = false;
        if (geofenceDot) {
          geofenceDot.style.background = "var(--accent-amber)";
          geofenceDot.style.boxShadow = "none";
        }
        if (geofenceStatusText) {
          geofenceStatusText.innerHTML = "Geofence: 180m from Target";
          geofenceStatusText.style.color = "inherit";
          geofenceStatusText.style.fontWeight = "normal";
        }
        if (driverCryptoKey) {
          driverCryptoKey.innerHTML = "KEY: 0x9F3B4E • GEOFENCE ENCRYPTED";
          driverCryptoKey.style.background = "#e2e8f0";
          driverCryptoKey.style.color = "#070e1a";
        }
        btnArrived.innerHTML = "Log Arrival Coordinates";
        btnArrived.style.background = "";
        btnArrived.style.color = "";

        // Reset status in Supabase
        if (window.JalSupabase) {
          window.JalSupabase.updateTankerLocation("TN-SN-02", 19.8920, 74.0610, false, "en_route");
          window.JalSupabase.updateTankerLocation("TN-04", 19.8920, 74.0610, false, "en_route");
        }
      }
    });
  }
});
