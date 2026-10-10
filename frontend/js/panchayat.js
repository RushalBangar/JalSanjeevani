document.addEventListener("DOMContentLoaded", () => {
  const btnScan = document.getElementById("btnSimulateScan");
  const statusBox = document.getElementById("statusBox");
  const scannerWindow = document.getElementById("scannerWindow");

  const cisternBarFill = document.getElementById("cisternBarFill");
  const cisternPercentText = document.getElementById("cisternPercentText");
  const cisternStatusBadge = document.getElementById("cisternStatusBadge");
  const cisternCurrentReserve = document.getElementById("cisternCurrentReserve");
  const incomingDropText = document.getElementById("incomingDropText");

  if (btnScan) {
    btnScan.addEventListener("click", () => {
      btnScan.innerHTML = "Verifying Asymmetric Key Pair...";
      btnScan.disabled = true;
      btnScan.style.opacity = "0.75";

      if (scannerWindow) {
        scannerWindow.style.borderColor = "#10b981";
      }

      // Simulate cryptographic verification delay
      setTimeout(() => {
        // Haptic feedback if supported on mobile device
        if ("vibrate" in navigator) {
          try { navigator.vibrate([100, 50, 100]); } catch(e) {}
        }

        btnScan.style.display = "none";
        if (scannerWindow) {
          scannerWindow.style.display = "none";
        }
        if (statusBox) {
          statusBox.classList.add("success");
          
          // Add a Reset Simulation button inside statusBox if not already added
          if (!document.getElementById("btnResetScan")) {
            const resetBtn = document.createElement("button");
            resetBtn.id = "btnResetScan";
            resetBtn.className = "btn btn-outline btn-sm";
            resetBtn.style.marginTop = "12px";
            resetBtn.style.width = "100%";
            resetBtn.style.fontSize = "0.75rem";
            resetBtn.textContent = "↺ Re-run Verification Simulation";
            resetBtn.addEventListener("click", resetVerification);
            statusBox.appendChild(resetBtn);
          }
        }

        // Animate Cistern Barometer Fill
        if (cisternBarFill) {
          cisternBarFill.style.width = "48%";
          cisternBarFill.style.background = "#10b981";
        }
        if (cisternPercentText) {
          cisternPercentText.textContent = "48% (Safe)";
          cisternPercentText.style.color = "#10b981";
        }
        if (cisternStatusBadge) {
          cisternStatusBadge.innerHTML = "● 48% SAFE RESERVE";
          cisternStatusBadge.style.color = "#10b981";
        }
        if (cisternCurrentReserve) {
          cisternCurrentReserve.innerHTML = "12,000 / 25,000 L";
          cisternCurrentReserve.style.color = "#10b981";
        }
        if (incomingDropText) {
          incomingDropText.innerHTML = "Delivered &amp; Verified ✓";
          incomingDropText.style.color = "#10b981";
        }

        // Store signed delivery receipt locally
        const receipt = {
          village: "Khopadi (Sinnar)",
          tanker: "TN-SN-02",
          volume: 10000,
          driver_key: "0x9F3B4ED812C4",
          cistern_key: "0x74CE8A1109B2",
          timestamp: new Date().toISOString(),
          status: "VERIFIED_DELIVERED"
        };
        try {
          const receipts = JSON.parse(localStorage.getItem("jalsanjeevani_receipts") || "[]");
          receipts.push(receipt);
          localStorage.setItem("jalsanjeevani_receipts", JSON.stringify(receipts));
        } catch(e) {}

        console.log("Cryptographic proof of delivery saved to offline storage:", receipt);

        // Sync with Supabase Database & Realtime
        if (window.JalSupabase) {
          window.JalSupabase.saveDeliveryReceipt(receipt);
          window.JalSupabase.updateTankerLocation("TN-SN-02", 19.9015, 74.1030, false, "delivered");
          // Also update Khopadi village status in Supabase if client active
          if (window.JalSupabase.client) {
            window.JalSupabase.client
              .from('villages')
              .update({
                cistern_level: '48%',
                status: 'warning',
                hours_remaining: 72
              })
              .or('id.eq.SN-02,id.eq.3,name.ilike.%Khopadi%')
              .then(() => console.log("🌊 Village Khopadi cistern status updated in Supabase."));
          }
        }
      }, 1100);
    });
  }

  function resetVerification() {
    if (btnScan) {
      btnScan.style.display = "block";
      btnScan.disabled = false;
      btnScan.style.opacity = "1";
      btnScan.textContent = "Scan Driver's Cryptographic QR";
    }
    if (scannerWindow) {
      scannerWindow.style.display = "flex";
      scannerWindow.style.borderColor = "var(--accent-amber)";
    }
    if (statusBox) {
      statusBox.classList.remove("success");
      const rBtn = document.getElementById("btnResetScan");
      if (rBtn) rBtn.remove();
    }
    if (cisternBarFill) {
      cisternBarFill.style.width = "8%";
      cisternBarFill.style.background = "var(--alert-red)";
    }
    if (cisternPercentText) {
      cisternPercentText.textContent = "8%";
      cisternPercentText.style.color = "var(--alert-red)";
    }
    if (cisternStatusBadge) {
      cisternStatusBadge.innerHTML = "● 8% CRITICAL";
      cisternStatusBadge.style.color = "var(--alert-red)";
    }
    if (cisternCurrentReserve) {
      cisternCurrentReserve.innerHTML = "2,000 / 25,000 L";
      cisternCurrentReserve.style.color = "var(--alert-red)";
    }
    if (incomingDropText) {
      incomingDropText.innerHTML = "+10,000 L (Tanker #04)";
      incomingDropText.style.color = "var(--primary-color)";
    }
  }
});
