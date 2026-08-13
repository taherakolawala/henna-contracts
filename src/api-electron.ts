import type { Contract, ContractSummary } from "../shared/types";
import type { AppApi } from "./api";
import { generatePdfBytes } from "./pdfClient";

interface ElectronBridge {
  listContracts: () => Promise<ContractSummary[]>;
  loadContract: (id: string) => Promise<Contract | null>;
  saveContract: (contract: Contract, pdfBytes: Uint8Array) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  downloadPdf: (
    id: string,
    pdfBytes: Uint8Array
  ) => Promise<{ path: string } | null>;
  newId: () => Promise<string>;
}

function bridge(): ElectronBridge {
  return (window as any).api as ElectronBridge;
}

export const electronApi: AppApi = {
  listContracts: () => bridge().listContracts(),
  loadContract: (id) => bridge().loadContract(id),
  saveContract: async (contract) => {
    const bytes = await generatePdfBytes(contract);
    await bridge().saveContract(contract, bytes);
  },
  deleteContract: (id) => bridge().deleteContract(id),
  downloadPdf: async (id) => {
    const contract = await bridge().loadContract(id);
    if (!contract) return;
    const bytes = await generatePdfBytes(contract);
    await bridge().downloadPdf(id, bytes);
  },
  newId: () => bridge().newId(),
};
