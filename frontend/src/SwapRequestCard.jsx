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
  const left = getSkillVisual(theyTeach);
  const right = getSkillVisual(youTeach);
  const initials = personName?.split(" ").map(part => part[0]).join("").slice(0,2).toUpperCase() || "SS";

  return (
    <article className={"swap-request-card glass status-" + swap.status}>
      <div className="swap-card-glow" />
      <div className="swap-card-top">
        <div className="request-person">
          {personProfile?.avatar_url
            ? <img className="request-avatar" src={personProfile.avatar_url} alt="" />
            : <div className="request-avatar request-avatar-fallback">{initials}</div>}
          <div>
            <div className="request-kicker">{incoming ? "Incoming skill exchange" : "Your skill exchange"}</div>
            <h3>{personName}</h3>
            <p>
              ⭐ {personProfile?.average_rating || 0}
              {personProfile?.location ? " · 📍 " + personProfile.location : ""}
              {" · "}{personProfile?.completed_swaps || 0} swaps
            </p>
          </div>
        </div>

        <div className={"status-pill status-" + swap.status}>
          {swap.status === "proposed" ? (incoming ? "New request" : "Awaiting reply") : swap.status}
        </div>
      </div>

      <div className="exchange-ribbon">
        <span>Skill Exchange Proposal</span>
        <strong>{youTeach} ↔ {theyTeach}</strong>
      </div>

      <div className="exchange-visual">
        <div className={"exchange-skill " + left.className}>
          <small>{incoming ? "They teach you" : "You want to learn"}</small>
          <div><span>{left.icon}</span><b>{theyTeach}</b></div>
        </div>

        <div className="exchange-arrow">
          <span>⇄</span>
          <small>SWAP</small>
        </div>

        <div className={"exchange-skill " + right.className}>
          <small>{incoming ? "They want from you" : "You will teach"}</small>
          <div><span>{right.icon}</span><b>{youTeach}</b></div>
        </div>
      </div>

      {swap.message && <blockquote className="request-message">“{swap.message}”</blockquote>}

      <div className="request-footer">
        <span>{relativeTime(swap.created_at)}</span>
        <div className="request-actions">
          {swap.status === "proposed" && incoming && <>
            <button className="danger-soft" onClick={() => onAction(swap.id, "decline")}>Decline</button>
            <button className="primary accept-button" onClick={() => onAction(swap.id, "accept")}>Accept Swap ✓</button>
          </>}
          {swap.status === "proposed" && !incoming &&
            <button className="danger-soft" onClick={() => onAction(swap.id, "cancel")}>Cancel request</button>}
          {swap.status === "accepted" &&
            <button className="outline" onClick={() => onAction(swap.id, "complete")}>Mark complete</button>}
        </div>
      </div>
    </article>
  );
}
