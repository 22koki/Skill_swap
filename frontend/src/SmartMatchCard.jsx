import { useState } from "react";
import { getSkillVisual } from "./skillVisuals";
import BookmarkButton from "./BookmarkButton";

const BREAKDOWN_LABELS={
  skills:"Skill compatibility",
  availability:"Availability overlap",
  session_preference:"Session preference",
  reputation:"Reputation",
  experience:"Experience",
};

export default function SmartMatchCard({match,user,onProposal,onPassport,onAvailability,onNotice,bookmarkProps}){
  const [expanded,setExpanded]=useState(false);
  const initials=(match.name||match.username||"SS").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
  const hasMutual=!!(match.i_teach_them?.length && match.they_teach_me?.length);
  const hasAny=(match.score||0)>0;
  const primaryTeach=match.they_teach_me?.[0]?.name || match.teach_skills?.[0]?.name || "";
  const primaryLearn=match.i_teach_them?.[0]?.name || match.learn_skills?.[0]?.name || "";
  const teachVisual=getSkillVisual(primaryTeach);
  const learnVisual=getSkillVisual(primaryLearn);
  const score=match.score;
  const confidence=match.confidence || (score>=85?"Excellent match":score>=70?"Strong match":score>=55?"Good match":score>=35?"Possible match":"Low compatibility");

  return (
    <article className="smart-match-card">
      <div className="smart-match-glow glow-one"></div>
      <div className="smart-match-glow glow-two"></div>

      <div className="smart-match-head">
        <button className="smart-match-person" onClick={()=>onPassport(match.user_id)}>
          <div className="smart-match-avatar-wrap">
            {match.avatar_url
              ? <img src={match.avatar_url} className="smart-match-avatar" alt="" />
              : <div className="smart-match-avatar smart-match-avatar-fallback">{initials}</div>}
            <span className="smart-match-presence"></span>
          </div>
          <div>
            <h3>{match.name}</h3>
            <p>{match.location ? "📍 "+match.location : "@"+match.username}</p>
          </div>
        </button>

        {score!==null && score!==undefined ? (
          <div className={"smart-score "+(score>=85?"excellent":score>=60?"good":"possible")}>
            <div className="smart-score-ring" style={{"--score":score}}>
              <strong>{score}%</strong>
            </div>
            <span>{confidence}</span>
          </div>
        ) : <span className="smart-community-chip">Community</span>}
      </div>

      <div className="smart-exchange">
        <div className={"smart-exchange-skill "+teachVisual.className}>
          <span>{teachVisual.icon}</span>
          <div><small>They can teach you</small><b>{primaryTeach||"Explore their skills"}</b></div>
        </div>
        <div className="smart-exchange-core">⇄</div>
        <div className={"smart-exchange-skill "+learnVisual.className}>
          <span>{learnVisual.icon}</span>
          <div><small>You can teach them</small><b>{primaryLearn||"No mutual skill yet"}</b></div>
        </div>
      </div>

      {!!match.reasons?.length && <div className="smart-reason-chips">
        {match.reasons.slice(0,4).map((reason,i)=>(
          <span className={"smart-reason "+reason.type} key={reason.label+i}>{reason.icon} {reason.label}</span>
        ))}
      </div>}

      {!!match.suggested_times?.length && (
        <div className="smart-time-box">
          <div className="smart-time-title">
            <span>⏰</span>
            <div><small>BEST SHARED TIME</small><b>{match.suggested_times[0].label}</b></div>
          </div>
          <div className="smart-time-options">
            {match.suggested_times.slice(0,3).map(slot=><span key={slot.starts_at}>{slot.label}</span>)}
          </div>
        </div>
      )}

      {user && !match.suggested_times?.length && match.reasons?.some(r=>r.label.includes("Availability still incomplete")) && (
        <button className="smart-availability-nudge" onClick={onAvailability}>
          <span>📅</span>
          <div><b>Unlock time recommendations</b><small>Add your weekly availability to improve this match.</small></div>
          <em>→</em>
        </button>
      )}

      <button className="smart-expand" onClick={()=>setExpanded(!expanded)}>
        <span>{expanded?"Hide compatibility details":"Why this match?"}</span>
        <b>{expanded?"−":"+"}</b>
      </button>

      {expanded && score!==null && score!==undefined && (
        <div className="smart-breakdown">
          <div className="smart-breakdown-grid">
            {Object.entries(match.breakdown||{}).map(([key,item])=>(
              <div className="smart-breakdown-row" key={key}>
                <div><span>{BREAKDOWN_LABELS[key]||key}</span><b>{item.score}/{item.max}</b></div>
                <div className="smart-breakdown-track">
                  <i style={{width:(item.max?item.score/item.max*100:0)+"%"}}></i>
                </div>
              </div>
            ))}
          </div>
          {!!match.missing?.length && (
            <div className="smart-improve">
              <span>💡</span>
              <div><b>How to improve this match</b>{match.missing.map((text,i)=><p key={i}>{text}</p>)}</div>
            </div>
          )}
        </div>
      )}

      <div className="smart-match-footer">
        <div className="smart-reputation-mini">
          <span>⭐ {Number(match.rating||match.average_rating||0).toFixed(1)}</span>
          <span>↻ {match.swaps||match.completed_swaps||0} swaps</span>
          <span>💬 {match.review_count||0} reviews</span>
        </div>

        <div className="smart-match-actions">
          {user&&<BookmarkButton type="user" id={match.user_id} compact {...bookmarkProps}/>}
          <button className="outline mini" onClick={()=>onPassport(match.user_id)}>View passport</button>
          {user ? (
            hasMutual
              ? <button className="primary mini" onClick={()=>onProposal(match)}>Propose swap ↗</button>
              : hasAny
                ? <button className="outline mini partial-match-button" onClick={()=>onProposal(match)}>Improve match</button>
                : <button className="outline mini" onClick={()=>onNotice(match.name+" is in the community, but your skills do not overlap yet.")}>Explore member</button>
          ) : <button className="primary mini" onClick={()=>onNotice("Log in to connect with "+match.name+".")}>Log in to connect</button>}
        </div>
      </div>
    </article>
  );
}
