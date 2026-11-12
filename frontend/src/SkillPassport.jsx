import { getSkillVisual } from "./skillVisuals";
import BookmarkButton from "./BookmarkButton";

function formatMemberSince(value){
  if(!value) return "";
  return new Intl.DateTimeFormat(undefined,{month:"short",year:"numeric"}).format(new Date(value));
}

function formatJourneyDate(value){
  if(!value) return "";
  return new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",year:"numeric"}).format(new Date(value));
}

export default function SkillPassport({open,passport,currentUserId,onBlock,onReport,onClose,bookmarkProps}){
  if(!open || !passport) return null;

  const initials=(passport.name||passport.username||"SS").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();

  return (
    <div className="passport-backdrop" onMouseDown={onClose}>
      <section className="passport-shell" onMouseDown={e=>e.stopPropagation()}>
        <button className="passport-close" onClick={onClose}>×</button>

        <div className="passport-cover">
          <div className="passport-cover-glow glow-a"></div>
          <div className="passport-cover-glow glow-b"></div>
          <div className="passport-wordmark">SKILLSWAP</div>
          <div className="passport-emblem">↔</div>
          <h2>Skill Passport</h2>
          <p>Proof of what you share, learn, and build with others.</p>
          <div className="passport-code">{passport.passport_code}</div>
        </div>

        <div className="passport-page">
          <div className="passport-identity-card">
            <div className="passport-avatar-wrap">
              {passport.avatar_url
                ? <img src={passport.avatar_url} className="passport-avatar" alt="" />
                : <div className="passport-avatar passport-avatar-fallback">{initials}</div>}
              <span className="passport-verified">✓</span>
            </div>

            <div className="passport-identity-copy">
              <div className="passport-kicker">MEMBER IDENTITY</div>
              <h3>{passport.name}</h3>
              <p>@{passport.username}</p>
              <div className="passport-identity-meta">
                <span>📍 {passport.location||"Location not set"}</span>
                <span>🗓 Member since {formatMemberSince(passport.member_since)}</span>
                <span>🔄 {passport.session_preference?.replace("_"," ")||"both"}</span>
              </div>
              {passport.bio && <blockquote>{passport.bio}</blockquote>}
            </div>

            <div className="passport-identity-actions">
              {currentUserId&&currentUserId!==passport.user_id&&<BookmarkButton type="user" id={passport.user_id} {...bookmarkProps}/>}
              <div className="passport-reputation-badge">
                <strong>{Number(passport.stats.average_rating||0).toFixed(1)}</strong>
                <span>★ reputation</span>
                <small>{passport.stats.review_count} reviews</small>
              </div>
              {currentUserId&&currentUserId!==passport.user_id&&<div className="passport-safety-actions">
                <button className="outline" onClick={()=>onReport?.({
                  target_type:"user",
                  reported_user:passport.user_id,
                  target_id:passport.user_id,
                  label:passport.name+" (@"+passport.username+")",
                  icon:"⚠"
                })}>⚠ Report</button>
                <button className="danger-soft" onClick={()=>onBlock?.(passport.user_id)}>⛔ Block</button>
              </div>}
            </div>
          </div>

          <div className="passport-stats-grid">
            <div><strong>{passport.stats.completed_swaps}</strong><span>Completed swaps</span></div>
            <div><strong>{passport.stats.total_hours_exchanged}</strong><span>Hours exchanged</span></div>
            <div><strong>{passport.stats.unique_partners}</strong><span>Learning partners</span></div>
            <div><strong>{passport.stats.would_swap_again_percent}%</strong><span>Would swap again</span></div>
          </div>

          {passport.progression && <section className="passport-section passport-progression-section">
            <div className="passport-progression-head">
              <div className="passport-progression-level">
                <span>{passport.progression.level.icon}</span>
                <div>
                  <small>LEVEL {passport.progression.level.level}</small>
                  <h3>{passport.progression.level.name}</h3>
                </div>
              </div>
              <div className="passport-progression-xp">
                <strong>{passport.progression.xp.toLocaleString()}</strong>
                <span>XP</span>
              </div>
            </div>

            <div className="passport-progression-track">
              <i style={{width:passport.progression.level_progress+"%"}}></i>
            </div>
            <div className="passport-progression-meta">
              <span>🔥 {passport.progression.current_streak} week streak</span>
              <span>⚡ Best: {passport.progression.best_streak} weeks</span>
              <span>🏅 {passport.progression.achievements_unlocked}/{passport.progression.achievements_total} achievements</span>
              <span>{passport.progression.next_level ? passport.progression.xp_to_next+" XP to "+passport.progression.next_level.name : "Max level"}</span>
            </div>

            {!!passport.progression.unlocked?.length && <div className="passport-achievement-ribbon">
              {passport.progression.unlocked.slice(0,6).map(item=>(
                <div className="passport-achievement-token" key={item.key}>
                  <span>{item.icon}</span><b>{item.title}</b>
                </div>
              ))}
            </div>}
          </section>}

          <div className="passport-section">
            <div className="passport-section-head">
              <div>
                <div className="passport-kicker">SKILL STAMPS</div>
                <h3>What I share & what I’m growing</h3>
              </div>
            </div>

            <div className="passport-skills-layout">
              <div className="passport-skill-column">
                <h4>🎓 Skills I teach</h4>
                <div className="passport-skill-stamps">
                  {passport.teach_skills.length ? passport.teach_skills.map(skill=>{
                    const visual=getSkillVisual(skill.name);
                    return (
                      <div className={"passport-stamp "+visual.className} key={"teach-"+skill.id}>
                        <span>{visual.icon}</span>
                        <div><b>{skill.name}</b><small>{skill.level} · {skill.category||"Skill"}</small></div>
                      </div>
                    );
                  }) : <div className="passport-empty-mini">No teaching skills yet.</div>}
                </div>
              </div>

              <div className="passport-skill-column">
                <h4>🌱 Skills I’m learning</h4>
                <div className="passport-skill-stamps">
                  {passport.learn_skills.length ? passport.learn_skills.map(skill=>{
                    const visual=getSkillVisual(skill.name);
                    return (
                      <div className={"passport-stamp "+visual.className} key={"learn-"+skill.id}>
                        <span>{visual.icon}</span>
                        <div><b>{skill.name}</b><small>{skill.level} · {skill.category||"Skill"}</small></div>
                      </div>
                    );
                  }) : <div className="passport-empty-mini">No learning goals yet.</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="passport-two-column">
            <section className="passport-section passport-reputation-panel">
              <div className="passport-kicker">REPUTATION</div>
              <h3>How I show up</h3>
              <div className="passport-rating-bars">
                {[
                  ["Teaching",passport.reputation.teaching],
                  ["Communication",passport.reputation.communication],
                  ["Reliability",passport.reputation.reliability],
                  ["Friendliness",passport.reputation.friendliness]
                ].map(([label,value])=>(
                  <div className="passport-rating-row" key={label}>
                    <div><span>{label}</span><b>{Number(value||0).toFixed(1)}</b></div>
                    <div className="passport-rating-track">
                      <i style={{width:(Math.min(Number(value||0),5)/5*100)+"%"}}></i>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="passport-section">
              <div className="passport-kicker">ACHIEVEMENTS</div>
              <h3>Badges earned</h3>
              <div className="passport-badges">
                {passport.badges.length ? passport.badges.map(badge=>(
                  <div className="passport-badge" key={badge.key}>
                    <span>{badge.icon}</span>
                    <b>{badge.label}</b>
                  </div>
                )) : <div className="passport-empty-mini">Complete swaps and earn reviews to unlock badges.</div>}
              </div>
            </section>
          </div>

          <section className="passport-section">
            <div className="passport-section-head">
              <div>
                <div className="passport-kicker">MILESTONES</div>
                <h3>Learning journey</h3>
              </div>
            </div>

            <div className="passport-milestones">
              {passport.milestones.length ? passport.milestones.map((item,i)=>(
                <div className="passport-milestone" key={item.label+"-"+i}>
                  <span>{item.icon}</span>
                  <div><b>{item.label}</b><small>{item.value}</small></div>
                </div>
              )) : <div className="passport-empty-mini">Your first milestone appears after your first completed SkillSwap.</div>}
            </div>
          </section>

          <section className="passport-section">
            <div className="passport-section-head">
              <div>
                <div className="passport-kicker">RECENT STAMPS</div>
                <h3>Recent SkillSwap journeys</h3>
              </div>
            </div>

            <div className="passport-journeys">
              {passport.recent_journeys.length ? passport.recent_journeys.map(journey=>{
                const learned=getSkillVisual(journey.learned_skill);
                const taught=getSkillVisual(journey.taught_skill);
                return (
                  <article className="passport-journey" key={journey.booking_id}>
                    <div className="passport-journey-date">{formatJourneyDate(journey.starts_at)}</div>
                    <div className="passport-journey-exchange">
                      <span className={learned.className}>{learned.icon} {journey.learned_skill}</span>
                      <b>↔</b>
                      <span className={taught.className}>{taught.icon} {journey.taught_skill}</span>
                    </div>
                    <div className="passport-journey-meta">
                      <span>with {journey.partner_name}</span>
                      <small>{journey.duration_minutes} min</small>
                    </div>
                  </article>
                );
              }) : <div className="passport-empty-large">Complete your first session and it will be stamped into your Skill Passport.</div>}
            </div>
          </section>

          <footer className="passport-footer">
            <span>SkillSwap digital credential</span>
            <b>{passport.passport_code}</b>
          </footer>
        </div>
      </section>
    </div>
  );
}
