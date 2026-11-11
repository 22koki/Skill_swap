import { useMemo, useState } from "react";
import { getSkillVisual } from "./skillVisuals";

const TYPE_META={
  learn:["🎓","Learn a Skill"],
  project:["🛠","Build a Project"],
  career:["💼","Career Prep"],
  creative:["🎨","Creative Challenge"],
  study:["🧠","Study Group"],
};

function initials(name=""){
  return name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()||"SS";
}

function fmt(value){
  if(!value) return "";
  try{
    return new Intl.DateTimeFormat(undefined,{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(value));
  }catch{return value}
}

export default function SkillCircles({
  open,
  circles,
  loading,
  catalog,
  user,
  activeCircle,
  messages,
  onClose,
  onCreate,
  onOpenCircle,
  onJoin,
  onLeave,
  onSendMessage,
  onAddTask,
  onToggleTask,
  onAddResource,
  onScheduleSession,
  onGenerateAIPlan,
  onPassport,
}){
  const [view,setView]=useState("browse");
  const [filter,setFilter]=useState("all");
  const [createOpen,setCreateOpen]=useState(false);
  const [createForm,setCreateForm]=useState({
    title:"",
    circle_type:"learn",
    primary_skill:"",
    description:"",
    goal:"",
    cover_emoji:"✦",
  });
  const [joinRole,setJoinRole]=useState("learner");
  const [message,setMessage]=useState("");
  const [task,setTask]=useState("");
  const [resource,setResource]=useState({title:"",url:"",kind:"link"});
  const [session,setSession]=useState({title:"",starts_at:"",duration_minutes:60,mode:"online",meeting_link:"",location_note:"",notes:""});
  const [planSetup,setPlanSetup]=useState({session_count:4,learner_level:"beginner",learning_style:"project_based",duration_minutes:60,goal:""});

  const filtered=useMemo(()=>{
    if(filter==="all") return circles;
    if(filter==="mine") return circles.filter(c=>c.membership);
    return circles.filter(c=>c.circle_type===filter);
  },[circles,filter]);

  if(!open) return null;

  const circle=activeCircle;
  const isMember=!!circle?.membership;
  const isMentor=circle?.membership?.role==="mentor";

  function submitCreate(e){
    e.preventDefault();
    onCreate({
      ...createForm,
      primary_skill:createForm.primary_skill?Number(createForm.primary_skill):null,
    }).then(ok=>{
      if(ok){
        setCreateOpen(false);
        setCreateForm({title:"",circle_type:"learn",primary_skill:"",description:"",goal:"",cover_emoji:"✦"});
      }
    });
  }

  return (
    <div className="circles-backdrop" onMouseDown={onClose}>
      <section className="circles-shell" onMouseDown={e=>e.stopPropagation()}>
        <header className="circles-header">
          <div>
            <div className="circles-kicker">LEARN TOGETHER</div>
            <h2>Skill Circles</h2>
            <p>Small group spaces for shared goals, group sessions, challenges and peer learning.</p>
          </div>
          <div className="circles-header-actions">
            {view==="workspace"&&<button className="outline" onClick={()=>setView("browse")}>← All circles</button>}
            {user&&view==="browse"&&<button className="primary" onClick={()=>setCreateOpen(true)}>+ Create circle</button>}
            <button className="circles-close" onClick={onClose}>×</button>
          </div>
        </header>

        {view==="browse" ? (
          <>
            <div className="circles-toolbar">
              <div className="circles-filters">
                {[
                  ["all","All"],
                  ["mine","My circles"],
                  ["learn","Learn"],
                  ["project","Projects"],
                  ["career","Career"],
                  ["creative","Creative"],
                  ["study","Study"],
                ].map(([key,label])=>(
                  <button key={key} className={filter===key?"active":""} onClick={()=>setFilter(key)}>{label}</button>
                ))}
              </div>
              <div className="circles-count">{filtered.length} circle{filtered.length===1?"":"s"}</div>
            </div>

            <div className="circles-grid">
              {loading ? <div className="circles-empty">Loading circles…</div> :
               filtered.length ? filtered.map(item=>{
                const meta=TYPE_META[item.circle_type]||TYPE_META.learn;
                const visual=getSkillVisual(item.primary_skill_name||item.title);
                return (
                  <article className="circle-card" key={item.id}>
                    <div className="circle-card-aura"></div>
                    <div className="circle-card-top">
                      <div className={"circle-card-icon "+visual.className}>{item.cover_emoji||visual.icon||meta[0]}</div>
                      <span className="circle-type-pill">{meta[0]} {meta[1]}</span>
                    </div>

                    <h3>{item.title}</h3>
                    <p>{item.description||item.goal||"A SkillSwap group learning space."}</p>

                    <div className="circle-card-skill">
                      <span>{visual.icon}</span>
                      <div><small>FOCUS SKILL</small><b>{item.primary_skill_name||"Multi-skill circle"}</b></div>
                    </div>

                    <div className="circle-member-stack">
                      <div className="circle-avatars">
                        {(item.members||[]).slice(0,5).map(member=>(
                          <button key={member.id} onClick={()=>onPassport(member.user_id)} title={member.name}>
                            {member.avatar_url?<img src={member.avatar_url} alt=""/>:<span>{initials(member.name)}</span>}
                          </button>
                        ))}
                        {item.member_count>5&&<i>+{item.member_count-5}</i>}
                      </div>
                      <div className="circle-member-copy">
                        <b>{item.member_count} member{item.member_count===1?"":"s"}</b>
                        <span>{item.mentor_count} mentors · {item.learner_count} learners</span>
                      </div>
                    </div>

                    <div className="circle-progress-row">
                      <div>
                        <span>Group progress</span><b>{item.progress_percentage||0}%</b>
                      </div>
                      <div className="circle-progress-track"><i style={{width:(item.progress_percentage||0)+"%"}}></i></div>
                    </div>

                    {item.next_session&&(
                      <div className="circle-next-session">
                        <span>📅</span>
                        <div><small>NEXT SESSION</small><b>{fmt(item.next_session.starts_at)}</b></div>
                      </div>
                    )}

                    <div className="circle-card-actions">
                      <button className="outline" onClick={async()=>{await onOpenCircle(item.id);setView("workspace");}}>Open circle</button>
                      {!item.membership&&user&&<button className="primary" onClick={()=>onJoin(item.id,"learner")}>Join →</button>}
                      {item.membership&&<span className={"circle-role "+item.membership.role}>{item.membership.role==="mentor"?"🎓 Mentor":"🌱 Learner"}</span>}
                    </div>
                  </article>
                );
               }) : <div className="circles-empty">
                 <div>👥</div><h3>No circles here yet</h3><p>Create the first group around a skill you care about.</p>
               </div>}
            </div>
          </>
        ) : circle ? (
          <div className="circle-workspace">
            <section className="circle-workspace-hero">
              <div className={"circle-workspace-icon "+getSkillVisual(circle.primary_skill_name||circle.title).className}>{circle.cover_emoji||"✦"}</div>
              <div className="circle-workspace-copy">
                <div className="circles-kicker">{(TYPE_META[circle.circle_type]||TYPE_META.learn)[1]}</div>
                <h2>{circle.title}</h2>
                <p>{circle.goal||circle.description}</p>
                <div className="circle-workspace-meta">
                  <span>👥 {circle.member_count} members</span>
                  <span>🎓 {circle.mentor_count} mentors</span>
                  <span>🌱 {circle.learner_count} learners</span>
                  <span>📈 {circle.progress_percentage}% progress</span>
                </div>
              </div>
              <div className="circle-workspace-actions">
                {!isMember&&user&&(
                  <>
                    <select value={joinRole} onChange={e=>setJoinRole(e.target.value)}>
                      <option value="learner">Join as learner</option>
                      <option value="mentor">Join as mentor</option>
                    </select>
                    <button className="primary" onClick={()=>onJoin(circle.id,joinRole)}>Join circle</button>
                  </>
                )}
                {isMember&&circle.created_by!==user?.id&&<button className="outline" onClick={()=>onLeave(circle.id)}>Leave circle</button>}
              </div>
            </section>

            <div className="circle-workspace-grid">
              <section className="circle-workspace-main">
                <div className="circle-panel">
                  <div className="circle-panel-head">
                    <div><small>SHARED ROADMAP</small><h3>Group learning plan</h3></div>
                    {isMentor&&<button className="outline" onClick={()=>onGenerateAIPlan(circle.id,{...planSetup,goal:planSetup.goal||circle.goal})}>✦ Generate roadmap</button>}
                  </div>
                  {circle.ai_plan?.sessions?.length ? (
                    <div className="circle-roadmap">
                      {circle.ai_plan.sessions.map((s,i)=>(
                        <article key={i}>
                          <span>{String(i+1).padStart(2,"0")}</span>
                          <div><small>SESSION {i+1}</small><b>{s.title}</b><p>{s.objective}</p></div>
                        </article>
                      ))}
                    </div>
                  ) : <div className="circle-inline-empty">Mentors can generate a shared AI learning roadmap for the group.</div>}
                </div>

                <div className="circle-panel">
                  <div className="circle-panel-head">
                    <div><small>GROUP CHALLENGES</small><h3>Shared checklist</h3></div>
                  </div>
                  <div className="circle-task-list">
                    {(circle.tasks||[]).map(item=>(
                      <label key={item.id} className={"circle-task "+(item.is_done?"done":"")}>
                        <input type="checkbox" checked={item.is_done} onChange={e=>onToggleTask(item.id,e.target.checked)}/>
                        <span>✓</span><b>{item.text}</b>
                      </label>
                    ))}
                    {!circle.tasks?.length&&<div className="circle-inline-empty">No challenges yet.</div>}
                  </div>
                  {isMember&&<div className="circle-compose-inline">
                    <input value={task} onChange={e=>setTask(e.target.value)} placeholder="Add a shared challenge…"/>
                    <button className="primary" onClick={()=>{if(task.trim()){onAddTask(circle.id,task);setTask("");}}}>Add</button>
                  </div>}
                </div>

                <div className="circle-panel">
                  <div className="circle-panel-head">
                    <div><small>RESOURCES</small><h3>Shared learning library</h3></div>
                  </div>
                  <div className="circle-resource-grid">
                    {(circle.resources||[]).map(item=>(
                      <a href={item.url} target="_blank" rel="noreferrer" key={item.id}>
                        <span>{item.kind==="video"?"🎥":item.kind==="article"?"📄":item.kind==="project"?"🛠":"🔗"}</span>
                        <div><b>{item.title}</b><small>Added by {item.added_by_name}</small></div>
                      </a>
                    ))}
                    {!circle.resources?.length&&<div className="circle-inline-empty">No shared resources yet.</div>}
                  </div>
                  {isMember&&<div className="circle-resource-form">
                    <input value={resource.title} onChange={e=>setResource({...resource,title:e.target.value})} placeholder="Resource title"/>
                    <input value={resource.url} onChange={e=>setResource({...resource,url:e.target.value})} placeholder="https://…"/>
                    <select value={resource.kind} onChange={e=>setResource({...resource,kind:e.target.value})}>
                      <option value="link">Link</option><option value="video">Video</option><option value="article">Article</option><option value="project">Project</option>
                    </select>
                    <button className="outline" onClick={()=>{if(resource.title&&resource.url){onAddResource(circle.id,resource);setResource({title:"",url:"",kind:"link"});}}}>Share</button>
                  </div>}
                </div>
              </section>

              <aside className="circle-workspace-side">
                <section className="circle-panel">
                  <div className="circle-panel-head"><div><small>MEMBERS</small><h3>Circle people</h3></div></div>
                  <div className="circle-members-list">
                    {(circle.members||[]).map(member=>(
                      <button key={member.id} onClick={()=>onPassport(member.user_id)}>
                        {member.avatar_url?<img src={member.avatar_url} alt=""/>:<span>{initials(member.name)}</span>}
                        <div><b>{member.name}</b><small>@{member.username}</small></div>
                        <em className={member.role}>{member.role}</em>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="circle-panel">
                  <div className="circle-panel-head"><div><small>GROUP SESSIONS</small><h3>Meetups</h3></div></div>
                  <div className="circle-session-list">
                    {(circle.sessions||[]).map(item=>(
                      <article key={item.id}>
                        <span>📅</span>
                        <div><b>{item.title}</b><small>{fmt(item.starts_at)} · {item.duration_minutes} min</small></div>
                      </article>
                    ))}
                    {!circle.sessions?.length&&<div className="circle-inline-empty">No sessions scheduled yet.</div>}
                  </div>
                  {isMentor&&<div className="circle-session-form">
                    <input value={session.title} onChange={e=>setSession({...session,title:e.target.value})} placeholder="Session title"/>
                    <input type="datetime-local" value={session.starts_at} onChange={e=>setSession({...session,starts_at:e.target.value})}/>
                    <button className="outline" onClick={()=>{if(session.title&&session.starts_at){onScheduleSession(circle.id,session);setSession({title:"",starts_at:"",duration_minutes:60,mode:"online",meeting_link:"",location_note:"",notes:""});}}}>Schedule</button>
                  </div>}
                </section>

                <section className="circle-panel circle-chat-panel">
                  <div className="circle-panel-head"><div><small>GROUP CHAT</small><h3>Circle conversation</h3></div></div>
                  <div className="circle-chat-list">
                    {isMember ? messages.map(msg=>(
                      <div className={"circle-chat-message "+(msg.sender_id===user?.id?"mine":"")} key={msg.id}>
                        <b>{msg.sender_name}</b><p>{msg.body}</p><small>{fmt(msg.created_at)}</small>
                      </div>
                    )) : <div className="circle-inline-empty">Join the circle to view the group chat.</div>}
                  </div>
                  {isMember&&<div className="circle-compose-inline">
                    <input value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&message.trim()){onSendMessage(circle.id,message);setMessage("");}}} placeholder="Message the circle…"/>
                    <button className="primary" onClick={()=>{if(message.trim()){onSendMessage(circle.id,message);setMessage("");}}}>Send</button>
                  </div>}
                </section>
              </aside>
            </div>
          </div>
        ) : <div className="circles-empty">Select a circle to open its workspace.</div>}

        {createOpen&&(
          <div className="circle-create-backdrop" onMouseDown={()=>setCreateOpen(false)}>
            <form className="circle-create-modal" onSubmit={submitCreate} onMouseDown={e=>e.stopPropagation()}>
              <button type="button" className="modal-close" onClick={()=>setCreateOpen(false)}>×</button>
              <div className="circles-kicker">START A COMMUNITY</div>
              <h2>Create a Skill Circle</h2>

              <label>Circle name<input required value={createForm.title} onChange={e=>setCreateForm({...createForm,title:e.target.value})} placeholder="e.g. React Builders"/></label>
              <div className="circle-create-grid">
                <label>Circle type<select value={createForm.circle_type} onChange={e=>setCreateForm({...createForm,circle_type:e.target.value})}>
                  {Object.entries(TYPE_META).map(([key,val])=><option key={key} value={key}>{val[0]} {val[1]}</option>)}
                </select></label>
                <label>Primary skill<select value={createForm.primary_skill} onChange={e=>setCreateForm({...createForm,primary_skill:e.target.value})}>
                  <option value="">Multi-skill</option>
                  {catalog.map(skill=><option key={skill.id} value={skill.id}>{skill.name}</option>)}
                </select></label>
              </div>
              <label>Group goal<input value={createForm.goal} onChange={e=>setCreateForm({...createForm,goal:e.target.value})} placeholder="What should members achieve together?"/></label>
              <label>Description<textarea value={createForm.description} onChange={e=>setCreateForm({...createForm,description:e.target.value})} placeholder="Describe the vibe, audience and focus of the circle."/></label>
              <button className="primary" type="submit">Create circle →</button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
