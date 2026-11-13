import { getSkillVisual } from "./skillVisuals";

function fmtDate(value){
 if(!value) return "";
 return new Intl.DateTimeFormat(undefined,{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(value));
}

function fmtTime(value){
 if(!value) return "";
 return new Intl.DateTimeFormat(undefined,{hour:"numeric",minute:"2-digit"}).format(new Date(value));
}

function greeting(){
 const hour=new Date().getHours();
 if(hour<12) return "Good morning";
 if(hour<18) return "Good afternoon";
 return "Good evening";
}

function initials(value="SS"){
 return value.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
}

export default function HomeDashboard({
 user,
 data,
 loading,
 onRefresh,
 onCalendar,
 onWorkspace,
 onChat,
 onRequests,
 onCircle,
 onProposal,
 onProgression,
 onDiscover,
 onPassport,
}){
 const summary=data?.summary||{};
 const progression=data?.progression||null;
 const next=data?.next_session||null;
 const requests=data?.pending_requests||[];
 const conversations=data?.conversations||[];
 const recommendations=data?.recommendations||[];
 const circles=data?.circle_activity||[];
 const recentAchievements=data?.recent_achievements||[];
 const nextAchievements=data?.next_achievements||[];

 return (
  <section id="top" className="home-dashboard">
   <div className="home-dashboard-ambient ambient-a"></div>
   <div className="home-dashboard-ambient ambient-b"></div>

   <header className="home-dashboard-hero">
    <div className="home-dashboard-welcome">
      <div className="home-dashboard-kicker">✦ YOUR SKILLSWAP HOME</div>
      <h1>{greeting()}, <span>{user?.first_name||user?.username||"Swapper"}</span>.</h1>
      <p>
        {next
          ? "You have a learning session coming up. Keep the momentum going."
          : "Your learning network is ready. Find someone new, join a Circle, or plan your next exchange."}
      </p>
      <div className="home-dashboard-quick-actions">
        <button className="primary" onClick={onDiscover}>⌕ Find a match</button>
        <button className="outline" onClick={onCalendar}>📅 Open calendar</button>
        <button className="outline" onClick={onRefresh}>↻ Refresh</button>
      </div>
    </div>

    <button className="home-level-card" onClick={onProgression} disabled={!progression}>
      <div className="home-level-icon">{progression?.level?.icon||"✦"}</div>
      <div className="home-level-copy">
        <small>YOUR MOMENTUM</small>
        <div><h3>{progression?.level?.name||"New Swapper"}</h3><strong>{progression?.xp||0} XP</strong></div>
        <div className="home-level-track"><i style={{width:(progression?.level_progress||0)+"%"}}></i></div>
        <span>🔥 {progression?.current_streak||0} week streak · {progression?.xp_to_next||0} XP to next level</span>
      </div>
      <em>→</em>
    </button>
   </header>

   {loading&&!data ? <div className="home-dashboard-loading">Building your SkillSwap home…</div> : <>
    <div className="home-stat-grid">
      <button onClick={onRequests}>
        <span className="home-stat-icon purple">🤝</span>
        <div><strong>{summary.pending_requests||0}</strong><small>Pending requests</small></div>
        <em>→</em>
      </button>
      <button onClick={()=>conversations[0]&&onChat(conversations[0].swap)}>
        <span className="home-stat-icon orange">💬</span>
        <div><strong>{summary.unread_messages||0}</strong><small>Unread messages</small></div>
        <em>→</em>
      </button>
      <button onClick={onCalendar}>
        <span className="home-stat-icon blue">📅</span>
        <div><strong>{summary.upcoming_sessions||0}</strong><small>Upcoming sessions</small></div>
        <em>→</em>
      </button>
      <button onClick={onProgression}>
        <span className="home-stat-icon green">⚡</span>
        <div><strong>+{summary.weekly_xp||0}</strong><small>XP this week</small></div>
        <em>→</em>
      </button>
    </div>

    <div className="home-dashboard-main-grid">
      <div className="home-dashboard-primary">
        <section className="home-card home-next-card">
          <div className="home-card-head">
            <div><small>NEXT UP</small><h2>Your next session</h2></div>
            <button onClick={onCalendar}>View calendar →</button>
          </div>

          {next ? <div className="home-next-session">
            <div className="home-next-time">
              <span>{new Intl.DateTimeFormat(undefined,{month:"short"}).format(new Date(next.starts_at)).toUpperCase()}</span>
              <strong>{new Date(next.starts_at).getDate()}</strong>
              <small>{fmtTime(next.starts_at)}</small>
            </div>
            <div className="home-next-copy">
              <div className="home-next-label">SKILLSWAP SESSION</div>
              <h3>{next.learn_skill_name} ↔ {next.teach_skill_name}</h3>
              <p>with <b>{next.partner_name}</b> · {next.duration_minutes} min · {next.mode?.replace("_"," ")}</p>
              <div className="home-next-meta">
                <span>📍 {next.mode==="online"?"Online session":next.location_note||"In person"}</span>
                {next.pending_reschedule&&<span className="home-reschedule-chip">↻ Reschedule pending</span>}
              </div>
            </div>
            <div className="home-next-actions">
              <button className="outline" onClick={()=>onChat(next.swap)}>Message</button>
              <button className="primary" onClick={()=>onWorkspace(next.id)}>Open workspace →</button>
            </div>
          </div> : <div className="home-empty-card">
            <span>📅</span><div><h3>No session scheduled yet.</h3><p>Find a compatible match and turn it into your next learning session.</p></div>
            <button className="primary" onClick={onDiscover}>Find a match</button>
          </div>}
        </section>

        <section className="home-card">
          <div className="home-card-head">
            <div><small>SMART MATCHES</small><h2>People worth meeting</h2></div>
            <button onClick={onDiscover}>Explore more →</button>
          </div>
          <div className="home-match-list">
            {recommendations.length?recommendations.map(match=>{
              const teach=match.they_teach_me?.[0]?.name||"Skill";
              const learn=match.i_teach_them?.[0]?.name||"Skill";
              const tv=getSkillVisual(teach);
              const lv=getSkillVisual(learn);
              return <article className="home-match-card" key={match.user_id}>
                <button className="home-match-person" onClick={()=>onPassport(match.user_id)}>
                  {match.avatar_url?<img src={match.avatar_url} alt=""/>:<span>{initials(match.name)}</span>}
                  <div><b>{match.name}</b><small>{match.location||"SkillSwap member"}</small></div>
                </button>
                <div className="home-match-score"><strong>{match.score}%</strong><span>{match.confidence||"match"}</span></div>
                <div className="home-match-exchange">
                  <span className={tv.className}>{tv.icon} {teach}</span><b>⇄</b><span className={lv.className}>{lv.icon} {learn}</span>
                </div>
                <div className="home-match-footer">
                  <small>⭐ {Number(match.average_rating||0).toFixed(1)} · ↻ {match.completed_swaps||0} swaps</small>
                  <button className="primary mini" onClick={()=>onProposal(match)}>Propose swap ↗</button>
                </div>
              </article>
            }):<div className="home-inline-empty">Add more teaching and learning skills to unlock stronger recommendations.</div>}
          </div>
        </section>

        <section className="home-card">
          <div className="home-card-head">
            <div><small>SKILL CIRCLES</small><h2>Your learning communities</h2></div>
            <button onClick={()=>circles[0]?onCircle(circles[0].id):onDiscover()}>Open Circles →</button>
          </div>
          <div className="home-circle-grid">
            {circles.length?circles.map(circle=>(
              <button className="home-circle-card" key={circle.id} onClick={()=>onCircle(circle.id)}>
                <span className="home-circle-emoji">{circle.cover_emoji||"✦"}</span>
                <div>
                  <small>{circle.role.toUpperCase()} · {circle.member_count} MEMBERS</small>
                  <h3>{circle.title}</h3>
                  <p>
                    {circle.latest_message
                      ? circle.latest_message.sender_name+": "+circle.latest_message.body
                      : circle.next_session
                        ? "Next: "+fmtDate(circle.next_session.starts_at)
                        : circle.primary_skill_name||"Open the Circle"}
                  </p>
                </div>
                <em>→</em>
              </button>
            )):<div className="home-inline-empty">Join a Skill Circle to learn with a small community.</div>}
          </div>
        </section>
      </div>

      <aside className="home-dashboard-side">
        <section className="home-card home-inbox-card">
          <div className="home-card-head">
            <div><small>INBOX</small><h2>Messages</h2></div>
            <span>{summary.unread_messages||0} unread</span>
          </div>
          <div className="home-conversation-list">
            {conversations.length?conversations.map(item=>(
              <button key={item.id} onClick={()=>onChat(item.swap)}>
                <span className="home-conversation-avatar">
                  {item.partner_avatar_url?<img src={item.partner_avatar_url} alt=""/>:<i>{initials(item.partner_name)}</i>}
                  {item.partner_online&&<b></b>}
                </span>
                <div>
                  <strong>{item.partner_name}</strong>
                  <p>{item.last_message?.body||"Open your SkillSwap conversation"}</p>
                </div>
                <span className="home-conversation-meta">
                  <small>{item.last_message?.created_at?fmtTime(item.last_message.created_at):""}</small>
                  {item.unread_count>0&&<em>{item.unread_count}</em>}
                </span>
              </button>
            )):<div className="home-inline-empty">Your conversations will appear here after you accept a swap.</div>}
          </div>
        </section>

        <section className="home-card home-request-card">
          <div className="home-card-head">
            <div><small>ACTION NEEDED</small><h2>Swap requests</h2></div>
            <button onClick={onRequests}>View all →</button>
          </div>
          <div className="home-request-list">
            {requests.length?requests.map(item=>{
              const requester=item.requester_name||"SkillSwap member";
              return <button key={item.id} onClick={onRequests}>
                <span>{initials(requester)}</span>
                <div><b>{requester}</b><small>{item.offered_skill_name} ↔ {item.requested_skill_name}</small></div>
                <em>→</em>
              </button>
            }):<div className="home-inline-empty">No pending requests. You’re all caught up.</div>}
          </div>
        </section>

        <section className="home-card home-achievement-card">
          <div className="home-card-head">
            <div><small>PROGRESSION</small><h2>Your momentum</h2></div>
            <button onClick={onProgression}>See all →</button>
          </div>

          {!!recentAchievements.length&&<div className="home-achievement-earned">
            <small>RECENTLY UNLOCKED</small>
            {recentAchievements.map(item=><div key={item.key}><span>{item.icon}</span><div><b>{item.title}</b><small>+{item.xp} XP</small></div></div>)}
          </div>}

          {!!nextAchievements.length&&<div className="home-achievement-next">
            <small>NEXT ACHIEVEMENTS</small>
            {nextAchievements.map(item=>(
              <div key={item.key}>
                <div><span>{item.icon}</span><b>{item.title}</b><em>{item.progress}%</em></div>
                <div className="home-achievement-track"><i style={{width:item.progress+"%"}}></i></div>
              </div>
            ))}
          </div>}
        </section>
      </aside>
    </div>
   </>}
  </section>
 );
}
