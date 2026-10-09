// Authentication & Portal Navigation Script
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const submitBtn = document.getElementById("btnSubmitLogin");

  const roleBtns = {
    collector: {
      btn: document.getElementById("btnRoleCollector"),
      email: "collector@sinnar.jalsanjeevani.gov.in",
      url: "dashboard.html",
      label: "Enter Collector Dashboard →"
    },
    driver: {
      btn: document.getElementById("btnRoleDriver"),
      email: "driver.mh15@sinnar.jalsanjeevani.gov.in",
      url: "driver.html",
      label: "Enter Driver PWA →"
    },
    panchayat: {
      btn: document.getElementById("btnRolePanchayat"),
      email: "panchayat.khopadi@sinnar.jalsanjeevani.gov.in",
      url: "panchayat.html",
      label: "Enter Panchayat Verifier →"
    }
  };

  let selectedRole = "collector";

  function setActiveRole(roleKey, autoRedirect = false) {
    selectedRole = roleKey;
    const roleData = roleBtns[roleKey];
    if (!roleData) return;

    // Update active highlight on role cards
    Object.values(roleBtns).forEach(r => r.btn?.classList.remove("active"));
    roleData.btn?.classList.add("active");

    // Populate inputs
    if (emailInput) emailInput.value = roleData.email;
    if (passwordInput) passwordInput.value = "sovereign_water_2025";
    if (submitBtn) submitBtn.textContent = roleData.label;

    if (autoRedirect) {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Authorizing " + roleKey.toUpperCase() + "...";
      }
      setTimeout(() => {
        window.location.href = roleData.url;
      }, 350);
    }
  }

  // Set initial state
  setActiveRole("collector", false);

  // Click on role button switches credentials and directly launches
  Object.entries(roleBtns).forEach(([roleKey, roleData]) => {
    roleData.btn?.addEventListener("click", () => {
      setActiveRole(roleKey, true);
    });
  });

  // Handle manual form submit
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = emailInput?.value.toLowerCase() || "";
      
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
      }, 400);
    });
  }
});
