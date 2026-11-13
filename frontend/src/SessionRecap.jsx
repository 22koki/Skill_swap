import { useMemo } from "react";
import { getSkillVisual } from "./skillVisuals";

export default function SessionRecap({
  workspace,
  reflection,
  setReflection,
  challenge,
  setChallenge,
  confidence,
  setConfidence,
  onGenerate,
  generating,
  onAddChecklist,
  addingChecklist,
}){
  const recap=workspace.my_recap?.recap||null;
  const visual=getSkillVisual(workspace.learn_skill_name);

  const confidenceLabel=useMemo(()=>{
    return ["","Very unsure","A little unsure","Getting there","Confident","Very confident"][Number(confidence)||3];
  },[confidence]);

  if(workspace.booking_status!=="completed"){
    return (
      <div className="recap-locked">
        <div>🔒</div>
        <h3>Recap unlocks after the session</h3>
        <p>Complete this SkillSwap first. Then SkillSwap can turn your notes, progress, and checklist into personalized next steps.</p>
      </div>
    );
  }

  if(!recap){
    return (
      <div className="recap-setup">
        <div className="recap-intro">
          <div className="recap-spark">✦</div>
          <div>
            <div className="workspace-kicker">POST-SESSION REFLECTION</div>
            <h3>Turn this session into your next move</h3>
            <p>SkillSwap will combine your reflection with the shared plan, notes, checklist, and goals to create a personalized recap.</p>
          </div>
        </div>

        <label className="recap-field">
          <span>📝 What clicked for you?</span>
          <textarea
            value={reflection}
            onChange={e=>setReflection(e.target.value)}
            placeholder={"Example: I finally understood how to structure "+workspace.learn_skill_name+" practice, but I still need more repetition."}
          />
        </label>

        <label className="recap-field">
          <span>🧩 What felt hardest?</span>
          <input
            value={challenge}
            onChange={e=>setChallenge(e.target.value)}
            placeholder="Example: Remembering the steps without looking at notes"
          />
        </label>

        <div className="recap-confidence">
          <div>
            <span>CONFIDENCE AFTER SESSION</span>
            <b>{confidenceLabel}</b>
          </div>
          <div className="recap-confidence-scale">
            {[1,2,3,4,5].map(value=>(
              <button
                key={value}
                className={Number(confidence)===value?"active":""}
                onClick={()=>setConfidence(value)}
              >
                <span>{value}</span>
                <small>{value===1?"Unsure":value===5?"Strong":""}</small>
              </button>
            ))}
          </div>
        </div>

        <button className="primary recap-generate" disabled={generating} onClick={onGenerate}>
          {generating?"Building your recap…":"Generate personalized recap ✦"}
        </button>
      </div>
    );
  }

  return (
    <div className="recap-wrap">
      <div className="recap-hero">
        <div className={"recap-skill "+visual.className}>{visual.icon}</div>
        <div className="recap-hero-copy">
          <div className="workspace-kicker">✦ YOUR SESSION RECAP</div>
          <h3>{recap.title}</h3>
          <p>{recap.summary}</p>
        </div>
        <div className="recap-mastery">
          <strong>{recap.mastery_score}%</strong>
          <span>{recap.momentum}</span>
          <small>learning progress estimate</small>
        </div>
      </div>

      <div className="recap-meta">
        <span>🎯 {recap.goal}</span>
        <span>💪 Confidence {recap.confidence}/5</span>
        <span>{workspace.my_recap?.source==="openai"?"✦ AI generated":"⚙ Smart recap"}</span>
      </div>

      <div className="recap-grid">
        <section className="recap-card recap-wins">
          <div className="recap-card-icon">🌟</div>
          <div>
            <small>WHAT WENT WELL</small>
            <h4>Session highlights</h4>
            <ul>{(recap.highlights||[]).map((item,i)=><li key={i}>{item}</li>)}</ul>
          </div>
        </section>

        <section className="recap-card recap-strengths">
          <div className="recap-card-icon">🧠</div>
          <div>
            <small>STRENGTHENED</small>
            <h4>What you built</h4>
            <div className="recap-chip-list">{(recap.concepts_strengthened||[]).map((item,i)=><span key={i}>{item}</span>)}</div>
          </div>
        </section>

        <section className="recap-card recap-revisit">
          <div className="recap-card-icon">↻</div>
          <div>
            <small>REVISIT</small>
            <h4>What still needs attention</h4>
            <ul>{(recap.revisit||[]).map((item,i)=><li key={i}>{item}</li>)}</ul>
          </div>
        </section>

        <section className="recap-card recap-practice">
          <div className="recap-card-icon">🛠</div>
          <div>
            <small>NEXT PRACTICE</small>
            <h4>Do this before your next swap</h4>
            <ul>{(recap.practice_next||[]).map((item,i)=><li key={i}>{item}</li>)}</ul>
          </div>
        </section>
      </div>

      <section className="recap-next-focus">
        <div className="recap-next-number">NEXT</div>
        <div>
          <div className="workspace-kicker">PERSONALIZED NEXT FOCUS</div>
          <h3>{recap.next_focus?.title}</h3>
          <p>{recap.next_focus?.why}</p>
          <div className="recap-challenge">
            <span>⚡</span>
            <div><small>YOUR CHALLENGE</small><b>{recap.next_focus?.challenge}</b></div>
          </div>
        </div>
      </section>

      <div className="recap-footer-grid">
        <section>
          <div className="workspace-kicker">NEXT SKILL GOAL</div>
          <h4>{recap.next_skill_goal}</h4>
        </section>
        <section>
          <div className="workspace-kicker">COACH NOTE</div>
          <p>“{recap.coach_note}”</p>
        </section>
      </div>

      <div className="recap-actions">
        <button className="outline" disabled={generating} onClick={onGenerate}>
          {generating?"Refreshing…":"↻ Regenerate recap"}
        </button>
        <button className="primary" disabled={addingChecklist} onClick={onAddChecklist}>
          {addingChecklist?"Adding…":"✓ Add next steps to checklist"}
        </button>
      </div>
    </div>
  );
}
