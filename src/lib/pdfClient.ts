import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const MAX_CHARS_FOR_CONTEXT = 12000;

export interface ExtractedPdf {
  fullText: string;
  truncatedForAI: string;
  pageCount: number;
}

export async function extractPdfText(file: File): Promise<ExtractedPdf> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const pageText = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');

    fullText += `\n\n--- Page ${i} ---\n${pageText}`;
  }

  return {
    fullText: fullText.trim(),
    truncatedForAI: fullText.trim().slice(0, MAX_CHARS_FOR_CONTEXT),
    pageCount: pdf.numPages,
  };
}
