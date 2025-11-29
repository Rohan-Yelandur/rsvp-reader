function HeroHeader({ brandLabel = 'ZipReader'}) {
  return (
    <header className="hero-header">
      <div className="brand-mark">
        <img src="/zipreader_logo.png" alt="ZipReader" className="brand-logo" />
        <span>{brandLabel}</span>
      </div>
    </header>
  );
}

export default HeroHeader;
