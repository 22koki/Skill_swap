import { useEffect, useMemo, useState } from "react";
import { getSkillVisual } from "./skillVisuals";
import AISessionPlanner from "./AISessionPlanner";
import SessionRecap from "./SessionRecap";

export default function WorkspacePanel({
  open,
  workspace,
  form,
  setForm,
  resourceForm,
  setResourceForm,
  checklistText,
  setChecklistText,
  onClose,
  onSave,
  onAddResource,
  onDeleteResource,
  onAddChecklist,
  onToggleChecklist,
  onDeleteChecklist,
  saving,
  aiSetup,
  setAiSetup,
  onGenerateAIPlan,
  aiGenerating,
  onAddAIPlanChecklist,
  aiAddingChecklist,
  onPlanChange,
  onSaveAIPlan,
  aiSavingPlan,
  recapReflection,
  setRecapReflection,
  recapChallenge,
  setRecapChallenge,
  recapConfidence,
  setRecapConfidence,
  onGenerateRecap,
  recapGenerating,
  onAddRecapChecklist,
  recapAddingChecklist,
}){
  const [tab,setTab]=useState("plan");
  useEffect(()=>{
    if(open && workspace) setTab(workspace.booking_status==="completed"?"recap":"plan");
  },[open,workspace?.booking]);
  if(!open || !workspace) return null;

  const learn=getSkillVisual(workspace.learn_skill_name);
  const teach=getSkillVisual(workspace.teach_skill_name);
  const completed=workspace.checklist.filter(i=>i.is_done).length;
  const total=workspace.checklist.length;
  const checklistProgress=total?Math.round((completed/total)*100):0;
  const effectiveProgress=Math.max(Number(form.progress_percentage||0),checklistProgress);

  const tabs=[
    ["ai","✦ AI Plan"],
    ["recap","✦ Recap"],
    ["plan","Plan"],
    ["checklist","Checklist"],
    ["resources","Resources"],
    ["notes","Notes"],
  ];

  return (
    <div className="workspace-backdrop" onMouseDown={onClose}>
      <section className="workspace-panel" onMouseDown={e=>e.stopPropagation()}>
        <header className="workspace-header">
          <div>
            <div className="workspace-kicker">SHARED SESSION WORKSPACE</div>
            <h2>{workspace.learn_skill_name} ↔ {workspace.teach_skill_name}</h2>
            <p>With {workspace.partner_name}</p>
          </div>
          <button className="workspace-close" onClick={onClose}>×</button>
        </header>

        <div className="workspace-skill-strip">
          <div className={"workspace-skill "+learn.className}>
            <span>{learn.icon}</span><small>You learn</small><b>{workspace.learn_skill_name}</b>
          </div>
          <div className="workspace-core">⇄</div>
          <div className={"workspace-skill "+teach.className}>
            <span>{teach.icon}</span><small>You teach</small><b>{workspace.teach_skill_name}</b>
          </div>
        </div>

        <div className="workspace-progress-card">
          <div className="workspace-progress-top">
            <div><span>Session progress</span><b>{effectiveProgress}%</b></div>
            <small>{completed}/{total||0} checklist items complete</small>
          </div>
          <div className="workspace-progress-track">
            <div style={{width:Math.min(effectiveProgress,100)+"%"}}></div>
          </div>
        </div>

        <div className="workspace-tabs">
          {tabs.map(([key,label])=><button key={key} className={tab===key?"active":""} onClick={()=>setTab(key)}>{label}</button>)}
        </div>

        <div className="workspace-body">
          {tab==="recap" && (
            <SessionRecap
              workspace={workspace}
              reflection={recapReflection}
              setReflection={setRecapReflection}
              challenge={recapChallenge}
              setChallenge={setRecapChallenge}
              confidence={recapConfidence}
              setConfidence={setRecapConfidence}
              onGenerate={onGenerateRecap}
              generating={recapGenerating}
              onAddChecklist={onAddRecapChecklist}
              addingChecklist={recapAddingChecklist}
            />
          )}

          {tab==="ai" && (
            <AISessionPlanner
              workspace={workspace}
              setup={aiSetup}
              setSetup={setAiSetup}
              onGenerate={onGenerateAIPlan}
              generating={aiGenerating}
              onAddChecklist={onAddAIPlanChecklist}
              addingChecklist={aiAddingChecklist}
              onPlanChange={onPlanChange}
              onSavePlan={onSaveAIPlan}
              savingPlan={aiSavingPlan}
            />
          )}

          {tab==="plan" && (
            <div className="workspace-grid">
              <label className="workspace-field">
                <span>🎯 Learning goals</span>
                <textarea
                  placeholder="What should be achieved by the end of this session?"
                  value={form.goals}
                  onChange={e=>setForm({...form,goals:e.target.value})}
                />
              </label>
              <label className="workspace-field">
                <span>🗺 Lesson plan</span>
                <textarea
                  placeholder="Outline the topics, order, exercises, or mini project."
                  value={form.lesson_plan}
                  onChange={e=>setForm({...form,lesson_plan:e.target.value})}
                />
              </label>
              <label className="workspace-field workspace-progress-input">
                <span>📈 Manual progress</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={form.progress_percentage}
                  onChange={e=>setForm({...form,progress_percentage:Number(e.target.value)})}
                />
                <b>{form.progress_percentage}%</b>
              </label>
              <button className="primary workspace-save" disabled={saving} onClick={onSave}>
                {saving?"Saving...":"Save session plan"}
              </button>
            </div>
          )}

          {tab==="checklist" && (
            <div className="workspace-checklist-wrap">
              <form className="workspace-add-row" onSubmit={e=>{e.preventDefault();onAddChecklist();}}>
                <input value={checklistText} onChange={e=>setChecklistText(e.target.value)} placeholder="Add a shared task, e.g. Install Python before session" />
                <button className="primary">Add task</button>
              </form>

              <div className="workspace-checklist">
                {workspace.checklist.length ? workspace.checklist.map(item=>(
                  <div className={"workspace-check-item "+(item.is_done?"done":"")} key={item.id}>
                    <button className="check-toggle" onClick={()=>onToggleChecklist(item)}>
                      {item.is_done?"✓":""}
                    </button>
                    <div>
                      <b>{item.text}</b>
                      <small>{item.is_done ? "Completed"+(item.completed_by_name?" by "+item.completed_by_name:"") : "Added by "+item.created_by_name}</small>
                    </div>
                    <button className="workspace-delete" onClick={()=>onDeleteChecklist(item.id)}>×</button>
                  </div>
                )) : (
                  <div className="workspace-empty">
                    <div>✅</div><h4>No checklist yet</h4><p>Add preparation steps or session tasks for both of you.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab==="resources" && (
            <div className="workspace-resources-wrap">
              <form className="workspace-resource-form" onSubmit={e=>{e.preventDefault();onAddResource();}}>
                <input placeholder="Resource title" value={resourceForm.title} onChange={e=>setResourceForm({...resourceForm,title:e.target.value})}/>
                <input placeholder="https://..." value={resourceForm.url} onChange={e=>setResourceForm({...resourceForm,url:e.target.value})}/>
                <select value={resourceForm.kind} onChange={e=>setResourceForm({...resourceForm,kind:e.target.value})}>
                  <option value="link">Link</option>
                  <option value="video">Video</option>
                  <option value="article">Article</option>
                  <option value="project">Project</option>
                  <option value="other">Other</option>
                </select>
                <button className="primary">Add resource</button>
              </form>

              <div className="workspace-resource-list">
                {workspace.resources.length ? workspace.resources.map(resource=>(
                  <div className="workspace-resource-card" key={resource.id}>
                    <div className="workspace-resource-icon">
                      {resource.kind==="video"?"🎬":resource.kind==="article"?"📄":resource.kind==="project"?"🧩":"🔗"}
                    </div>
                    <div>
                      <a href={resource.url} target="_blank" rel="noreferrer">{resource.title} ↗</a>
                      <small>{resource.kind} · added by {resource.added_by_name}</small>
                    </div>
                    <button className="workspace-delete" onClick={()=>onDeleteResource(resource.id)}>×</button>
                  </div>
                )) : (
                  <div className="workspace-empty">
                    <div>📚</div><h4>No resources yet</h4><p>Share tutorials, project links, videos, references, or practice material.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab==="notes" && (
            <div className="workspace-notes">
              <label className="workspace-field">
                <span>📝 Shared notes</span>
                <textarea
                  placeholder="Capture key ideas, links, reminders, questions, and what to practice next..."
                  value={form.shared_notes}
                  onChange={e=>setForm({...form,shared_notes:e.target.value})}
                />
              </label>
              <button className="primary workspace-save" disabled={saving} onClick={onSave}>
                {saving?"Saving...":"Save shared notes"}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
