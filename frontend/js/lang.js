const translations = {
  en: {
    hero_badge: "AI-Powered Scarcity Prediction",
    nav_login: "Portal Login",
    hero_title: "Smart Operations for Sustainable Drought Relief",
    hero_desc: "JalSanjeevani (जलसंजीवनी) is an end-to-end intelligent platform that predicts regional water scarcity, stops tanker diversion via cryptographic validation, and optimizes delivery routes to ensure equitable access for both humans and livestock.",
    hero_btn_discover: "Discover the Pillars",
    hero_btn_access: "Access Command Dashboard",
    pillars_title: "The 3-Pillar Solution Architecture",
    pillar1_title: "Predictive Early Warning",
    pillar1_desc: "Using open geospatial telemetry (ESA Copernicus & NASA SMAP), we compute a localized Water Depletion Index. Predict village groundwater failure up to 14 days in advance, moving from reactive to proactive relief.",
    pillar2_title: "Anti-Diversion & Proof-of-Delivery",
    pillar2_desc: "Eliminate the Tanker Mafia. A dual-key offline-first cryptographic QR handshake at geofenced community cisterns ensures water is delivered to the people, not sold to private commercial entities.",
    pillar3_title: "Multi-Objective Logistics Solver",
    pillar3_desc: "Mathematical fair-share distribution routing using Google OR-Tools. Guarantees a minimum statutory quota of 40L/day for humans and 70L/day for cattle, minimizing diesel burn and eliminating skipped hamlets."
  },
  mr: {
    hero_badge: "एआय (AI) द्वारे पाणीटंचाईचा अंदाज",
    nav_login: "पोर्टल लॉगिन",
    hero_title: "शाश्वत दुष्काळ निवारणासाठी स्मार्ट ऑपरेशन्स",
    hero_desc: "जलसंजीवनी हे एक बुद्धिमान तंत्रज्ञान आहे जे दुष्काळाची १४ दिवस आधी पूर्वसूचना देते, क्यूआर (QR) पडताळणीद्वारे टँकर माफियांची चोरी थांबवते आणि माणसे व जनावरे दोघांनाही समान पाणीवाटप सुनिश्चित करते.",
    hero_btn_discover: "प्रकल्पाची माहिती घ्या",
    hero_btn_access: "कमांड डॅशबोर्ड उघडा",
    pillars_title: "प्रकल्पाचे ३ मुख्य स्तंभ",
    pillar1_title: "दुष्काळाची पूर्वसूचना",
    pillar1_desc: "सॅटेलाइट डेटाचा वापर करून भूजल पातळी आणि मातीतील ओलावा मोजला जातो. यामुळे कोणती गावे पुढील १४ दिवसांत पाण्याविना राहतील याचा अचूक अंदाज बांधता येतो.",
    pillar2_title: "चोरीविरोधी प्रणाली (QR पडताळणी)",
    pillar2_desc: "गावातील पाण्याच्या टाकीजवळ क्यूआर कोड स्कॅन केल्याशिवाय कंत्राटदाराला पैसे मिळत नाहीत. यामुळे टँकर मधील पाण्याची खासगी कारखान्यांना होणारी बेकायदेशीर विक्री थांबते.",
    pillar3_title: "पाणीवाटप नियोजन (लॉजिस्टिक सॉल्व्हर)",
    pillar3_desc: "प्रत्येक माणसासाठी ४० लिटर आणि जनावरासाठी ७० लिटर पाण्याचे वाटप करण्याचे गणितीय नियोजन. एकाही वाडीला किंवा जनावरांच्या पाणवठ्याला पाण्यापासून वंचित ठेवले जात नाही."
  },
  hi: {
    hero_badge: "एआई (AI) द्वारा जल संकट की भविष्यवाणी",
    nav_login: "पोर्टल लॉगिन",
    hero_title: "स्थायी सूखा राहत के लिए स्मार्ट ऑपरेशन्स",
    hero_desc: "जलसंजीवनी (JalSanjeevani) एक इंटेलिजेंट प्लेटफॉर्म है जो 14 दिन पहले पानी के संकट की भविष्यवाणी करता है, क्रिप्टोग्राफ़िक सत्यापन के माध्यम से टैंकर माफिया को रोकता है, और मनुष्यों और पशुओं दोनों के लिए उचित जल वितरण सुनिश्चित करता है।",
    hero_btn_discover: "प्रोजेक्ट के बारे में जानें",
    hero_btn_access: "कमांड डैशबोर्ड खोलें",
    pillars_title: "प्रोजेक्ट के 3 मुख्य स्तंभ",
    pillar1_title: "भविष्य कहनेवाला प्रारंभिक चेतावनी",
    pillar1_desc: "उपग्रह डेटा (NASA, ESA) का उपयोग करके हम भूजल की कमी को ट्रैक करते हैं। इससे 14 दिन पहले ही पता चल जाता है कि किस गाँव का पानी खत्म होने वाला है।",
    pillar2_title: "टैंकर चोरी की रोकथाम (QR सत्यापन)",
    pillar2_desc: "टैंकर माफिया का खात्मा। गाँव की टंकी पर QR स्कैन किए बिना पानी की डिलीवरी नहीं मानी जाएगी, जिससे पानी की व्यावसायिक बिक्री पर रोक लगती है।",
    pillar3_title: "न्यायसंगत वितरण प्रणाली",
    pillar3_desc: "Google OR-Tools का उपयोग करके पानी के टैंकरों का रूट तय किया जाता है। यह हर इंसान के लिए 40L/दिन और पशु के लिए 70L/दिन की न्यूनतम गारंटी देता है।"
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const langSwitcher = document.getElementById("langSwitcher");
  const savedLang = localStorage.getItem("jalsanjeevani_lang") || "en";

  if (langSwitcher) {
    langSwitcher.value = savedLang;
    langSwitcher.addEventListener("change", (e) => {
      const selectedLang = e.target.value;
      localStorage.setItem("jalsanjeevani_lang", selectedLang);
      applyTranslation(selectedLang);
    });
  }

  applyTranslation(savedLang);
});

function applyTranslation(lang) {
  document.documentElement.lang = lang;
  
  const elements = document.querySelectorAll("[data-i18n]");
  elements.forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
}
