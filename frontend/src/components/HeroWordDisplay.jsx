function HeroWordDisplay({
  shouldShowTyping,
  typedWord,
  isWordComplete,
  displayedWord,
}) {
  return (
    <div className={`hero-word ${shouldShowTyping ? 'typing' : 'playing'}`} aria-live="polite">
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
  );
}

export default HeroWordDisplay;
