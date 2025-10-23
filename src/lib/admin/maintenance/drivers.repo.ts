import type { Driver } from "./maintenance.types";

export const DriverRepo = {
  list(): Driver[] {
    return [
      { id: "drv-ramon", name: "Ramon Dela Cruz" },
      { id: "drv-jose", name: "Jose Bautista" },
      { id: "drv-gina", name: "Gina Santos" },
    ];
  },
};
