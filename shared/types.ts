export interface EventEntry {
  id: string;
  name: string;
  date: string;
  location: string;
  address: string;
  timings: string;
  numArtists: string;
}

export interface LineItem {
  id: string;
  description: string;
  amount: string;
}

export interface EventPricing {
  eventId: string;
  lineItems: LineItem[];
}

export type DepositStatus = "Received" | "Not Received";

export interface Contract {
  id: string;
  createdAt: string;
  updatedAt: string;
  client: {
    name: string;
    phone: string;
    email: string;
    dateSigned: string;
  };
  events: EventEntry[];
  pricing: EventPricing[];
  deposit: {
    amount: string;
    status: DepositStatus;
    dateReceived: string;
  };
  photographyConsent: boolean;
}

export interface ContractSummary {
  id: string;
  clientName: string;
  updatedAt: string;
}

export function createEmptyContract(id: string): Contract {
  const now = new Date().toISOString();
  const firstEventId = cryptoRandomId();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    client: { name: "", phone: "", email: "", dateSigned: "" },
    events: [
      {
        id: firstEventId,
        name: "",
        date: "",
        location: "",
        address: "",
        timings: "",
        numArtists: "",
      },
    ],
    pricing: [{ eventId: firstEventId, lineItems: [] }],
    deposit: { amount: "90", status: "Not Received", dateReceived: "" },
    photographyConsent: true,
  };
}

function cryptoRandomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
