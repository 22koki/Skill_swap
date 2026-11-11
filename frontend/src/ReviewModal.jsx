import { useState } from "react";

const categories = [
  ["overall_rating","Overall experience","How was the SkillSwap overall?"],
  ["teaching_quality","Teaching quality","How clearly did they share their skill?"],
  ["communication","Communication","Were they clear and easy to coordinate with?"],
  ["reliability","Reliability","Did they show up prepared and on time?"],
  ["friendliness","Friendliness","Did the exchange feel welcoming and respectful?"],
];

function Stars({value,onChange}){
  return (
    <div className="review-stars">
      {[1,2,3,4,5].map(star=>
        <button type="button" className={star<=value?"active":""} key={star} onClick={()=>onChange(star)}>★</button>
      )}
    </div>
  );
}

export default function ReviewModal({ booking, form, setForm, onClose, onSubmit, saving }){
  const [step,setStep]=useState(1);
  if(!booking) return null;

  const average=Math.round(
    (form.overall_rating+form.teaching_quality+form.communication+form.reliability+form.friendliness)/5*10
  )/10;

  return (
    <div className="review-backdrop" onMouseDown={onClose}>
      <section className="review-modal" onMouseDown={e=>e.stopPropagation()}>
        <button className="review-close" onClick={onClose}>×</button>

        {step===1 ? (
          <>
            <div className="review-hero">
              <div className="review-celebration">✦</div>
              <div className="review-kicker">SESSION COMPLETE</div>
              <h2>How was your SkillSwap?</h2>
              <p>Your feedback helps build trust and better matches for everyone.</p>
              <div className="review-exchange-pill">
                <span>{booking.learn_skill_name}</span><b>↔</b><span>{booking.teach_skill_name}</span>
              </div>
              <div className="review-partner">Reviewing <strong>{booking.partner_name}</strong></div>
            </div>

            <div className="review-ratings">
              {categories.map(([key,label,help])=>(
                <div className="review-rating-row" key={key}>
                  <div><b>{label}</b><small>{help}</small></div>
                  <Stars value={form[key]} onChange={value=>setForm({...form,[key]:value})}/>
                </div>
              ))}
            </div>

            <div className="review-summary-score">
              <span>Your rating</span>
              <strong>{average}</strong>
              <small>/ 5</small>
            </div>

            <button className="primary review-next" onClick={()=>setStep(2)}>Continue →</button>
          </>
        ) : (
          <>
            <div className="review-hero review-hero-small">
              <div className="review-kicker">ONE LAST THING</div>
              <h2>Share a little more.</h2>
              <p>This helps future swappers know what it is like learning with {booking.partner_name}.</p>
            </div>

            <label className="review-comment">
              <span>Written feedback <small>optional</small></span>
              <textarea
                maxLength="1200"
                placeholder="What went well? What did you learn? What made this person a good swap partner?"
                value={form.comment}
                onChange={e=>setForm({...form,comment:e.target.value})}
              />
              <small>{form.comment.length}/1200</small>
            </label>

            <div className="review-again">
              <div>
                <b>Would you SkillSwap with them again?</b>
                <small>This helps us improve future recommendations.</small>
              </div>
              <div className="review-choice">
                <button className={form.would_swap_again?"active":""} onClick={()=>setForm({...form,would_swap_again:true})}>👍 Yes</button>
                <button className={!form.would_swap_again?"active":""} onClick={()=>setForm({...form,would_swap_again:false})}>Not this time</button>
              </div>
            </div>

            <div className="review-final-score">
              <span>⭐</span>
              <div><small>Overall</small><b>{form.overall_rating}.0 / 5</b></div>
            </div>

            <div className="review-actions">
              <button className="outline" onClick={()=>setStep(1)}>← Back</button>
              <button className="primary" disabled={saving} onClick={onSubmit}>{saving?"Submitting...":"Submit review ✓"}</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
