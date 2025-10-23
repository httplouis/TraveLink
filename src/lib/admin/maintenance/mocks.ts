import type {
  Attachment, Driver, MaintRecord, MaintStatus, MaintType, Vehicle,
} from "./maintenance.types";

const TYPES: MaintType[] = [
  "Preventive (PMS)", "Repair", "LTO Renewal", "Insurance Renewal", "Vulcanize/Tire", "Other",
];
const STATUSES: MaintStatus[] = [
  "Submitted", "Acknowledged", "In-Progress", "Completed", "Rejected",
];

const DOC_SVGS = [
  "/maintenance/docs-images/lto-cr.svg",
  "/maintenance/docs-images/lto-or.svg",
  "/maintenance/docs-images/insurance-card.svg",
];

function r<T>(a: T[]) { return a[Math.floor(Math.random() * a.length)]; }
function peso(n: number) { return Math.round(n * 100) / 100; }

export function buildDemoRecords(vehicles: Vehicle[], drivers: Driver[]): MaintRecord[] {
  const rows: MaintRecord[] = [];
  for (let i = 0; i < 12; i++) {
    const v = r(vehicles), d = r(drivers);
    const type = r(TYPES), status = r(STATUSES);

    // 1–3 doc-like images to simulate paperwork
    const attachments: Attachment[] = [];
    const count = 1 + Math.floor(Math.random() * 3);
    for (let k = 0; k < count; k++) {
      const url = r(DOC_SVGS);
      attachments.push({
        id: crypto.randomUUID(),
        name: url.split("/").pop() || `doc-${k + 1}.svg`,
        mime: "image/svg+xml",
        size: 2048,
        url,
      });
    }

    rows.push({
      id: crypto.randomUUID(),
      vehicleId: v.id,
      type,
      status,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 20) * 864e5)
        .toISOString().slice(0, 10),
      createdBy: "admin",
      description:
        type === "LTO Renewal" ? "LTO renewal documents prepared" :
        type === "Insurance Renewal" ? "CTPL policy renewal" :
        type === "Repair" ? "Replace alternator assembly" :
        type === "Preventive (PMS)" ? "Scheduled PMS (5k km)" :
        "Routine admin document",
      odometer: Math.floor(Math.random() * 60000),
      cost: status === "Completed" ? peso(500 + Math.random() * 15000) : undefined,
      vendor: r(["MSEUF Motorpool", "Isuzu Lucena", "3rd-Party Shop", ""]),
      nextDueDate: type === "Preventive (PMS)"
        ? new Date(Date.now() + 45 * 864e5).toISOString().slice(0, 10)
        : undefined,
      assignedDriverId: d.id,
      attachments,
      history: [{ at: new Date().toISOString(), by: "admin", from: "Submitted", to: status }] as any,
    });
  }
  return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
