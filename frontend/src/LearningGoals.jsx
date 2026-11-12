import {useEffect,useState} from "react";
import "./LearningGoals.css";

export default function LearningGoals({open,onClose,api,catalog=[]}){
 const [goals,setGoals]=useState([]);
 const [loading,setLoading]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [creating,setCreating]=useState(false);
 const [form,setForm]=useState({title:"",description:"",skill:"",target_date:""});
 const [newMilestone,setNewMilestone]=useState({});
 const [expanded,setExpanded]=useState({});

 async function request(path,options={}){
  const response=await api("/goals/"+path,options);
  if(!response.ok){
   const info=await response.json().catch(()=>({}));
   throw new Error(info.detail||JSON.stringify(info).slice(0,200));
  }
  return response.status===204?null:response.json();
 }
 async function refresh(){setGoals(await request(""))}
 useEffect(()=>{
  if(!open)return;
  let cancelled=false;
  setLoading(true);setError("");
  request("").then(data=>{if(!cancelled)setGoals(data)}).catch(e=>{if(!cancelled)setError(e.message)}).finally(()=>{if(!cancelled)setLoading(false)});
  return ()=>{cancelled=true};
 },[open]);
 useEffect(()=>{
  if(!open)return;
  const onKey=e=>{if(e.key==="Escape")onClose()};
  window.addEventListener("keydown",onKey);
  return ()=>window.removeEventListener("keydown",onKey);
 },[open,onClose]);
 async function act(fn){
  setBusy(true);setError("");
  try{await fn();await refresh();return true}
  catch(e){setError(e.message);return false}
  finally{setBusy(false)}
 }
 async function create(e){
  e.preventDefault();
  if(!form.title.trim())return;
  const data={title:form.title.trim(),description:form.description,skill:form.skill||null,target_date:form.target_date||null};
  if(await act(()=>request("",{method:"POST",body:JSON.stringify(data)}))){
   setForm({title:"",description:"",skill:"",target_date:""});setCreating(false);
  }
 }
 async function addMilestone(e,goal){
  e.preventDefault();
  const title=(newMilestone[goal.id]||"").trim();
  if(!title)return;
  if(await act(()=>request(goal.id+"/milestones/",{method:"POST",body:JSON.stringify({title})})))
   setNewMilestone(prev=>({...prev,[goal.id]:""}));
 }
 async function toggleMilestone(goal,milestone){
  await act(()=>request(goal.id+"/milestones/"+milestone.id+"/",{method:"PATCH",body:JSON.stringify({is_done:!milestone.is_done})}));
 }
 async function status(goal,value){
  await act(()=>request(goal.id+"/",{method:"PATCH",body:JSON.stringify({status:value})}));
 }
 async function removeGoal(goal){
  if(!window.confirm("Delete '"+goal.title+"' and all its milestones?"))return;
  await act(()=>request(goal.id+"/",{method:"DELETE"}));
 }
 const active=goals.filter(x=>x.status==="active").length;
 const completed=goals.filter(x=>x.status==="completed").length;
 const completedMilestones=goals.reduce((n,g)=>n+g.milestones.filter(m=>m.is_done).length,0);
 if(!open)return null;
 return <div className="lg-backdrop" onMouseDown={onClose}>
  <section className="lg-shell" role="dialog" aria-modal="true" aria-label="Learning goals" onMouseDown={e=>e.stopPropagation()}>
   <div className="lg-hero">
    <div className="lg-topline"><span>✦ YOUR GROWTH STUDIO</span><button onClick={onClose} aria-label="Close learning goals">×</button></div>
    <h2>Make progress feel magical. ✨</h2>
    <p>Turn big ambitions into small wins. Every milestone counts.</p>
    <div className="lg-stats"><div><b>{active}</b><small>Active goals</small></div><div><b>{completedMilestones}</b><small>Milestones done</small></div><div><b>{completed}</b><small>Goals achieved</small></div></div>
   </div>
   <div className="lg-main">
    <div className="lg-heading"><div><h3>Your learning journeys</h3><p>Build your skills at your own pace.</p></div><button className="lg-primary" onClick={()=>setCreating(x=>!x)}>{creating?"Cancel":"+ New goal"}</button></div>
    {error&&<p role="alert" className="lg-error">{error}</p>}
    {creating&&<form className="lg-create" onSubmit={create}>
     <label>What would you like to achieve?<input required maxLength={160} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Build my first React app"/></label>
     <label>Why does this matter?<textarea rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="A few words to keep yourself motivated..."/></label>
     <div className="lg-create-row"><label>Related skill<select value={form.skill} onChange={e=>setForm({...form,skill:e.target.value})}><option value="">Choose a skill (optional)</option>{catalog.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Target date<input type="date" value={form.target_date} onChange={e=>setForm({...form,target_date:e.target.value})}/></label></div>
     <button className="lg-primary" disabled={busy}>Create my goal ↗</button>
    </form>}
    {loading&&<p>Loading your goals...</p>}
    {!loading&&goals.length===0&&!creating&&<div className="lg-empty"><span>🎯</span><h3>Your next chapter starts here</h3><p>Set one goal and break it into achievable steps.</p><button className="lg-primary" onClick={()=>setCreating(true)}>Create your first goal</button></div>}
    <div className="lg-grid">
     {goals.map(goal=>{
      const done=goal.milestones.filter(m=>m.is_done).length;
      const isExpanded=expanded[goal.id]!==false;
      return <article key={goal.id} className="lg-card">
       <div className="lg-card-header"><span className="lg-card-icon">{goal.status==="completed"?"🏆":goal.status==="paused"?"⏸":"🌱"}</span><div className="lg-card-title"><small>{goal.skill_name||"PERSONAL GROWTH"}</small><h4>{goal.title}</h4></div><span className={"lg-status "+goal.status}>{goal.status}</span></div>
       {goal.description&&<p className="lg-description">{goal.description}</p>}
       <div className="lg-progress-head"><span>{done} of {goal.milestones.length} milestones</span><b>{goal.progress}%</b></div>
       <div className="lg-track"><span style={{width:goal.progress+"%"}}/></div>
       <div className="lg-meta"><span>{goal.target_date?"📅 Due "+new Date(goal.target_date+"T12:00:00").toLocaleDateString():"📅 No deadline"}</span><button onClick={()=>setExpanded(x=>({...x,[goal.id]:!isExpanded}))}>{isExpanded?"Hide steps ↑":"View steps ↓"}</button></div>
       {isExpanded&&<div className="lg-milestones">
        {goal.milestones.map(m=><label key={m.id} className={m.is_done?"done":""}><input type="checkbox" checked={m.is_done} disabled={busy} onChange={()=>toggleMilestone(goal,m)}/><span>{m.title}</span></label>)}
        <form onSubmit={e=>addMilestone(e,goal)} className="lg-add-step"><input maxLength={180} value={newMilestone[goal.id]||""} onChange={e=>setNewMilestone(x=>({...x,[goal.id]:e.target.value}))} placeholder="+ Add a milestone"/><button disabled={busy||!(newMilestone[goal.id]||"").trim()}>Add</button></form>
       </div>}
       <div className="lg-card-actions"><select aria-label={"Status for "+goal.title} value={goal.status} disabled={busy} onChange={e=>status(goal,e.target.value)}><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option></select><button disabled={busy} onClick={()=>removeGoal(goal)}>Delete</button></div>
      </article>;
     })}
    </div>
   </div>
  </section>
 </div>;
}
