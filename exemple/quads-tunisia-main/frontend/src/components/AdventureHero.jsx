import { Link } from 'react-router-dom';
import './AdventureHero.css';

export default function AdventureHero() {
  return (
    <section className="adventure-hero adventure-hero--desert" aria-labelledby="adventure-title">
      <img className="adventure-hero__image" src="/images/hero-sahara.png" alt="Helmeted quad rider carving through golden Sahara dunes at sunset" fetchPriority="high" />
      <div className="adventure-hero__shade" aria-hidden="true" />
      <div className="adventure-hero__inner">
        <div className="adventure-hero__copy">
          <p className="adventure-hero__eyebrow"><span aria-hidden="true" />QUADS TUNISIA / GO BEYOND THE ROAD</p>
          <h1 id="adventure-title">Chase the dunes.<br /><em>Feel alive.</em></h1>
          <p className="adventure-hero__description">Golden sand. Wide-open trails. A little dust and a lot of adrenaline. This is your wild side of Tunisia.</p>
          <div className="adventure-hero__actions">
            <Link to="/locations" className="adventure-hero__primary">Find your adventure<span aria-hidden="true">↗</span></Link>
            <a href="#activities" className="adventure-hero__secondary">Explore experiences <span aria-hidden="true">↓</span></a>
          </div>
          <p className="adventure-hero__note">FOR THE DUST-CHASERS & MEMORY-MAKERS</p>
        </div>
        <div className="adventure-hero__postcard" aria-hidden="true"><span>THE WILD SIDE</span><p>Turn the ordinary into a dust trail.</p></div>
        <div className="adventure-hero__bottom">
          <div className="adventure-hero__tags"><span>Off-road energy</span><span>Golden-hour mood</span><span>Pure adventure</span></div>
          <a href="#activities" className="adventure-hero__scroll">Your story starts here <span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </section>
  );
}
