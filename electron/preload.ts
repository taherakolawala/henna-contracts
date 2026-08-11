import { contextBridge, ipcRenderer } from "electron";
import type { Contract, ContractSummary } from "../shared/types";

const api = {
  listContracts: (): Promise<ContractSummary[]> =>
    ipcRenderer.invoke("contracts:list"),
  loadContract: (id: string): Promise<Contract | null> =>
    ipcRenderer.invoke("contracts:load", id),
  saveContract: (
    contract: Contract,
    pdfBytes: Uint8Array
  ): Promise<void> =>
    ipcRenderer.invoke("contracts:save", contract, pdfBytes),
  deleteContract: (id: string): Promise<void> =>
    ipcRenderer.invoke("contracts:delete", id),
  downloadPdf: (
    id: string,
    pdfBytes: Uint8Array
  ): Promise<{ path: string } | null> =>
    ipcRenderer.invoke("contracts:download", id, pdfBytes),
  newId: (): Promise<string> => ipcRenderer.invoke("contracts:newId"),
};

contextBridge.exposeInMainWorld("api", api);

export type Api = typeof api;
