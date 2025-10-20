// src/lib/admin/requests/pdfWithTemplate.ts
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { AdminRequest } from "@/lib/admin/requests/store";

/** Layout enum to avoid TS2367 literal-compare warnings */
enum CostMode { Column = "column", Row = "row" }

export async function generateRequestPDF(req: AdminRequest) {
  /* ===== DEV VISUALS ===== */
  const SHOW_BOXES = false; // field guides
  const SHOW_GRID = false;  // 50pt grid rulers

  /* ===== GLOBAL OFFSETS ===== */
  const OFFSET_X = 0;   // +right / -left
  const OFFSET_TOP = 0; // +down  / -up
  const PAD_X = 2;

  /* ===== HELPERS: format ===== */
  const peso = (val?: number | null) =>
    `PHP ${new Intl.NumberFormat("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(val ?? 0))}`;

  const fmtDate = (d?: string | number | Date | null) => {
    const dt = d ? new Date(d) : new Date();
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

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

  function abbreviateDepartment(raw: string) {
    if (!raw) return "";
    let s = raw.replace(/\bCollege of\b/gi, "C. of").replace(/\b&\b/g, "&").replace(/\band\b/gi, "&");
    s = s
      .split(/\s+/)
      .map((w) => {
        const key = Object.keys(DEPT_WORD_ABBR).find((k) => new RegExp(`^${k}$`, "i").test(w));
        return key ? DEPT_WORD_ABBR[key] : w;
      })
      .join(" ");
    return s.replace(/\s{2,}/g, " ").trim();
  }

  function abbreviateAddress(s: string) {
    return (s ?? "")
      .replace(/\bBarangay\b/gi, "Brgy.")
      .replace(/\bDistrict\b/gi, "Dist.")
      .replace(/\bAvenue\b/gi, "Ave.")
      .replace(/\bStreet\b/gi, "St.")
      .replace(/\bRoad\b/gi, "Rd.")
      .replace(/\bSubdivision\b/gi, "Subd.");
  }

  /* ===== TYPES ===== */
  type Rect = { x: number; top: number; w: number; h: number; align?: "left" | "right" | "center" };

  /* ===== COST LAYOUT =====
   * Items with 0 are filtered out before positioning.
   * Micro-nudge per item via COST_TWEAKS (applied post-layout).
   */
  let COST_MODE: CostMode =
    ((req as any)?.travelOrder?.costLayout === "column" ? CostMode.Column : CostMode.Row);

  // Column baseline (stacked in Travel Cost table)
  const COST_COL = {
    x: 380,   // start more left to fit "Label – Amount"
    top: 332,
    rowStep: 22,
    w: 280,
    h: 12,
  };

  // Row baseline (one line inside the Travel Cost area)
  const COST_ROW_BOUNDS = {
    left: 140,   // entire band start x (not per-slot)
    right: 550,  // entire band end x
    top: 325,    // vertical anchor (center of band)
    h: 12,
    minGap: 12,  // minimum gap between items in row layout
  };

  // Per-item micro nudges (applied AFTER layout)
  const COST_TWEAKS: Record<string, { dx: number; dtop: number; w: number; h: number }> = {
    food:             { dx: 4, dtop: -33, w: 0, h: 0 },
    driversAllowance: { dx: 0, dtop: 0, w: 0, h: 0 },
    rentVehicles:     { dx: 0, dtop: 0, w: 0, h: 0 },
    hiredDrivers:     { dx: 0, dtop: 0, w: 0, h: 0 },
    accommodation:    { dx: 0, dtop: -33, w: 0, h: 0 },
    total:            { dx: 0, dtop: -33, w: 0, h: 0 },
  };

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

  async function getSignatureDataUrl(data: AdminRequest): Promise<string | null> {
    const t = (data as any)?.travelOrder ?? {};
    const candidates = [
      t.endorsedByHeadSignature,
      t.endorsedSignature,
      t.endorsedSignatureUrl,
      t.signature,
      (data as any)?.signature,
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

  function toNumber(v: unknown): number {
    return typeof v === "number" ? v : typeof v === "string" ? Number(v) || 0 : 0;
  }

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

  function computeTravelTotal(req: AdminRequest): number {
    const c: any = req?.travelOrder?.costs || {};
    return computeTravelTotalFromCosts(c);
  }

  // Try many shapes for driver/vehicle (dropdowns, objects, labels)
  function getString(v: any): string {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (typeof v === "object") {
      return v.name ?? v.label ?? v.title ?? v.plateNo ?? v.plate ?? v.value ?? "";
    }
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

  /** Right-edge clamp so fields can never spill into the right area */
  const RIGHT_EDGE = 565; // tune once to match the vertical border of the Destination cell
  function clampToRightEdge(rect: Rect): Rect {
    const maxW = Math.max(0, RIGHT_EDGE - rect.x);
    return { ...rect, w: Math.min(rect.w, maxW) };
  }

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

    // Draw single-line, vertically centered text
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
      if (align === "right") drawX = xL + innerW - tw;
      if (align === "center") drawX = xL + (innerW - tw) / 2;

      const baselineY = PAGE_H - (top + (rect.h - size) / 2 + size);
      page.drawText(t, { x: drawX, y: baselineY, size, font: f, color });

      if (SHOW_BOXES) {
        const y = PAGE_H - (top + rect.h);
        page.drawRectangle({
          x: xL - PAD_X,
          y,
          width: rect.w,
          height: rect.h,
          borderColor: rgb(0, 0.5, 1),
          borderWidth: 0.7,
          color: rgb(0, 0.5, 1),
          opacity: 0.05,
        });
      }
    }

    // Multi-line with clamp & ellipsis
    function drawAutoFitEllipsis(
      text: string,
      rect: Rect,
      opts: { baseSize?: number; minSize?: number; strong?: boolean; maxLines?: number; align?: Rect["align"] } = {}
    ) {
      const base = opts.baseSize ?? 10;
      const min = opts.minSize ?? 8;
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
          else {
            lines.push(cur);
            cur = w;
          }
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
          const top = tty(rect.top);
          for (let i = 0; i < out.length; i++) {
            const line = out[i];
            const tw = f.widthOfTextAtSize(line, size);
            const innerW = rect.w - PAD_X * 2;
            let drawX = xBase;
            if (align === "right") drawX = xBase + innerW - tw;
            if (align === "center") drawX = xBase + (innerW - tw) / 2;
            const y = PAGE_H - (top + size + i * lineH);
            page.drawText(line, { x: drawX, y, size, font: f, color: rgb(0, 0, 0) });
          }
          if (SHOW_BOXES) {
            const y = PAGE_H - (top + rect.h);
            page.drawRectangle({
              x: xBase - PAD_X,
              y,
              width: rect.w,
              height: rect.h,
              borderColor: rgb(1, 0, 0),
              borderWidth: 0.8,
              color: rgb(1, 0, 0),
              opacity: 0.06,
            });
          }
          return;
        }
      }
      drawInRect(text, rect, { size: min, strong: opts.strong, align });
    }

    async function drawSignature(rect: Rect) {
      const dataUrl = await getSignatureDataUrl(req);
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

      page.drawImage(img, { x: dx, y: dy, width: dw, height: dh, opacity: 0.95 });

      if (SHOW_BOXES) {
        page.drawRectangle({ x, y, width: rect.w, height: rect.h,
          borderColor: rgb(0,0.5,1), borderWidth: 0.7, color: rgb(0,0.5,1), opacity: 0.06 });
      }
    }

    /* 3) GRID OVERLAY (optional) */
    if (SHOW_GRID) {
      const step = 50;
      for (let t = 0; t <= Math.ceil(PAGE_H); t += step) {
        const y = PAGE_H - t;
        page.drawLine({ start: { x: 0, y }, end: { x: PAGE_W, y }, thickness: 0.2, color: rgb(0.7, 0.7, 0.7) });
        page.drawText(`${t}`, { x: 2, y: y + 1, size: 6, font, color: rgb(0.4, 0.4, 0.4) });
      }
      for (let x = 0; x <= Math.ceil(PAGE_W); x += step) {
        page.drawLine({ start: { x, y: 0 }, end: { x, y: PAGE_H }, thickness: 0.2, color: rgb(0.7, 0.7, 0.7) });
        page.drawText(`${x}`, { x: x + 1, y: 2, size: 6, font, color: rgb(0.4, 0.4, 0.4) });
      }
    }

    /* 4) RECT MAP */
    const R: Record<string, Rect> = {
      createdDate: { x: 105, top: 125, w: 150, h: 14 },

      requestingPerson: { x: 150, top: 180, w: 210, h: 14 },

      department: { x: 450, top: 169, w: 146, h: 42 },

      // We'll clamp this one to RIGHT_EDGE at draw time
      destination: { x: 150, top: 205, w: 446, h: 32 },

      departureDate: { x: 150, top: 235, w: 210, h: 14 },
      returnDate: { x: 450, top: 235, w: 150, h: 14 },

      purposeOfTravel: { x: 150, top: 260, w: 446, h: 26 },

      // costs drawn dynamically below

      endorsedByName: { x: 125, top: 400, w: 260, h: 14 },
      endorsedSignature: { x: 85, top: 380, w: 180, h: 34 },

      driver: { x: 110, top: 470, w: 210, h: 14 },
      vehicle: { x: 110, top: 485, w: 210, h: 14 },
    };

    /* 5) WRITE FIELDS */
    const created = (req as any)?.createdAt ? fmtDate((req as any).createdAt) : fmtDate();
    drawInRect(created, R.createdDate);

    drawInRect(req.travelOrder?.requestingPerson ?? "", R.requestingPerson);

    const dept = abbreviateDepartment(req.travelOrder?.department ?? "");
    drawAutoFitEllipsis(dept, R.department, { baseSize: 10, minSize: 8, maxLines: 3 });

    const dest = abbreviateAddress(req.travelOrder?.destination ?? "");
    // ⬇️ Use the clamp so it never spills into the right-hand column
    drawAutoFitEllipsis(dest, clampToRightEdge(R.destination), { baseSize: 10, minSize: 8, maxLines: 2 });

    drawInRect(req.travelOrder?.departureDate ?? "", R.departureDate);
    drawInRect(req.travelOrder?.returnDate ?? "", R.returnDate);
    drawAutoFitEllipsis(req.travelOrder?.purposeOfTravel ?? "", R.purposeOfTravel, {
      baseSize: 10, minSize: 8, maxLines: 2,
    });

    /* 5a) COSTS: filter zero, lay out, draw */
    const c: any = req.travelOrder?.costs || {};
    const rawItems: { key: string; label: string; value: number }[] = [
      { key: "food",             label: COST_LABELS.food,             value: toNumber(c.food) },
      { key: "driversAllowance", label: COST_LABELS.driversAllowance, value: toNumber(c.driversAllowance) },
      { key: "rentVehicles",     label: COST_LABELS.rentVehicles,     value: toNumber(c.rentVehicles) },
      { key: "hiredDrivers",     label: COST_LABELS.hiredDrivers,     value: toNumber(c.hiredDrivers) },
      { key: "accommodation",    label: COST_LABELS.accommodation,    value: toNumber(c.accommodation) },
    ];

    // keep only > 0
    const visible = rawItems.filter((it) => it.value > 0);

    // compute total only from visible categories + any "other" amounts
    const baseSum = visible.reduce((s, it) => s + it.value, 0);
    const others =
      (Array.isArray(c.otherItems) ? c.otherItems.reduce((s: number, it: any) => s + toNumber(it?.amount), 0) : 0) +
      (c.otherLabel ? toNumber(c.otherAmount) : 0);
    const total = baseSum + others;

    if (visible.length > 0 || others > 0) {
      const itemsToDraw = [...visible, { key: "total", label: COST_LABELS.total, value: total }];

      if (COST_MODE === CostMode.Column) {
        // stacked
        itemsToDraw.forEach((it, i) => {
          const t = COST_TWEAKS[it.key] || { dx: 0, dtop: 0, w: 0, h: 0 };
          const rect: Rect = {
            x: COST_COL.x + t.dx,
            top: COST_COL.top + i * COST_COL.rowStep + t.dtop,
            w: COST_COL.w + t.w,
            h: COST_COL.h + t.h,
            align: "left",
          };
          drawInRect(`${it.label} – ${peso(it.value)}`, rect);
        });
      } else {
        // row: compute dynamic widths & spacing so everything fits between left..right
        const bandWidth = COST_ROW_BOUNDS.right - COST_ROW_BOUNDS.left;
        const size = 10;
        const slots = itemsToDraw.map((it) => {
          const text = `${it.label} – ${peso(it.value)}`;
          const tw = font.widthOfTextAtSize(text, size) + 12; // padding
          return { key: it.key, text, width: tw };
        });

        const totalText = slots.reduce((s, a) => s + a.width, 0);
        const gaps = Math.max(slots.length - 1, 0);
        let gap = COST_ROW_BOUNDS.minGap;
        if (totalText + gaps * gap > bandWidth && slots.length > 1) {
          gap = Math.max(6, (bandWidth - totalText) / gaps);
        }

        let cursor = COST_ROW_BOUNDS.left;
        slots.forEach((slot) => {
          const t = COST_TWEAKS[slot.key] || { dx: 0, dtop: 0, w: 0, h: 0 };
          const rect: Rect = {
            x: cursor + t.dx,
            top: COST_ROW_BOUNDS.top + t.dtop,
            w: slot.width + t.w,
            h: COST_ROW_BOUNDS.h + t.h,
            align: "left",
          };
          drawInRect(slot.text, rect);
          cursor += slot.width + gap;
        });
      }
    }

    /* 5b) Endorsement & school service */
    drawInRect(req.travelOrder?.endorsedByHeadName ?? "", R.endorsedByName);
    await drawSignature(R.endorsedSignature);

    drawInRect(resolveDriver(req), R.driver);
    drawInRect(resolveVehicle(req), R.vehicle);

    /* 6) SAVE */
    const bytes = await pdfDoc.save();
    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const blob = new Blob([ab], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(req as any)?.id ?? "TravelOrder"}_TravelOrder.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("Failed to generate Travel Order PDF.");
  }
}
