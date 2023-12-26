import { K as KeeLog } from "./ConfigManager-21f0f76b.js";
async function copyStringToClipboard(value) {
  try {
    await navigator.clipboard.writeText(value);
  } catch (e) {
    try {
      const copyFrom = document.createElement("textarea");
      copyFrom.textContent = value;
      const body = document.getElementsByTagName("body")[0];
      body.appendChild(copyFrom);
      copyFrom.select();
      document.execCommand("copy");
      body.removeChild(copyFrom);
      KeeLog.info("Failed to write to clipboard using modern API so used the fallback hack");
    } catch (e2) {
      KeeLog.error("Failed to write to clipboard using modern API and fallback hack");
    }
  }
}
export {
  copyStringToClipboard as c
};
