import { useRef } from 'react';
import { IoPause, IoPlay } from 'react-icons/io5';
import { FaFileUpload } from 'react-icons/fa';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path to local file
pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;

function RsvpPanel({
  isPlaying,
  onToggle,
  textValue,
  onTextChange,
  wpm,
  minWpm,
  maxWpm,
  onWpmChange,
  onUpload,
  onStep,
  onWordJump,
}) {
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Handle PDF files
    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item) => item.str)
            .join(' ');
          fullText += pageText + ' ';
        }

        // Pass only text content
        onUpload?.(fullText.trim());
      } catch (error) {
        console.error('Error parsing PDF:', error);
      }
      event.target.value = '';
      return;
    }

    // Handle text files
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = () => {
        const content = typeof reader.result === 'string' ? reader.result : '';
        onUpload?.(content);
      };
      reader.readAsText(file);
      event.target.value = '';
      return;
    }

    // Unsupported file type
    event.target.value = '';
  };

  const handleTextareaClick = (event) => {
    const cursorPosition = event.target.selectionStart;
    onWordJump?.(cursorPosition);
  };

  const handleKeyDown = (event) => {
    // Allow: Ctrl/Cmd+V (paste), Ctrl/Cmd+A (select all), Ctrl/Cmd+C (copy), Ctrl/Cmd+X (cut)
    // Allow: Tab, Escape, Arrow keys, Home, End
    // Block: All character input
    const isCtrlCmd = event.ctrlKey || event.metaKey;
    const allowedKeys = ['v', 'a', 'c', 'x', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    
    if (isCtrlCmd && allowedKeys.includes(event.key.toLowerCase())) {
      return; // Allow shortcuts
    }
    
    if (['Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      return; // Allow navigation
    }
    
    // Block all other keys (character input, backspace, delete, enter, etc.)
    event.preventDefault();
  };

  return (
    <section className="rsvp-panel">
      <div className="panel-controls">
        <button
          className="primary-button"
          type="button"
          onClick={onToggle}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <IoPause size={28} aria-hidden="true" />
          ) : (
            <IoPlay size={28} aria-hidden="true" />
          )}
        </button>
        <button
          className="secondary-button"
          type="button"
          aria-label="Upload text"
          onClick={handleUploadClick}
        >
          <FaFileUpload size={28} aria-hidden="true" color="#fff" />
        </button>
        <button
          className="secondary-button"
          type="button"
          aria-label="Previous word"
          onClick={() => onStep?.('back')}
        >
          <FaChevronLeft size={18} aria-hidden="true" color="#fff" />
        </button>
        <button
          className="secondary-button"
          type="button"
          aria-label="Next word"
          onClick={() => onStep?.('forward')}
        >
          <FaChevronRight size={18} aria-hidden="true" color="#fff" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,text/plain,application/pdf"
          hidden
          onChange={handleFileChange}
        />
        <div className="slider-group">
          <label htmlFor="wpm-slider">{wpm} WPM</label>
          <input
            id="wpm-slider"
            type="range"
            min={minWpm}
            max={maxWpm}
            step={10}
            value={wpm}
            onChange={(e) => onWpmChange(Number(e.target.value))}
          />
        </div>
        <span className="textarea-hint">Click any word to jump to it.</span>
      </div>
      <div className="textarea-stack">
        <textarea
          id="rsvp-input"
          value={textValue}
          onChange={onTextChange}
          onClick={handleTextareaClick}
          onKeyDown={handleKeyDown}
          placeholder="Paste text here..."
          rows={5}
        />
      </div>
    </section>
  );
}

export default RsvpPanel;
