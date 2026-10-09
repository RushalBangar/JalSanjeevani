document.addEventListener("DOMContentLoaded", () => {
  const btnScan = document.getElementById("btnSimulateScan");
  const statusBox = document.getElementById("statusBox");
  const scannerWindow = document.getElementById("scannerWindow");

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
        // Haptic feedback if on mobile device
        if ("vibrate" in navigator) {
          try { navigator.vibrate([100, 50, 100]); } catch(e) {}
        }

        btnScan.style.display = "none";
        if (scannerWindow) {
          scannerWindow.style.display = "none";
        }
        if (statusBox) {
          statusBox.classList.add("success");
        }

        // Store signed delivery receipt locally
        const receipt = {
          village: "Khopadi",
          tanker: "TN-04",
          volume: 10000,
          timestamp: new Date().toISOString(),
          status: "VERIFIED_DELIVERED"
        };
        try {
          const receipts = JSON.parse(localStorage.getItem("jalsanjeevani_receipts") || "[]");
          receipts.push(receipt);
          localStorage.setItem("jalsanjeevani_receipts", JSON.stringify(receipts));
        } catch(e) {}

        console.log("Cryptographic proof of delivery saved to offline storage:", receipt);
      }, 1200);
    });
  }
});
