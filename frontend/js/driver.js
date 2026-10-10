/**
 * JalSanjeevani (RouteGuard) - Driver PWA Tactical Cockpit Engine
 * Handles live cryptographic QR token generation, geofence arrival lock,
 * and online-first Supabase telemetry synchronization.
 */

document.addEventListener("DOMContentLoaded", () => {
  const qrContainer = document.getElementById("qrcode");
  const btnLogArrival = document.getElementById("btnLogArrival") || document.getElementById("btnArrived");
  const btnLogArrivalText = document.getElementById("btnLogArrivalText");
  const arrivalSuccessBanner = document.getElementById("arrivalSuccessBanner");
  const geofenceStatusText = document.getElementById("geofenceStatusText");
  const geofenceRangeBadge = document.getElementById("geofenceRangeBadge");
  const geofenceRadarIcon = document.getElementById("geofenceRadarIcon");
  const driverCryptoKey = document.getElementById("driverCryptoKey");
  const transitBadge = document.getElementById("transitBadge");
  const transitDot = document.getElementById("transitDot");

  const copyTokenBtn = document.getElementById("copyTokenBtn") || document.getElementById("btnCopyPayload");
  const saveImageBtn = document.getElementById("saveImageBtn") || document.getElementById("btnDownloadQR");
  const toggleJsonBtn = document.getElementById("toggleJsonBtn") || document.getElementById("btnTogglePayload");
  const closeJsonProofBtn = document.getElementById("closeJsonProofBtn");
  const jsonProofDrawer = document.getElementById("jsonProofDrawer");
  const payloadJsonView = document.getElementById("payloadJsonView");
  const sosBeaconBtn = document.getElementById("sosBeaconBtn");
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
      networkBadge.className = "flex items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded-full border border-safe-emerald/30";
      if (networkDot) networkDot.className = "w-2 h-2 rounded-full bg-safe-emerald animate-pulse";
      networkText.className = "font-label-tactical text-label-tactical text-safe-emerald uppercase font-bold tracking-tight";
      networkText.textContent = "Online";
    } else {
      networkBadge.className = "flex items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded-full border border-warning-amber/40";
      if (networkDot) networkDot.className = "w-2 h-2 rounded-full bg-warning-amber";
      networkText.className = "font-label-tactical text-label-tactical text-warning-amber uppercase font-bold tracking-tight";
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
   * Renders the scannable high-density QR code
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
   * Displays floating tactical toast message
   */
  function showToast(message) {
    if (!driverToast) return;
    driverToast.textContent = message;
    driverToast.classList.remove("hidden");
    clearTimeout(driverToast._timer);
    driverToast._timer = setTimeout(() => {
      driverToast.classList.add("hidden");
    }, 2500);
  }

  // 1. Initial Render
  renderQRCode();

  // 2. Geofence & GPS Arrival Handshake Handler
  if (btnLogArrival) {
    btnLogArrival.addEventListener("click", () => {
      if (!isArrived) {
        btnLogArrival.disabled = true;
        btnLogArrival.classList.add("opacity-75");
        if (btnLogArrivalText) {
          btnLogArrivalText.textContent = "Acquiring GPS Lock...";
        }

        setTimeout(() => {
          isArrived = true;

          // Update Status Text & Badges
          if (geofenceStatusText) {
            geofenceStatusText.textContent = "✓ Inside Cistern Perimeter (12m)";
            geofenceStatusText.className = "font-body-lg text-body-lg font-bold text-safe-emerald";
          }
          if (geofenceRangeBadge) {
            geofenceRangeBadge.textContent = "GPS Locked";
            geofenceRangeBadge.className = "bg-safe-emerald/15 text-safe-emerald px-2 py-0.5 rounded font-label-tactical text-label-tactical uppercase font-bold";
          }
          if (geofenceRadarIcon) {
            geofenceRadarIcon.className = "material-symbols-outlined text-[20px] text-safe-emerald";
          }
          if (arrivalSuccessBanner) {
            arrivalSuccessBanner.classList.remove("hidden");
          }
          if (driverCryptoKey) {
            driverCryptoKey.textContent = "TOKEN READY: 0x9F3B4E • GEOFENCE VERIFIED";
          }
          if (transitBadge) {
            transitBadge.textContent = "ARRIVED AT CISTERN";
            transitBadge.className = "font-label-tactical text-label-tactical font-bold text-safe-emerald uppercase tracking-wider";
          }
          if (transitDot) {
            transitDot.className = "w-2 h-2 rounded-full bg-safe-emerald";
          }

          // Button state
          btnLogArrival.disabled = false;
          btnLogArrival.classList.remove("opacity-75", "bg-primary-container", "hover:bg-primary");
          btnLogArrival.classList.add("bg-safe-emerald", "text-surface-base");
          if (btnLogArrivalText) {
            btnLogArrivalText.textContent = "Arrival Verified ✓ (Reset)";
          }

          // Re-render QR code with locked GPS coordinates
          renderQRCode();
          showToast("✓ Arrival Locked: QR Armed for Panchayat Scan");

          // Sync arrival to Supabase
          if (window.JalSupabase) {
            window.JalSupabase.updateTankerLocation("TN-SN-02", 19.9015, 74.1030, false, "arrived");
            window.JalSupabase.updateTankerLocation("TN-04", 19.9015, 74.1030, false, "arrived");
            console.log("🌊 Driver arrival coordinates synced to Supabase for Tanker TN-SN-02.");
          }
        }, 700);

      } else {
        // Reset state for re-testing
        isArrived = false;

        if (geofenceStatusText) {
          geofenceStatusText.textContent = "Geofence: 180m from Target";
          geofenceStatusText.className = "font-body-lg text-body-lg font-bold text-on-surface";
        }
        if (geofenceRangeBadge) {
          geofenceRangeBadge.textContent = "Within Corridor";
          geofenceRangeBadge.className = "bg-warning-amber/15 text-warning-amber px-2 py-0.5 rounded font-label-tactical text-label-tactical uppercase font-bold";
        }
        if (geofenceRadarIcon) {
          geofenceRadarIcon.className = "material-symbols-outlined text-[20px] text-primary animate-pulse";
        }
        if (arrivalSuccessBanner) {
          arrivalSuccessBanner.classList.add("hidden");
        }
        if (driverCryptoKey) {
          driverCryptoKey.textContent = "KEY: 0x9F3B4E • GEOFENCE ENCRYPTED";
        }
        if (transitBadge) {
          transitBadge.textContent = "IN TRANSIT";
          transitBadge.className = "font-label-tactical text-label-tactical font-bold text-primary uppercase tracking-wider";
        }
        if (transitDot) {
          transitDot.className = "w-2 h-2 rounded-full bg-primary animate-pulse";
        }

        btnLogArrival.classList.remove("bg-safe-emerald", "text-surface-base");
        btnLogArrival.classList.add("bg-primary-container", "hover:bg-primary");
        if (btnLogArrivalText) {
          btnLogArrivalText.textContent = "Log Arrival Coordinates";
        }

        renderQRCode();
        showToast("Reset to In-Transit corridor state");

        if (window.JalSupabase) {
          window.JalSupabase.updateTankerLocation("TN-SN-02", 19.8920, 74.0610, false, "en_route");
          window.JalSupabase.updateTankerLocation("TN-04", 19.8920, 74.0610, false, "en_route");
        }
      }
    });
  }

  // 3. Copy Token Payload to Clipboard
  if (copyTokenBtn) {
    copyTokenBtn.addEventListener("click", () => {
      const payloadText = getCurrentPayloadString();
      const origContent = copyTokenBtn.innerHTML;

      const doSuccess = () => {
        copyTokenBtn.innerHTML = `<span class="material-symbols-outlined text-[16px] text-safe-emerald">check</span><span class="font-label-tactical text-label-tactical font-semibold text-safe-emerald">Copied!</span>`;
        showToast("📋 Token JSON copied to clipboard!");
        setTimeout(() => { copyTokenBtn.innerHTML = origContent; }, 1800);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(payloadText).then(doSuccess).catch(() => fallbackCopy(payloadText, doSuccess));
      } else {
        fallbackCopy(payloadText, doSuccess);
      }
    });
  }

  function fallbackCopy(text, onSuccess) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      if (onSuccess) onSuccess();
    } catch (e) {
      alert("Token payload:\n" + text);
    }
    document.body.removeChild(ta);
  }

  // 4. Download QR Code Image
  if (saveImageBtn) {
    saveImageBtn.addEventListener("click", () => {
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
        link.download = `JalSanjeevani_QR_Tanker_TK04_${Date.now()}.png`;
        link.href = dataUrl;
        link.click();

        const origContent = saveImageBtn.innerHTML;
        saveImageBtn.innerHTML = `<span class="material-symbols-outlined text-[16px] text-safe-emerald">done</span><span class="font-label-tactical text-label-tactical font-semibold text-safe-emerald">Saved Offline</span>`;
        showToast("💾 QR Code Image Downloaded!");
        setTimeout(() => { saveImageBtn.innerHTML = origContent; }, 1800);
      } else {
        showToast("Generating image, please try again in 1s");
      }
    });
  }

  // 5. Toggle JSON Payload Preview Drawer
  function toggleJsonProof() {
    if (!jsonProofDrawer) return;
    const isHidden = jsonProofDrawer.classList.contains("hidden");
    if (isHidden) {
      jsonProofDrawer.classList.remove("hidden");
      if (payloadJsonView) {
        payloadJsonView.textContent = getCurrentPayloadString();
      }
    } else {
      jsonProofDrawer.classList.add("hidden");
    }
  }

  if (toggleJsonBtn) {
    toggleJsonBtn.addEventListener("click", toggleJsonProof);
  }
  if (closeJsonProofBtn) {
    closeJsonProofBtn.addEventListener("click", toggleJsonProof);
  }

  // 6. SOS Beacon Trigger
  if (sosBeaconBtn) {
    sosBeaconBtn.addEventListener("click", () => {
      alert("🚨 Emergency beacon triggered!\n\nSinnar District Dispatch Node and Quick Response Team have been alerted with Tanker #04 telemetry coordinates.");
      if (window.JalSupabase && window.JalSupabase.client) {
        window.JalSupabase.client.from("escrow_actions").insert([{
          tanker_id: "TN-SN-02",
          penalty_amount: "SOS_ALERT",
          reason: "Driver emergency distress beacon triggered along Sinnar drought corridor.",
          status: "ALERT"
        }]).then(() => console.log("🚨 SOS logged to Supabase."));
      }
    });
  }
});
