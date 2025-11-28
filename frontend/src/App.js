import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import HeroHeader from './components/HeroHeader';
import HeroWordDisplay from './components/HeroWordDisplay';
import RsvpPanel from './components/RsvpPanel';
import { DEFAULT_WPM, MAX_WPM, MIN_WPM, TYPED_WORDS, TYPING_DELAYS } from './config';

function App() {
  const [text, setText] = useState('The RSVP reader helps you consume text faster by flashing one word at a time. Upload anything and press PLAY.');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wpm, setWpm] = useState(DEFAULT_WPM);
  const previousText = useRef(text);
  const [typedWord, setTypedWord] = useState('');
  const [isDeletingWord, setIsDeletingWord] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);

  const words = useMemo(() => {
    return text
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }, [text]);

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

    const intervalMs = Math.round(60000 / wpm);
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev + 1 >= words.length) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, words.length, wpm]);

  const displayedWord = words[currentIndex] || 'Ready?';
  const shouldShowTyping = !isPlaying && currentIndex === 0;
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
  };

  const handleUploadContent = (content) => {
    if (!content) {
      return;
    }
    setText(content);
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const handleStep = (direction) => {
    setCurrentIndex((prev) => {
      if (direction === 'back') {
        return Math.max(0, prev - 1);
      }
      if (direction === 'forward') {
        return Math.min(words.length - 1, prev + 1);
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

  return (
    <div className="app-shell">
      <HeroHeader />

      <main className="hero-body">
        <HeroWordDisplay
          shouldShowTyping={shouldShowTyping}
          typedWord={typedWord}
          isWordComplete={isWordComplete}
          displayedWord={displayedWord}
        />

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
        />
      </main>
    </div>
  );
}

export default App;
