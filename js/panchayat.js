document.addEventListener("DOMContentLoaded", () => {
  
  const btnScan = document.getElementById("btnSimulateScan");
  const statusBox = document.getElementById("statusBox");
  const scanner = document.getElementById("scanner");

  btnScan.addEventListener("click", () => {
    // Simulate a scan delay
    btnScan.innerHTML = "Scanning...";
    btnScan.disabled = true;
    scanner.style.borderColor = "#22c55e";

    setTimeout(() => {
      // Simulate successful cryptographic verification
      btnScan.style.display = "none";
      scanner.style.display = "none";
      statusBox.classList.add("success");
      
      // In production, this saves the signed receipt to IndexedDB
      // and triggers the service worker background sync
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((swRegistration) => {
          // swRegistration.sync.register('sync-deliveries');
          console.log("Delivery receipt queued for background sync.");
        });
      }

    }, 1500);
  });

});
