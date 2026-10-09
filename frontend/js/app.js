// Authentication & Portal Navigation Script
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    // Add quick demo role switcher buttons below the form
    const roleContainer = document.createElement("div");
    roleContainer.style.marginTop = "1.5rem";
    roleContainer.style.paddingTop = "1rem";
    roleContainer.style.borderTop = "1px solid var(--border-color)";
    roleContainer.innerHTML = `
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Quick Demo Portals</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
        <button type="button" id="btnDemoCollector" class="btn btn-outline btn-sm" style="font-size: 0.8rem; padding: 8px;">District Collector</button>
        <button type="button" id="btnDemoDriver" class="btn btn-outline btn-sm" style="font-size: 0.8rem; padding: 8px;">Tanker Driver</button>
      </div>
      <button type="button" id="btnDemoPanchayat" class="btn btn-outline btn-sm btn-block" style="font-size: 0.8rem; padding: 8px;">Gram Panchayat App</button>
    `;
    loginForm.parentNode.insertBefore(roleContainer, loginForm.nextSibling);

    // Event handlers for quick demo portals
    document.getElementById("btnDemoCollector")?.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });

    document.getElementById("btnDemoDriver")?.addEventListener("click", () => {
      window.location.href = "driver.html";
    });

    document.getElementById("btnDemoPanchayat")?.addEventListener("click", () => {
      window.location.href = "panchayat.html";
    });

    // Handle normal form submit
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email")?.value.toLowerCase() || "";
      const submitBtn = loginForm.querySelector("button[type='submit']");
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Authenticating...";
      }

      setTimeout(() => {
        if (email.includes("driver")) {
          window.location.href = "driver.html";
        } else if (email.includes("panchayat")) {
          window.location.href = "panchayat.html";
        } else {
          window.location.href = "dashboard.html";
        }
      }, 600);
    });
  }
});
