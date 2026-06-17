/**
 * parser.js — Extracts plain text from PDF and DOCX files
 * Uses PDF.js for PDFs and mammoth.js for DOCX files.
 * Everything runs client-side — no data is uploaded anywhere.
 */

const Parser = (() => {
  'use strict';

  // Configure PDF.js worker (needed for reading PDFs)
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';

  /**
   * Extract text from a PDF file using PDF.js
   * Iterates over every page and concatenates text content.
   */
  async function parsePDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      text += pageText + '\n';
    }

    return text.trim();
  }

  /**
   * Extract text from a DOCX file using mammoth.js
   * Returns the raw text content of the document.
   */
  async function parseDOCX(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  }

  /**
   * Main entry point — detect file type and parse accordingly.
   * Supported: PDF (.pdf), DOCX (.docx)
   * Returns the extracted plain text.
   */
  async function parseResume(file) {
    const name = file.name.toLowerCase();

    if (name.endsWith('.pdf')) {
      return await parsePDF(file);
    } else if (name.endsWith('.docx')) {
      return await parseDOCX(file);
    } else {
      throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
    }
  }

  // Public API
  return { parseResume };
})();
