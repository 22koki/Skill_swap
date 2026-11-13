import { useEffect, useMemo, useState } from "react";
import { getSkillVisual } from "./skillVisuals";
import BookmarkButton from "./BookmarkButton";

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
  onTyping,
  onlineMemberIds=[],
  typingUsers=[],
  onAddTask,
  onToggleTask,
  onAddResource,
  onScheduleSession,
  onGenerateAIPlan,
  onPassport,
  onModerateMember,
  onDeleteMessage,
  onReport,
  focusCircleId,
  bookmarkProps,
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

  useEffect(()=>{
    if(open && activeCircle?.id===focusCircleId && focusCircleId){
      setView("workspace");
    }
  },[open,activeCircle?.id,focusCircleId]);

  const filtered=useMemo(()=>{
    if(filter==="all") return circles;
    if(filter==="mine") return circles.filter(c=>c.membership);
    return circles.filter(c=>c.circle_type===filter);
  },[circles,filter]);

  const myCircles=useMemo(()=>circles.filter(item=>item.membership),[circles]);
  const featuredCircle=useMemo(()=>{
    return filtered.find(item=>item.membership) || filtered[0] || circles[0] || null;
  },[filtered,circles]);
  const discoverCircles=useMemo(()=>{
    if(!featuredCircle) return filtered;
    return filtered.filter(item=>item.id!==featuredCircle.id);
  },[filtered,featuredCircle]);
  const communityStats=useMemo(()=>{
    const uniqueMembers=new Set();
    const uniqueMentors=new Map();
    const upcoming=[];
    circles.forEach(item=>{
      (item.members||[]).forEach(member=>{
        uniqueMembers.add(member.user_id);
        if(member.role==="mentor") uniqueMentors.set(member.user_id,member);
      });
      (item.sessions||[]).forEach(session=>{
        if(new Date(session.starts_at).getTime()>=Date.now()){
          upcoming.push({...session,circleTitle:item.title,circleEmoji:item.cover_emoji});
        }
      });
    });
    upcoming.sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at));
    return {
      circles:circles.length,
      members:uniqueMembers.size,
      mentors:Array.from(uniqueMentors.values()),
      sessions:upcoming.slice(0,3),
    };
  },[circles]);

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
        <header className={"circles-header "+(view==="browse"?"circles-header-showcase":"")}>
          <div className="circles-header-copy">
            <div className="circles-kicker">LEARN TOGETHER</div>
            <h2>Skill Circles</h2>
            <p>Small group spaces for shared goals, group sessions, challenges and peer learning.</p>
          </div>

          {view==="browse"&&<div className="circles-header-art" aria-hidden="true">
            <span className="circle-float-icon camera">📷</span>
            <span className="circle-float-icon code">{"</>"}</span>
            <span className="circle-float-icon creative">🖌️</span>
            <i className="circle-orbit orbit-one"></i>
            <i className="circle-orbit orbit-two"></i>
          </div>}

          <div className="circles-header-actions">
            {view==="workspace"&&<button className="outline" onClick={()=>setView("browse")}>← All circles</button>}
            {user&&view==="browse"&&<button className="primary circles-create-main" onClick={()=>setCreateOpen(true)}>+ Create circle</button>}
            <button className="circles-close" onClick={onClose}>×</button>
          </div>
        </header>

        {view==="browse" ? (
          <div className="circles-browse">
            <div className="circles-toolbar circles-toolbar-premium">
              <div className="circles-filters">
                {[
                  ["all","▦","All"],
                  ["mine","♙","My circles"],
                  ["learn","▣","Learn"],
                  ["project","◆","Projects"],
                  ["career","▤","Career"],
                  ["creative","✦","Creative"],
                  ["study","◇","Study"],
                ].map(([key,icon,label])=>(
                  <button key={key} className={filter===key?"active":""} onClick={()=>setFilter(key)}>
                    <span>{icon}</span>{label}
                  </button>
                ))}
              </div>
              <div className="circles-count">{filtered.length} circle{filtered.length===1?"":"s"}</div>
            </div>

            {loading ? <div className="circles-empty">Loading circles…</div> : featuredCircle ? (
              <div className="circles-dashboard">
                <main className="circles-dashboard-main">
                  {(()=>{
                    const item=featuredCircle;
                    const meta=TYPE_META[item.circle_type]||TYPE_META.learn;
                    const visual=getSkillVisual(item.primary_skill_name||item.title);
                    return <article className={"circle-featured circle-theme-"+item.circle_type}>
                      <div className="circle-featured-bg">
                        <span className="circle-featured-orb orb-a"></span>
                        <span className="circle-featured-orb orb-b"></span>
                        <span className="circle-featured-grid"></span>
                      </div>

                      <div className="circle-featured-content">
                        <div className="circle-featured-label">
                          <span>✦</span> FEATURED CIRCLE
                        </div>
                        <h3>{item.title}</h3>
                        <p>{item.description||item.goal||"Learn, build and grow together with the SkillSwap community."}</p>

                        <div className="circle-featured-members">
                          <div className="circle-avatars featured">
                            {(item.members||[]).slice(0,5).map(member=>(
                              <button key={member.id} onClick={()=>onPassport(member.user_id)} title={member.name}>
                                {member.avatar_url?<img src={member.avatar_url} alt=""/>:<span>{initials(member.name)}</span>}
                              </button>
                            ))}
                          </div>
                          <div>
                            <b>{item.member_count} member{item.member_count===1?"":"s"}</b>
                            <span>{item.mentor_count} mentor{item.mentor_count===1?"":"s"} · {item.learner_count} learner{item.learner_count===1?"":"s"}</span>
                          </div>
                        </div>

                        <div className="circle-featured-metrics">
                          <div><span>{visual.icon}</span><small>FOCUS SKILL</small><b>{item.primary_skill_name||"Multi-skill"}</b></div>
                          <div><span>👥</span><small>COMMUNITY</small><b>{meta[1]}</b></div>
                          <div><span>📅</span><small>NEXT SESSION</small><b>{item.next_session?fmt(item.next_session.starts_at):"Plan together"}</b></div>
                        </div>

                        <div className="circle-featured-progress">
                          <div><span>Group progress</span><b>{item.progress_percentage||0}%</b></div>
                          <div className="circle-progress-track"><i style={{width:(item.progress_percentage||0)+"%"}}></i></div>
                        </div>

                        <div className="circle-featured-actions">
                          {user&&<BookmarkButton type="circle" id={item.id} compact {...bookmarkProps}/>}
                          <button className="circle-featured-open" onClick={async()=>{await onOpenCircle(item.id);setView("workspace");}}>Open circle <span>→</span></button>
                          {item.membership
                            ? <span className={"circle-featured-role "+item.membership.role}>{item.membership.role==="mentor"?"🎓 Mentor":"🌱 Learner"}</span>
                            : user&&<button className="circle-featured-join" onClick={()=>onJoin(item.id,"learner")}>Join circle</button>}
                        </div>
                      </div>

                      <div className="circle-featured-visual">
                        <div className={"circle-featured-icon "+visual.className}>
                          <span>{visual.icon}</span>
                        </div>
                        <div className="circle-featured-chip chip-one">✦ Learn</div>
                        <div className="circle-featured-chip chip-two">↗ Build</div>
                        <div className="circle-featured-chip chip-three">👥 Grow</div>
                      </div>
                    </article>;
                  })()}

                  <section className="circles-discover-section">
                    <div className="circles-section-head">
                      <div>
                        <div className="circles-section-icon">◈</div>
                        <div><h3>Discover circles</h3><p>Explore active communities, meet peers and start learning together.</p></div>
                      </div>
                      {discoverCircles.length>0&&<span>{discoverCircles.length} more</span>}
                    </div>

                    <div className="circles-discover-grid">
                      {(discoverCircles.length?discoverCircles:filtered.slice(0,3)).map(item=>{
                        const meta=TYPE_META[item.circle_type]||TYPE_META.learn;
                        const visual=getSkillVisual(item.primary_skill_name||item.title);
                        return <article className={"circle-discover-card circle-theme-"+item.circle_type} key={"discover-"+item.id}>
                          <div className="circle-discover-cover">
                            <div className={"circle-discover-icon "+visual.className}>{visual.icon}</div>
                            <span>{meta[0]} {meta[1]}</span>
                          </div>
                          <div className="circle-discover-body">
                            <h4>{item.title}</h4>
                            <p>{item.description||item.goal||"A focused SkillSwap learning community."}</p>
                            <div className="circle-discover-members">
                              <div className="circle-avatars compact">
                                {(item.members||[]).slice(0,4).map(member=>(
                                  <button key={member.id} onClick={()=>onPassport(member.user_id)}>
                                    {member.avatar_url?<img src={member.avatar_url} alt=""/>:<span>{initials(member.name)}</span>}
                                  </button>
                                ))}
                              </div>
                              <b>{item.member_count} members</b>
                            </div>
                            <div className="circle-progress-row">
                              <div><span>Group progress</span><b>{item.progress_percentage||0}%</b></div>
                              <div className="circle-progress-track"><i style={{width:(item.progress_percentage||0)+"%"}}></i></div>
                            </div>
                            <div className="circle-discover-actions">
                              {user&&<BookmarkButton type="circle" id={item.id} compact {...bookmarkProps}/>}
                              <button className="primary" onClick={async()=>{await onOpenCircle(item.id);setView("workspace");}}>Open circle →</button>
                              {!item.membership&&user&&<button className="circle-mini-join" onClick={()=>onJoin(item.id,"learner")}>＋</button>}
                            </div>
                          </div>
                        </article>;
                      })}
                    </div>
                  </section>
                </main>

                <aside className="circles-dashboard-side">
                  <section className="circles-side-card circles-your-card">
                    <div className="circles-side-head">
                      <div><span>👥</span><h3>Your circles</h3></div>
                      <small>{myCircles.length}</small>
                    </div>
                    <div className="circles-your-list">
                      {myCircles.length ? myCircles.slice(0,4).map(item=>{
                        const visual=getSkillVisual(item.primary_skill_name||item.title);
                        return <button key={item.id} onClick={async()=>{await onOpenCircle(item.id);setView("workspace");}}>
                          <div className={"circles-your-icon "+visual.className}>{visual.icon}</div>
                          <div className="circles-your-copy">
                            <b>{item.title}</b>
                            <div className="circles-your-progress"><i style={{width:(item.progress_percentage||0)+"%"}}></i></div>
                          </div>
                          <span>{item.progress_percentage||0}%</span>
                          <em className={item.membership.role}>{item.membership.role==="mentor"?"🎓 Mentor":"🌱 Learner"}</em>
                        </button>;
                      }) : <div className="circle-side-empty">Join a circle and it will appear here.</div>}
                    </div>
                  </section>

                  <section className="circles-side-card circles-pulse-card">
                    <div className="circles-side-head">
                      <div><span>〽</span><h3>Community Pulse</h3></div>
                    </div>
                    <p className="circles-side-sub">What's happening across your Skill Circles.</p>

                    <div className="circles-pulse-stats">
                      <div><span>◉</span><strong>{communityStats.members}</strong><small>people</small></div>
                      <div><span>🎓</span><strong>{communityStats.mentors.length}</strong><small>mentors</small></div>
                      <div><span>◫</span><strong>{communityStats.circles}</strong><small>circles</small></div>
                    </div>

                    <div className="circles-pulse-block">
                      <div className="circles-pulse-title"><b>Mentors</b><span>{communityStats.mentors.length}</span></div>
                      <div className="circles-mentor-row">
                        {communityStats.mentors.slice(0,6).map(member=>(
                          <button key={member.user_id} onClick={()=>onPassport(member.user_id)} title={member.name}>
                            {member.avatar_url?<img src={member.avatar_url} alt=""/>:<span>{initials(member.name)}</span>}
                          </button>
                        ))}
                        {!communityStats.mentors.length&&<small>No mentors yet</small>}
                      </div>
                    </div>

                    <div className="circles-pulse-block">
                      <div className="circles-pulse-title"><b>Upcoming sessions</b><span>{communityStats.sessions.length}</span></div>
                      <div className="circles-upcoming-list">
                        {communityStats.sessions.length ? communityStats.sessions.map((session,index)=>(
                          <article key={session.id||index}>
                            <span>📅</span>
                            <div><b>{session.circleTitle}</b><small>{fmt(session.starts_at)}</small></div>
                          </article>
                        )) : <div className="circle-side-empty compact">No sessions scheduled yet.</div>}
                      </div>
                    </div>
                  </section>
                </aside>
              </div>
            ) : <div className="circles-empty">
              <div>👥</div><h3>No circles here yet</h3><p>Create the first group around a skill you care about.</p>
            </div>}
          </div>
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
                  {isMember&&<span className="circle-live-count">● {onlineMemberIds.length} online</span>}
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
                {user&&<button className="outline" onClick={()=>onReport?.({
                  target_type:"circle",target_id:circle.id,reported_user:circle.created_by,
                  label:circle.title,icon:"👥"
                })}>⚠ Report circle</button>}
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
                      <div className="circle-member-row" key={member.id}>
                        <button className="circle-member-profile" onClick={()=>onPassport(member.user_id)}>
                          {member.avatar_url?<img src={member.avatar_url} alt=""/>:<span>{initials(member.name)}</span>}
                          <div><b>{member.name}</b><small>@{member.username}</small></div>
                          <span className={"circle-member-presence "+(onlineMemberIds.includes(member.user_id)?"online":"")}></span>
                          <em className={member.role}>{member.role}</em>
                          {member.is_muted&&<small className="circle-muted-label">Muted</small>}
                        </button>
                        {isMentor&&member.user_id!==circle.created_by&&member.user_id!==user?.id&&<div className="circle-member-mod-actions">
                          <button title={member.is_muted?"Unmute":"Mute"} onClick={()=>onModerateMember?.(circle.id,member.user_id,member.is_muted?"unmute":"mute")}>{member.is_muted?"🔊":"🔇"}</button>
                          <button title={member.role==="mentor"?"Make learner":"Make mentor"} onClick={()=>onModerateMember?.(circle.id,member.user_id,member.role==="mentor"?"demote":"promote")}>{member.role==="mentor"?"🌱":"🎓"}</button>
                          <button title="Remove member" onClick={()=>onModerateMember?.(circle.id,member.user_id,"remove")}>✕</button>
                        </div>}
                      </div>
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
                        <div className="circle-message-safety">
                          {msg.sender_id!==user?.id&&<button onClick={()=>onReport?.({
                            target_type:"circle_message",target_id:msg.id,reported_user:msg.sender_id,
                            label:"Message from "+msg.sender_name,icon:"💬"
                          })}>Report</button>}
                          {isMentor&&<button onClick={()=>onDeleteMessage?.(circle.id,msg.id)}>Delete</button>}
                        </div>
                      </div>
                    )) : <div className="circle-inline-empty">Join the circle to view the group chat.</div>}
                    {isMember&&typingUsers.length>0&&<div className="circle-typing-indicator">
                      <span>•••</span>
                      <b>{typingUsers.slice(0,2).map(item=>item.name).join(", ")} {typingUsers.length===1?"is":"are"} typing…</b>
                    </div>}
                  </div>
                  {isMember&&<div className="circle-compose-inline">
                    <input value={message} onChange={e=>{setMessage(e.target.value);onTyping?.(!!e.target.value.trim());}} onKeyDown={e=>{if(e.key==="Enter"&&message.trim()){onTyping?.(false);onSendMessage(circle.id,message);setMessage("");}}} placeholder="Message the circle…"/>
                    <button className="primary" onClick={()=>{if(message.trim()){onTyping?.(false);onSendMessage(circle.id,message);setMessage("");}}}>Send</button>
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
