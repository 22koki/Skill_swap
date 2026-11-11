import { getSkillVisual } from "./skillVisuals";

function formatDate(value){
  if(!value) return "";
  return new Intl.DateTimeFormat(undefined,{
    weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"
  }).format(new Date(value));
}

export default function BookingsPanel({ bookings, currentUser, onAction, onMessage, onWorkspace, onReview }) {
  const upcoming=bookings.filter(b=>b.status==="scheduled");
  const completed=bookings.filter(b=>b.status==="completed");
  if(!upcoming.length && !completed.length) return null;

  const meName=currentUser
    ? ((currentUser.first_name||currentUser.username)+(currentUser.last_name?" "+currentUser.last_name:""))
    : "You";
  const meProfile=currentUser?.profile||{};
  const meInitials=meName.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()||"YOU";

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

      {!!upcoming.length && <div className="booking-grid">
        {upcoming.map(booking=>{
          const learn=getSkillVisual(booking.learn_skill_name);
          const teach=getSkillVisual(booking.teach_skill_name);
          const partner=booking.partner_profile||{};
          const partnerName=booking.partner_name||"SkillSwap partner";
          const partnerInitials=partnerName.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()||"SS";

          return (
            <article className="booking-profile-rich glass" key={booking.id}>
              <div className="bpr-topline">
                <div>
                  <div className="booking-kicker">WITH {partnerName.toUpperCase()}</div>
                  <h3>{booking.learn_skill_name} ↔ {booking.teach_skill_name}</h3>
                </div>
                <span className="booking-status">Scheduled</span>
              </div>

              <div className="bpr-main">
                <div className="bpr-person">
                  <div className="bpr-avatar-shell">
                    {meProfile.avatar_url
                      ? <img src={meProfile.avatar_url} className="bpr-avatar" alt="" />
                      : <div className="bpr-avatar bpr-avatar-fallback">{meInitials}</div>}
                    <span className="presence-dot"></span>
                  </div>
                  <div className="bpr-person-copy">
                    <h4>{meName}</h4>
                    <p>Learner · Teacher</p>
                    <div className="bpr-person-stats">
                      <span>⭐ {Number(meProfile.average_rating||0).toFixed(1)}</span>
                      <span>↻ {meProfile.completed_swaps||0} swaps</span>
                    </div>
                  </div>
                </div>

                <div className="bpr-exchange">
                  <div className={"bpr-skill-chip "+learn.className}>
                    <span>{learn.icon}</span><b>{booking.learn_skill_name}</b>
                  </div>

                  <div className="bpr-core">
                    <div className="bpr-core-ring ring-1"></div>
                    <div className="bpr-core-ring ring-2"></div>
                    <div className="bpr-core-icon">⇄</div>
                  </div>

                  <div className={"bpr-skill-chip "+teach.className}>
                    <span>{teach.icon}</span><b>{booking.teach_skill_name}</b>
                  </div>

                  <div className="bpr-swap-arc"></div>
                </div>

                <div className="bpr-person bpr-person-right">
                  <div className="bpr-avatar-shell">
                    {partner.avatar_url
                      ? <img src={partner.avatar_url} className="bpr-avatar" alt="" />
                      : <div className="bpr-avatar bpr-avatar-fallback">{partnerInitials}</div>}
                    <span className="presence-dot"></span>
                  </div>
                  <div className="bpr-person-copy">
                    <h4>{partnerName}</h4>
                    <p>SkillSwap partner</p>
                    <div className="bpr-person-stats">
                      <span>⭐ {Number(partner.average_rating||0).toFixed(1)}</span>
                      <span>↻ {partner.completed_swaps||0} swaps</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bpr-session-strip">
                <div className="bpr-session-item">
                  <span>📅</span>
                  <div><small>Date & time</small><b>{formatDate(booking.starts_at)}</b></div>
                </div>
                <div className="bpr-divider"></div>
                <div className="bpr-session-item">
                  <span>⏱</span>
                  <div><small>Duration</small><b>{booking.duration_minutes} min</b></div>
                </div>
                <div className="bpr-divider"></div>
                <div className="bpr-session-item">
                  <span>{booking.mode==="online"?"💻":"📍"}</span>
                  <div><small>Session</small><b>{booking.mode==="online"?"Online":"In person"}</b></div>
                </div>
                <div className="bpr-divider"></div>
                <div className="bpr-session-item">
                  <span>📌</span>
                  <div><small>Location</small><b>{booking.mode==="online"?(booking.meeting_link?"Meeting link ready":"Online"):(booking.location_note||"To be confirmed")}</b></div>
                </div>
              </div>

              <div className="bpr-bottom">
                <div className="bpr-note">
                  <span>“</span>
                  <p>{booking.note||"No preparation notes for this session."}</p>
                </div>

                <div className="bpr-actions">
                  <button className="outline bpr-workspace" onClick={()=>onWorkspace(booking.id)}>🧭 Open workspace</button>
                  <button className="outline bpr-message" onClick={()=>onMessage(booking.swap)}>💬 Message partner</button>
                  {booking.mode==="online" && booking.meeting_link &&
                    <a className="outline booking-link" href={booking.meeting_link} target="_blank" rel="noreferrer">Open meeting ↗</a>}
                  <button className="danger-soft" onClick={()=>onAction(booking.id,"cancel")}>Cancel</button>
                  <button className="primary bpr-complete" onClick={()=>onAction(booking.id,"complete")}>Complete session ✓</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>}

      {!!completed.length && <div className="completed-bookings">
        <div className="completed-bookings-head">
          <div>
            <div className="eyebrow">RECENTLY COMPLETED</div>
            <h3>Past SkillSwaps</h3>
          </div>
          <span>{completed.length} completed</span>
        </div>

        <div className="completed-booking-list">
          {completed.map(booking=>{
            const learn=getSkillVisual(booking.learn_skill_name);
            const teach=getSkillVisual(booking.teach_skill_name);
            return (
              <article className="completed-booking-card glass" key={booking.id}>
                <div className="completed-booking-main">
                  <div className="completed-partner-avatar">
                    {booking.partner_profile?.avatar_url
                      ? <img src={booking.partner_profile.avatar_url} alt="" />
                      : <span>{(booking.partner_name||"SS").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()}</span>}
                  </div>
                  <div>
                    <small>With {booking.partner_name}</small>
                    <h4>{booking.learn_skill_name} ↔ {booking.teach_skill_name}</h4>
                    <div className="completed-skill-pills">
                      <span className={learn.className}>{learn.icon} {booking.learn_skill_name}</span>
                      <span className={teach.className}>{teach.icon} {booking.teach_skill_name}</span>
                    </div>
                  </div>
                </div>

                <div className="completed-booking-actions">
                  {booking.review_status?.reviewed
                    ? <span className="reviewed-chip">✓ Reviewed</span>
                    : <button className="primary review-now-button" onClick={()=>onReview(booking)}>⭐ Leave review</button>}
                  <button className="outline" onClick={()=>onMessage(booking.swap)}>💬 Message</button>
                </div>
              </article>
            );
          })}
        </div>
      </div>}
    </section>
  );
}
