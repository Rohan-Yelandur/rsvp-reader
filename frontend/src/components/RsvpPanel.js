import { useRef, useEffect } from 'react';
import { IoPause, IoPlay } from 'react-icons/io5';
import { FaFileUpload, FaBookmark } from 'react-icons/fa';
import { FaChevronLeft, FaChevronRight, FaUniversalAccess } from 'react-icons/fa6';
import { MdOutlineClear, MdLightMode, MdDarkMode, MdHistory } from 'react-icons/md';
import { HiMiniMagnifyingGlassPlus } from 'react-icons/hi2';
import { CiTextAlignCenter } from 'react-icons/ci';
import { TbTheater } from 'react-icons/tb';
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
  onClear,
  isDarkMode,
  onThemeToggle,
  isWpmSliderVisible,
  onWpmToggle,
  onWpmSliderClose,
  fontSize,
  isFontSizeSliderVisible,
  onFontSizeToggle,
  onFontSizeChange,
  onFontSizeSliderClose,
  chunkSize,
  isChunkSizeSliderVisible,
  onChunkSizeToggle,
  onChunkSizeChange,
  onChunkSizeSliderClose,
  isAccessibilityVisible,
  onAccessibilityToggle,
  onAccessibilityClose,
  slowDownAtSentenceEnd,
  onSlowDownChange,
  breakAtSentenceEnd,
  onBreakAtSentenceEndChange,
  isTheaterMode,
  onTheaterModeToggle,
  highlightWords,
  onHighlightWordsChange,
  currentIndex,
  words,
  fileHistory,
  onHistoryToggle,
  isHistoryVisible,
  onLoadHistoryFile,
  bookmarks,
  onBookmarksToggle,
  isBookmarksVisible,
}) {
  const fileInputRef = useRef(null);
  const wpmContainerRef = useRef(null);
  const fontSizeContainerRef = useRef(null);
  const chunkSizeContainerRef = useRef(null);
  const accessibilityContainerRef = useRef(null);
  const textInputRef = useRef(null);

  // Auto-scroll to keep highlighted words visible
  useEffect(() => {
    if (!highlightWords || isTheaterMode || !textInputRef.current) {
      return;
    }

    const highlightedSpan = textInputRef.current.querySelector('.highlighted-word');
    if (highlightedSpan) {
      highlightedSpan.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [currentIndex, highlightWords, isTheaterMode]);

  // Click outside handler to close WPM slider
  useEffect(() => {
    if (!isWpmSliderVisible) {
      return;
    }

    const handleClickOutside = (event) => {
      if (wpmContainerRef.current && !wpmContainerRef.current.contains(event.target)) {
        onWpmSliderClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isWpmSliderVisible, onWpmSliderClose]);

  // Click outside handler to close font size slider
  useEffect(() => {
    if (!isFontSizeSliderVisible) {
      return;
    }

    const handleClickOutside = (event) => {
      if (fontSizeContainerRef.current && !fontSizeContainerRef.current.contains(event.target)) {
        onFontSizeSliderClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFontSizeSliderVisible, onFontSizeSliderClose]);

  // Click outside handler to close chunk size slider
  useEffect(() => {
    if (!isChunkSizeSliderVisible) {
      return;
    }

    const handleClickOutside = (event) => {
      if (chunkSizeContainerRef.current && !chunkSizeContainerRef.current.contains(event.target)) {
        onChunkSizeSliderClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isChunkSizeSliderVisible, onChunkSizeSliderClose]);

  // Click outside handler to close accessibility panel
  useEffect(() => {
    if (!isAccessibilityVisible) {
      return;
    }

    const handleClickOutside = (event) => {
      if (accessibilityContainerRef.current && !accessibilityContainerRef.current.contains(event.target)) {
        onAccessibilityClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAccessibilityVisible, onAccessibilityClose]);

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

        // Pass text content and file name
        onUpload?.(fullText.trim(), file.name);
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
        onUpload?.(content, file.name);
      };
      reader.readAsText(file);
      event.target.value = '';
      return;
    }

    // Unsupported file type
    event.target.value = '';
  };

  const handleTextareaClick = (event) => {
    // Find the closest word span that was clicked
    let target = event.target;
    
    // Traverse up to find a span with data-word-index
    while (target && target !== textInputRef.current) {
      if (target.hasAttribute && target.hasAttribute('data-word-index')) {
        const wordIndex = parseInt(target.getAttribute('data-word-index'), 10);
        if (!isNaN(wordIndex)) {
          onWordJump?.(wordIndex);
          return;
        }
      }
      target = target.parentElement;
    }
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

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    onTextChange({ target: { value: textValue + pastedText } });
  };

  return (
    <section className="rsvp-panel">
      <div className="panel-controls">
        <button
          className="primary-button"
          type="button"
          onClick={onToggle}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause reading' : 'Start reading'}
        >
          {isPlaying ? (
            <IoPause size={23} aria-hidden="true" />
          ) : (
            <IoPlay size={23} aria-hidden="true" />
          )}
        </button>
        <button
          className="primary-button"
          type="button"
          aria-label="Upload text"
          onClick={handleUploadClick}
          title="Upload text or PDF file"
        >
          <FaFileUpload size={23} aria-hidden="true" color="#fff" />
        </button>
        <button
          className="primary-button"
          type="button"
          aria-label="Previous word"
          onClick={() => onStep?.('back')}
          title="Go to previous word"
        >
          <FaChevronLeft size={23} aria-hidden="true" color="#fff" />
        </button>
        <button
          className="primary-button"
          type="button"
          aria-label="Next word"
          onClick={() => onStep?.('forward')}
          title="Go to next word"
        >
          <FaChevronRight size={23} aria-hidden="true" color="#fff" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,text/plain,application/pdf"
          hidden
          onChange={handleFileChange}
        />
        <div className="wpm-container" ref={wpmContainerRef}>
          <button
            className="primary-button wpm-button"
            type="button"
            aria-label="WPM settings"
            onClick={onWpmToggle}
            title="Adjust reading speed"
          >
            WPM
          </button>
          {isWpmSliderVisible && (
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
          )}
        </div>
        <div className="wpm-container" ref={fontSizeContainerRef}>
          <button
            className="primary-button wpm-button"
            type="button"
            aria-label="Font size settings"
            onClick={onFontSizeToggle}
            title="Adjust font size"
          >
            <HiMiniMagnifyingGlassPlus size={23} aria-hidden="true" color="#fff" />
          </button>
          {isFontSizeSliderVisible && (
            <div className="slider-group">
              <label htmlFor="font-size-slider">{fontSize}</label>
              <input
                id="font-size-slider"
                type="range"
                min={2}
                max={10}
                step={0.5}
                value={fontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
              />
            </div>
          )}
        </div>
        <div className="wpm-container" ref={chunkSizeContainerRef}>
          <button
            className="primary-button wpm-button"
            type="button"
            aria-label="Chunk size settings"
            onClick={onChunkSizeToggle}
            title="Adjust chunk size"
          >
            <CiTextAlignCenter size={23} aria-hidden="true" color="#fff" style={{ transform: 'rotate(90deg)' }} />
          </button>
          {isChunkSizeSliderVisible && (
            <div className="slider-group">
              <label htmlFor="chunk-size-slider">{chunkSize} word{chunkSize !== 1 ? 's' : ''}</label>
              <input
                id="chunk-size-slider"
                type="range"
                min={1}
                max={5}
                step={1}
                value={chunkSize}
                onChange={(e) => onChunkSizeChange(Number(e.target.value))}
              />
            </div>
          )}
        </div>
        <div className="wpm-container" ref={accessibilityContainerRef}>
          <button
            className="primary-button wpm-button"
            type="button"
            aria-label="Accessibility settings"
            onClick={onAccessibilityToggle}
            title="Toggle adaptive features"
          >
            <FaUniversalAccess size={23} aria-hidden="true" color="#fff" />
          </button>
          {isAccessibilityVisible && (
            <div className="checkbox-group">
              <label htmlFor="slow-down-checkbox" title="Pause at punctuation">
                <input
                  id="slow-down-checkbox"
                  type="checkbox"
                  checked={slowDownAtSentenceEnd}
                  onChange={(e) => onSlowDownChange(e.target.checked)}
                />
              </label>
              <label htmlFor="break-at-sentence-checkbox" title="Break chunks at sentence-ending punctuation">
                <input
                  id="break-at-sentence-checkbox"
                  type="checkbox"
                  checked={breakAtSentenceEnd}
                  onChange={(e) => onBreakAtSentenceEndChange(e.target.checked)}
                />
              </label>
              <label htmlFor="highlight-words-checkbox" title="Highlight words">
                <input
                  id="highlight-words-checkbox"
                  type="checkbox"
                  checked={highlightWords}
                  onChange={(e) => onHighlightWordsChange(e.target.checked)}
                />
              </label>
            </div>
          )}
        </div>
        <button
          className="primary-button"
          type="button"
          aria-label="Theater mode"
          onClick={onTheaterModeToggle}
          title="Toggle theater mode"
        >
          <TbTheater size={23} aria-hidden="true" color="#fff" />
        </button>
        <button
          className="primary-button"
          type="button"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={onThemeToggle}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? (
            <MdLightMode size={23} aria-hidden="true" color="#fff" />
          ) : (
            <MdDarkMode size={23} aria-hidden="true" color="#fff" />
          )}
        </button>
        <button
          className="primary-button"
          type="button"
          aria-label="Bookmarks"
          onClick={onBookmarksToggle}
          title="Bookmarks"
        >
          <FaBookmark size={20} aria-hidden="true" color="#fff" />
        </button>
        <button
          className="primary-button"
          type="button"
          aria-label="File history"
          onClick={onHistoryToggle}
          title="View file history"
        >
          <MdHistory size={23} aria-hidden="true" color="#fff" />
        </button>
        <button
          className="primary-button"
          type="button"
          aria-label="Clear text"
          onClick={onClear}
          title="Clear all text"
        >
          <MdOutlineClear size={23} aria-hidden="true" color="#fff" />
        </button>
        <span className="textarea-hint">Click any word to jump to it.</span>
      </div>
      <div className="textarea-stack">
        <div 
          ref={textInputRef}
          className="text-input"
          onClick={handleTextareaClick}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          data-placeholder={textValue ? '' : 'Upload or paste text here'}
          tabIndex={0}
          role="textbox"
          aria-multiline="true"
        >
          {textValue ? (
            (() => {
              const parts = [];
              
              // Virtualization: only render words in a window around current position
              const WINDOW_SIZE = 300; // Render ±300 words around current position
              const startIndex = Math.max(0, currentIndex - WINDOW_SIZE);
              const endIndex = Math.min(words.length, currentIndex + WINDOW_SIZE);
              
              // Find the text position for the start of our window
              let windowStartPos = 0;
              for (let i = 0; i < startIndex; i++) {
                const wordPos = textValue.indexOf(words[i], windowStartPos);
                if (wordPos !== -1) {
                  windowStartPos = wordPos + words[i].length;
                }
              }
              
              // If we're not starting at the beginning, add ellipsis
              if (startIndex > 0) {
                parts.push(
                  <span key="start-ellipsis" className="word-space" style={{ opacity: 0.5 }}>
                    ...
                  </span>
                );
              }
              
              let currentPos = windowStartPos;
              
              // Only process words in the visible window
              for (let index = startIndex; index < endIndex; index++) {
                const word = words[index];
                
                // Find the word in the text starting from current position
                const wordStart = textValue.indexOf(word, currentPos);
                if (wordStart === -1) continue;
                
                // Add any text before this word (whitespace/newlines) as plain text
                if (wordStart > currentPos) {
                  parts.push(
                    <span key={`space-${index}`} className="word-space">
                      {textValue.substring(currentPos, wordStart)}
                    </span>
                  );
                }
                
                // Add the word with highlighting if it's in the current chunk
                const isHighlighted = highlightWords && !isTheaterMode && index >= currentIndex && index < currentIndex + chunkSize;
                parts.push(
                  <span 
                    key={`word-${index}`} 
                    className={isHighlighted ? 'word-span highlighted-word' : 'word-span'}
                    data-word-index={index}
                  >
                    {word}
                  </span>
                );
                
                currentPos = wordStart + word.length;
              }
              
              // If we're not at the end, add ellipsis
              if (endIndex < words.length) {
                parts.push(
                  <span key="end-ellipsis" className="word-space" style={{ opacity: 0.5 }}>
                    ...
                  </span>
                );
              }
              
              return parts;
            })()
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default RsvpPanel;
