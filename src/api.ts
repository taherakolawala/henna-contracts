import type { Contract, ContractSummary } from "../shared/types";
import { electronApi } from "./api-electron";
import { capacitorApi } from "./api-capacitor";

export interface AppApi {
  listContracts: () => Promise<ContractSummary[]>;
  loadContract: (id: string) => Promise<Contract | null>;
  saveContract: (contract: Contract) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  downloadPdf: (id: string) => Promise<void>;
  newId: () => Promise<string>;
}

function pickBackend(): AppApi {
  if (typeof window !== "undefined" && (window as any).api) {
    return electronApi;
  }
  return capacitorApi;
}

export const api: AppApi = pickBackend();
