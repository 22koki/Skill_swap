export default function ProgressionPanel({open,progression,onClose}){
  if(!open || !progression) return null;

  const level=progression.level;
  const next=progression.next_level;

  return (
    <div className="progression-backdrop" onMouseDown={onClose}>
      <section className="progression-panel" onMouseDown={e=>e.stopPropagation()}>
        <button className="progression-close" onClick={onClose}>×</button>

        <div className="progression-hero">
          <div className="progression-orbit">
            <div className="progression-level-core">
              <small>LEVEL</small>
              <strong>{level.level}</strong>
            </div>
          </div>

          <div className="progression-hero-copy">
            <div className="progression-kicker">YOUR SKILLSWAP PROGRESSION</div>
            <h2>{level.icon} {level.name}</h2>
            <p>{progression.xp.toLocaleString()} XP earned across your learning journey.</p>

            <div className="progression-level-track">
              <div style={{width:progression.level_progress+"%"}}></div>
            </div>
            <div className="progression-level-meta">
              <span>{progression.level_progress}% through this level</span>
              <b>{next ? progression.xp_to_next+" XP to "+next.name : "Max level reached"}</b>
            </div>
          </div>
        </div>

        <div className="progression-stats">
          <div><span>🔥</span><strong>{progression.current_streak}</strong><small>week streak</small></div>
          <div><span>⚡</span><strong>{progression.best_streak}</strong><small>best streak</small></div>
          <div><span>🤝</span><strong>{progression.completed_swaps}</strong><small>completed swaps</small></div>
          <div><span>⏱</span><strong>{progression.total_hours}</strong><small>hours exchanged</small></div>
          <div><span>🏅</span><strong>{progression.achievements_unlocked}/{progression.achievements_total}</strong><small>achievements</small></div>
        </div>

        <section className="progression-section">
          <div className="progression-section-head">
            <div>
              <div className="progression-kicker">UNLOCKED</div>
              <h3>Your achievements</h3>
            </div>
            <span>{progression.achievements_unlocked} earned</span>
          </div>

          <div className="achievement-grid">
            {progression.unlocked.length ? progression.unlocked.map(item=>(
              <article className="achievement-card unlocked" key={item.key}>
                <div className="achievement-icon">{item.icon}</div>
                <div className="achievement-copy">
                  <small>{item.category}</small>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
                <div className="achievement-xp">+{item.xp} XP</div>
                <span className="achievement-done">✓</span>
              </article>
            )) : <div className="progression-empty">Complete your first SkillSwap to unlock your first achievement.</div>}
          </div>
        </section>

        <section className="progression-section">
          <div className="progression-section-head">
            <div>
              <div className="progression-kicker">UP NEXT</div>
              <h3>Achievements in progress</h3>
            </div>
          </div>

          <div className="achievement-progress-list">
            {progression.next_achievements.map(item=>(
              <article className="achievement-progress-card" key={item.key}>
                <div className="achievement-progress-icon">{item.icon}</div>
                <div className="achievement-progress-main">
                  <div className="achievement-progress-title">
                    <div><small>{item.category}</small><b>{item.title}</b></div>
                    <span>{item.current}/{item.target}</span>
                  </div>
                  <p>{item.description}</p>
                  <div className="achievement-progress-track">
                    <i style={{width:item.progress+"%"}}></i>
                  </div>
                </div>
                <strong>+{item.xp} XP</strong>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
