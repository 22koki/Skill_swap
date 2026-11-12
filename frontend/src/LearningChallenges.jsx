import {useEffect,useState} from "react";
import "./LearningChallenges.css";

const statusLabels={available:"Ready to join",joined:"In progress",completed:"Completed",expired:"Challenge ended"};
function readable(value){if(!value)return "";try{return new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",year:"numeric"}).format(new Date(value))}catch{return value}}

export default function LearningChallenges({open,onClose,api,onOpenGoals,onOpenCommunity}){
 const [dashboard,setDashboard]=useState(null);
 const [loading,setLoading]=useState(false);
 const [busy,setBusy]=useState("");
 const [error,setError]=useState("");
 async function request(path,options={}){
  const res=await api("/challenges/"+path,options);
  if(!res.ok){const data=await res.json().catch(()=>({}));throw new Error(data.detail||"Could not load challenges")}
  return res.json();
 }
 useEffect(()=>{
  if(!open)return;
  let active=true;
  setLoading(true);setError("");
  request("").then(data=>{if(active)setDashboard(data)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});
  return ()=>{active=false};
 },[open]);
 useEffect(()=>{
  if(!open)return;
  const close=e=>{if(e.key==="Escape")onClose()};
  window.addEventListener("keydown",close);
  return ()=>window.removeEventListener("keydown",close);
 },[open,onClose]);
 async function join(slug){
  setBusy(slug);setError("");
  try{setDashboard(await request(slug+"/join/",{method:"POST"}))}
  catch(e){setError(e.message)}finally{setBusy("")}
 }
 if(!open)return null;
 const streak=dashboard?.streak||{};
 return <div className="challenge-backdrop" onMouseDown={onClose}>
  <section className="challenge-shell" role="dialog" aria-modal="true" aria-label="Learning challenges" onMouseDown={e=>e.stopPropagation()}>
   <header className="challenge-hero">
    <div className="challenge-top"><span>✦ YOUR SKILLSWAP QUESTS</span><button aria-label="Close challenges" onClick={onClose}>×</button></div>
    <h2>Small steps. Big glow-ups. ✨</h2>
    <p>Build your skills, make consistent progress, and earn badges for real learning activity.</p>
    <div className="challenge-stats">
     <div><span>🔥</span><strong>{streak.current||0}</strong><small>Current day streak</small></div>
     <div><span>⚡</span><strong>{streak.best||0}</strong><small>Best day streak</small></div>
     <div><span>🏅</span><strong>{dashboard?.completed_challenges||0}</strong><small>Badges earned</small></div>
     <div><span>✦</span><strong>{dashboard?.earned_xp||0}</strong><small>Challenge XP</small></div>
    </div>
   </header>
   <div className="challenge-body">
    {error&&<p role="alert" className="challenge-error">{error}</p>}
    <div className="challenge-heading"><div><h3>Choose your next challenge</h3><p>Rewards unlock when your tracked activity meets each target.</p></div><button className="challenge-refresh" disabled={loading} onClick={async()=>{setLoading(true);try{setDashboard(await request(""))}catch(e){setError(e.message)}finally{setLoading(false)}}}>↻ Refresh</button></div>
    {loading&&<p>Loading your challenges...</p>}
    <div className="challenge-grid">
     {(dashboard?.challenges||[]).map(ch=><article className={"challenge-card "+ch.color} key={ch.slug}>
      <div className="challenge-card-top"><span className="challenge-icon">{ch.icon}</span><span className={"challenge-status "+ch.state}>{statusLabels[ch.state]}</span></div>
      <h4>{ch.title}</h4><p>{ch.subtitle}</p>
      <div className="challenge-progress-title"><span>{ch.progress} / {ch.target} {ch.kind==="active_days"?"active days":ch.kind==="milestones"?"milestones":"project posts"}</span><b>{ch.percent}%</b></div>
      <div className="challenge-track"><span style={{width:ch.percent+"%"}}/></div>
      <div className="challenge-detail"><span>⏳ {ch.duration_days} days</span><span>✦ {ch.xp} XP</span></div>
      {ch.joined_at&&<small className="challenge-date">Joined {readable(ch.joined_at)} · Ends {readable(ch.ends_at)}</small>}
      {ch.state==="available"?<button className="challenge-join" disabled={!!busy} onClick={()=>join(ch.slug)}>{busy===ch.slug?"Joining...":"Join challenge →"}</button>
       :ch.state==="completed"?<div className="challenge-earned">🏆 {ch.badge} unlocked</div>
       :ch.state==="expired"?<div className="challenge-expired">This attempt has ended</div>
       :<div className="challenge-active">🌱 Keep going — you've got this!</div>}
     </article>)}
    </div>
    <section className="challenge-how"><div><h3>How do streaks work?</h3><p>Completing a learning milestone or sharing a learning update counts as activity for that calendar day. Multiple actions on the same day count once. Your streak stays alive if you participated today or yesterday.</p></div><div className="challenge-jumps"><button onClick={()=>{onClose();onOpenGoals()}}>🎯 Open Goals</button><button onClick={()=>{onClose();onOpenCommunity()}}>💜 Community</button></div></section>
    {!!dashboard?.badges?.length&&<section className="challenge-badges"><h3>✨ Your earned badges</h3><div>{dashboard.badges.map(b=><span key={b.name}>{b.icon} {b.name}</span>)}</div></section>}
   </div>
  </section>
 </div>;
}
