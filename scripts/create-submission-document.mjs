import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "../tmp/document-tools/node_modules/docx/dist/index.mjs";
const require = createRequire(import.meta.url);
const PDFDocument = require("../tmp/document-tools/node_modules/pdfkit");

const liveUrl = process.argv[2];
if (!liveUrl) throw new Error("Usage: node scripts/create-submission-document.mjs <live-url>");

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const outputDir = join(projectRoot, "output");
const docxPath = join(outputDir, "dina_seoudi_task_manager_assessment.docx");
const pdfPath = join(outputDir, "dina_seoudi_task_manager_assessment.pdf");
const schema = await readFile(join(projectRoot, "supabase", "schema.sql"), "utf8");

await mkdir(outputDir, { recursive: true });

const githubUrl = "https://github.com/Dinasaur9/kanban-task-board";
const bullets = {
  design: [
    "A deep slate interface and cyan primary accent create a focused, professional visual system. Amber, violet, emerald, and red communicate workflow and urgency without competing with primary actions.",
    "Strong spacing, rounded surfaces, compact badges, and clear typography establish hierarchy between summary information, columns, and task cards.",
    "Native drag-and-drop keeps the required desktop interaction lightweight. Every card also has a status selector for keyboard and touch accessibility.",
    "Optimistic updates make task changes immediate. If a Supabase mutation fails, the interface restores the previous state and presents an actionable error.",
  ],
  required: [
    "Four default columns: To Do, In Progress, In Review, and Done.",
    "Create, edit, drag, move, persist, and delete task workflows.",
    "Automatic Supabase anonymous authentication and user-scoped queries.",
    "Clear loading, empty, saving, and error states.",
    "Responsive layouts for mobile, tablet, and desktop widths.",
  ],
  advanced: [
    "Due date indicators highlight tasks that are due soon or overdue.",
    "Search filters task titles and descriptions in real time.",
    "Priority filtering and automatic priority ordering keep urgent work visible.",
    "Board summary cards show total, completed, in-progress, and overdue task counts.",
  ],
  tradeoffs: [
    "Native drag-and-drop avoids another dependency, but a specialized interaction library could add richer touch dragging and animated reordering within columns.",
    "The device-local fallback is intentionally separate from cloud data and does not automatically merge into a later Supabase session.",
    "With additional time, the next features would be assignees, comments, activity history, and custom labels.",
  ],
  verification: [
    "TypeScript production build: passed.",
    "ESLint code-quality check: passed with zero errors or warnings.",
    "Playwright end-to-end workflow: passed in Microsoft Edge, covering create, edit, move, filter, reload persistence, and delete.",
  ],
};

const body = [];
const addHeading = (text) => body.push(new Paragraph({ text, heading: HeadingLevel.HEADING_1 }));
const addBody = (text) => body.push(new Paragraph({ text }));
const addBullets = (items) => {
  for (const text of items) body.push(new Paragraph({ text, bullet: { level: 0 } }));
};

body.push(
  new Paragraph({
    children: [new TextRun({ text: "INTERNSHIP ASSESSMENT", bold: true, color: "22D3EE", size: 18, characterSpacing: 30 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "NextPlay Kanban", bold: true, color: "0B2545", size: 56 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Full-Stack Task Board Submission", color: "475569", size: 30 })],
    spacing: { after: 320 },
  }),
  new Paragraph({ children: [new TextRun({ text: "Candidate: ", bold: true }), new TextRun("Dina Seoudi")] }),
  new Paragraph({ children: [new TextRun({ text: "Stack: ", bold: true }), new TextRun("React, TypeScript, Vite, Tailwind CSS, Supabase, Playwright")] }),
  new Paragraph({ children: [new TextRun({ text: "Submission date: ", bold: true }), new TextRun("July 30, 2026")], spacing: { after: 180 } }),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2160, 7200],
    rows: [
      ["Live frontend", liveUrl],
      ["GitHub repository", githubUrl],
    ].map(([label, url]) =>
      new TableRow({
        children: [
          new TableCell({ width: { size: 2160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })] }),
          new TableCell({
            width: { size: 7200, type: WidthType.DXA },
            children: [new Paragraph({ children: [new ExternalHyperlink({ link: url, children: [new TextRun({ text: url, style: "Hyperlink" })] })] })],
          }),
        ],
      }),
    ),
  }),
);

addHeading("Solution overview");
addBody("NextPlay Kanban is a responsive task board designed around a fast anonymous workflow. A guest session is created automatically, each task belongs to that authenticated guest, and Supabase Row Level Security prevents users from reading or changing another guest's records. The board remains usable when cloud configuration is unavailable through a clearly labeled device-local fallback.");
addHeading("Design decisions");
addBullets(bullets.design);
addHeading("Required functionality delivered");
addBullets(bullets.required);
addHeading("Advanced features");
addBullets(bullets.advanced);
addHeading("Local setup");
[
  "Clone the GitHub repository and run npm install.",
  "Create a free Supabase project and enable anonymous sign-ins in Authentication settings.",
  "Run supabase/schema.sql in the Supabase SQL Editor.",
  "Copy .env.example to .env.local, then enter VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  "Run npm run dev. Use npm run lint, npm run build, and npm run test:e2e for verification.",
].forEach((text, index) => body.push(new Paragraph({ text, numbering: { reference: "setup", level: 0 }, contextualSpacing: true })));
body.push(
  new Paragraph({
    children: [new TextRun({ text: "Security note: ", bold: true, color: "9B1C1C" }), new TextRun("Only the public Supabase anon key belongs in the frontend. The service-role key must never be committed or exposed.")],
    shading: { type: ShadingType.CLEAR, fill: "F4F6F9" },
    spacing: { before: 120, after: 120 },
    indent: { left: 180, right: 180 },
  }),
);
addHeading("Tradeoffs and future improvements");
addBullets(bullets.tradeoffs);
addHeading("Verification");
addBullets(bullets.verification);
body.push(new Paragraph({ pageBreakBefore: true, text: "Complete Supabase schema", heading: HeadingLevel.HEADING_1 }));
addBody("The following SQL creates the required UUID-based tasks table, validation constraints, index, grants, and owner-only Row Level Security policies.");
for (const line of schema.trimEnd().split(/\r?\n/)) {
  body.push(new Paragraph({
    children: [new TextRun({ text: line || " ", font: "Consolas", size: 16, color: "1E293B" })],
    spacing: { before: 0, after: 0, line: 200 },
    keepLines: false,
  }));
}

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22, color: "292524" }, paragraph: { spacing: { after: 120, line: 264 } } },
      heading1: { run: { font: "Calibri", size: 32, bold: true, color: "2E74B5" }, paragraph: { spacing: { before: 320, after: 160 }, keepNext: true } },
      heading2: { run: { font: "Calibri", size: 26, bold: true, color: "2E74B5" }, paragraph: { spacing: { before: 240, after: 120 }, keepNext: true } },
    },
  },
  numbering: {
    config: [{
      reference: "setup",
      levels: [{
        level: 0,
        format: "decimal",
        text: "%1.",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 }, spacing: { after: 160, line: 280 } } },
      }],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440, header: 708, footer: 708 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [new TextRun({ text: "NEXT PLAY GAMES  |  SOFTWARE DEVELOPMENT ASSESSMENT", bold: true, color: "64748B", size: 16 })],
          border: { bottom: { color: "CBD5E1", style: BorderStyle.SINGLE, size: 4, space: 6 } },
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "Dina Seoudi  |  NextPlay Kanban  |  ", color: "64748B", size: 16 }), new TextRun({ children: [PageNumber.CURRENT], color: "64748B", size: 16 })],
        })],
      }),
    },
    children: body,
  }],
});

await writeFile(docxPath, await Packer.toBuffer(doc));

const pdf = new PDFDocument({ size: "LETTER", margins: { top: 72, right: 72, bottom: 60, left: 72 }, bufferPages: true, info: { Title: "NextPlay Kanban - Full-Stack Task Board Submission", Author: "Dina Seoudi" } });
const pdfDone = new Promise((resolve, reject) => {
  const stream = createWriteStream(pdfPath);
  stream.on("finish", resolve);
  stream.on("error", reject);
  pdf.pipe(stream);
});

const navy = "#0B2545";
const blue = "#2E74B5";
const slate = "#475569";
const cyan = "#0891B2";
const ensureSpace = (height = 80) => {
  if (pdf.y + height > pdf.page.height - 72) pdf.addPage();
};
const pdfHeading = (text) => {
  ensureSpace(70);
  pdf.moveDown(0.55).font("Helvetica-Bold").fontSize(16).fillColor(blue).text(text, { lineGap: 2 });
  pdf.moveDown(0.35);
};
const pdfBody = (text) => {
  pdf.font("Helvetica").fontSize(10.5).fillColor("#292524").text(text, { lineGap: 3 });
  pdf.moveDown(0.55);
};
const pdfBulletList = (items) => {
  for (const text of items) {
    ensureSpace(45);
    pdf.font("Helvetica").fontSize(10.5).fillColor("#292524").text(`•  ${text}`, { indent: 12, lineGap: 3 });
    pdf.moveDown(0.35);
  }
};

pdf.font("Helvetica-Bold").fontSize(9).fillColor(cyan).text("INTERNSHIP ASSESSMENT", { characterSpacing: 1.2 });
pdf.moveDown(0.55).fontSize(28).fillColor(navy).text("NextPlay Kanban");
pdf.moveDown(0.2).font("Helvetica").fontSize(15).fillColor(slate).text("Full-Stack Task Board Submission");
pdf.moveDown(1.5).font("Helvetica-Bold").fontSize(10.5).fillColor("#292524").text("Candidate: Dina Seoudi");
pdf.font("Helvetica").text("Stack: React, TypeScript, Vite, Tailwind CSS, Supabase, Playwright");
pdf.text("Submission date: July 30, 2026");
pdf.moveDown(1);
pdf.font("Helvetica-Bold").fillColor(navy).text("Live frontend");
pdf.font("Helvetica").fillColor(blue).text(liveUrl, { link: liveUrl, underline: true });
pdf.moveDown(0.5).font("Helvetica-Bold").fillColor(navy).text("GitHub repository");
pdf.font("Helvetica").fillColor(blue).text(githubUrl, { link: githubUrl, underline: true });

pdfHeading("Solution overview");
pdfBody("NextPlay Kanban is a responsive task board designed around a fast anonymous workflow. A guest session is created automatically, each task belongs to that authenticated guest, and Supabase Row Level Security prevents users from reading or changing another guest's records. The board remains usable when cloud configuration is unavailable through a clearly labeled device-local fallback.");
pdfHeading("Design decisions");
pdfBulletList(bullets.design);
pdfHeading("Required functionality delivered");
pdfBulletList(bullets.required);
pdfHeading("Advanced features");
pdfBulletList(bullets.advanced);
pdfHeading("Local setup");
[
  "1. Clone the GitHub repository and run npm install.",
  "2. Create a free Supabase project and enable anonymous sign-ins in Authentication settings.",
  "3. Run supabase/schema.sql in the Supabase SQL Editor.",
  "4. Copy .env.example to .env.local, then enter VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  "5. Run npm run dev. Use npm run lint, npm run build, and npm run test:e2e for verification.",
].forEach(pdfBody);
ensureSpace(65);
pdf.roundedRect(72, pdf.y, 468, 52, 6).fill("#F4F6F9");
pdf.fillColor("#9B1C1C").font("Helvetica-Bold").fontSize(10).text("Security note", 84, pdf.y + 10);
pdf.fillColor("#292524").font("Helvetica").fontSize(9.5).text("Only the public Supabase anon key belongs in the frontend. The service-role key must never be committed or exposed.", 84, pdf.y + 4, { width: 444, lineGap: 2 });
pdf.y += 58;
pdfHeading("Tradeoffs and future improvements");
pdfBulletList(bullets.tradeoffs);
pdfHeading("Verification");
pdfBulletList(bullets.verification);

ensureSpace(180);
pdf.font("Helvetica-Bold").fontSize(16).fillColor(blue).text("Complete Supabase schema");
pdf.moveDown(0.45);
pdfBody("The following SQL creates the required UUID-based tasks table, validation constraints, index, grants, and owner-only Row Level Security policies.");
pdf.font("Courier").fontSize(7.2).fillColor("#1E293B");
for (const line of schema.trimEnd().split(/\r?\n/)) {
  ensureSpace(18);
  pdf.text(line || " ", { lineGap: 1 });
}

const pageRange = pdf.bufferedPageRange();
for (let pageIndex = pageRange.start; pageIndex < pageRange.start + pageRange.count; pageIndex += 1) {
  pdf.switchToPage(pageIndex);
  pdf.font("Helvetica-Bold").fontSize(7.5).fillColor("#64748B").text("NEXT PLAY GAMES  |  SOFTWARE DEVELOPMENT ASSESSMENT", 72, 34, { width: 468 });
}

pdf.end();
await pdfDone;
console.log(docxPath);
console.log(pdfPath);
