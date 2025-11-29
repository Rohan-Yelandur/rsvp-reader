import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import HeroHeader from './components/HeroHeader';
import HeroWordDisplay from './components/HeroWordDisplay';
import RsvpPanel from './components/RsvpPanel';
import Footer from './components/Footer';
import TheaterControls from './components/TheaterControls';
import { DEFAULT_WPM, MAX_WPM, MIN_WPM, TYPED_WORDS, TYPING_DELAYS, SENTENCE_END_DELAY_MULTIPLIER, COMMA_DELAY_MULTIPLIER } from './config';

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
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  const words = useMemo(() => {
    return text
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }, [text]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

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
  }, [isPlaying, words.length, wpm, chunkSize, currentIndex, slowDownAtSentenceEnd]);

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

  const handleWordJump = (cursorPosition) => {
    const textUpToCursor = text.slice(0, cursorPosition).trim();
    if (!textUpToCursor) {
      setCurrentIndex(0);
      setIsPlaying(false);
      return;
    }
    
    const wordsBeforeCursor = textUpToCursor.split(/\s+/).filter(Boolean);
    const targetIndex = Math.min(wordsBeforeCursor.length - 1, words.length - 1);
    
    setCurrentIndex(Math.max(0, targetIndex));
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
    </div>
  );
}

export default App;
