import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import HeroHeader from './components/HeroHeader';
import HeroWordDisplay from './components/HeroWordDisplay';
import RsvpPanel from './components/RsvpPanel';
import Footer from './components/Footer';
import TheaterControls from './components/TheaterControls';
import { DEFAULT_WPM, MAX_WPM, MIN_WPM, TYPED_WORDS, TYPING_DELAYS, SENTENCE_END_DELAY_MULTIPLIER, COMMA_DELAY_MULTIPLIER, HIGHLIGHT_COLOR_LIGHT, HIGHLIGHT_COLOR_DARK } from './config';
import { MdOutlineClear } from 'react-icons/md';
import { Analytics } from '@vercel/analytics/react';

function AddBookmarkForm({ onAdd, currentWord }) {
  const [label, setLabel] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (label.trim()) {
      onAdd(label);
      setLabel('');
    }
  };

  return (
    <form className="add-bookmark-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="bookmark-input"
        placeholder={`Bookmark current word: "${currentWord || ''}"`}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        autoFocus
      />
      <button type="submit" className="add-bookmark-button">
        Add Bookmark
      </button>
    </form>
  );
}

function App() {
  const [text, setText] = useState('Upload or paste text to start reading using the Rapid Serial Visual Presentation (RSVP) technique, which can more than double your reading speed. Feel free to adjust the speed, click back to words you missed, and toggle narration!');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wpm, setWpm] = useState(DEFAULT_WPM);
  const previousText = useRef(text);
  const [typedWord, setTypedWord] = useState('');
  const [isDeletingWord, setIsDeletingWord] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [fileName, setFileName] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [hasEverPlayed, setHasEverPlayed] = useState(false);
  const [isWpmSliderVisible, setIsWpmSliderVisible] = useState(false);
  const [fontSize, setFontSize] = useState(5);
  const [isFontSizeSliderVisible, setIsFontSizeSliderVisible] = useState(false);
  const [chunkSize, setChunkSize] = useState(1);
  const [isChunkSizeSliderVisible, setIsChunkSizeSliderVisible] = useState(false);
  const [isAccessibilityVisible, setIsAccessibilityVisible] = useState(false);
  const [slowDownAtSentenceEnd, setSlowDownAtSentenceEnd] = useState(true);
  const [breakAtSentenceEnd, setBreakAtSentenceEnd] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [highlightWords, setHighlightWords] = useState(true);
  const [fileHistory, setFileHistory] = useState([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [isBookmarksVisible, setIsBookmarksVisible] = useState(false);
  const [orpEnabled, setOrpEnabled] = useState(false);

  const words = useMemo(() => {
    return text
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }, [text]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.setProperty('--highlight-color', HIGHLIGHT_COLOR_DARK);
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.style.setProperty('--highlight-color', HIGHLIGHT_COLOR_LIGHT);
    }
  }, [isDarkMode]);

  // Handle fullscreen when entering/exiting theater mode
  useEffect(() => {
    if (isTheaterMode) {
      // Enter fullscreen
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
          console.error('Error attempting to enable fullscreen:', err);
        });
      } else if (elem.webkitRequestFullscreen) { // Safari
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { // IE11
        elem.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { // Safari
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE11
          document.msExitFullscreen();
        }
      }
    }
  }, [isTheaterMode]);

  // Handle escape key to exit theater mode
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isTheaterMode) {
        setIsTheaterMode(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isTheaterMode]);

  useEffect(() => {
    // Restart stream when user edits text while paused
    if (!isPlaying && previousText.current !== text) {
      setCurrentIndex(0);
    }
    previousText.current = text;
  }, [text, isPlaying]);

  useEffect(() => {
    if (!isPlaying || words.length === 0) {
      return undefined;
    }

    // Check if current chunk contains punctuation
    const currentChunk = words.slice(currentIndex, currentIndex + chunkSize).join(' ');
    const hasSentenceEnd = /[.!?]/.test(currentChunk);
    const hasCommaSemicolon = /[,;]/.test(currentChunk);
    
    // Apply delay multiplier based on punctuation type
    const baseIntervalMs = Math.round(60000 / wpm);
    let intervalMs = baseIntervalMs;
    
    if (slowDownAtSentenceEnd) {
      if (hasSentenceEnd) {
        intervalMs = baseIntervalMs * SENTENCE_END_DELAY_MULTIPLIER;
      } else if (hasCommaSemicolon) {
        intervalMs = baseIntervalMs * COMMA_DELAY_MULTIPLIER;
      }
    }
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + chunkSize;
        if (nextIndex >= words.length) {
          setIsPlaying(false);
          return prev;
        }
        return nextIndex;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, words.length, wpm, chunkSize, currentIndex, slowDownAtSentenceEnd, words]);

  const displayedWord = useMemo(() => {
    if (words.length === 0) {
      return 'Ready?';
    }
    
    let chunk = words.slice(currentIndex, currentIndex + chunkSize);
    
    // If breakAtSentenceEnd is enabled, chunkSize > 1, truncate at sentence-ending punctuation
    if (breakAtSentenceEnd && chunkSize > 1) {
      for (let i = 0; i < chunk.length; i++) {
        if (/[.!?]/.test(chunk[i])) {
          // Include the word with the punctuation, but cut off the rest
          chunk = chunk.slice(0, i + 1);
          break;
        }
      }
    }
    
    return chunk.join(' ');
  }, [words, currentIndex, chunkSize, breakAtSentenceEnd]);
  
  const shouldShowTyping = !isPlaying && currentIndex === 0 && !hasEverPlayed;
  const isWordComplete =
    shouldShowTyping && !isDeletingWord && typedWord === TYPED_WORDS[phraseIndex];

  useEffect(() => {
    if (!shouldShowTyping) {
      return;
    }

    const currentPhrase = TYPED_WORDS[phraseIndex];
    let timeoutId;

    if (!isDeletingWord && typedWord === currentPhrase) {
      timeoutId = setTimeout(() => setIsDeletingWord(true), TYPING_DELAYS.holdComplete);
    } else if (isDeletingWord && typedWord === '') {
      timeoutId = setTimeout(() => {
        setIsDeletingWord(false);
        setPhraseIndex((prev) => (prev + 1) % TYPED_WORDS.length);
      }, TYPING_DELAYS.holdEmpty);
    } else {
      timeoutId = setTimeout(() => {
        const nextText = isDeletingWord
          ? currentPhrase.slice(0, Math.max(typedWord.length - 1, 0))
          : currentPhrase.slice(0, typedWord.length + 1);
        setTypedWord(nextText);
      }, isDeletingWord ? TYPING_DELAYS.delete : TYPING_DELAYS.type);
    }

    return () => clearTimeout(timeoutId);
  }, [shouldShowTyping, typedWord, isDeletingWord, phraseIndex]);

  useEffect(() => {
    if (shouldShowTyping) {
      return;
    }
    setTypedWord('');
    setIsDeletingWord(false);
  }, [shouldShowTyping]);

  const handleToggle = () => {
    if (words.length === 0) {
      return;
    }

    setIsPlaying((prev) => {
      // Resume from last index; if we reached end, restart
      if (!prev && currentIndex >= words.length - 1) {
        setCurrentIndex(0);
      }
      return !prev;
    });
    setHasEverPlayed(true);
  };

  const handleWpmChange = (value) => {
    const clamped = Math.min(MAX_WPM, Math.max(MIN_WPM, Math.round(value / 10) * 10));
    setWpm(clamped);
  };

  const handleTextChange = (event) => {
    setText(event.target.value);
    if (isPlaying) {
      // Editing while playing resets so users see new content immediately
      setIsPlaying(false);
    }
    setCurrentIndex(0);
    setFileName('');
  };

  const handleUploadContent = (content, uploadedFileName = '') => {
    if (!content) {
      return;
    }
    setText(content);
    setIsPlaying(false);
    setCurrentIndex(0);
    setFileName(uploadedFileName);
    
    // Add to file history if it has a name
    if (uploadedFileName) {
      setFileHistory(prev => {
        const newEntry = {
          name: uploadedFileName,
          content: content,
          timestamp: Date.now()
        };
        // Keep only last 10 files
        const updated = [newEntry, ...prev].slice(0, 10);
        return updated;
      });
    }
  };

  const handleStep = (direction) => {
    setCurrentIndex((prev) => {
      if (direction === 'back') {
        return Math.max(0, prev - chunkSize);
      }
      if (direction === 'forward') {
        return Math.min(words.length - 1, prev + chunkSize);
      }
      return prev;
    });
  };

  const handleWordJump = (wordIndex) => {
    // wordIndex is now the direct index of the word clicked
    if (wordIndex < 0 || wordIndex >= words.length) {
      return;
    }
    
    setCurrentIndex(wordIndex);
    setIsPlaying(false);
  };

  const handleClear = () => {
    setText('');
    setFileName('');
    setIsPlaying(false);
    setCurrentIndex(0);
    setHasEverPlayed(false);
  };

  const handleThemeToggle = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleWpmToggle = () => {
    setIsWpmSliderVisible((prev) => !prev);
  };

  const handleFontSizeToggle = () => {
    setIsFontSizeSliderVisible((prev) => !prev);
  };

  const handleFontSizeChange = (value) => {
    setFontSize(value);
  };

  const handleChunkSizeToggle = () => {
    setIsChunkSizeSliderVisible((prev) => !prev);
  };

  const handleChunkSizeChange = (value) => {
    setChunkSize(value);
  };

  const handleAccessibilityToggle = () => {
    setIsAccessibilityVisible((prev) => !prev);
  };

  const handleSlowDownChange = (checked) => {
    setSlowDownAtSentenceEnd(checked);
  };

  const handleBreakAtSentenceEndChange = (checked) => {
    setBreakAtSentenceEnd(checked);
  };

  const handleTheaterModeToggle = () => {
    setIsTheaterMode((prev) => !prev);
  };

  const handleHighlightWordsChange = (checked) => {
    setHighlightWords(checked);
  };

  const handleOrpChange = (checked) => {
    setOrpEnabled(checked);
  };

  const handleHistoryToggle = () => {
    setIsHistoryVisible(prev => !prev);
  };

  const handleLoadHistoryFile = (index) => {
    const file = fileHistory[index];
    if (file) {
      setText(file.content);
      setFileName(file.name);
      setCurrentIndex(0);
      setIsPlaying(false);
      setIsHistoryVisible(false);
    }
  };

  const handleDeleteHistoryFile = (index) => {
    setFileHistory(prev => prev.filter((_, i) => i !== index));
  };

  const handleBookmarksToggle = () => {
    setIsBookmarksVisible(prev => !prev);
  };

  const handleAddBookmark = (label) => {
    if (!label.trim()) {
      return;
    }
    const newBookmark = {
      label: label.trim(),
      wordIndex: currentIndex,
      timestamp: Date.now()
    };
    setBookmarks(prev => [newBookmark, ...prev]);
  };

  const handleLoadBookmark = (index) => {
    const bookmark = bookmarks[index];
    if (bookmark) {
      setCurrentIndex(bookmark.wordIndex);
      setIsPlaying(false);
      setIsBookmarksVisible(false);
    }
  };

  const handleDeleteBookmark = (index) => {
    setBookmarks(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`app-shell ${isTheaterMode ? 'theater-mode' : ''}`}>
      {!isTheaterMode && <HeroHeader />}

      <main className="hero-body">
        <HeroWordDisplay
          shouldShowTyping={shouldShowTyping}
          typedWord={typedWord}
          isWordComplete={isWordComplete}
          displayedWord={displayedWord}
          fileName={fileName}
          fontSize={fontSize}
          isTheaterMode={isTheaterMode}
          orpEnabled={orpEnabled}
        />

        {!isTheaterMode && (
          <RsvpPanel
            isPlaying={isPlaying}
            onToggle={handleToggle}
            textValue={text}
            onTextChange={handleTextChange}
            wpm={wpm}
            minWpm={MIN_WPM}
            maxWpm={MAX_WPM}
            onWpmChange={handleWpmChange}
            onUpload={handleUploadContent}
            onStep={handleStep}
            onWordJump={handleWordJump}
            onClear={handleClear}
            isDarkMode={isDarkMode}
            onThemeToggle={handleThemeToggle}
            isWpmSliderVisible={isWpmSliderVisible}
            onWpmToggle={handleWpmToggle}
            onWpmSliderClose={() => setIsWpmSliderVisible(false)}
            fontSize={fontSize}
            isFontSizeSliderVisible={isFontSizeSliderVisible}
            onFontSizeToggle={handleFontSizeToggle}
            onFontSizeChange={handleFontSizeChange}
            onFontSizeSliderClose={() => setIsFontSizeSliderVisible(false)}
            chunkSize={chunkSize}
            isChunkSizeSliderVisible={isChunkSizeSliderVisible}
            onChunkSizeToggle={handleChunkSizeToggle}
            onChunkSizeChange={handleChunkSizeChange}
            onChunkSizeSliderClose={() => setIsChunkSizeSliderVisible(false)}
            isAccessibilityVisible={isAccessibilityVisible}
            onAccessibilityToggle={handleAccessibilityToggle}
            onAccessibilityClose={() => setIsAccessibilityVisible(false)}
            slowDownAtSentenceEnd={slowDownAtSentenceEnd}
            onSlowDownChange={handleSlowDownChange}
            breakAtSentenceEnd={breakAtSentenceEnd}
            onBreakAtSentenceEndChange={handleBreakAtSentenceEndChange}
            isTheaterMode={isTheaterMode}
            onTheaterModeToggle={handleTheaterModeToggle}
            highlightWords={highlightWords}
            onHighlightWordsChange={handleHighlightWordsChange}
            orpEnabled={orpEnabled}
            onOrpChange={handleOrpChange}
            currentIndex={currentIndex}
            words={words}
            fileHistory={fileHistory}
            onHistoryToggle={handleHistoryToggle}
            isHistoryVisible={isHistoryVisible}
            onLoadHistoryFile={handleLoadHistoryFile}
            bookmarks={bookmarks}
            onBookmarksToggle={handleBookmarksToggle}
            isBookmarksVisible={isBookmarksVisible}
          />
        )}
      </main>
      
      {!isTheaterMode && <Footer />}
      
      {isTheaterMode && (
        <TheaterControls
          isPlaying={isPlaying}
          onToggle={handleToggle}
          onStep={handleStep}
          onExit={handleTheaterModeToggle}
        />
      )}
      
      {isHistoryVisible && (
        <div className="history-overlay" onClick={handleHistoryToggle}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-header">
              <h2>File History</h2>
              <button 
                className="history-close-button" 
                onClick={handleHistoryToggle}
                aria-label="Close history"
                title="Close"
              >
                <MdOutlineClear size={23} aria-hidden="true" color="#fff" />
              </button>
            </div>
            <div className="history-content">
              {fileHistory.length === 0 ? (
                <p className="history-empty">No files in history</p>
              ) : (
                <div className="history-list">
                  {fileHistory.map((file, index) => (
                    <div 
                      key={index} 
                      className="history-item"
                    >
                      <div className="history-info" onClick={() => handleLoadHistoryFile(index)}>
                        <span className="history-filename">{file.name}</span>
                        <span className="history-date">{new Date(file.timestamp).toLocaleString()}</span>
                      </div>
                      <button 
                        className="history-delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHistoryFile(index);
                        }}
                        aria-label="Delete file"
                        title="Delete"
                      >
                        <MdOutlineClear size={18} aria-hidden="true" color="#fff" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isBookmarksVisible && (
        <div className="bookmarks-overlay" onClick={handleBookmarksToggle}>
          <div className="bookmarks-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bookmarks-header">
              <h2>Bookmarks</h2>
              <button 
                className="bookmarks-close-button" 
                onClick={handleBookmarksToggle}
                aria-label="Close bookmarks"
                title="Close"
              >
                <MdOutlineClear size={23} aria-hidden="true" color="#fff" />
              </button>
            </div>
            <div className="bookmarks-content">
              <AddBookmarkForm onAdd={handleAddBookmark} currentWord={words[currentIndex]} />
              {bookmarks.length === 0 ? (
                <p className="bookmarks-empty">No bookmarks saved</p>
              ) : (
                <div className="bookmarks-list">
                  {bookmarks.map((bookmark, index) => (
                    <div 
                      key={index} 
                      className="bookmark-item"
                    >
                      <div className="bookmark-info" onClick={() => handleLoadBookmark(index)}>
                        <span className="bookmark-label">{bookmark.label}</span>
                        <span className="bookmark-word">Word {bookmark.wordIndex + 1}: {words[bookmark.wordIndex]}</span>
                      </div>
                      <button 
                        className="bookmark-delete-button"
                        onClick={() => handleDeleteBookmark(index)}
                        aria-label="Delete bookmark"
                        title="Delete"
                      >
                        <MdOutlineClear size={18} aria-hidden="true" color="#fff" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <Analytics />
    </div>
  );
}

export default App;
