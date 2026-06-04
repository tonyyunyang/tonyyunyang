// Terminal-window SVG builder for the profile README panes + ledger.
// No dependencies. Two themes, in lockstep with the design spec and the
// site's globals.css tokens.

export const THEMES = {
  light: {
    win: "#F2EAD8", bar: "#E7DDC7", border: "#D9D2C2",
    prompt: "#0E5347", cmd: "#1A1F24", out: "#43494F", comment: "#9C917A", amber: "#946321",
    dotR: "#E0654F", dotY: "#D9A23B", dotG: "#3E8E6E",
    shadow: "rgba(15,20,23,0.16)",
  },
  dark: {
    win: "#0F1417", bar: "#161D23", border: "#2A3138",
    prompt: "#5BC795", cmd: "#EFE4CE", out: "#C7C0B2", comment: "#7C8893", amber: "#E0A458",
    dotR: "#EC6A5E", dotY: "#F4BF4F", dotG: "#43C59E",
    shadow: "rgba(0,0,0,0.40)",
  },
};

const XML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);
}
