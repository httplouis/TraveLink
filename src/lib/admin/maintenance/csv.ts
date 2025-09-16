import type { Maintenance } from "./types";

export function toCSV(rows: Maintenance[]): string {
  const head = [
    "ID","VehicleCode","Plate","Type","Description","OdometerKm",
    "RequestDate","ServiceDate","Status","Remarks","UpdatedAt"
  ];
  const lines = rows.map(r => [
    r.id, r.vehicleCode, r.plateNo, r.type, r.description, r.odometerKm,
    r.requestDate, r.serviceDate ?? "", r.status, r.remarks ?? "", r.updatedAt
  ].map(x => `"${String(x).replaceAll('"','""')}"`).join(","));
  return [head.join(","), ...lines].join("\n");
}
