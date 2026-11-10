import { getSkillVisual } from "./skillVisuals";

function relativeTime(value) {
  if (!value) return "";
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return Math.floor(seconds / 60) + " min ago";
  if (seconds < 86400) return Math.floor(seconds / 3600) + " hr ago";
  const days = Math.floor(seconds / 86400);
  return days === 1 ? "Yesterday" : days + " days ago";
}

export default function SwapRequestCard({ swap, currentUserId, onAction }) {
  const incoming = swap.recipient === currentUserId;
  const personName = incoming ? swap.requester_name : swap.recipient_name;
  const personProfile = incoming ? swap.requester_profile : swap.recipient_profile;
  const theyTeach = incoming ? swap.offered_skill_name : swap.requested_skill_name;
  const youTeach = incoming ? swap.requested_skill_name : swap.offered_skill_name;
  const learnVisual = getSkillVisual(theyTeach);
  const teachVisual = getSkillVisual(youTeach);
  const initials = personName?.split(" ").map(part => part[0]).join("").slice(0,2).toUpperCase() || "SS";
  const rating = Number(personProfile?.average_rating || 0).toFixed(1);

  return (
    <article className={"swap-request-card swap-pass glass status-" + swap.status}>
      <div className="swap-pass-aura aura-one" />
      <div className="swap-pass-aura aura-two" />

      <div className="swap-pass-head">
        <div className="request-person premium-person">
          <div className="avatar-shell">
            {personProfile?.avatar_url
              ? <img className="request-avatar" src={personProfile.avatar_url} alt="" />
              : <div className="request-avatar request-avatar-fallback">{initials}</div>}
            <span className="presence-dot" />
          </div>

          <div>
            <div className="request-kicker">{incoming ? "SkillSwap invitation" : "SkillSwap exchange"}</div>
            <h3>{personName}</h3>
            <div className="person-stats">
              <span>⭐ {rating}</span>
              {personProfile?.location && <span>📍 {personProfile.location}</span>}
              <span>↻ {personProfile?.completed_swaps || 0} swaps</span>
            </div>
          </div>
        </div>

        <div className="status-stack">
          <div className={"status-pill status-" + swap.status}>
            {swap.status === "proposed" ? (incoming ? "New request" : "Awaiting reply") : swap.status}
          </div>
          <small>{relativeTime(swap.created_at)}</small>
        </div>
      </div>

      <div className="exchange-stage">
        <div className={"exchange-panel exchange-learn " + learnVisual.className}>
          <div className="exchange-panel-label">{incoming ? "You receive" : "You want to learn"}</div>
          <div className="exchange-panel-icon">{learnVisual.icon}</div>
          <div className="exchange-panel-copy">
            <span>{incoming ? "From " + personName : "From your match"}</span>
            <strong>{theyTeach}</strong>
          </div>
          <div className="skill-spark">✦</div>
        </div>

        <div className="swap-core">
          <div className="swap-core-ring ring-one" />
          <div className="swap-core-ring ring-two" />
          <div className="swap-core-icon">⇄</div>
          <small>SKILL SWAP</small>
        </div>

        <div className={"exchange-panel exchange-teach " + teachVisual.className}>
          <div className="exchange-panel-label">{incoming ? "You give" : "You will teach"}</div>
          <div className="exchange-panel-icon">{teachVisual.icon}</div>
          <div className="exchange-panel-copy">
            <span>{incoming ? "In return" : "To " + personName}</span>
            <strong>{youTeach}</strong>
          </div>
          <div className="skill-spark">✦</div>
        </div>
      </div>

      <div className="exchange-caption">
        <span className="exchange-caption-dot" />
        <span>{youTeach}</span>
        <b>↔</b>
        <span>{theyTeach}</span>
      </div>

      {swap.message && (
        <div className="message-card">
          <div className="message-quote">“</div>
          <blockquote>{swap.message}</blockquote>
        </div>
      )}

      <div className="request-footer premium-footer">
        <div className="footer-meta">
          <span className="live-chip">{swap.status === "accepted" ? "Ready to schedule" : "Skill exchange"}</span>
          <span>{incoming ? "You are the recipient" : "You sent this request"}</span>
        </div>

        <div className="request-actions">
          {swap.status === "proposed" && incoming && <>
            <button className="danger-soft" onClick={() => onAction(swap.id, "decline")}>Not now</button>
            <button className="primary accept-button" onClick={() => onAction(swap.id, "accept")}>Accept exchange ✓</button>
          </>}

          {swap.status === "proposed" && !incoming &&
            <button className="danger-soft" onClick={() => onAction(swap.id, "cancel")}>Cancel request</button>}

          {swap.status === "accepted" &&
            <button className="primary complete-button" onClick={() => onAction(swap.id, "complete")}>Mark complete ✓</button>}
        </div>
      </div>
    </article>
  );
}
