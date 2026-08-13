import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { Contract } from "../shared/types";
import { buildPdfDocDefinition } from "../shared/pdfDoc";

function resolveVfs(): Record<string, string> {
  const pf: any = pdfFonts as any;
  const candidates = [
    pf?.pdfMake?.vfs,
    pf?.vfs,
    pf?.default?.vfs,
    pf?.default,
    pf,
  ];
  const vfs = candidates.find(
    (c) => c && typeof c === "object" && "Roboto-Regular.ttf" in c
  );
  if (!vfs) {
    throw new Error(
      "pdfmake fonts (vfs_fonts) did not expose Roboto TTFs in any known shape"
    );
  }
  return vfs as Record<string, string>;
}

let installed = false;
function ensureFonts(): void {
  if (installed) return;
  const pm: any = pdfMake as any;
  pm.addVirtualFileSystem(resolveVfs());
  installed = true;
}

export async function generatePdfBlob(contract: Contract): Promise<Blob> {
  ensureFonts();
  const doc = buildPdfDocDefinition(contract);
  console.log("[pdfClient] createPdf, items:", doc.content?.length);
  const pdf = pdfMake.createPdf(doc, {});
  const blob: Blob = await (pdf as any).getBlob();
  console.log("[pdfClient] blob ready, size:", blob?.size);
  return blob;
}

export async function generatePdfBytes(contract: Contract): Promise<Uint8Array> {
  const blob = await generatePdfBlob(contract);
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}
