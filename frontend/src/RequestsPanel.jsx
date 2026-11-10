import { useMemo, useState } from "react";
import SwapRequestCard from "./SwapRequestCard";

export default function RequestsPanel({ swaps, bookings, currentUserId, currentUser, onAction, onSchedule, onMessage }) {
  const [tab, setTab] = useState("incoming");

  const groups = useMemo(() => ({
    incoming: swaps.filter(s => s.recipient === currentUserId && s.status === "proposed"),
    sent: swaps.filter(s => s.requester === currentUserId && s.status === "proposed"),
    accepted: swaps.filter(s => s.status === "accepted"),
    completed: swaps.filter(s => ["completed","declined","cancelled"].includes(s.status)),
  }), [swaps, currentUserId]);

  const labels = [
    ["incoming", "Incoming"],
    ["sent", "Sent"],
    ["accepted", "Accepted"],
    ["completed", "History"],
  ];

  const current = groups[tab];

  return (
    <section id="requests" className="requests-section section">
      <div className="heading requests-heading">
        <div>
          <div className="eyebrow">SKILLS COMING YOUR WAY</div>
          <h2>Swap requests</h2>
          <p>See who wants to trade knowledge with you and keep every exchange moving.</p>
        </div>
        <div className="request-summary-card glass">
          <b>{groups.incoming.length}</b>
          <span>waiting for you</span>
        </div>
      </div>

      <div className="request-tabs glass">
        {labels.map(([key,label]) => (
          <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
            {label}
            <span>{groups[key].length}</span>
          </button>
        ))}
      </div>

      <div className="request-list">
        {current.length ? current.map(swap => (
          <SwapRequestCard
            key={swap.id}
            swap={swap}
            currentUserId={currentUserId}
            currentUser={currentUser}
            onAction={onAction}
            onSchedule={onSchedule}
            onMessage={onMessage}
            booking={bookings.find(b=>b.swap===swap.id && b.status==="scheduled")}
          />
        )) : (
          <div className="requests-empty glass">
            <div>{tab === "incoming" ? "📭" : tab === "sent" ? "🛫" : tab === "accepted" ? "🤝" : "✨"}</div>
            <h3>No {tab === "completed" ? "history yet" : tab + " swaps yet"}</h3>
            <p>{tab === "incoming" ? "When someone proposes a skill exchange, it will appear here." : "Your SkillSwap activity will show up here."}</p>
          </div>
        )}
      </div>
    </section>
  );
}
