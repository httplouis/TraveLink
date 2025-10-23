import type { Vehicle } from "./maintenance.types";

export const VehiclesRepo = {
  list(): Vehicle[] {
    return [
      { id: "veh-bus-01", plate: "NAB-1234", name: "BUS-01" },
      { id: "veh-van-03", plate: "XAC-9687", name: "VAN-03" },
      { id: "veh-pu-02", plate: "TBA-4452", name: "Pickup-02" },
    ];
  },
};
