"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as fabric from "fabric";
declare module "fabric" {
interface Object {
id?: string;
}
}
interface Key {
param: string;
type: string;
children?: { param: string; type: string }[];
}

const EditTemplatePage = () => {
const canvasRef = useRef<HTMLCanvasElement | null>(null);
const wrapperRef = useRef<HTMLDivElement | null>(null);
const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
const [newText, setNewText] = useState("");
const [plainText, setPlainText] = useState("");
const [svgElements, setSvgElements] = useState<{ id: string; svg: string }[]>(
[]
);
const [dynamicFieldData, setDynamicFieldData] = useState<{ [key: string]: string }>({});

const apiIp = process.env.NEXT_PUBLIC_API_URL;
const router = useRouter();
const [showSuccessModal, setShowSuccessModal] = useState(false);
const [uploadedSvgObj, setUploadedSvgObj] = useState<fabric.Object | null>(
null
);
const [svgOpacity, setSvgOpacity] = useState<number>(1);
const [title, setTitle] = useState("birth certificate");
// const [keys, setKeys] = useState<{ param: string; type: string }[]>([
// { param: "did", type: "string" },
// ]);
const [keys, setKeys] = useState<Key[]>([{ param: "did", type: "string" }]);
const [qrPosition, setQrPosition] = useState<{ left: number; top: number }>({
left: 0,
top: 0,
});
const [canvasFields, setCanvasFields] = useState<
{ param: string; type: "string" | "number" | "date" }[]
>([]);

const [keyParam, setKeyParam] = useState("");
const [keyType, setKeyType] = useState<"string" | "number" | "date">(
"string"
);

const [paramInput, setParamInput] = useState("");
const [typeInput, setTypeInput] = useState<"string" | "number" | "date">(
"string"
);

const [staticKeys, setStaticKeys] = useState<Key[]>([
{ param: "did", type: "string" },
]);

const [dynamicKeys, setDynamicKeys] = useState<Key[]>([]);

const [htmlInput, setHtmlInput] = useState(
'<p style="left: 100px; top: 150px; font-size: 24px; color: #333;">Hello World</p>\n<img src="https://api.qrserver.com/v1/create-qr-code/?data=${did}&size=100x100" style="left: 200px; top: 300px; width: 100px; height: 100px;" />'
);
function parseHtmlToCanvas(html: string, fabricCanvas: fabric.Canvas): void {
// 1. Clear out any existing objects
fabricCanvas.clear();
// 2. Create a temporary container to parse HTML
const container = document.createElement("div");
container.innerHTML = html;
// 3. Render all <p> tags as fabric.Textbox
container.querySelectorAll("p").forEach((p) => {
const left = parseInt(p.style.left || "0", 10);
const top = parseInt(p.style.top || "0", 10);
const fontSize = parseInt(p.style.fontSize|| "16", 10);
const color = p.style.color || "#000";
const text = p.textContent || "";
// Build options object, only adding fontFamily if it exists
const opts: any = {
left,
top,
fontSize,
fill: color,
width: parseInt(p.style.width || "300", 10),
textAlign: (p.style.textAlign as any) || "left",
lineHeight: parseFloat(p.style.lineHeight || "1.3"),
};
if (p.style.fontFamily) {
opts.fontFamily = p.style.fontFamily;
}
if (p.style.fontFamily) {
opts.fontFamily = p.style.fontFamily;
}
const textbox = new fabric.Textbox(text, opts);
fabricCanvas.add(textbox);
})
// 4. Render all <img> tags as fabric.Image via an HTMLImageElement
container.querySelectorAll("img").forEach((imgEl) => {
const src = imgEl.getAttribute("src");
if (!src) return;

const left = parseInt(imgEl.style.left || "0", 10);
const top = parseInt(imgEl.style.top || "0", 10);
const width = parseInt(imgEl.style.width || "100", 10);
const height = parseInt(imgEl.style.height || "100", 10);

const htmlImg = new Image();
htmlImg.crossOrigin = "Anonymous"; // ensure CORS
htmlImg.onload = () => {
// create a Fabric image from the loaded HTMLImage
const fabricImg = new fabric.Image(htmlImg, {
left,
top,
selectable: true,
});
// now resize it to the desired dimensions
fabricImg.scaleToWidth(width);
fabricImg.scaleToHeight(height);

fabricCanvas.add(fabricImg);
fabricCanvas.renderAll();
};
htmlImg.src = src;
});

const tables = container.querySelectorAll("table");
tables.forEach((table) => {
  const topOffset = parseInt((table.closest("div")?.style.top || "0"));
  const leftOffset = parseInt((table.closest("div")?.style.left || "0"));
  
  const rows = table.querySelectorAll("tr");
  
  rows.forEach((row, rowIndex) => {
    const cells = row.querySelectorAll("th, td");
    cells.forEach((cell, colIndex) => {
      const text = cell.textContent?.trim() || "";
      const isHeader = cell.tagName.toLowerCase() === "th";

      const cellWidth = 100;
      const cellHeight = 30;
      const x = leftOffset + colIndex * cellWidth;
      const y = topOffset + rowIndex * cellHeight;

      const rect = new fabric.Rect({
        left: x,
        top: y,
        width: cellWidth,
        height: cellHeight,
        fill: isHeader ? "#f0f0f0" : "#ffffff",
        stroke: "#000000",
        strokeWidth: 1,
      });

      const textObj = new fabric.Textbox(text, {
        left: x + 5,
        top: y + 5,
        width: cellWidth - 10,
        height: cellHeight - 10,
        fontSize: 10,
        fill: "#000000",
        fontWeight: isHeader ? "bold" : "normal",
      });

      fabricCanvas.add(rect);
      fabricCanvas.add(textObj);
    });
  });
});

fabricCanvas.renderAll();
}
const groupDynamicMemberRows = (
keys: Key[],
values: { [key: string]: string }
) => {
const rows: any[] = [];
const rowMap: { [index: string]: any } = {};
keys.forEach(({ param }) => {
const match = param.match(/^member_(\d+)_(.+)$/);
if (match) {
const [_, index, field] = match;
if (!rowMap[index]) rowMap[index] = {};
rowMap[index][field] = values[param] || "";
}
});
Object.keys(rowMap)
.sort((a, b) => Number(a) - Number(b))
.forEach((i) => {
rows.push(rowMap[i]);
});
return rows;
};
const addKeyField = () => {
const param = keyParam.trim();
if (!param) return alert("Enter a field name");
if (dynamicKeys.some((k) => k.param === param))
return alert("That dynamic key already exists");
const cleanParam = param.replace(/[^\w]/g, "");
const dynamicField = `\${${cleanParam}}`;
setDynamicKeys((prev) => [...prev, { param: cleanParam, type: keyType }]);
setKeyParam("");
};

const removeStaticKey = (idx: number) => {
setStaticKeys((prev) => prev.filter((_, i) => i !== idx));
};
const removeDynamicKey = (idx: number) => {
setDynamicKeys((prev) => prev.filter((_, i) => i !== idx));
};

/**
* Serializes all objects on a Fabric canvas into an HTML string
* with absolute‐positioned <p> and <img> (and SVG) tags.
*/
const extractCanvasToHtml = (canvas: fabric.Canvas) => {
const width = canvas.getWidth();
const height = canvas.getHeight();

// Helper to escape HTML
const escapeHtml = (str: string) =>
str.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");

// Serialize each object
const parts = canvas.getObjects().map((obj) => {
const left = obj.left ?? 0;
const top = obj.top ?? 0;

// 1) TEXTBOXES → <p>
if (obj.type === "textbox") {
const t = obj as fabric.Textbox;
const txt = escapeHtml(t.text || "");
return `
<p style="
position:absolute;
left:${left}px;
top:${top}px;
font-size:${t.fontSize}px;
font-family:${t.fontFamily};
color:${t.fill};
text-align:${t.textAlign};
width:${t.width}px;
line-height:${t.lineHeight};
${t.charSpacing ? `letter-spacing:${t.charSpacing/10}px;` : ""}
">
${txt}
</p>
`;
}

if (obj.type === "image") {
const img = obj as fabric.Image;
const src = img.getSrc() as string;
const w = img.getScaledWidth();
const h = img.getScaledHeight();
return `
<img src="${src}" style="
position:absolute;
left:${left}px;
top:${top}px;
width:${w}px;
height:${h}px;
" alt="" />
`;
}

// 3) GROUPED SVGs → unwrap and inline
if (obj.type === "group" && (obj as any).id) {
const id = (obj as any).id as string;
const svgEntry = svgElements.find((e) => e.id === id);
if (!svgEntry) return "";
// get bounding box
const bounds = obj.getBoundingRect();
// strip original <svg> dims and inject ours
const updatedSvg = svgEntry.svg
.replace(/<svg([^>]*)>/, `<svg$1 width="${bounds.width}" height="${bounds.height}">`);
return `
<div style="
position:absolute;
left:${bounds.left}px;
top:${bounds.top}px;
width:${bounds.width}px;
height:${bounds.height}px;
">
${updatedSvg}
</div>
`;
}

return "";
});

// Build full page
const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Certificate</title>
<style>
body { margin:0; padding:0; }
.certificate-container {
position: relative;
width: ${width}px;
height: ${height}px;
}
</style>
</head>
<body>
<div class="certificate-container">
${parts.join("")}
</div>
</body>
</html>`;

return html;
};

const addFieldToCanvas = (param: string) => {
if (!canvas) return;
const textbox = new fabric.Textbox(`\${${param}}`, {
left: 200,
top: 200,
fontSize: 28,
fill: "#000000",
width: 300,
textAlign: "left",
});
canvas.add(textbox);
};

const addPlainTextToCanvas = () => {
if (!canvas || !plainText.trim()) return;

const text = new fabric.Textbox(plainText, {
left: 200,
top: 300,
fontSize: 24,
fill: "#000000",
width: 300,
textAlign: "left",
});

canvas.add(text);
setPlainText("");
};


useEffect(() => {
if (!canvasRef.current) return;

const fabricCanvas = new fabric.Canvas(canvasRef.current, {
backgroundColor: "#ffffff",
});
setCanvas(fabricCanvas);
const img = new Image();
img.crossOrigin = "anonymous";
img.src = `https://api.qrserver.com/v1/create-qr-code/?data=\${did}&size=100x100`;

img.onload = () => {
const fabricImage = new fabric.Image(img, {
left: 100,
top: 100,
width: 100,
height: 100,
scaleX: 1,
scaleY: 1,
selectable: true,
});

setQrPosition({ left: fabricImage.left || 0, top: fabricImage.top || 0 });

fabricImage.on("moving", () => {
setQrPosition({
left: fabricImage.left || 0,
top: fabricImage.top || 0,
});
});

fabricCanvas.add(fabricImage);
fabricCanvas.renderAll();
console.log("✅ QR Image loaded and added to canvas.");
};

img.onerror = () => {
console.error("❌ Failed to load the QR image.");
};

img.onerror = () => {
alert("Failed to load image from URL");
};

const nameText = new fabric.Textbox("Birth Certificate", {
left: 250,
top: 100,
fontFamily: "Georgia",
fontSize: 32,
fill: "#000000",
width: 400,
textAlign: "left",
});
const courseText = new fabric.Textbox("Government Of India", {
left: 250,
top: 150,
fontFamily: "Arial",
fontSize: 24,
fill: "#444444",
width: 250,
textAlign: "left",
});
fabricCanvas.add(nameText, courseText);

const resizeObserver = new ResizeObserver((entries) => {
for (let entry of entries) {
if (entry.target === wrapperRef.current) {
const { width, height } = entry.contentRect;
fabricCanvas.setWidth(width);
fabricCanvas.setHeight(height);
fabricCanvas.renderAll();
}
}
});

if (wrapperRef.current) {
resizeObserver.observe(wrapperRef.current);
}
fabricCanvas.renderAll();
return () => {
fabricCanvas.dispose();
resizeObserver.disconnect();
};
}, []);

const updateTextProps = (prop: string, value: any) => {
if (!canvas) return;
const activeObject = canvas.getActiveObject();
if (activeObject && activeObject.type === "textbox") {
(activeObject as fabric.Textbox).set(prop, value);
canvas.renderAll();
}
};

const addTextToCanvas = () => {
if (!canvas || !newText.trim()) return;
const param = newText.replace(/[^\w]/g, ""); 
const dynamicField = `\${${param}}`; 
const text = new fabric.Textbox(dynamicField, {
left: 200,
top: 200,
fontSize: 28,
fill: "#000000",
width: 300,
textAlign: "left",
customType: "dynamic",
});
canvas.add(text);
setNewText("");

if (!staticKeys.find((k) => k.param === param)) {
setStaticKeys((prev) => [...prev, { param, type: typeInput }]);
}
};

const printCertificateInConsole = () => {
if (!canvas) return;

const width = canvas.getWidth();
const height = canvas.getHeight();

const htmlElements = canvas.getObjects().map((obj) => {
if (obj.type === "textbox") {
const t = obj as fabric.Textbox;
return `<p style="position:absolute; left:${t.left}px; top:${
t.top
}px; font-size:${t.fontSize}px; font-family:${t.fontFamily}; color:${
t.fill
}; text-align:${t.textAlign}; width:${t.width}px; line-height:${
t.lineHeight
}; letter-spacing:${(t.charSpacing || 0) / 10}px;">${t.text}</p>`;
}
return "";
});

const svgDivs = canvas
.getObjects()
.filter(
(obj: any) => obj.id?.startsWith("svg-") && obj.data !== "watermark"
)
.map((svgObj: any) => {
const match = svgElements.find((e) => e.id === svgObj.id);
if (!match) return "";

const bounds = svgObj.getBoundingRect();
const width = bounds.width;
const height = bounds.height;

const updatedSvg = match.svg.replace(
/<svg([^>]*)>/,
`<svg$1 width="${width}" height="${height}">`
);

return `<div style="position:absolute; left:${svgObj.left}px; top:${svgObj.top}px;">${updatedSvg}</div>`;
});

const backgroundSvgObj = canvas
.getObjects()
.find((obj: any) => obj.data === "watermark");
let backgroundSvgHTML = "";

if (backgroundSvgObj) {
const match = svgElements.find((e) => e.id === backgroundSvgObj.id);
if (match) {
const bounds = backgroundSvgObj.getBoundingRect();
const width = bounds.width;
const height = bounds.height;
const opacity = backgroundSvgObj.opacity ?? 1;

const updatedSvg = match.svg.replace(
/<svg([^>]*)>/,
`<svg$1 width="${width}" height="${height}" opacity="${opacity}">`
);

backgroundSvgHTML = `<div style="position:absolute; left:${backgroundSvgObj.left}px; top:${backgroundSvgObj.top}px;">${updatedSvg}</div>`;
}
}

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Certificate</title>
<style>
body {
background: #fff;
padding: 40px;
}
.certificate-container {
position: relative;
background: white;
width: ${width}px;
height: ${height}px;
margin: auto;
border: 2px solid #c1272c;
box-shadow: 0 0 12px rgba(0,0,0,0.15);
}
</style>
</head>
<body>
<div class="certificate-container">
${backgroundSvgHTML}
${htmlElements.join("\n")}
${svgDivs.join("\n")}
</div>
</body>
</html>
`;

console.log("Generated Certificate HTML:\n", htmlContent);
};

const onSvgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
if (!canvas || !e.target.files?.[0]) return;
const file = e.target.files[0];
const reader = new FileReader();
const sanitizeSvgDimensions = (svgText: string): string => {
return svgText
.replace(/<svg([^>]*)\swidth="[^"]+"([^>]*)>/, "<svg$1$2>")
.replace(/<svg([^>]*)\sheight="[^"]+"([^>]*)>/, "<svg$1$2>");
};

reader.onload = async (event) => {
let rawSvgText = event.target?.result as string;
let svgText = sanitizeSvgDimensions(rawSvgText);

try {
const { objects, options } = await fabric.loadSVGFromString(svgText);
const validObjects = objects.filter(
(obj): obj is fabric.Object => obj !== null
);
const svg = fabric.util.groupSVGElements(validObjects, options);

const uniqueId = `svg-${Date.now()}`;
svg.set({
id: uniqueId,
left: 400,
top: 300,
scaleX: 0.5,
scaleY: 0.5,
});

canvas.add(svg);
canvas.renderAll();

setSvgElements((prev) => [...prev, { id: uniqueId, svg: svgText }]);
} catch (err) {
console.error("Failed to load SVG:", err);
alert("Error loading SVG. Check if the file is valid.");
}
};

reader.readAsText(file);
};

const onSvgUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
if (!canvas || !e.target.files?.[0]) return;
const file = e.target.files[0];
const reader = new FileReader();
const sanitizeSvgDimensions = (svgText: string): string => {
return svgText
.replace(/<svg([^>]*)\swidth="[^"]+"([^>]*)>/, "<svg$1$2>")
.replace(/<svg([^>]*)\sheight="[^"]+"([^>]*)>/, "<svg$1$2>");
};
reader.onload = async (event) => {
let rawSvgText = event.target?.result as string;
let svgText = sanitizeSvgDimensions(rawSvgText);

try {
const { objects, options } = await fabric.loadSVGFromString(svgText);
const validObjects = objects.filter(
(obj): obj is fabric.Object => obj !== null
);
const svg = fabric.util.groupSVGElements(validObjects, options);

const uniqueId = `svg-${Date.now()}`;
svg.set({
id: uniqueId,
left: 100,
top: 100,
scaleX: 0.5,
scaleY: 0.5,
opacity: svgOpacity,
originX: "left",
originY: "top",
data: "watermark",
});

svg.setCoords();

canvas.add(svg);

canvas.renderAll();

setUploadedSvgObj(svg);
setSvgElements((prev) => [...prev, { id: uniqueId, svg: svgText }]);
} catch (err) {
console.error("Failed to load SVG:", err);
alert("Error loading SVG. Check if the file is valid.");
}
};

reader.readAsText(file);
};

const onSvgOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
const value = parseFloat(e.target.value);
setSvgOpacity(value);

if (uploadedSvgObj) {
uploadedSvgObj.set({ opacity: value });
canvas?.renderAll();
}
};

const downloadCertificate = () => {
if (!canvas) return;
const dataURL = canvas.toDataURL({
format: "png",
quality: 1,
multiplier: 1,
});
const link = document.createElement("a");
link.href = dataURL;
link.download = "certificate.png";
link.click();
};

const submitToCertificateAPI = async () => {
if (!canvas) return;

const width = canvas.getWidth();
const height = canvas.getHeight();

const htmlElements = canvas.getObjects().map((obj) => {
if (obj.type === "textbox") {
const t = obj as fabric.Textbox;
const isDynamic = /^\$\{[\w]+\}$/.test(t.text || "");
return `<p style="position:absolute; left:${t.left}px; top:${
t.top
}px; font-size:${t.fontSize}px; font-family:${t.fontFamily}; color:${
t.fill
}; text-align:${t.textAlign}; width:${t.width}px; line-height:${
t.lineHeight
}; letter-spacing:${(t.charSpacing || 0) / 10}px;">${
isDynamic ? t.text : t.text
}</p>`;
}
return "";
});

const svgDivs = canvas
.getObjects()
.filter(
(obj: any) => obj.id?.startsWith("svg-") && obj.data !== "watermark"
)
.map((svgObj: any) => {
const match = svgElements.find((e) => e.id === svgObj.id);
if (!match) return "";
const bounds = svgObj.getBoundingRect();
const updatedSvg = match.svg.replace(
/<svg([^>]*)>/,
`<svg$1 width="${bounds.width}" height="${bounds.height}">`
);
return `<div style="position:absolute; left:${svgObj.left}px; top:${svgObj.top}px;">${updatedSvg}</div>`;
});

const backgroundSvgObj = canvas
.getObjects()
.find((obj: any) => obj.data === "watermark");
let backgroundSvgHTML = "";

if (backgroundSvgObj) {
const match = svgElements.find((e) => e.id === backgroundSvgObj.id);
if (match) {
const bounds = backgroundSvgObj.getBoundingRect();
const width = bounds.width;
const height = bounds.height;
const left = backgroundSvgObj.left ?? 0;
const top = backgroundSvgObj.top ?? 0;
const opacity = backgroundSvgObj.opacity ?? 1;

const updatedSvg = match.svg.replace(
/<svg([^>]*)>/,
`<svg$1 style="position:absolute; left:${left}px; top:${top}px;" width="${width}" height="${height}" opacity="${opacity}">`
);

backgroundSvgHTML = updatedSvg;
}
}

let qrImageHTML = "";
const qrObj = canvas
.getObjects()
.find(
(obj) =>
obj.type === "image" &&
(obj as fabric.Image).getSrc().includes("api.qrserver.com")
);

if (qrObj && qrObj.type === "image") {
const image = qrObj as fabric.Image;
const src = image.getSrc();
const left = image.left || 0;
const top = image.top || 0;
const width = image.getScaledWidth();
const height = image.getScaledHeight();

qrImageHTML = `<img src="${src}" style="position:absolute; left:${left}px; top:${top}px; width:${width}px; height:${height}px;" />`;
}

const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Birth Certificate</title>
<style>
body {
background: #fff;
padding: 40px;
}
.certificate-container {
position: relative;
background: white;
width: ${width}px;
height: ${height}px;
margin: auto;
border: 2px solid #c1272c;
box-shadow: 0 0 12px rgba(0,0,0,0.15);
}
</style>
</head>
<body>
<div class="certificate-container">
${backgroundSvgHTML}
${qrImageHTML}
${htmlElements.join("\n")}
${svgDivs.join("\n")}
</div>
</body>
</html>
`;

const sanitizedKeys = keys.map(({ param, type }) => ({
param,
type,
}));
console.log('staticKeys ===>>>',staticKeys)
console.log('dynamicKeys ===>>>',dynamicKeys)

const fullHtml = extractCanvasToHtml(canvas);
const memberRows = groupDynamicMemberRows(dynamicKeys, dynamicFieldData);
console.log("rows ===>>>", memberRows);
const codeToSend = htmlInput;
const payload = {
name: title,
keys: staticKeys,
dynamicKeys: dynamicKeys.map(({ param, type }) => ({ param, type })),
code: htmlInput,
// memberRows:[...staticKeys,...dynamicKeys]
};
console.log('dynamicKeys below ===>>>',dynamicKeys)

try {
const response = await fetch(`${apiIp}certificate/addCertificate`, {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify(payload),
});
console.log('payload ===>>>',payload)

const data = await response.json();
console.log('data ===>>>',data)
if (response.ok) {
setShowSuccessModal(true);
setTimeout(() => {
setShowSuccessModal(false);
router.push("/templates");
}, 3000);
} else {
alert(`Failed to add certificate: ${data.message}`);
}
} catch (error) {
console.error("API error:", error);
alert("Network or server error occurred");
}
};

const handleDynamicFieldData = (fieldName: string, data: string) => {
updateDynamicFieldData(fieldName, data);
};

const updateDynamicFieldData = (fieldName: string, data: string) => {
setDynamicFieldData((prevData) => ({
...prevData,
[fieldName]: data,
}));

if (canvas) {
canvas.getObjects().forEach((obj) => {
if (
obj.type === "textbox" &&
obj instanceof fabric.Textbox &&
obj.get("data-placeholder") === fieldName
) {
obj.set({ text: data || `\${${fieldName}}` });
canvas.renderAll();
}
});
}
};


return (
<div style={styles.page}>
<h2 style={styles.heading}>🎨 Certificate Editor</h2>

<div style={styles.toolbar}>
<label style={styles.label}>
Title:
<input
type="text"
value={title}
onChange={(e) => setTitle(e.target.value)}
style={styles.input}
/>
</label>

<label style={styles.label}>
Font:
<select
onChange={(e) => updateTextProps("fontFamily", e.target.value)}
style={styles.select}
>
<option value="Arial">Arial</option>
<option value="Georgia">Georgia</option>
<option value="Courier New">Courier New</option>
<option value="Times New Roman">Times New Roman</option>
<option value="Verdana">Verdana</option>
</select>
</label>

<label style={styles.label}>
Size:
<input
type="number"
onChange={(e) =>
updateTextProps("fontSize", parseInt(e.target.value))
}
defaultValue={32}
style={styles.input}
/>
</label>

<label style={styles.label}>
Color:
<input
type="color"
onChange={(e) => updateTextProps("fill", e.target.value)}
defaultValue="#000000"
style={{ ...styles.input, padding: 0 }}
/>
</label>

<label style={styles.label}>
Align:
<select
onChange={(e) => updateTextProps("textAlign", e.target.value)}
style={styles.select}
>
<option value="left">Left</option>
<option value="center">Center</option>
<option value="right">Right</option>
<option value="justify">Justify</option>
</select>
</label>

<label style={styles.label}>
Line Height:
<input
type="number"
step="0.1"
onChange={(e) =>
updateTextProps("lineHeight", parseFloat(e.target.value))
}
defaultValue={1.3}
style={styles.input}
/>
</label>

<label style={styles.label}>
Letter Spacing:
<input
type="number"
onChange={(e) =>
updateTextProps("charSpacing", parseInt(e.target.value))
}
defaultValue={0}
style={styles.input}
/>
</label>

<div style={styles.addTextRow} >
<input
type="text"
value={newText}
onChange={(e) => setNewText(e.target.value)}
placeholder="Enter keys"
style={styles.input}
/>

<select
value={typeInput}
onChange={(e) =>
setTypeInput(e.target.value as "string" | "number" | "date")
}
style={styles.select}
>
<option value="string">string</option>
<option value="number">number</option>
<option value="date">date</option>
</select>

<button onClick={addTextToCanvas} style={styles.button}>
Add Field
</button>
</div>

<div style={styles.addTextRow}>
<input
type="text"
value={keyParam}
onChange={(e) => setKeyParam(e.target.value)}
placeholder="Dynamic Key"
style={styles.input}
/>
<select
value={keyType}
onChange={(e) => setKeyType(e.target.value as any)}
style={styles.select}
>
<option value="string">string</option>
<option value="number">number</option>
<option value="date">date</option>
<option value="array">array</option>
</select>
<button onClick={addKeyField} style={styles.button}>
Add Key
</button>
</div>


<h4>Static Keys</h4>
<table>
<thead>
<tr>
<th>Param</th>
<th>Type</th>
<th>Action</th>
</tr>
</thead>
<tbody>
{staticKeys.map((k, i) => (
<tr key={i}>
<td>{k.param}</td>
<td>{k.type}</td>
<td>
<button onClick={() => removeStaticKey(i)}>Remove</button>
</td>
</tr>
))}
</tbody>
</table>

<h4>Dynamic Keys</h4>
<table>
<thead>
<tr>
<th>Param</th>
<th>Type</th>
<th>Action</th>
</tr>
</thead>
<tbody>
{dynamicKeys.map((k, i) => (
<tr key={i}>
<td>{k.param}</td>
<td>{k.type}</td>
<td>
<button onClick={() => removeDynamicKey(i)}>Remove</button>
</td>
</tr>
))}
</tbody>
</table>

<div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
<input
type="text"
value={plainText}
onChange={(e) => setPlainText(e.target.value)}
placeholder="Enter plain text"
style={styles.input}
/>
<button onClick={addPlainTextToCanvas} style={styles.button}>
Add Text
</button>
</div>

<label style={styles.label}>
SVG:
<input type="file" accept=".svg" onChange={onSvgUpload} />
</label>

<label style={styles.label}>
Image:
<input type="file" accept="image/*" onChange={onSvgUploaded} />
</label>

<label style={styles.label}>
SVG Opacity:
<input
type="range"
min="0"
max="1"
step="0.01"
value={svgOpacity}
onChange={(e) => {
const value = parseFloat(e.target.value);
setSvgOpacity(value);

if (uploadedSvgObj) {
uploadedSvgObj.set({ opacity: value });
canvas?.renderAll();
}
}}
style={{ width: "100px" }}
/>
</label>

{/* <button onClick={downloadCertificate} style={styles.button}>
Download
</button> */}

{/* <button onClick={printCertificateInConsole} style={styles.button}>
Print to Console
</button> */}
<button onClick={submitToCertificateAPI} style={styles.button}>
Submit Template
</button>
</div>

<div ref={wrapperRef} style={styles.canvasWrapper}>
<canvas ref={canvasRef} style={styles.canvas} />
</div>
<div
style={{
display: "flex",
gap: "10px",
flexDirection: "column",
width: "70%",
marginTop: "20px",
}}
>
<textarea
value={htmlInput}
onChange={(e) => setHtmlInput(e.target.value)}
rows={6}
placeholder="Paste HTML here"
style={{ width: "100%", fontFamily: "monospace", padding: "10px" }}
/>

<button
onClick={() => canvas && parseHtmlToCanvas(htmlInput, canvas)}
style={{
padding: "10px 20px",
background: "#c1272c",
color: "white",
border: "none",
borderRadius: "5px",
cursor: "pointer",
}}
>
Render HTML to Canvas
</button>

<button
onClick={() => {
if (!canvas) return;
const extractedHtml = extractCanvasToHtml(canvas);
setHtmlInput(extractedHtml);
}}
style={{
padding: "10px 20px",
background: "#444",
color: "white",
border: "none",
borderRadius: "5px",
cursor: "pointer",
}}
>
Export Canvas to HTML
</button>
</div>
{showSuccessModal && (
<div
style={{
position: "fixed",
top: 0,
left: 0,
width: "100vw",
height: "100vh",
backgroundColor: "rgba(0, 0, 0, 0.5)",
display: "flex",
justifyContent: "center",
alignItems: "center",
zIndex: 9999,
}}
>
<div
style={{
background: "white",
padding: "40px 40px",
borderRadius: "10px",
boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
textAlign: "center",
fontSize: "16px",
width: "200px",
color: "#000",
}}
>
Template send to super admin for approval.
</div>
</div>
)}
</div>
);
};

const styles: { [key: string]: React.CSSProperties } = {
page: {
padding: "20px",
fontFamily: "sans-serif",
background: "#fff7ed",
minHeight: "100vh",
},
heading: {
fontSize: "1.8rem",
marginBottom: "20px",
},
toolbar: {
display: "flex",
flexWrap: "wrap",
gap: "20px",
marginBottom: "20px",
alignItems: "flex-start",
flexDirection: "column",
position: "absolute",
right: "13px",
background: "#fff",
width: "22%",
padding: "20px",
borderRadius: "10px",
},
label: {
display: "flex",
fontSize: "0.9rem",
gap: "5px",
},
input: {
padding: "4px 6px",
fontSize: "14px",
borderRadius: "4px",
border: "1px solid #ccc",
minWidth: "80px",
},
select: {
padding: "4px 6px",
fontSize: "14px",
borderRadius: "4px",
border: "1px solid #ccc",
},


addTextRow: {
gap: "5px",
width: "100%",
display: "grid",
gridTemplateColumns: "repeat(3, 1fr)",
},



button: {
padding: "6px 10px",
background: "#c1272c",
color: "#fff",
border: "none",
borderRadius: "5px",
cursor: "pointer",
transition: "background 0.2s ease-in-out",
},
canvasWrapper: {
border: "2px dashed #c1272c",
background: "#fff",
overflow: "auto",
resize: "both",
width: "70%",
height: "700px",
},
canvas: {
display: "block",
width: "100%",
height: "100%",
},
};

export default EditTemplatePage;