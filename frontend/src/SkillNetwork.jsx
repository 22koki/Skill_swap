import { useMemo, useRef, useState } from "react";
import { getSkillVisual } from "./skillVisuals";

function clamp(value,min,max){ return Math.max(min,Math.min(max,value)); }

function initials(name=""){
  return name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase() || "SS";
}

export default function SkillNetwork({
  open,
  data,
  loading,
  onClose,
  onPassport,
  onPropose,
  currentUser,
}){
  const stageRef=useRef(null);
  const [mode,setMode]=useState("all");
  const [selectedSkill,setSelectedSkill]=useState(null);
  const [selectedUser,setSelectedUser]=useState(null);
  const [zoom,setZoom]=useState(1);
  const [offset,setOffset]=useState({x:0,y:0});
  const [drag,setDrag]=useState(null);

  const users=data?.users||[];
  const skills=data?.skills||[];
  const edges=data?.edges||[];
  const myPath=data?.my_path||[];

  const layout=useMemo(()=>{
    const width=1200;
    const height=760;
    const center={x:width/2,y:height/2};

    const userNodes=new Map();
    const skillNodes=new Map();

    const me=users.find(u=>u.is_me);
    const otherUsers=users.filter(u=>!u.is_me);

    if(me) userNodes.set(me.id,{x:center.x,y:center.y});

    const userRadius=270;
    otherUsers.forEach((user,index)=>{
      const angle=(Math.PI*2*index)/Math.max(otherUsers.length,1)-Math.PI/2;
      userNodes.set(user.id,{
        x:center.x+Math.cos(angle)*userRadius,
        y:center.y+Math.sin(angle)*userRadius,
      });
    });

    const skillRadius=150;
    skills.forEach((skill,index)=>{
      const angle=(Math.PI*2*index)/Math.max(skills.length,1)-Math.PI/2+0.28;
      const ring=index%2===0?skillRadius:skillRadius+72;
      skillNodes.set(skill.id,{
        x:center.x+Math.cos(angle)*ring,
        y:center.y+Math.sin(angle)*ring,
      });
    });

    return {width,height,userNodes,skillNodes};
  },[users,skills]);

  const pathSet=useMemo(()=>{
    const userIds=new Set();
    const skillIds=new Set();
    myPath.forEach(item=>{
      if(item.type==="user") userIds.add(item.id);
      if(item.type==="skill") skillIds.add(item.id);
    });
    return {userIds,skillIds};
  },[myPath]);

  const visibleEdges=useMemo(()=>{
    return edges.filter(edge=>{
      if(mode==="teach") return edge.kind==="teach";
      if(mode==="learn") return edge.kind==="learn";
      if(mode==="path") return pathSet.userIds.has(edge.user_id) && pathSet.skillIds.has(edge.skill_id);
      if(selectedSkill) return edge.skill_id===selectedSkill.id;
      if(selectedUser) return edge.user_id===selectedUser.id;
      return true;
    });
  },[edges,mode,pathSet,selectedSkill,selectedUser]);

  const activeUsers=useMemo(()=>{
    if(mode==="path") return users.filter(u=>pathSet.userIds.has(u.id));
    if(selectedSkill){
      const ids=new Set(edges.filter(e=>e.skill_id===selectedSkill.id).map(e=>e.user_id));
      return users.filter(u=>ids.has(u.id));
    }
    return users;
  },[users,edges,mode,pathSet,selectedSkill]);

  const activeSkills=useMemo(()=>{
    if(mode==="path") return skills.filter(s=>pathSet.skillIds.has(s.id));
    if(selectedUser){
      const ids=new Set(edges.filter(e=>e.user_id===selectedUser.id).map(e=>e.skill_id));
      return skills.filter(s=>ids.has(s.id));
    }
    return skills;
  },[skills,edges,mode,pathSet,selectedUser]);

  function resetView(){
    setZoom(1);
    setOffset({x:0,y:0});
  }

  function onWheel(e){
    e.preventDefault();
    const next=clamp(zoom+(e.deltaY<0?0.1:-0.1),0.65,1.8);
    setZoom(next);
  }

  function onPointerDown(e){
    setDrag({x:e.clientX,y:e.clientY,ox:offset.x,oy:offset.y});
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e){
    if(!drag) return;
    setOffset({
      x:drag.ox+(e.clientX-drag.x),
      y:drag.oy+(e.clientY-drag.y),
    });
  }

  function onPointerUp(){ setDrag(null); }

  if(!open) return null;

  return (
    <div className="skill-network-backdrop" onMouseDown={onClose}>
      <section className="skill-network-shell" onMouseDown={e=>e.stopPropagation()}>
        <header className="skill-network-header">
          <div>
            <div className="skill-network-kicker">KNOWLEDGE, VISUALIZED</div>
            <h2>Skill Network</h2>
            <p>Explore who knows what, who wants to learn, and where your next SkillSwap could begin.</p>
          </div>
          <div className="skill-network-header-actions">
            <button className="outline" onClick={resetView}>Reset view</button>
            <button className="skill-network-close" onClick={onClose}>×</button>
          </div>
        </header>

        <div className="skill-network-stats">
          <div><span>👥</span><strong>{data?.stats?.people||0}</strong><small>people</small></div>
          <div><span>🧠</span><strong>{data?.stats?.skills||0}</strong><small>skills</small></div>
          <div><span>↔</span><strong>{data?.stats?.connections||0}</strong><small>connections</small></div>
          <div><span>🎓</span><strong>{data?.stats?.teachers||0}</strong><small>teachers</small></div>
        </div>

        <div className="skill-network-toolbar">
          <div className="skill-network-modes">
            {[
              ["all","All connections"],
              ["teach","Teaching"],
              ["learn","Learning"],
              ["path","My learning path"],
            ].map(([key,label])=>(
              <button
                key={key}
                className={mode===key?"active":""}
                onClick={()=>{setMode(key);setSelectedSkill(null);setSelectedUser(null);}}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="skill-network-legend">
            <span><i className="teach"></i> teaches</span>
            <span><i className="learn"></i> wants to learn</span>
            <span><i className="path"></i> learning path</span>
          </div>
        </div>

        <div className="skill-network-content">
          <div className="skill-network-stage-wrap">
            {loading ? (
              <div className="skill-network-loading">
                <div className="skill-network-loader">↔</div>
                <h3>Mapping the community…</h3>
              </div>
            ) : (
              <div
                className="skill-network-stage"
                ref={stageRef}
                onWheel={onWheel}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
              >
                <svg
                  className="skill-network-svg"
                  viewBox={"0 0 "+layout.width+" "+layout.height}
                  style={{
                    transform:`translate(${offset.x}px,${offset.y}px) scale(${zoom})`,
                  }}
                >
                  <defs>
                    <filter id="networkGlow">
                      <feGaussianBlur stdDeviation="3.5" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>

                  <g className="network-grid-lines">
                    {Array.from({length:8}).map((_,i)=>(
                      <circle key={i} cx={layout.width/2} cy={layout.height/2} r={80+i*42}/>
                    ))}
                  </g>

                  {visibleEdges.map(edge=>{
                    const u=layout.userNodes.get(edge.user_id);
                    const s=layout.skillNodes.get(edge.skill_id);
                    if(!u||!s) return null;
                    const isPath=mode==="path" && pathSet.userIds.has(edge.user_id) && pathSet.skillIds.has(edge.skill_id);
                    return (
                      <line
                        key={edge.id}
                        x1={u.x} y1={u.y} x2={s.x} y2={s.y}
                        className={"network-edge "+edge.kind+(isPath?" path":"")}
                      />
                    );
                  })}

                  {activeSkills.map(skill=>{
                    const p=layout.skillNodes.get(skill.id);
                    if(!p) return null;
                    const visual=getSkillVisual(skill.name);
                    const selected=selectedSkill?.id===skill.id;
                    return (
                      <g
                        key={"skill-"+skill.id}
                        className={"network-skill-node "+(selected?"selected":"")}
                        transform={`translate(${p.x},${p.y})`}
                        onPointerDown={e=>e.stopPropagation()}
                        onClick={()=>{
                          setSelectedSkill(selected?null:skill);
                          setSelectedUser(null);
                          if(mode!=="path") setMode("all");
                        }}
                      >
                        <circle r={selected?49:43} className="network-skill-halo"/>
                        <circle r={36} className={"network-skill-core "+visual.className}/>
                        <text className="network-skill-icon" textAnchor="middle" dy="-2">{visual.icon}</text>
                        <text className="network-skill-name" textAnchor="middle" dy="54">{skill.name}</text>
                        <text className="network-skill-count" textAnchor="middle" dy="68">{skill.connection_count} links</text>
                      </g>
                    );
                  })}

                  {activeUsers.map(user=>{
                    const p=layout.userNodes.get(user.id);
                    if(!p) return null;
                    const selected=selectedUser?.id===user.id;
                    const score=user.match?.score;
                    return (
                      <g
                        key={"user-"+user.id}
                        className={"network-user-node "+(user.is_me?"me ":"")+(selected?"selected":"")}
                        transform={`translate(${p.x},${p.y})`}
                        onPointerDown={e=>e.stopPropagation()}
                        onClick={()=>{
                          setSelectedUser(selected?null:user);
                          setSelectedSkill(null);
                          if(mode!=="path") setMode("all");
                        }}
                      >
                        <circle r={selected?57:50} className="network-user-halo"/>
                        <circle r={43} className="network-user-core"/>
                        {user.avatar_url
                          ? <image href={user.avatar_url} x="-34" y="-34" width="68" height="68" preserveAspectRatio="xMidYMid slice" className="network-user-image"/>
                          : <text className="network-user-initials" textAnchor="middle" dy="6">{initials(user.name)}</text>}
                        {user.is_me && <text className="network-me-label" textAnchor="middle" dy="-58">YOU</text>}
                        {!user.is_me && score!==null && score!==undefined && <g transform="translate(31,-33)">
                          <circle r="15" className="network-match-badge"/>
                          <text textAnchor="middle" dy="3" className="network-match-score">{score}%</text>
                        </g>}
                        <text className="network-user-name" textAnchor="middle" dy="63">{user.name}</text>
                        <text className="network-user-level" textAnchor="middle" dy="77">Lv {user.level?.level||1} · {user.level?.name||"New Swapper"}</text>
                      </g>
                    );
                  })}
                </svg>

                <div className="skill-network-zoom">
                  <button onClick={()=>setZoom(z=>clamp(z+0.1,0.65,1.8))}>+</button>
                  <span>{Math.round(zoom*100)}%</span>
                  <button onClick={()=>setZoom(z=>clamp(z-0.1,0.65,1.8))}>−</button>
                </div>

                {mode==="path" && myPath.length>0 && (
                  <div className="skill-network-path-strip">
                    <small>YOUR LEARNING PATH</small>
                    <div>
                      {myPath.map((item,index)=>(
                        <span key={item.type+"-"+item.id}>
                          <b className={item.type}>{item.label}</b>
                          {index<myPath.length-1 && <i>→</i>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="skill-network-inspector">
            {selectedUser ? (
              <div className="network-inspector-card">
                <div className="network-inspector-user">
                  {selectedUser.avatar_url
                    ? <img src={selectedUser.avatar_url} alt="" />
                    : <div>{initials(selectedUser.name)}</div>}
                  <div>
                    <small>{selectedUser.is_me?"YOUR PROFILE":"COMMUNITY MEMBER"}</small>
                    <h3>{selectedUser.name}</h3>
                    <p>{selectedUser.location||"SkillSwap community"}</p>
                  </div>
                </div>

                {!selectedUser.is_me && selectedUser.match && (
                  <div className="network-inspector-match">
                    <strong>{selectedUser.match.score}%</strong>
                    <div><b>{selectedUser.match.confidence}</b><span>{selectedUser.match.reasons?.[0]?.label||"Community connection"}</span></div>
                  </div>
                )}

                <div className="network-inspector-stats">
                  <span>⭐ {Number(selectedUser.average_rating||0).toFixed(1)}</span>
                  <span>↻ {selectedUser.completed_swaps} swaps</span>
                  <span>🔥 {selectedUser.current_streak} wk</span>
                </div>

                <section>
                  <small>TEACHES</small>
                  <div className="network-inspector-tags">
                    {selectedUser.teach_skills?.length
                      ? selectedUser.teach_skills.map(skill=><span key={skill.id}>🎓 {skill.name}</span>)
                      : <em>No teaching skills yet</em>}
                  </div>
                </section>

                <section>
                  <small>WANTS TO LEARN</small>
                  <div className="network-inspector-tags learn">
                    {selectedUser.learn_skills?.length
                      ? selectedUser.learn_skills.map(skill=><span key={skill.id}>🌱 {skill.name}</span>)
                      : <em>No learning goals yet</em>}
                  </div>
                </section>

                <div className="network-inspector-actions">
                  <button className="outline" onClick={()=>onPassport(selectedUser.id)}>View Passport</button>
                  {!selectedUser.is_me && currentUser && selectedUser.match?.i_teach_them?.length>0 && selectedUser.match?.they_teach_me?.length>0 &&
                    <button className="primary" onClick={()=>onPropose({
                      ...selectedUser,
                      user_id:selectedUser.id,
                      name:selectedUser.name,
                      i_teach_them:selectedUser.match.i_teach_them,
                      they_teach_me:selectedUser.match.they_teach_me,
                      score:selectedUser.match.score,
                      reasons:selectedUser.match.reasons,
                    })}>Propose swap ↗</button>}
                </div>
              </div>
            ) : selectedSkill ? (
              <div className="network-inspector-card">
                <div className="network-skill-detail">
                  <div className={"network-skill-detail-icon "+getSkillVisual(selectedSkill.name).className}>{getSkillVisual(selectedSkill.name).icon}</div>
                  <div>
                    <small>SKILL CLUSTER</small>
                    <h3>{selectedSkill.name}</h3>
                    <p>{selectedSkill.category}</p>
                  </div>
                </div>

                <div className="network-skill-detail-stats">
                  <div><strong>{selectedSkill.teacher_count}</strong><span>teachers</span></div>
                  <div><strong>{selectedSkill.learner_count}</strong><span>learners</span></div>
                  <div><strong>{selectedSkill.connection_count}</strong><span>connections</span></div>
                </div>

                <section>
                  <small>PEOPLE CONNECTED TO THIS SKILL</small>
                  <div className="network-people-mini">
                    {users.filter(user=>edges.some(edge=>edge.skill_id===selectedSkill.id&&edge.user_id===user.id)).map(user=>(
                      <button key={user.id} onClick={()=>{setSelectedUser(user);setSelectedSkill(null);}}>
                        {user.avatar_url?<img src={user.avatar_url} alt=""/>:<span>{initials(user.name)}</span>}
                        <b>{user.name}</b>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="network-inspector-empty">
                <div>🕸</div>
                <h3>Explore the network</h3>
                <p>Click a person or skill to see how they connect to the SkillSwap community.</p>
                <div className="network-inspector-tip">
                  <span>✦</span>
                  <p>Try <b>My learning path</b> to see a chain from one of your learning goals through the community.</p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
