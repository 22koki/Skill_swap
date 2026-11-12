import { useEffect, useMemo, useRef, useState } from "react";
import { getSkillVisual } from "./skillVisuals";
import BookmarkButton from "./BookmarkButton";

const FILTERS=[
  ["all","All"],
  ["people","People"],
  ["skills","Skills"],
  ["circles","Circles"],
  ["mentors","Mentors"],
];

function initials(name=""){
  return name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()||"SS";
}

export default function UniversalSearch({
  open,
  query,
  setQuery,
  data,
  loading,
  onClose,
  onPerson,
  onSkill,
  onCircle,
  onPropose,
  currentUser,
  bookmarkProps,
}){
  const inputRef=useRef(null);
  const [filter,setFilter]=useState("all");

  useEffect(()=>{
    if(open){
      setTimeout(()=>inputRef.current?.focus(),30);
      setFilter("all");
    }
  },[open]);

  useEffect(()=>{
    if(!open) return;
    const onKey=e=>{
      if(e.key==="Escape") onClose();
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[open,onClose]);

  const sections=useMemo(()=>{
    const all=[
      ["people","People",data?.people||[]],
      ["skills","Skills",data?.skills||[]],
      ["circles","Circles",data?.circles||[]],
      ["mentors","Mentors",data?.mentors||[]],
    ];
    return filter==="all"?all:all.filter(([key])=>key===filter);
  },[data,filter]);

  const total=(data?.counts?.people||0)+(data?.counts?.skills||0)+(data?.counts?.circles||0);

  if(!open) return null;

  return (
    <div className="universal-search-backdrop" onMouseDown={onClose}>
      <section className="universal-search-shell" onMouseDown={e=>e.stopPropagation()}>
        <header className="universal-search-header">
          <div className="universal-search-box">
            <span>⌕</span>
            <input
              ref={inputRef}
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder="Search people, skills, mentors, or circles..."
            />
            {query&&<button onClick={()=>setQuery("")}>×</button>}
            <kbd>ESC</kbd>
          </div>

          <div className="universal-search-filters">
            {FILTERS.map(([key,label])=>(
              <button key={key} className={filter===key?"active":""} onClick={()=>setFilter(key)}>
                {label}
                {key!=="all"&&data?.counts?.[key]!==undefined&&<span>{data.counts[key]}</span>}
              </button>
            ))}
          </div>
        </header>

        <div className="universal-search-body">
          {loading ? (
            <div className="universal-search-loading">
              <div className="universal-search-spinner">↔</div>
              <h3>Searching SkillSwap…</h3>
            </div>
          ) : total===0 && query ? (
            <div className="universal-search-empty">
              <div>⌕</div>
              <h3>No results for “{query}”</h3>
              <p>Try a person, skill, Circle, mentor, location, or category.</p>
            </div>
          ) : (
            <>
              {!query&&(
                <div className="universal-search-intro">
                  <div>
                    <div className="universal-search-kicker">DISCOVER SKILLSWAP</div>
                    <h2>What are you looking for?</h2>
                    <p>Search the whole community from one place.</p>
                  </div>
                  <div className="universal-search-shortcuts">
                    <span>👤 People</span><span>🧠 Skills</span><span>👥 Circles</span><span>🎓 Mentors</span>
                  </div>
                </div>
              )}

              {sections.map(([key,label,items])=>items.length>0&&(
                <section className="universal-search-section" key={key}>
                  <div className="universal-search-section-head">
                    <h3>{label}</h3>
                    <span>{items.length}</span>
                  </div>

                  {key==="people"||key==="mentors" ? (
                    <div className="universal-people-grid">
                      {items.map(person=>(
                        <article className="universal-person-card" key={key+"-"+person.user_id}>
                          <button className="universal-person-main" onClick={()=>onPerson(person)}>
                            <div className="universal-person-avatar">
                              {person.avatar_url?<img src={person.avatar_url} alt=""/>:<span>{initials(person.name)}</span>}
                              {person.is_mentor&&<i>🎓</i>}
                            </div>
                            <div className="universal-person-copy">
                              <div><h4>{person.name}</h4><small>@{person.username}</small></div>
                              <p>{person.bio||person.location||"SkillSwap community member"}</p>
                              <div className="universal-result-tags">
                                {(person.teach_skills||[]).slice(0,3).map(skill=><span key={skill.id}>🎓 {skill.name}</span>)}
                              </div>
                            </div>
                            <div className="universal-person-meta">
                              {person.match_score!==null&&person.match_score!==undefined&&<strong>{person.match_score}%</strong>}
                              <small>⭐ {Number(person.average_rating||0).toFixed(1)}</small>
                              <small>↻ {person.completed_swaps||0}</small>
                            </div>
                          </button>

                          <div className="universal-result-actions">
                            {currentUser&&currentUser.id!==person.user_id&&<BookmarkButton type="user" id={person.user_id} compact {...bookmarkProps}/>}
                            <button className="outline" onClick={()=>onPerson(person)}>View passport</button>
                            {currentUser && person.they_teach_me?.length>0 && person.i_teach_them?.length>0 &&
                              <button className="primary" onClick={()=>onPropose({
                                ...person,
                                score:person.match_score,
                                confidence:person.match_confidence,
                              })}>Propose swap</button>}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : key==="skills" ? (
                    <div className="universal-skill-grid">
                      {items.map(skill=>{
                        const visual=getSkillVisual(skill.name);
                        return (
                          <div className="quick-save-card" key={skill.id}><button className="universal-skill-card" onClick={()=>onSkill(skill)}>
                            <div className={"universal-skill-icon "+visual.className}>{visual.icon}</div>
                            <div>
                              <small>{skill.category}</small>
                              <h4>{skill.name}</h4>
                              <p>{skill.teacher_count} teachers · {skill.learner_count} learners</p>
                            </div>
                            <span>→</span>
                          </button>{currentUser&&<BookmarkButton type="skill" id={skill.id} compact {...bookmarkProps}/>}</div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="universal-circle-grid">
                      {items.map(circle=>{
                        const visual=getSkillVisual(circle.primary_skill_name||circle.title);
                        return (
                          <div className="quick-save-card" key={circle.id}><button className="universal-circle-card" onClick={()=>onCircle(circle)}>
                            <div className="universal-circle-cover">
                              <div className={"universal-circle-icon "+visual.className}>{circle.cover_emoji||visual.icon}</div>
                              {circle.membership&&<span>{circle.membership.role==="mentor"?"🎓 Mentor":"🌱 Member"}</span>}
                            </div>
                            <div className="universal-circle-copy">
                              <small>{circle.circle_type_label}</small>
                              <h4>{circle.title}</h4>
                              <p>{circle.description||circle.goal||circle.primary_skill_name||"SkillSwap Circle"}</p>
                              <div><span>👥 {circle.member_count}</span><span>🎓 {circle.mentor_count}</span></div>
                            </div>
                            <em>→</em>
                          </button>{currentUser&&<BookmarkButton type="circle" id={circle.id} compact {...bookmarkProps}/>}</div>
                        );
                      })}
                    </div>
                  )
                </section>
              ))}
            </>
          )}
        </div>

        <footer className="universal-search-footer">
          <span>Search across your entire SkillSwap community</span>
          <div><kbd>ESC</kbd> close</div>
        </footer>
      </section>
    </div>
  );
}
