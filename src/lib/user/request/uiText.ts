// Centralized UI strings for the Request form
export type UIText = {
  title: string;
  requiredHint: string;

  date: { label: string; helper: string };
  requester: { label: string; placeholder: string };
  requesterSignature?: { title: string }; // new (used beside requester)

  dept: { label: string; placeholder: string };
  destination: { label: string; placeholder: string };

  departure: { label: string };
  return: { label: string };

  purpose: { label: string; placeholder: string };

  // Costs block (needed by CostsSection.view.tsx)
  costs?: {
    title: string;
    food: string;
    driversAllowance: string;
    rentVehicles: string;
    hiredDrivers: string;
    accommodation: string;
    amountPh: string; // hint text like "₱ 0.00"
  };

  // Justification (also used by Costs section)
  justification?: {
    label: string;
    placeholder: string;
  };

  // Endorsement block
  endorsedBy: {
    name: string;
    namePh?: string; // placeholder (fixes namePh error)
    date: string;
  };

  signature: {
    title: string;
    notSaved: string;
  };
};

export const UI_TEXT: UIText = {
  title: "Travel Order",
  requiredHint: "Required fields marked with *",

  date: {
    label: "Date",
    helper: "Select the date this request is created.",
  },

  requester: {
    label: "Requesting person",
    placeholder: "Juan Dela Cruz",
  },

  requesterSignature: {
    title: "Requesting person’s signature",
  },

  dept: {
    label: "Department",
    placeholder: "e.g., CBA, CCMS, ICT Department",
  },

  destination: {
    label: "Destination",
    placeholder: "City / Venue / School / Company",
  },

  departure: { label: "Departure date" },
  return: { label: "Return date" },

  purpose: {
    label: "Purpose of travel",
    placeholder: "Briefly explain what the trip is for",
  },

  costs: {
    title: "Travel Cost (estimate)",
    food: "Food",
    driversAllowance: "Driver’s allowance",
    rentVehicles: "Rent vehicles",
    hiredDrivers: "Hired drivers",
    accommodation: "Accommodation",
    amountPh: "₱ 0.00",
  },

  justification: {
    label: "Justification",
    placeholder: "Explain why these costs are needed…",
  },

  endorsedBy: {
    name: "Department Head’s Name and Signature",
    namePh: "e.g., Dean Roberto Cruz",
    date: "Date",
  },

  signature: {
    title: "Endorser signature",
    notSaved: "Signature will be required before submitting.",
  },
};
