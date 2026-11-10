import { getSkillVisual } from "./skillVisuals";

function formatDate(value){
  if(!value) return "";
  return new Intl.DateTimeFormat(undefined,{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(value));
}

export default function BookingsPanel({ bookings, onAction }) {
  const upcoming=bookings.filter(b=>b.status==="scheduled");
  if(!upcoming.length) return null;

  return (
    <section id="bookings" className="bookings-section section">
      <div className="heading">
        <div>
          <div className="eyebrow">NEXT UP</div>
          <h2>Upcoming SkillSwaps</h2>
          <p className="section-copy">Your accepted exchanges now have a time, place, and clear next step.</p>
        </div>
        <div className="booking-count glass">{upcoming.length}<span>scheduled</span></div>
      </div>

      <div className="booking-grid">
        {upcoming.map(booking=>{
          const learn=getSkillVisual(booking.learn_skill_name);
          const teach=getSkillVisual(booking.teach_skill_name);
          return (
            <article className="booking-card glass" key={booking.id}>
              <div className="booking-card-top">
                <div>
                  <div className="booking-kicker">WITH {booking.partner_name?.toUpperCase()}</div>
                  <h3>{booking.learn_skill_name} ↔ {booking.teach_skill_name}</h3>
                </div>
                <span className="booking-status">Scheduled</span>
              </div>

              <div className="booking-skills">
                <div className={learn.className}><span>{learn.icon}</span><small>Learn</small><b>{booking.learn_skill_name}</b></div>
                <div className="booking-mini-swap">⇄</div>
                <div className={teach.className}><span>{teach.icon}</span><small>Teach</small><b>{booking.teach_skill_name}</b></div>
              </div>

              <div className="booking-details">
                <div><span>📅</span><p><small>Date & time</small><b>{formatDate(booking.starts_at)}</b></p></div>
                <div><span>⏱</span><p><small>Duration</small><b>{booking.duration_minutes} min</b></p></div>
                <div><span>{booking.mode==="online"?"💻":"📍"}</span><p><small>Session</small><b>{booking.mode==="online"?"Online":"In person"}</b></p></div>
              </div>

              {booking.note && <div className="booking-note">“{booking.note}”</div>}

              <div className="booking-footer">
                <div>
                  {booking.mode==="online" && booking.meeting_link && <a className="outline booking-link" href={booking.meeting_link} target="_blank" rel="noreferrer">Open meeting ↗</a>}
                  {booking.mode==="in_person" && booking.location_note && <span className="location-chip">📍 {booking.location_note}</span>}
                </div>
                <div className="booking-actions">
                  <button className="danger-soft" onClick={()=>onAction(booking.id,"cancel")}>Cancel</button>
                  <button className="primary" onClick={()=>onAction(booking.id,"complete")}>Complete session ✓</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
