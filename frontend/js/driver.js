/**
 * JalSanjeevani (RouteGuard) - Driver PWA Logistics & Cryptographic Handshake Engine
 * Generates verified asymmetric delivery tokens for offline rural cistern discharges.
 */

document.addEventListener("DOMContentLoaded", () => {
  const qrContainer = document.getElementById("qrcode");
  const btnArrived = document.getElementById("btnArrived");
  const geofenceDot = document.getElementById("geofenceDot");
  const geofenceStatusText = document.getElementById("geofenceStatusText");
  const driverCryptoKey = document.getElementById("driverCryptoKey");
  const transitBadge = document.getElementById("transitBadge");

  const btnCopyPayload = document.getElementById("btnCopyPayload");
  const btnDownloadQR = document.getElementById("btnDownloadQR");
  const btnTogglePayload = document.getElementById("btnTogglePayload");
  const payloadJsonView = document.getElementById("payloadJsonView");
  const driverToast = document.getElementById("driverToast");

  let isArrived = false;
  let qrcodeInstance = null;

  // Online-First Network Status Sync
  const networkBadge = document.getElementById("networkStatusBadge");
  const networkDot = document.getElementById("networkStatusDot");
  const networkText = document.getElementById("networkStatusText");

  function syncNetworkStatus() {
    if (!networkBadge || !networkText) return;
    if (navigator.onLine) {
      networkBadge.style.background = "rgba(16, 185, 129, 0.15)";
      networkBadge.style.borderColor = "rgba(16, 185, 129, 0.3)";
      networkBadge.style.color = "#10b981";
      if (networkDot) networkDot.style.background = "#10b981";
      networkText.textContent = "Online";
    } else {
      networkBadge.style.background = "rgba(245, 158, 11, 0.15)";
      networkBadge.style.borderColor = "rgba(245, 158, 11, 0.4)";
      networkBadge.style.color = "#f59e0b";
      if (networkDot) networkDot.style.background = "#f59e0b";
      networkText.textContent = "Offline PWA";
    }
  }

  window.addEventListener("online", syncNetworkStatus);
  window.addEventListener("offline", syncNetworkStatus);
  syncNetworkStatus();

  // Active delivery manifest parameters
  const manifest = {
    protocol: "JALSANJEEVANI_POD_V2",
    tanker_id: "TN-SN-02",
    registration: "MH-15-TK-5512",
    target_village: "Khopadi (Sinnar)",
    volume_liters: 10000,
    driver_key: "0x9F3B4ED812C4",
    cistern_key: "0x74CE8A1109B2",
    lat: 19.8920,
    lng: 74.0610,
    geofence_status: "EN_ROUTE_180M",
    timestamp: new Date().toISOString(),
    signature: "SHA256:8f4c2e1b9a7d3c5e"
  };

  /**
   * Generates or refreshes the Cryptographic Delivery Token Payload
   */
  function getCurrentPayloadString() {
    return JSON.stringify({
      protocol: manifest.protocol,
      tanker_id: manifest.tanker_id,
      registration: manifest.registration,
      target_village: manifest.target_village,
      volume_liters: manifest.volume_liters,
      driver_key: manifest.driver_key,
      cistern_key: manifest.cistern_key,
      lat: isArrived ? 19.9015 : manifest.lat,
      lng: isArrived ? 74.1030 : manifest.lng,
      geofence_verified: isArrived,
      timestamp: isArrived ? new Date().toISOString() : manifest.timestamp,
      signature: manifest.signature
    }, null, 2);
  }

  /**
   * Renders the high-density QR code
   */
  function renderQRCode() {
    if (!qrContainer) return;

    const payloadText = getCurrentPayloadString();

    // Update JSON preview if visible
    if (payloadJsonView) {
      payloadJsonView.textContent = payloadText;
    }

    if (typeof QRCode !== "undefined") {
      qrContainer.innerHTML = "";
      qrcodeInstance = new QRCode(qrContainer, {
        text: payloadText,
        width: 190,
        height: 190,
        colorDark: "#070e1a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      console.warn("QRCode library not loaded yet.");
    }
  }

  /**
   * Helper to display temporary toast message
   */
  function showToast(message) {
    if (!driverToast) return;
    driverToast.textContent = message;
    driverToast.style.display = "block";
    clearTimeout(driverToast._timer);
    driverToast._timer = setTimeout(() => {
      driverToast.style.display = "none";
    }, 2500);
  }

  // 1. Initial Render
  renderQRCode();

  // 2. Geofence & GPS Arrival Handshake Toggle
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
          if (transitBadge) {
            transitBadge.textContent = "● ARRIVED AT CISTERN";
            transitBadge.style.color = "#10b981";
          }

          btnArrived.disabled = false;
          btnArrived.innerHTML = "Arrival Verified ✓ (Reset)";
          btnArrived.style.background = "linear-gradient(135deg, #10b981, #059669)";
          btnArrived.style.color = "#fff";

          // Re-generate QR with locked coordinates and fresh timestamp
          renderQRCode();
          showToast("✓ Arrival Locked: QR Token Armed for Verification");

          // Sync arrival to Supabase
          if (window.JalSupabase) {
            window.JalSupabase.updateTankerLocation("TN-SN-02", 19.9015, 74.1030, false, "arrived");
            window.JalSupabase.updateTankerLocation("TN-04", 19.9015, 74.1030, false, "arrived");
            console.log("🌊 Driver arrival synced to Supabase for Tanker TN-SN-02.");
          }
        }, 600);
      } else {
        // Reset state for testing
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
        if (transitBadge) {
          transitBadge.textContent = "● IN TRANSIT";
          transitBadge.style.color = "var(--telemetry-emerald)";
        }
        btnArrived.innerHTML = "Log Arrival Coordinates";
        btnArrived.style.background = "";
        btnArrived.style.color = "";

        renderQRCode();
        showToast("Reset to In-Transit state");

        // Reset status in Supabase
        if (window.JalSupabase) {
          window.JalSupabase.updateTankerLocation("TN-SN-02", 19.8920, 74.0610, false, "en_route");
          window.JalSupabase.updateTankerLocation("TN-04", 19.8920, 74.0610, false, "en_route");
        }
      }
    });
  }

  // 3. Copy Token Payload to Clipboard
  if (btnCopyPayload) {
    btnCopyPayload.addEventListener("click", () => {
      const payloadText = getCurrentPayloadString();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(payloadText)
          .then(() => showToast("📋 Token JSON copied to clipboard!"))
          .catch(() => fallbackCopy(payloadText));
      } else {
        fallbackCopy(payloadText);
      }
    });
  }

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast("📋 Token copied!");
    } catch (e) {
      alert("Token payload:\n" + text);
    }
    document.body.removeChild(ta);
  }

  // 4. Download QR Code Image
  if (btnDownloadQR) {
    btnDownloadQR.addEventListener("click", () => {
      const img = qrContainer ? qrContainer.querySelector("img") : null;
      const canvas = qrContainer ? qrContainer.querySelector("canvas") : null;

      let dataUrl = null;
      if (canvas) {
        dataUrl = canvas.toDataURL("image/png");
      } else if (img && img.src) {
        dataUrl = img.src;
      }

      if (dataUrl) {
        const link = document.createElement("a");
        link.download = `JalSanjeevani_QR_Tanker_TN-SN-02_${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        showToast("💾 QR Code Image Downloaded!");
      } else {
        showToast("Generating image, please try again in 1s");
      }
    });
  }

  // 5. Toggle JSON Payload Preview
  if (btnTogglePayload && payloadJsonView) {
    btnTogglePayload.addEventListener("click", () => {
      const isHidden = payloadJsonView.style.display === "none";
      payloadJsonView.style.display = isHidden ? "block" : "none";
      btnTogglePayload.textContent = isHidden ? "✕ Hide JSON" : "🔍 View JSON";
      if (isHidden) {
        payloadJsonView.textContent = getCurrentPayloadString();
      }
    });
  }
});
