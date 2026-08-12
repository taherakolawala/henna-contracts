import { app, ipcMain, shell } from "electron";
import * as fs from "fs";
import * as path from "path";
import type { Contract } from "../shared/types";
import {
  listContracts,
  loadContract,
  saveContract,
  deleteContract,
  pdfPath,
} from "./storage";

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").trim();
  return cleaned || "Untitled";
}

function uniqueDownloadPath(dir: string, baseName: string): string {
  let candidate = path.join(dir, `${baseName}.pdf`);
  let i = 2;
  while (fs.existsSync(candidate)) {
    candidate = path.join(dir, `${baseName} (${i}).pdf`);
    i++;
  }
  return candidate;
}

function toBuffer(pdfBytes: Uint8Array | ArrayBuffer | number[]): Buffer {
  if (pdfBytes instanceof Uint8Array) return Buffer.from(pdfBytes);
  if (pdfBytes instanceof ArrayBuffer) return Buffer.from(new Uint8Array(pdfBytes));
  return Buffer.from(pdfBytes as number[]);
}

export function registerIpcHandlers(): void {
  ipcMain.handle("contracts:list", () => listContracts());

  ipcMain.handle("contracts:load", (_e, id: string) => loadContract(id));

  ipcMain.handle(
    "contracts:save",
    (_e, contract: Contract, pdfBytes: Uint8Array) => {
      saveContract(contract);
      fs.writeFileSync(pdfPath(contract.id), toBuffer(pdfBytes));
    }
  );

  ipcMain.handle("contracts:delete", (_e, id: string) => deleteContract(id));

  ipcMain.handle(
    "contracts:download",
    (_e, id: string, pdfBytes: Uint8Array) => {
      const contract = loadContract(id);
      if (!contract) return null;
      const downloadsDir = app.getPath("downloads");
      const clientName = sanitizeFilename(contract.client.name || "Untitled");
      const baseName = `Henna Contract - ${clientName}`;
      const dest = uniqueDownloadPath(downloadsDir, baseName);
      fs.writeFileSync(dest, toBuffer(pdfBytes));
      shell.showItemInFolder(dest);
      shell.openPath(dest);
      return { path: dest };
    }
  );

  ipcMain.handle("contracts:newId", () => {
    return (
      Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
    );
  });
}
