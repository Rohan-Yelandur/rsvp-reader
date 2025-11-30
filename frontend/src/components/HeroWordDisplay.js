import './HeroWordDisplay.css';

// Calculate ORP index based on word length
function getOrpIndex(word) {
  const length = word.length;
  if (length <= 4) return 1;
  if (length <= 9) return 2;
  if (length <= 13) return 3;
  return 4;
}

function HeroWordDisplay({
  shouldShowTyping,
  typedWord,
  isWordComplete,
  displayedWord,
  fileName,
  fontSize,
  isTheaterMode,
  orpEnabled,
}) {
  // Apply ORP highlighting if enabled and not typing
  const renderDisplayedWord = () => {
    if (shouldShowTyping || !orpEnabled) {
      return displayedWord;
    }

    // Get the first word from displayedWord (in case of multiple words)
    const words = displayedWord.trim().split(/\s+/);
    if (words.length === 0) return displayedWord;

    const firstWord = words[0];
    const orpIndex = getOrpIndex(firstWord);

    // Split the first word at ORP
    const before = firstWord.substring(0, orpIndex);
    const orpChar = firstWord[orpIndex];
    const after = firstWord.substring(orpIndex + 1);

    // Reconstruct with remaining words
    const remainingWords = words.slice(1).join(' ');

    return (
      <>
        {before}
        <span className="orp-character">{orpChar}</span>
        {after}
        {remainingWords && ` ${remainingWords}`}
      </>
    );
  };

  return (
    <>
      {fileName && !isTheaterMode && <div className="file-name-display">{fileName}</div>}
      <div
        className={`hero-word ${shouldShowTyping ? 'typing' : 'playing'}`}
        aria-live="polite"
        style={!shouldShowTyping ? { fontSize: `${fontSize}rem` } : {}}
      >
        {shouldShowTyping ? (
          <span className="typed-line">
            <span className="static-text">Speed-read your</span>{' '}
            <span className="typed-word-wrapper">
              <span className="typed-word">{typedWord}</span>
              <span
                className={`cursor ${isWordComplete ? 'blink' : ''}`}
                aria-hidden="true"
              />
            </span>
          </span>
        ) : (
          renderDisplayedWord()
        )}
      </div>
    </>
  );
}

export default HeroWordDisplay;
