import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfReportConfig {
  title: string;
  subtitle: string;
  dataset: string;
  model: string;
  generatedBy: string;
  generatedAt: string;
  sections: PdfSection[];
}

export interface PdfSection {
  heading: string;
  description?: string;
  table?: { headers: string[]; rows: (string | number)[][] };
  keyValues?: Record<string, string | number>;
}

const BRAND = {
  emerald: [16, 185, 129] as [number, number, number],
  emeraldDark: [5, 78, 59] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
  slate: [30, 41, 59] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightGray: [148, 163, 184] as [number, number, number],
  border: [51, 65, 85] as [number, number, number],
};

export function generateCoLLMReport(config: PdfReportConfig): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  // === HEADER BACKGROUND ===
  doc.setFillColor(...BRAND.dark);
  doc.rect(0, 0, W, 297, "F");

  // Header gradient band
  doc.setFillColor(...BRAND.emeraldDark);
  doc.rect(0, 0, W, 55, "F");

  // Accent bar
  doc.setFillColor(...BRAND.emerald);
  doc.rect(0, 52, W, 3, "F");

  // Logo box
  doc.setFillColor(...BRAND.emerald);
  doc.roundedRect(12, 8, 22, 22, 3, 3, "F");
  doc.setTextColor(...BRAND.dark);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("C", 16, 19);
  doc.setFontSize(8);
  doc.text("LLM", 21, 19);

  // Brand name
  doc.setTextColor(...BRAND.emerald);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CoLLM PLATFORM", 38, 14);
  doc.setTextColor(...BRAND.lightGray);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Collaborative LLM for Recommendation", 38, 19);
  doc.text("arXiv:2310.19488v3  |  USTC Research", 38, 24);

  // Report title
  doc.setTextColor(...BRAND.white);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(config.title, 14, 40);

  doc.setTextColor(...BRAND.emerald);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(config.subtitle, 14, 47);

  // Page stamp (top right)
  doc.setTextColor(...BRAND.lightGray);
  doc.setFontSize(7);
  doc.text("OFFICIAL RESEARCH REPORT", W - 14, 12, { align: "right" });
  doc.text(`Generated: ${config.generatedAt}`, W - 14, 17, { align: "right" });
  doc.text(`By: ${config.generatedBy}`, W - 14, 22, { align: "right" });

  // Watermark stamp circle
  doc.setDrawColor(...BRAND.emerald);
  doc.setLineWidth(0.5);
  doc.circle(W - 20, 38, 10);
  doc.setTextColor(...BRAND.emerald);
  doc.setFontSize(5);
  doc.setFont("helvetica", "bold");
  doc.text("CoLLM", W - 20, 37, { align: "center" });
  doc.text("VERIFIED", W - 20, 41, { align: "center" });

  // Meta info row
  let y = 63;
  const metaItems = [
    { label: "Dataset", value: config.dataset },
    { label: "Model", value: config.model },
    { label: "Format", value: "Research Grade" },
  ];

  doc.setFontSize(7);
  const boxW = (W - 28) / metaItems.length;
  metaItems.forEach((item, i) => {
    const bx = 14 + i * (boxW + 2);
    doc.setFillColor(...BRAND.slate);
    doc.roundedRect(bx, y, boxW, 14, 2, 2, "F");
    doc.setDrawColor(...BRAND.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, y, boxW, 14, 2, 2, "S");
    doc.setTextColor(...BRAND.lightGray);
    doc.setFont("helvetica", "normal");
    doc.text(item.label.toUpperCase(), bx + 4, y + 5);
    doc.setTextColor(...BRAND.emerald);
    doc.setFont("helvetica", "bold");
    doc.text(item.value, bx + 4, y + 11);
  });

  y = 84;

  // === SECTIONS ===
  config.sections.forEach((section, sIdx) => {
    // Section check: if near bottom add new page
    if (y > 250) {
      doc.addPage();
      doc.setFillColor(...BRAND.dark);
      doc.rect(0, 0, W, 297, "F");
      y = 20;
    }

    // Section heading
    doc.setFillColor(...BRAND.emeraldDark);
    doc.roundedRect(14, y, W - 28, 9, 1, 1, "F");
    doc.setTextColor(...BRAND.emerald);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text(`${sIdx + 1}. ${section.heading.toUpperCase()}`, 18, y + 6);
    y += 13;

    if (section.description) {
      doc.setTextColor(...BRAND.lightGray);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(section.description, W - 28);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 3;
    }

    if (section.keyValues) {
      const entries = Object.entries(section.keyValues);
      entries.forEach(([k, v], ki) => {
        const row = Math.floor(ki / 3);
        const col = ki % 3;
        const kbw = (W - 28) / 3 - 2;
        const kbx = 14 + col * (kbw + 3);
        const kby = y + row * 18;
        if (y + row * 18 > 260) return;
        doc.setFillColor(...BRAND.slate);
        doc.roundedRect(kbx, kby, kbw, 14, 1.5, 1.5, "F");
        doc.setDrawColor(...BRAND.border);
        doc.setLineWidth(0.2);
        doc.roundedRect(kbx, kby, kbw, 14, 1.5, 1.5, "S");
        doc.setTextColor(...BRAND.lightGray);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.text(k, kbx + 3, kby + 5);
        doc.setTextColor(...BRAND.emerald);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(String(v), kbx + 3, kby + 11);
      });
      const rows = Math.ceil(entries.length / 3);
      y += rows * 18 + 4;
    }

    if (section.table) {
      autoTable(doc, {
        head: [section.table.headers],
        body: section.table.rows,
        startY: y,
        margin: { left: 14, right: 14 },
        styles: {
          fontSize: 7.5,
          cellPadding: 3.5,
          textColor: [226, 232, 240],
          fillColor: [30, 41, 59],
          lineColor: [51, 65, 85],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: BRAND.slate,
          textColor: BRAND.emerald,
          fontStyle: "bold",
          fontSize: 7,
        },
        alternateRowStyles: { fillColor: [15, 23, 42] },
        didParseCell: (data) => {
          if (data.section === "body") {
            const cellVal = String(data.cell.raw);
            if (cellVal.startsWith("CoLLM") || cellVal.includes("Best")) {
              data.cell.styles.textColor = BRAND.emerald;
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    y += 4;
  });

  // === FOOTER ===
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(...BRAND.slate);
    doc.rect(0, pageH - 14, W, 14, "F");
    doc.setDrawColor(...BRAND.emerald);
    doc.setLineWidth(0.4);
    doc.line(0, pageH - 14, W, pageH - 14);
    doc.setTextColor(...BRAND.lightGray);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text("CoLLM Platform — Collaborative LLM Research Report", 14, pageH - 5);
    doc.text(`Page ${p} of ${totalPages}`, W - 14, pageH - 5, { align: "right" });
    doc.text("CONFIDENTIAL — FOR RESEARCH PURPOSES ONLY", W / 2, pageH - 5, { align: "center" });
  }

  return doc;
}
