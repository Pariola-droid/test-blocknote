import { Block, BlockNoteEditor, PartialBlock } from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView } from '@blocknote/react';
import '@blocknote/react/style.css';
import { saveAs } from 'file-saver';
import htmlToPdf from 'html-to-pdf';
import { useEffect, useMemo, useState } from 'react';

async function saveToStorage(jsonBlocks: Block[]) {
  // Save contents to local storage. You might want to debounce this or replace
  // with a call to your API / database.
  localStorage.setItem('editorContent', JSON.stringify(jsonBlocks));
}

async function loadFromStorage() {
  // Gets the previously stored editor contents.
  const storageString = localStorage.getItem('editorContent');
  return storageString
    ? (JSON.parse(storageString) as PartialBlock[])
    : undefined;
}

export default function App() {
  const [initialContent, setInitialContent] = useState<
    PartialBlock[] | undefined | 'loading'
  >('loading');
  const [markdown, setMarkdown] = useState<string>('');
  const [pdf, setPdf] = useState<Blob | null>(null);

  // Loads the previously stored editor contents.
  useEffect(() => {
    loadFromStorage().then((content) => {
      setInitialContent(content);
    });
  }, []);

  // Creates a new editor instance.
  // We use useMemo + createBlockNoteEditor instead of useCreateBlockNote so we
  // can delay the creation of the editor until the initial content is loaded.
  const editor = useMemo(() => {
    if (initialContent === 'loading') {
      return undefined;
    }
    return BlockNoteEditor.create({ initialContent });
  }, [initialContent]);

  if (editor === undefined) {
    return 'Loading content...';
  }

  const onChange = async () => {
    saveToStorage(editor.document);
    const markdown = await editor.blocksToMarkdownLossy(editor.document);
    const pdfHtml = await editor.blocksToHTMLLossy(editor.document);
    setMarkdown(markdown);
    // Convert HTML to PDF
    htmlToPdf()
      .set({ html: pdfHtml })
      .toPdf((generatedPdf: any) => {
        const pdfBlob = generatedPdf.output('blob');
        setPdf(pdfBlob);
      });
  };

  const handleDownloadMarkdown = () => {
    if (markdown.trim() !== '') {
      const blob = new Blob([markdown], { type: 'text/markdown' });
      saveAs(blob, 'blocknote_document.md');
    }
  };

  const handleDownloadPdf = () => {
    if (pdf) {
      saveAs(pdf, 'blocknote_document.pdf'); // Download the PDF using saveAs
    }
  };

  // Renders the editor instance.
  return (
    <div>
      <BlockNoteView editor={editor} onChange={onChange} />
      <button onClick={handleDownloadMarkdown}>Download Markdown</button>
      <button onClick={handleDownloadPdf}>Download PDF</button>
      <div>
        <pre>{markdown}</pre>
      </div>
    </div>
  );
}
