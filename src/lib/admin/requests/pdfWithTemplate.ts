// src/lib/admin/requests/pdfWithTemplate.ts
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { AdminRequest } from "@/lib/admin/requests/store";

/** Layout enum (kept for future) */
enum CostMode { Column = "column", Row = "row", Grid3 = "grid3" }

export async function generateRequestPDF(req: AdminRequest) {
  /* ===== DEV VISUALS ===== */
  const SHOW_BOXES = false; // field guides
  const SHOW_GRID  = false; // page rulers (50pt)

  /* ===== GLOBAL OFFSETS ===== */
  const OFFSET_X = 0;
  const OFFSET_TOP = 0;
  const PAD_X = 2;

  /* ===== FORMAT HELPERS ===== */
  const peso = (val?: number | null) =>
    `PHP ${new Intl.NumberFormat("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(val ?? 0))}`;

  // Robust local date parsing/formatting (avoids TZ shifts for YYYY-MM-DD)
  function toLocalDate(d?: string | number | Date | null): Date {
    if (!d) return new Date();
    if (d instanceof Date) return d;
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [y, m, day] = d.split("-").map(Number);
      return new Date(y, (m || 1) - 1, day || 1);
    }
    const t = new Date(d as any);
    return isNaN(t.getTime()) ? new Date() : t;
  }

  const fmtLongDate = (d?: string | number | Date | null) =>
    new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    }).format(toLocalDate(d));

  const DEPT_WORD_ABBR: Record<string, string> = {
    College: "C.",
    of: "of",
    Business: "Bus.",
    Accountancy: "Accty.",
    Hospitality: "Hosp.",
    Tourism: "Tour.",
    Management: "Mgmt.",
    "Management/": "Mgmt/",
    Criminal: "Crim.",
    Justice: "Just.",
    Research: "Res.",
    Knowledge: "Knowl.",
    Institute: "Inst.",
    International: "Intl.",
    Human: "Hum.",
    Resource: "Res.",
    Information: "Info.",
    Science: "Sci.",
    Sciences: "Scis.",
  };
  const abbreviateDepartment = (raw: string) =>
    (raw || "")
      .replace(/\bCollege of\b/gi, "C. of")
      .replace(/\b&\b/g, "&")
      .replace(/\band\b/gi, "&")
      .split(/\s+/)
      .map((w) => {
        const k = Object.keys(DEPT_WORD_ABBR).find((kk) => new RegExp(`^${kk}$`, "i").test(w));
        return k ? DEPT_WORD_ABBR[k] : w;
      })
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim();

  const abbreviateAddress = (s: string) =>
    (s ?? "")
      .replace(/\bBarangay\b/gi, "Brgy.")
      .replace(/\bDistrict\b/gi, "Dist.")
      .replace(/\bAvenue\b/gi, "Ave.")
      .replace(/\bStreet\b/gi, "St.")
      .replace(/\bRoad\b/gi, "Rd.")
      .replace(/\bSubdivision\b/gi, "Subd.");

  /* ===== TYPES ===== */
  type Rect = { x: number; top: number; w: number; h: number; align?: "left" | "right" | "center" };

  /* ===== COST LABELS ===== */
  const COST_LABELS: Record<string, string> = {
    food: "Food",
    driversAllowance: "Driver’s allowance",
    rentVehicles: "Rent vehicles",
    hiredDrivers: "Hired drivers",
    accommodation: "Accommodation",
    total: "Total",
  };

  /* ===== SIGNATURE & DATA HELPERS ===== */
  function dataUrlToBytes(dataUrl: string): Uint8Array {
    const base64 = dataUrl.split(",")[1] ?? "";
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(String(r.result));
      r.readAsDataURL(blob);
    });
  }
  async function toDataUrlFromAny(input: any): Promise<string | null> {
    if (!input) return null;
    if (typeof input === "string" && input.startsWith("data:image/")) return input;
    if (typeof input === "string" && (input.startsWith("http") || input.startsWith("/"))) {
      try {
        const buf = await fetch(input).then((r) => r.blob());
        return await blobToDataURL(buf);
      } catch { return null; }
    }
    if (typeof Blob !== "undefined" && input instanceof Blob) return blobToDataURL(input);
    if (typeof HTMLImageElement !== "undefined" && input instanceof HTMLImageElement) {
      if (input.src?.startsWith("data:image/")) return input.src;
      const canvas = document.createElement("canvas");
      canvas.width = input.naturalWidth || input.width;
      canvas.height = input.naturalHeight || input.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(input, 0, 0);
      return canvas.toDataURL("image/png");
    }
    if (typeof HTMLCanvasElement !== "undefined" && input instanceof HTMLCanvasElement) {
      return input.toDataURL("image/png");
    }
    return null;
  }

  // Endorser (department head) signature (LEFT)
  async function getEndorserSignatureDataUrl(data: AdminRequest): Promise<string | null> {
    const t = (data as any)?.travelOrder ?? {};
    const candidates = [
      t.endorsedByHeadSignature, t.endorsedSignature, t.endorsedSignatureUrl,
      t.signature, (data as any)?.signature,
    ];
    for (const c of candidates) {
      const u = await toDataUrlFromAny(c);
      if (u) return u;
    }
    if (typeof document !== "undefined") {
      const el = document.getElementById("endorse-signature");
      if (el instanceof HTMLCanvasElement || el instanceof HTMLImageElement) {
        return await toDataUrlFromAny(el);
      }
    }
    return null;
  }

  // School Transportation Coordinator / Approver signature (RIGHT)
  async function getCoordinatorSignatureDataUrl(data: AdminRequest): Promise<string | null> {
    const candidates = [
      (data as any)?.signature,           // saved by approve flow
      (data as any)?.approverSignature,
      (data as any)?.approvedSignature,
      (data as any)?.approved?.signature,
      (data as any)?.approvalSignature,
    ];
    for (const c of candidates) {
      const u = await toDataUrlFromAny(c);
      if (u) return u;
    }
    return null;
  }

  const toNumber = (v: unknown) =>
    typeof v === "number" ? v : typeof v === "string" ? Number(v) || 0 : 0;

  function computeTravelTotalFromCosts(c: any): number {
    const base =
      toNumber(c.food) +
      toNumber(c.driversAllowance) +
      toNumber(c.rentVehicles) +
      toNumber(c.hiredDrivers) +
      toNumber(c.accommodation);
    const otherItemsTotal = Array.isArray(c.otherItems)
      ? c.otherItems.reduce((s: number, it: any) => s + toNumber(it?.amount), 0)
      : 0;
    const singleOther = c.otherLabel ? toNumber(c.otherAmount) : 0;
    return base + otherItemsTotal + singleOther;
  }

  function getString(v: any): string {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (typeof v === "object") return v.name ?? v.label ?? v.title ?? v.plateNo ?? v.plate ?? v.value ?? "";
    return "";
  }
  function resolveDriver(req: AdminRequest): string {
    const t: any = (req as any)?.travelOrder ?? {};
    return (
      getString((req as any)?.driver) ||
      getString(t.driver) ||
      getString(t.schoolService?.driver) ||
      getString(t.schoolService?.driverName) ||
      getString(t.selectedDriver) ||
      getString(t.selectedDriverName) ||
      getString(t.assignedDriver) ||
      getString(t.assignedDriverName) ||
      ""
    );
  }
  function resolveVehicle(req: AdminRequest): string {
    const t: any = (req as any)?.travelOrder ?? {};
    return (
      getString((req as any)?.vehicle) ||
      getString(t.vehicle) ||
      getString(t.schoolService?.vehicle) ||
      getString(t.schoolService?.vehicleName) ||
      getString(t.selectedVehicle) ||
      getString(t.selectedVehicleName) ||
      getString(t.assignedVehicle) ||
      getString(t.assignedVehicleName) ||
      ""
    );
  }

  /* ===== DRAW HELPERS ===== */
  const tx = (x: number) => x + OFFSET_X;
  const tty = (t: number) => t + OFFSET_TOP;

  /** Prevent Destination from bleeding into the right column */
  const RIGHT_EDGE = 565;
  const clampToRightEdge = (rect: Rect): Rect => ({ ...rect, w: Math.min(rect.w, Math.max(0, RIGHT_EDGE - rect.x)) });

  try {
    /* 1) Load template */
    const template = await fetch("/Travel-Order_Rev12_Jan2024.pdf").then((r) => r.arrayBuffer());

    /* 2) Prepare PDF */
    const pdfDoc = await PDFDocument.load(template);
    const page = pdfDoc.getPages()[0];
    const PAGE_W = page.getWidth();
    const PAGE_H = page.getHeight();

    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    function drawInRect(
      text: string,
      rect: Rect,
      opts: { size?: number; strong?: boolean; color?: [number, number, number]; align?: Rect["align"] } = {}
    ) {
      const t = (text ?? "").toString();
      const size = opts.size ?? 10;
      const f = opts.strong ? bold : font;
      const color = opts.color ? rgb(...opts.color) : rgb(0, 0, 0);

      const xL = tx(rect.x) + PAD_X;
      const top = tty(rect.top);
      const innerW = rect.w - PAD_X * 2;
      const align = opts.align ?? rect.align ?? "left";

      const tw = f.widthOfTextAtSize(t, size);
      let drawX = xL;
      if (align === "right")  drawX = xL + innerW - tw;
      if (align === "center") drawX = xL + (innerW - tw) / 2;

      const baselineY = PAGE_H - (top + (rect.h - size) / 2 + size);
      page.drawText(t, { x: drawX, y: baselineY, size, font: f, color });

      if (SHOW_BOXES) {
        const y = PAGE_H - (top + rect.h);
        page.drawRectangle({
          x: xL - PAD_X, y, width: rect.w, height: rect.h,
          borderColor: rgb(0, 0.5, 1), borderWidth: 0.7, color: rgb(0, 0.5, 1), opacity: 0.05,
        });
      }
    }

    function drawAutoFitEllipsis(
      text: string,
      rect: Rect,
      opts: { baseSize?: number; minSize?: number; strong?: boolean; maxLines?: number; align?: Rect["align"] } = {}
    ) {
      const base = opts.baseSize ?? 10;
      const min  = opts.minSize ?? 8;
      const maxL = Math.max(1, opts.maxLines ?? 2);
      const align = opts.align ?? rect.align ?? "left";
      const f = opts.strong ? bold : font;

      for (let size = base; size >= min; size -= 0.5) {
        const usableW = rect.w - PAD_X * 2;
        const words = (text ?? "").toString().split(/\s+/);
        const lines: string[] = [];
        let cur = "";
        for (const w of words) {
          const cand = cur ? `${cur} ${w}` : w;
          if (f.widthOfTextAtSize(cand, size) <= usableW || cur === "") cur = cand;
          else { lines.push(cur); cur = w; }
        }
        if (cur) lines.push(cur);

        let out = lines.slice(0, maxL);
        if (lines.length > maxL) {
          let last = out[out.length - 1];
          while (f.widthOfTextAtSize(last + "…", size) > usableW && last.length > 0) last = last.slice(0, -1);
          out[out.length - 1] = last + "…";
        }

        const lineH = size + 2;
        const totalH = out.length * lineH;
        if (totalH <= rect.h + 0.1) {
          const xBase = tx(rect.x) + PAD_X;
          const top   = tty(rect.top);
          for (let i = 0; i < out.length; i++) {
            const line = out[i];
            const tw = f.widthOfTextAtSize(line, size);
            const innerW = rect.w - PAD_X * 2;
            let drawX = xBase;
            if (align === "right")  drawX = xBase + innerW - tw;
            if (align === "center") drawX = xBase + (innerW - tw) / 2;
            const y = PAGE_H - (top + size + i * lineH);
            page.drawText(line, { x: drawX, y, size, font: f, color: rgb(0,0,0) });
          }
          if (SHOW_BOXES) {
            const y = PAGE_H - (top + rect.h);
            page.drawRectangle({
              x: xBase - PAD_X, y, width: rect.w, height: rect.h,
              borderColor: rgb(1,0,0), borderWidth: 0.8, color: rgb(1,0,0), opacity: 0.06,
            });
          }
          return;
        }
      }
      drawInRect(text, rect, { size: min, strong: opts.strong, align });
    }

    // Generic image drawer
    async function drawImageInRect(dataUrl: string | null, rect: Rect, opacity = 0.95) {
      if (!dataUrl) return;
      const bytes = dataUrlToBytes(dataUrl);
      const isPng = dataUrl.startsWith("data:image/png");
      const img = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);

      const x = tx(rect.x);
      const top = tty(rect.top);
      const y = PAGE_H - (top + rect.h);

      const iw = img.width, ih = img.height;
      const scale = Math.min(rect.w / iw, rect.h / ih);
      const dw = iw * scale, dh = ih * scale;
      const dx = x + (rect.w - dw) / 2;
      const dy = y + (rect.h - dh) / 2;

      page.drawImage(img, { x: dx, y: dy, width: dw, height: dh, opacity });

      if (SHOW_BOXES) {
        page.drawRectangle({ x, y, width: rect.w, height: rect.h,
          borderColor: rgb(0,0.5,1), borderWidth: 0.7, color: rgb(0,0.5,1), opacity: 0.06 });
      }
    }

    /* 3) Optional grid rulers */
    if (SHOW_GRID) {
      const step = 50;
      for (let t = 0; t <= Math.ceil(PAGE_H); t += step) {
        const y = PAGE_H - t;
        page.drawLine({ start: { x: 0, y }, end: { x: PAGE_W, y }, thickness: 0.2, color: rgb(0.7,0.7,0.7) });
        page.drawText(`${t}`, { x: 2, y: y + 1, size: 6, font, color: rgb(0.4,0.4,0.4) });
      }
      for (let x = 0; x <= Math.ceil(PAGE_W); x += step) {
        page.drawLine({ start: { x, y: 0 }, end: { x, y: PAGE_H }, thickness: 0.2, color: rgb(0.7,0.7,0.7) });
        page.drawText(`${x}`, { x: x + 1, y: 2, size: 6, font, color: rgb(0.4,0.4,0.4) });
      }
    }

    /* 4) Static rects (tuned for your Rev12 template) */
    const R: Record<string, Rect> = {
      createdDate: { x: 100, top: 123, w: 150, h: 14 },

      requestingPerson:   { x: 150, top: 180, w: 210, h: 14 },
      requesterSignature: { x: 200, top: 170, w: 120, h: 26 },

      department:  { x: 450, top: 169, w: 146, h: 42 },
      destination: { x: 150, top: 205, w: 446, h: 32 },

      departureDate: { x: 150, top: 235, w: 210, h: 14 },
      returnDate:    { x: 450, top: 235, w: 150, h: 14 },

      purposeOfTravel: { x: 150, top: 260, w: 446, h: 26 },

      // LEFT (Dept Head)
      endorsedByName:    { x: 125, top: 400, w: 260, h: 14 },
      endorsedSignature: { x:  85, top: 380, w: 180, h: 34 },

      // RIGHT (School Transportation Coordinator — where you want the admin/approval signature)
      stcSignature: { x: 340, top: 455, w: 200, h: 34 },  // signature over the right line
      stcName:      { x: 430, top: 515, w: 260, h: 14 },  // printed name below the line

      driver:  { x: 110, top: 470, w: 210, h: 14 },
      vehicle: { x: 110, top: 485, w: 210, h: 14 },
    };

    /* 5) Write values */
    const created = (req as any)?.createdAt ? fmtLongDate((req as any).createdAt) : fmtLongDate();
    drawInRect(created, R.createdDate);

    drawInRect(req.travelOrder?.requestingPerson ?? "", R.requestingPerson);
    await drawImageInRect(await getEndorserSignatureDataUrl(req), R.requesterSignature, 0.95);

    const dept = abbreviateDepartment(req.travelOrder?.department ?? "");
    drawAutoFitEllipsis(dept, R.department, { baseSize: 10, minSize: 8, maxLines: 3 });

    const dest = abbreviateAddress(req.travelOrder?.destination ?? "");
    drawAutoFitEllipsis(dest, clampToRightEdge(R.destination), { baseSize: 10, minSize: 8, maxLines: 2 });

    drawInRect(req.travelOrder?.departureDate ? fmtLongDate(req.travelOrder?.departureDate) : "", R.departureDate);
    drawInRect(req.travelOrder?.returnDate ? fmtLongDate(req.travelOrder?.returnDate) : "", R.returnDate);
    drawAutoFitEllipsis(req.travelOrder?.purposeOfTravel ?? "", R.purposeOfTravel, {
      baseSize: 10, minSize: 8, maxLines: 2,
    });

    /* ===== COSTS (3-column, column-major grid) ===== */
    const GRID = {
      cols: 4,
      maxRowsPerCol: 4,
      x: [150, 270, 365],
      topStart: 295,
      rowStep: 8,
      colWidth: 145,
      lineHeight: 0,
      fontSize: 8,
    };

    const c: any = req.travelOrder?.costs || {};
    const baseItems: { label: string; value: number }[] = [
      { label: COST_LABELS.food,             value: toNumber(c.food) },
      { label: COST_LABELS.driversAllowance, value: toNumber(c.driversAllowance) },
      { label: COST_LABELS.rentVehicles,     value: toNumber(c.rentVehicles) },
      { label: COST_LABELS.hiredDrivers,     value: toNumber(c.hiredDrivers) },
      { label: COST_LABELS.accommodation,    value: toNumber(c.accommodation) },
    ].filter((it) => it.value > 0);

    const others: { label: string; value: number }[] = [];
    if (c.otherLabel && toNumber(c.otherAmount) > 0) {
      others.push({ label: String(c.otherLabel), value: toNumber(c.otherAmount) });
    }
    if (Array.isArray(c.otherItems)) {
      for (const it of c.otherItems) {
        const v = toNumber(it?.amount);
        const lbl = (it?.label ?? "").toString();
        if (lbl && v > 0) others.push({ label: lbl, value: v });
      }
    }

    const items: { label: string; value: number }[] = [...baseItems, ...others];
    const total = items.reduce((s, it) => s + it.value, 0);
    if (items.length > 0) items.push({ label: COST_LABELS.total, value: total });

    if (items.length > 0) {
      const maxRows = GRID.maxRowsPerCol;
      const size = GRID.fontSize;

      items.forEach((it, idx) => {
        const col = Math.floor(idx / maxRows);
        const row = idx % maxRows;
        const colX = GRID.x[col] ?? GRID.x[GRID.x.length - 1];
        const top  = GRID.topStart + row * GRID.rowStep;

        const rect: Rect = { x: colX, top, w: GRID.colWidth, h: GRID.lineHeight, align: "left" };
        const isTotal = it.label === COST_LABELS.total;
        const text = `${it.label} – ${peso(it.value)}`;
        drawInRect(text, rect, { size, strong: isTotal });
      });
    }

    /* Endorsement (left) & School Service (right) */
    drawInRect(req.travelOrder?.endorsedByHeadName ?? "", R.endorsedByName);
    await drawImageInRect(await getEndorserSignatureDataUrl(req), R.endorsedSignature, 0.95);

    // RIGHT SIDE — School Transportation Coordinator (fixed name on your template)
    await drawImageInRect(await getCoordinatorSignatureDataUrl(req), R.stcSignature, 0.95);

    // Driver / Vehicle text (left under ‘School Service Request’)
    drawInRect(resolveDriver(req),  R.driver);
    drawInRect(resolveVehicle(req), R.vehicle);

    /* 6) Save */
    const bytes = await pdfDoc.save();
    return bytes;
  } catch (err) {
    console.error("PDF generation failed:", err);
    throw new Error("Failed to generate Travel Order PDF.");
  }
}
