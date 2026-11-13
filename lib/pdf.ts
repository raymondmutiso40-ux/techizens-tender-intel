import { extractText, getDocumentProxy } from "unpdf";

export async function pdfPages(buf: ArrayBuffer): Promise<string[]> {
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: false });
  return text as string[];
}