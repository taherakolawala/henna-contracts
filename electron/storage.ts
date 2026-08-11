import { app } from "electron";
import * as fs from "fs";
import * as path from "path";
import type { Contract, ContractSummary } from "../shared/types";

function contractsDir(): string {
  const dir = path.join(app.getPath("userData"), "contracts");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function jsonPath(id: string): string {
  return path.join(contractsDir(), `${id}.json`);
}

export function pdfPath(id: string): string {
  return path.join(contractsDir(), `${id}.pdf`);
}

export function listContracts(): ContractSummary[] {
  const dir = contractsDir();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const summaries: ContractSummary[] = [];
  for (const f of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, f), "utf-8");
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
}

export function loadContract(id: string): Contract | null {
  const p = jsonPath(id);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as Contract;
  } catch {
    return null;
  }
}

export function saveContract(contract: Contract): void {
  contract.updatedAt = new Date().toISOString();
  fs.writeFileSync(jsonPath(contract.id), JSON.stringify(contract, null, 2), "utf-8");
}

export function deleteContract(id: string): void {
  const j = jsonPath(id);
  const p = pdfPath(id);
  if (fs.existsSync(j)) fs.unlinkSync(j);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}
