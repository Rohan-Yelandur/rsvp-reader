import { useRef } from 'react';
import { IoPause, IoPlay } from 'react-icons/io5';
import { FaFileUpload } from 'react-icons/fa';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';

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
}) {
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type && file.type !== 'text/plain') {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      onUpload?.(content);
    };
    reader.readAsText(file);
    event.target.value = '';
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
          accept=".txt,text/plain"
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
      </div>
      <div className="textarea-stack">
        <textarea
          id="rsvp-input"
          value={textValue}
          onChange={onTextChange}
          placeholder="Paste or type text here..."
          rows={5}
        />
      </div>
    </section>
  );
}

export default RsvpPanel;
