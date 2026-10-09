document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Generate Encrypted Payload for QR
  // In production, this would be cryptographically signed.
  const payload = JSON.stringify({
    tanker_id: "TN-04",
    manifest_id: "MNF-9823",
    timestamp: new Date().toISOString(),
    signature: "abc123xyz_mock_signature"
  });

  // 2. Render QR Code
  const qrContainer = document.getElementById("qrcode");
  new QRCode(qrContainer, {
    text: payload,
    width: 200,
    height: 200,
    colorDark : "#0f172a",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });

  // 3. Mock GPS Logging
  const btnArrived = document.getElementById("btnArrived");
  btnArrived.addEventListener("click", () => {
    if (navigator.geolocation) {
      btnArrived.innerHTML = "Acquiring GPS...";
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success
          console.log("Logged coordinates:", position.coords.latitude, position.coords.longitude);
          btnArrived.innerHTML = "Coordinates Logged ✓";
          btnArrived.classList.remove("btn-primary");
          btnArrived.style.background = "#22c55e";
          
          // Here we would normally save to IndexedDB or push to Supabase
        },
        (error) => {
          // For demo purposes, fake it if permissions are denied
          console.log("Using fallback coordinates");
          btnArrived.innerHTML = "Offline Sync Logged ✓";
          btnArrived.classList.remove("btn-primary");
          btnArrived.style.background = "#22c55e";
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  });

});
