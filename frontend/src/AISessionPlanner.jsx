import { useMemo, useState } from "react";
import { getSkillVisual } from "./skillVisuals";

const STYLES=[
  ["practical","🎯","Practical"],
  ["theory_first","📖","Theory first"],
  ["project_based","🛠","Project-based"],
  ["fast_paced","⚡","Fast-paced"],
  ["step_by_step","🧩","Step-by-step"],
];

const LEVELS=[
  ["beginner","Beginner"],
  ["intermediate","Intermediate"],
  ["advanced","Advanced"],
  ["expert","Expert"],
];

export default function AISessionPlanner({
  workspace,
  setup,
  setSetup,
  onGenerate,
  generating,
  onAddChecklist,
  addingChecklist,
  onPlanChange,
  onSavePlan,
  savingPlan,
}){
  const [editing,setEditing]=useState(false);
  const plan=workspace.ai_plan||{};
  const sessions=plan.sessions||[];
  const visual=getSkillVisual(workspace.learn_skill_name);

  const totalMinutes=useMemo(
    ()=>sessions.reduce((sum,item)=>sum+Number(item.minutes||0),0),
    [sessions]
  );

  function updateSession(index,key,value){
    const next={
      ...plan,
      sessions:sessions.map((item,i)=>i===index?{...item,[key]:value}:item)
    };
    onPlanChange(next);
  }

  function updateList(index,key,value){
    updateSession(index,key,value.split("\n").map(x=>x.trim()).filter(Boolean));
  }

  if(!sessions.length){
    return (
      <div className="ai-planner-empty">
        <div className="ai-planner-intro">
          <div className="ai-planner-spark">
            <span>✦</span>
            <i></i>
          </div>
          <div>
            <div className="workspace-kicker">AI LEARNING ARCHITECT</div>
            <h3>Build a roadmap for {workspace.learn_skill_name}</h3>
            <p>Tell SkillSwap what you want to achieve and it will turn this exchange into a focused, practical learning journey.</p>
          </div>
        </div>

        <div className="ai-setup-grid">
          <label className="ai-setup-goal">
            <span>🎯 What do you want to achieve?</span>
            <textarea
              value={setup.goal}
              onChange={e=>setSetup({...setup,goal:e.target.value})}
              placeholder={"Example: I want to confidently use "+workspace.learn_skill_name+" in a small real project."}
            />
          </label>

          <div className="ai-setup-block">
            <span className="ai-setup-label">CURRENT LEVEL</span>
            <div className="ai-choice-row">
              {LEVELS.map(([key,label])=>(
                <button key={key} className={setup.learner_level===key?"active":""} onClick={()=>setSetup({...setup,learner_level:key})}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="ai-setup-block">
            <span className="ai-setup-label">LEARNING STYLE</span>
            <div className="ai-style-grid">
              {STYLES.map(([key,icon,label])=>(
                <button key={key} className={setup.learning_style===key?"active":""} onClick={()=>setSetup({...setup,learning_style:key})}>
                  <span>{icon}</span><b>{label}</b>
                </button>
              ))}
            </div>
          </div>

          <div className="ai-setup-block">
            <span className="ai-setup-label">NUMBER OF SESSIONS</span>
            <div className="ai-session-count">
              {[1,2,3,4,5,6].map(count=>(
                <button key={count} className={Number(setup.session_count)===count?"active":""} onClick={()=>setSetup({...setup,session_count:count})}>
                  {count}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="ai-generate-card">
          <div>
            <span>✦</span>
            <div><b>Ready to build your roadmap?</b><small>Both SkillSwap partners will see the same saved learning plan.</small></div>
          </div>
          <button className="primary ai-generate-button" disabled={generating} onClick={onGenerate}>
            {generating?"Designing your roadmap…":"Generate learning plan ✦"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-plan-wrap">
      <div className="ai-plan-hero">
        <div className="ai-plan-hero-main">
          <div className={"ai-plan-skill-icon "+visual.className}>{visual.icon}</div>
          <div>
            <div className="workspace-kicker">✦ AI LEARNING PLAN</div>
            <h3>{plan.title||workspace.learn_skill_name+" Roadmap"}</h3>
            <p>{plan.summary}</p>
          </div>
        </div>

        <div className="ai-plan-source">
          <span>{workspace.ai_plan_source==="openai"?"✦ AI generated":"⚙ Smart plan"}</span>
          <small>{sessions.length} sessions · {totalMinutes||plan.estimated_total_minutes||0} min</small>
        </div>
      </div>

      <div className="ai-plan-meta">
        <span>🎯 {plan.goal||setup.goal||"Practical confidence"}</span>
        <span>📈 {plan.learner_level||setup.learner_level} → {plan.target_level||"next level"}</span>
        <span>{STYLES.find(x=>x[0]===(plan.learning_style||setup.learning_style))?.[1]||"🧩"} {plan.learning_style_label||"Step-by-step"}</span>
      </div>

      <div className="ai-plan-actions">
        <button className="outline" onClick={()=>setEditing(!editing)}>{editing?"Done editing":"✎ Edit roadmap"}</button>
        <button className="outline" disabled={generating} onClick={onGenerate}>{generating?"Regenerating…":"↻ Regenerate"}</button>
        <button className="outline" disabled={addingChecklist} onClick={onAddChecklist}>{addingChecklist?"Adding…":"✓ Add plan to checklist"}</button>
        {editing && <button className="primary" disabled={savingPlan} onClick={onSavePlan}>{savingPlan?"Saving…":"Save roadmap"}</button>}
      </div>

      <div className="ai-session-timeline">
        {sessions.map((session,index)=>(
          <article className="ai-session-card" key={(session.number||index)+"-"+session.title}>
            <div className="ai-session-rail">
              <div className="ai-session-node">{String(index+1).padStart(2,"0")}</div>
              {index<sessions.length-1 && <i></i>}
            </div>

            <div className="ai-session-content">
              <div className="ai-session-head">
                <div>
                  <small>SESSION {index+1}</small>
                  {editing
                    ? <input className="ai-edit-title" value={session.title||""} onChange={e=>updateSession(index,"title",e.target.value)}/>
                    : <h4>{session.title}</h4>}
                </div>
                <span>⏱ {session.minutes||60} min</span>
              </div>

              {editing
                ? <textarea className="ai-edit-objective" value={session.objective||""} onChange={e=>updateSession(index,"objective",e.target.value)}/>
                : <p className="ai-session-objective">{session.objective}</p>}

              <div className="ai-session-columns">
                <div className="ai-session-block">
                  <b>What you'll cover</b>
                  {editing
                    ? <textarea value={(session.topics||[]).join("\n")} onChange={e=>updateList(index,"topics",e.target.value)}/>
                    : <div className="ai-topic-chips">{(session.topics||[]).map((item,i)=><span key={i}>{item}</span>)}</div>}
                </div>

                <div className="ai-session-block">
                  <b>Learning flow</b>
                  {editing
                    ? <textarea value={(session.activities||[]).join("\n")} onChange={e=>updateList(index,"activities",e.target.value)}/>
                    : <ol>{(session.activities||[]).map((item,i)=><li key={i}>{item}</li>)}</ol>}
                </div>
              </div>

              <div className="ai-session-bottom">
                <div className="ai-practice-card">
                  <span>🛠</span>
                  <div>
                    <small>PRACTICE TASK</small>
                    {editing
                      ? <textarea value={session.practice_task||""} onChange={e=>updateSession(index,"practice_task",e.target.value)}/>
                      : <p>{session.practice_task}</p>}
                  </div>
                </div>

                <div className="ai-success-card">
                  <span>✓</span>
                  <div>
                    <small>SUCCESS CHECK</small>
                    {editing
                      ? <textarea value={session.success_check||""} onChange={e=>updateSession(index,"success_check",e.target.value)}/>
                      : <p>{session.success_check}</p>}
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="ai-plan-tail">
        <section>
          <div className="workspace-kicker">RESOURCE IDEAS</div>
          <h4>What to bring into the exchange</h4>
          <div>{(plan.resource_ideas||[]).map((item,i)=><span key={i}>📚 {item}</span>)}</div>
        </section>
        <section>
          <div className="workspace-kicker">AFTER THE ROADMAP</div>
          <h4>Keep the momentum going</h4>
          <div>{(plan.next_steps||[]).map((item,i)=><span key={i}>→ {item}</span>)}</div>
        </section>
      </div>
    </div>
  );
}
