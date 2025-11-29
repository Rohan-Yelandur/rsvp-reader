import { IoPlay, IoPause, IoClose } from 'react-icons/io5';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';

function TheaterControls({ isPlaying, onToggle, onStep, onExit }) {
  return (
    <div className="theater-controls">
      <button
        className="theater-button"
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
        className="theater-button"
        type="button"
        onClick={() => onStep?.('back')}
        aria-label="Previous word"
        title="Go to previous word"
      >
        <FaChevronLeft size={23} aria-hidden="true" />
      </button>
      <button
        className="theater-button"
        type="button"
        onClick={() => onStep?.('forward')}
        aria-label="Next word"
        title="Go to next word"
      >
        <FaChevronRight size={23} aria-hidden="true" />
      </button>
      <button
        className="theater-button"
        type="button"
        onClick={onExit}
        aria-label="Exit theater mode"
        title="Exit theater mode"
      >
        <IoClose size={23} aria-hidden="true" />
      </button>
    </div>
  );
}

export default TheaterControls;
