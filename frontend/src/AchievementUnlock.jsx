export default function AchievementUnlock({achievement,onClose}){
  if(!achievement) return null;

  return (
    <div className="achievement-unlock-backdrop" onMouseDown={onClose}>
      <section className="achievement-unlock-card" onMouseDown={e=>e.stopPropagation()}>
        <div className="achievement-confetti c1">✦</div>
        <div className="achievement-confetti c2">●</div>
        <div className="achievement-confetti c3">✧</div>
        <div className="achievement-confetti c4">◆</div>
        <div className="achievement-confetti c5">✦</div>

        <div className="achievement-unlock-glow"></div>
        <div className="achievement-unlock-icon">{achievement.icon}</div>
        <div className="achievement-unlock-kicker">ACHIEVEMENT UNLOCKED</div>
        <h2>{achievement.title}</h2>
        <p>{achievement.description}</p>
        <div className="achievement-unlock-xp">+{achievement.xp} XP</div>
        <button className="primary" onClick={onClose}>Nice! Continue →</button>
      </section>
    </div>
  );
}
