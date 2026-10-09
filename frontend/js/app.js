// Authentication & Portal Navigation Script
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");

  // Role button shortcuts
  document.getElementById("btnRoleCollector")?.addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });

  document.getElementById("btnRoleDriver")?.addEventListener("click", () => {
    window.location.href = "driver.html";
  });

  document.getElementById("btnRolePanchayat")?.addEventListener("click", () => {
    window.location.href = "panchayat.html";
  });

  // Handle normal form submit
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = emailInput?.value.toLowerCase() || "";
      const submitBtn = document.getElementById("btnSubmitLogin");
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Verifying Cryptographic Credentials...";
      }

      setTimeout(() => {
        if (email.includes("driver")) {
          window.location.href = "driver.html";
        } else if (email.includes("panchayat")) {
          window.location.href = "panchayat.html";
        } else {
          window.location.href = "dashboard.html";
        }
      }, 500);
    });
  }
});
