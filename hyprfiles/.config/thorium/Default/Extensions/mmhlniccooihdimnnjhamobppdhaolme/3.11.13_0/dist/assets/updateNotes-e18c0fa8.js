import "./DollarPolyfills-e1e75c6d.js";
/* empty css                        */import { s as setup } from "./i18n-018df846.js";
document.getElementById("betaTestingCTA").addEventListener("click", () => {
  window.open("https://forum.kee.pm/t/beta-testing-the-kee-browser-extension/2022");
});
document.getElementById("betaTestingFeedbackCTA").addEventListener("click", () => {
  window.open("https://forum.kee.pm/");
});
document.getElementById("keeVaultCTA").addEventListener("click", () => {
  window.open("https://forum.kee.pm/kee-vault-launch");
});
const root = document.documentElement;
if ({}.VITE_KEE_CHANNEL) {
  console.error("beta 1");
  root.style.setProperty("--display-none-when-beta", "none");
} else {
  console.error("prod");
  root.style.setProperty("--display-none-when-not-beta", "none");
}
setup();
