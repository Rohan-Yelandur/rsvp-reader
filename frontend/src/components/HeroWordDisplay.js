function HeroWordDisplay({
  shouldShowTyping,
  typedWord,
  isWordComplete,
  displayedWord,
  fileName,
  fontSize,
  isTheaterMode,
}) {
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
          <span className="static-word">Speed-read your</span>
          <span className="typed-slot">
            <span className="typed-word">{typedWord}</span>
            <span
              className={`cursor ${isWordComplete ? 'blink' : ''}`}
              aria-hidden="true"
            />
          </span>
        </span>
      ) : (
        displayedWord
      )}
    </div>
    </>
  );
}

export default HeroWordDisplay;
