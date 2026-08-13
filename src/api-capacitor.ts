import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { Contract, ContractSummary } from "../shared/types";
import type { AppApi } from "./api";
import { generatePdfBlob } from "./pdfClient";

const CONTRACTS_DIR = "contracts";

async function ensureDir(): Promise<void> {
  try {
    await Filesystem.mkdir({
      path: CONTRACTS_DIR,
      directory: Directory.Data,
      recursive: true,
    });
  } catch {
    // exists
  }
}

function jsonPath(id: string): string {
  return `${CONTRACTS_DIR}/${id}.json`;
}

function pdfPath(id: string): string {
  return `${CONTRACTS_DIR}/${id}.pdf`;
}

function sanitizeFilename(name: string): string {
  const cleaned = (name || "").replace(/[<>:"/\\|?*\x00-\x1F]/g, "").trim();
  return cleaned || "Untitled";
}

function newRandomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const idx = dataUrl.indexOf(",");
      resolve(idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl);
    };
    reader.readAsDataURL(blob);
  });
}

async function writePdf(contract: Contract): Promise<string> {
  const blob = await generatePdfBlob(contract);
  const base64 = await blobToBase64(blob);
  await ensureDir();
  await Filesystem.writeFile({
    path: pdfPath(contract.id),
    data: base64,
    directory: Directory.Data,
  });
  return pdfPath(contract.id);
}

export const capacitorApi: AppApi = {
  async listContracts(): Promise<ContractSummary[]> {
    await ensureDir();
    let entries: { name: string }[] = [];
    try {
      const res = await Filesystem.readdir({
        path: CONTRACTS_DIR,
        directory: Directory.Data,
      });
      entries = res.files as any;
    } catch {
      return [];
    }
    const summaries: ContractSummary[] = [];
    for (const entry of entries) {
      const name = (entry as any).name || (entry as unknown as string);
      if (!name.endsWith(".json")) continue;
      try {
        const read = await Filesystem.readFile({
          path: `${CONTRACTS_DIR}/${name}`,
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        });
        const raw = read.data as string;
        const c = JSON.parse(raw) as Contract;
        summaries.push({
          id: c.id,
          clientName: c.client?.name || "",
          updatedAt: c.updatedAt,
        });
      } catch {
        // skip corrupt
      }
    }
    summaries.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    return summaries;
  },

  async loadContract(id: string): Promise<Contract | null> {
    try {
      const read = await Filesystem.readFile({
        path: jsonPath(id),
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      return JSON.parse(read.data as string) as Contract;
    } catch {
      return null;
    }
  },

  async saveContract(contract: Contract): Promise<void> {
    contract.updatedAt = new Date().toISOString();
    await ensureDir();
    await Filesystem.writeFile({
      path: jsonPath(contract.id),
      data: JSON.stringify(contract, null, 2),
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    await writePdf(contract);
  },

  async deleteContract(id: string): Promise<void> {
    for (const p of [jsonPath(id), pdfPath(id)]) {
      try {
        await Filesystem.deleteFile({
          path: p,
          directory: Directory.Data,
        });
      } catch {
        // ignore
      }
    }
  },

  async downloadPdf(id: string): Promise<void> {
    const contract = await this.loadContract(id);
    if (!contract) return;

    const clientName = sanitizeFilename(contract.client.name || "Untitled");
    const filename = `Henna Contract - ${clientName}.pdf`;

    const blob = await generatePdfBlob(contract);
    const base64 = await blobToBase64(blob);

    await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
    });

    const uri = await Filesystem.getUri({
      path: filename,
      directory: Directory.Cache,
    });

    await Share.share({
      title: filename,
      files: [uri.uri],
      dialogTitle: "Save or share contract PDF",
    });
  },

  async newId(): Promise<string> {
    return newRandomId();
  },
};
