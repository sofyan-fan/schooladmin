// node scripts/make-jspdf-font.js <inTTF> <outJS> <family> <style> <psName>
import fs from "fs"; import path from "path";
const [,, inTtf, outJs, family, style, psName] = process.argv;
if (!inTtf || !outJs || !family || !style) { console.error("Usage: node scripts/make-jspdf-font.js <inputTTF> <outJS> <family> <style> <psName>"); process.exit(1); }
const psFile = psName || `${family}-${style}.ttf`;
const b64 = fs.readFileSync(inTtf).toString("base64");
const js = `import { jsPDF } from "jspdf";
jsPDF.API.events.push(["addFonts", function() {
  try {
    this.addFileToVFS(${JSON.stringify(psFile)}, ${JSON.stringify(b64)});
    this.addFont(${JSON.stringify(psFile)}, ${JSON.stringify(family)}, ${JSON.stringify(style)});
  } catch (e) {
    // Ignore invalid/unsupported TTFs to avoid jsPDF PubSub errors
  }
}]);`;
fs.mkdirSync(path.dirname(outJs), { recursive: true });
fs.writeFileSync(outJs, js);


