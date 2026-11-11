import { useState } from "react";
import { getSkillVisual } from "./skillVisuals";

export default function AISessionRecap({
  workspace,
  setup,
  setSetup,
  onGenerate,
  generating,
  onAddChecklist,
  addingChecklist,
}){
  const recapRecord=workspace.my_recap;
  const recap=recapRecord?.recap||{};
  const visual=getSkillVisual(workspace.learn_skill_name);
  const [detailsOpen,setDetailsOpen]=useState(true);

  if(workspace.booking_status!=="completed"){
    return (
      <div className="ai-recap-locked">
        <div className="ai-recap-lock-icon">✦</div>
        <div>
          <div className="workspace-kicker">POST-SESSION REFLECTION</div>
          <h3>Your AI recap unlocks after the session.</h3>
          <p>Complete this SkillSwap first. Then SkillSwap can combine your goals, notes, checklist progress, and reflection into personalized next steps.</p>
        </div>
      </div>
    );
  }

  if(!recapRecord || !Object.keys(recap).length){
    return (
      <div className="ai-recap-setup">
        <div className="ai-recap-intro">
          <div className={"ai-recap-skill "+visual.className}>{visual.icon}</div>
          <div>
            <div className="workspace-kicker">✦ AI SESSION RECAP</div>
            <h3>Turn this session into your next move.</h3>
            <p>A short reflection helps SkillSwap make the recap more personal and more useful.</p>
          </div>
        </div>

        <div className="ai-recap-form">
          <label>
            <span>🪞 What stood out from the session?</span>
            <textarea
              value={setup.reflection}
              onChange={e=>setSetup({...setup,reflection:e.target.value})}
              placeholder="What clicked, what did you practise, or what are you proud of?"
            />
          </label>

          <label>
            <span>🧩 What still feels difficult?</span>
            <textarea
              value={setup.challenge}
              onChange={e=>setSetup({...setup,challenge:e.target.value})}
              placeholder="Mention one thing you want to revisit or practise more."
            />
          </label>

          <div className="ai-confidence">
            <div>
              <span>CONFIDENCE AFTER THIS SESSION</span>
              <small>How confident do you feel using {workspace.learn_skill_name} now?</small>
            </div>
            <div className="ai-confidence-options">
              {[1,2,3,4,5].map(value=>(
                <button
                  key={value}
                  className={Number(setup.confidence)===value?"active":""}
                  onClick={()=>setSetup({...setup,confidence:value})}
                >
                  <b>{value}</b>
                  <small>{value===1?"Unsure":value===2?"Learning":value===3?"Getting it":value===4?"Confident":"Ready"}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="ai-recap-generate">
          <div><span>✦</span><div><b>Generate your personalized recap</b><small>Uses this session's real workspace activity.</small></div></div>
          <button className="primary" disabled={generating} onClick={onGenerate}>
            {generating?"Building your recap…":"Generate recap ✦"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-recap-wrap">
      <div className="ai-recap-hero">
        <div className="ai-recap-hero-copy">
          <div className={"ai-recap-skill "+visual.className}>{visual.icon}</div>
          <div>
            <div className="workspace-kicker">✦ SESSION COMPLETE</div>
            <h3>{recap.title||workspace.learn_skill_name+" Session Recap"}</h3>
            <p>{recap.summary}</p>
          </div>
        </div>

        <div className="ai-recap-score" style={{"--recap-score":Number(recap.mastery_score||0)}}>
          <div><strong>{recap.mastery_score||0}%</strong><span>progress signal</span></div>
          <small>{recap.momentum||"Learning momentum"}</small>
        </div>
      </div>

      <div className="ai-recap-meta">
        <span>🎯 {recap.goal}</span>
        <span>🪞 Confidence {recap.confidence||recapRecord.confidence}/5</span>
        <span>{recapRecord.source==="openai"?"✦ AI generated":"⚙ Smart recap"}</span>
      </div>

      <div className="ai-recap-actions">
        <button className="outline" disabled={generating} onClick={onGenerate}>{generating?"Regenerating…":"↻ Regenerate recap"}</button>
        <button className="outline" disabled={addingChecklist} onClick={onAddChecklist}>{addingChecklist?"Adding…":"✓ Add next steps to checklist"}</button>
        <button className="outline" onClick={()=>setDetailsOpen(!detailsOpen)}>{detailsOpen?"Hide details":"Show details"}</button>
      </div>

      {detailsOpen && <>
        <div className="ai-recap-grid">
          <section className="ai-recap-card wins">
            <div className="ai-recap-card-head"><span>✨</span><div><small>SESSION WINS</small><h4>What moved forward</h4></div></div>
            <div className="ai-recap-list">{(recap.highlights||[]).map((item,i)=><p key={i}>✓ {item}</p>)}</div>
          </section>

          <section className="ai-recap-card strengths">
            <div className="ai-recap-card-head"><span>🧠</span><div><small>STRENGTHENED</small><h4>What is sticking</h4></div></div>
            <div className="ai-recap-chips">{(recap.concepts_strengthened||[]).map((item,i)=><span key={i}>{item}</span>)}</div>
          </section>

          <section className="ai-recap-card revisit">
            <div className="ai-recap-card-head"><span>🔁</span><div><small>REVISIT</small><h4>What needs another pass</h4></div></div>
            <div className="ai-recap-list">{(recap.revisit||[]).map((item,i)=><p key={i}>→ {item}</p>)}</div>
          </section>

          <section className="ai-recap-card practice">
            <div className="ai-recap-card-head"><span>🛠</span><div><small>NEXT PRACTICE</small><h4>Do this before your next swap</h4></div></div>
            <div className="ai-recap-list">{(recap.practice_next||[]).map((item,i)=><p key={i}>{i+1}. {item}</p>)}</div>
          </section>
        </div>

        <section className="ai-next-focus">
          <div className="ai-next-focus-number">NEXT</div>
          <div className="ai-next-focus-copy">
            <div className="workspace-kicker">PERSONALIZED NEXT FOCUS</div>
            <h3>{recap.next_focus?.title}</h3>
            <p>{recap.next_focus?.why}</p>
            <div className="ai-next-challenge"><span>⚡</span><div><small>YOUR CHALLENGE</small><b>{recap.next_focus?.challenge}</b></div></div>
          </div>
        </section>

        <div className="ai-recap-tail">
          <div><small>NEXT SKILL GOAL</small><b>🎯 {recap.next_skill_goal}</b></div>
          <div><small>COACH NOTE</small><b>“{recap.coach_note}”</b></div>
        </div>
      </>}
    </div>
  );
}
