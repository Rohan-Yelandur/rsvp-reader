function HeroHeader({ brandLabel = 'ZipReader'}) {
  return (
    <header className="hero-header">
      <div className="brand-mark">
        <span>{brandLabel}</span>
      </div>
    </header>
  );
}

export default HeroHeader;
