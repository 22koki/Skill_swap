import { useEffect, useMemo, useState } from "react";
import RequestsPanel from "./RequestsPanel";

const API = "http://127.0.0.1:8000/api";
const previewMatches = [
  {name:"Alex M.",teaches:"Photography",wants:"Python",score:96,rating:4.8,swaps:18,icon:"📸",preview:true},
  {name:"Jane K.",teaches:"Graphic Design",wants:"Photography",score:84,rating:4.9,swaps:27,icon:"🎨",preview:true},
  {name:"Brian T.",teaches:"Video Editing",wants:"React",score:78,rating:4.7,swaps:12,icon:"🎬",preview:true}
];

export default function App(){
 const [teach,setTeach]=useState("Python");
 const [learn,setLearn]=useState("Photography");
 const [searched,setSearched]=useState(false);
 const [matches,setMatches]=useState(previewMatches);
 const [token,setToken]=useState(localStorage.getItem("skillswap_access") || "");
 const [user,setUser]=useState(null);
 const [authOpen,setAuthOpen]=useState(false);
 const [authMode,setAuthMode]=useState("login");
 const [form,setForm]=useState({username:"",email:"",password:"",first_name:"",last_name:""});
 const [authError,setAuthError]=useState("");
 const [loading,setLoading]=useState(false);
 const [profileOpen,setProfileOpen]=useState(false);
 const [skillsOpen,setSkillsOpen]=useState(false);
 const [proposalOpen,setProposalOpen]=useState(false);
 const [selectedMatch,setSelectedMatch]=useState(null);
 const [catalog,setCatalog]=useState([]);
 const [mySkills,setMySkills]=useState([]);
 const [skillForm,setSkillForm]=useState({skill_id:"",kind:"teach",level:"beginner"});
 const [profileForm,setProfileForm]=useState({bio:"",location:"",availability_note:"",session_preference:"both",avatar_url:""});
 const [proposalForm,setProposalForm]=useState({offered_skill:"",requested_skill:"",message:""});
 const [notice,setNotice]=useState("");
 const [swaps,setSwaps]=useState([]);

 const teachSkills=useMemo(()=>mySkills.filter(s=>s.kind==="teach"),[mySkills]);
 const learnSkills=useMemo(()=>mySkills.filter(s=>s.kind==="learn"),[mySkills]);

 useEffect(()=>{ loadCatalog(); },[]);
 useEffect(()=>{ if(token){ loadMe(); loadMySkills(); loadSwaps(); } },[token]);

 async function refreshAccessToken(){
  const refresh=localStorage.getItem("skillswap_refresh");
  if(!refresh) return "";
  try{
   const res=await fetch(API+"/auth/token/refresh/",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({refresh})
   });
   if(!res.ok) return "";
   const data=await res.json();
   localStorage.setItem("skillswap_access",data.access);
   if(data.refresh) localStorage.setItem("skillswap_refresh",data.refresh);
   setToken(data.access);
   return data.access;
  }catch{
   return "";
  }
 }

 async function api(path, options={}){
  const makeRequest=(access)=>{
   const headers={...(options.headers||{})};
   if(access) headers.Authorization="Bearer "+access;
   if(options.body) headers["Content-Type"]="application/json";
   return fetch(API+path,{...options,headers});
  };

  const access=token||localStorage.getItem("skillswap_access")||"";
  let res=await makeRequest(access);

  if(res.status===401 && localStorage.getItem("skillswap_refresh")){
   const newAccess=await refreshAccessToken();
   if(newAccess) res=await makeRequest(newAccess);
  }
  return res;
 }

 async function loadCatalog(){
  try{
   const res=await fetch(API+"/skills/");
   if(res.ok) setCatalog(await res.json());
  }catch{}
 }

 async function loadMe(){
  try{
   const res=await api("/auth/me/");
   if(!res.ok) throw new Error();
   const data=await res.json();
   setUser(data);
   setProfileForm({
    bio:data.profile?.bio||"",
    location:data.profile?.location||"",
    availability_note:data.profile?.availability_note||"",
    session_preference:data.profile?.session_preference||"both",
    avatar_url:data.profile?.avatar_url||""
   });
  }catch{
   logout();
  }
 }

 async function loadMySkills(){
  if(!token && !localStorage.getItem("skillswap_access")) return;
  try{
   const res=await api("/skills/mine/");
   if(res.ok) setMySkills(await res.json());
  }catch{}
 }

 async function loadSwaps(){
  if(!token && !localStorage.getItem("skillswap_access")) return;
  try{
   const res=await api("/swaps/");
   if(res.ok) setSwaps(await res.json());
  }catch{}
 }

 async function handleSwapAction(id, action){
  const res=await api("/swaps/"+id+"/"+action+"/",{method:"POST"});
  if(res.ok){
   const updated=await res.json();
   setSwaps(prev=>prev.map(s=>s.id===id?updated:s));
   const copy={accept:"Swap accepted 🤝",decline:"Request declined.",cancel:"Request cancelled.",complete:"Swap completed 🎉"};
   setNotice(copy[action]||"Swap updated.");
  }else{
   const data=await res.json().catch(()=>({}));
   setNotice(data.detail||"Could not update the swap.");
  }
 }

 async function submitAuth(e){
  e.preventDefault();
  setLoading(true); setAuthError("");
  try{
   const endpoint=authMode==="register"?"/auth/register/":"/auth/login/";
   const payload=authMode==="register"?form:{username:form.username,password:form.password};
   const res=await fetch(API+endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const data=await res.json();
   if(!res.ok){
    const details=Object.entries(data)
     .map(([field,value])=>field+": "+(Array.isArray(value)?value.join(" "):value))
     .join(" · ");
    throw new Error(data.detail||details||"Unable to continue.");
   }
   localStorage.setItem("skillswap_access",data.access);
   if(data.refresh) localStorage.setItem("skillswap_refresh",data.refresh);
   setToken(data.access);
   setAuthOpen(false);
   if(data.user) setUser(data.user);
   setNotice("Welcome to SkillSwap ✨");
  }catch(err){setAuthError(err.message)}
  finally{setLoading(false)}
 }

 function logout(){
  localStorage.removeItem("skillswap_access");
  localStorage.removeItem("skillswap_refresh");
  setToken(""); setUser(null); setMySkills([]); setSwaps([]); setMatches(previewMatches);
 }

 async function saveProfile(e){
  e.preventDefault();
  const res=await api("/auth/me/",{
   method:"PATCH",
   body:JSON.stringify({profile:profileForm})
  });
  if(res.ok){
   const data=await res.json();
   setUser(data);
   setProfileOpen(false);
   setNotice("Profile updated.");
  }else setNotice("Could not update profile.");
 }

 async function addSkill(e){
  e.preventDefault();
  if(!skillForm.skill_id) return;
  const res=await api("/skills/mine/",{method:"POST",body:JSON.stringify({
   skill_id:Number(skillForm.skill_id),kind:skillForm.kind,level:skillForm.level,description:""
  })});
  if(res.ok){
   await loadMySkills();
   setSkillForm({...skillForm,skill_id:""});
   setNotice("Skill added.");
  }else{
   const data=await res.json().catch(()=>({}));
   setNotice(data.non_field_errors?.[0]||"That skill is already on your profile.");
  }
 }

 async function removeSkill(id){
  const res=await api("/skills/mine/"+id+"/",{method:"DELETE"});
  if(res.ok){ setMySkills(prev=>prev.filter(s=>s.id!==id)); setNotice("Skill removed."); }
 }

 async function findMatches(){
  setSearched(true);
  document.getElementById("discover")?.scrollIntoView({behavior:"smooth"});
  if(!token){
   setMatches(previewMatches);
   setAuthMode("login");
   setAuthOpen(true);
   return;
  }
  if(!mySkills.length){
   setMatches([]);
   setNotice("Add at least one skill you teach and one you want to learn first.");
   setSkillsOpen(true);
   return;
  }
  const res=await api("/skills/matches/");
  if(res.ok){
   const data=await res.json();
   setMatches(data.map((m,i)=>({
    ...m,
    teaches:m.they_teach_me.map(x=>x.name).join(", ")||"Partial match",
    wants:m.i_teach_them.map(x=>x.name).join(", ")||"Partial match",
    rating:m.average_rating||0,
    swaps:m.completed_swaps||0,
    icon:["📸","🎨","🎬","💻","🎸"][i%5],
    preview:false
   })));
   if(!data.length) setNotice("No compatible users yet. Your profile is ready — matches will appear as the community grows.");
  }
 }

 function openProposal(match){
  if(!token){ setAuthMode("login"); setAuthOpen(true); return; }
  if(match.preview){ setNotice("Preview card only. Add your skills and click Find my match to get real users."); setSkillsOpen(true); return; }
  const offered=match.i_teach_them?.[0]?.id||"";
  const requested=match.they_teach_me?.[0]?.id||"";
  setSelectedMatch(match);
  setProposalForm({offered_skill:String(offered),requested_skill:String(requested),message:"Hey! I’d love to swap skills with you."});
  setProposalOpen(true);
 }

 async function submitProposal(e){
  e.preventDefault();
  const res=await api("/swaps/",{method:"POST",body:JSON.stringify({
   recipient:selectedMatch.user_id,
   offered_skill:Number(proposalForm.offered_skill),
   requested_skill:Number(proposalForm.requested_skill),
   message:proposalForm.message
  })});
  if(res.ok){
   const created=await res.json();
   setSwaps(prev=>[created,...prev]);
   setProposalOpen(false);
   setNotice("Swap proposal sent 🎉");
  }else{
   const data=await res.json().catch(()=>({}));
   setNotice(data.detail||data.non_field_errors?.[0]||"Could not send proposal.");
  }
 }

 function openSkills(){ if(!token){setAuthMode("login");setAuthOpen(true)} else setSkillsOpen(true) }

 return <main className="app">
  {notice && <button className="toast" onClick={()=>setNotice("")}>{notice} ×</button>}

  <nav className="nav glass">
   <a className="brand" href="#top"><span>↔</span>SkillSwap</a>
   <div className="links">
    <a href="#discover">Discover</a>
    {user && <a className="request-nav-link" href="#requests">Requests{swaps.filter(s=>s.recipient===user.id&&s.status==="proposed").length>0&&<span>{swaps.filter(s=>s.recipient===user.id&&s.status==="proposed").length}</span>}</a>}
    <a href="#how">How it works</a>
    <a href="#community">Community</a>
   </div>
   <div className="actions">
    {user ? <>
      <button className="ghost" onClick={()=>setProfileOpen(true)}>My profile</button>
      <span className="welcome">Hi, {user.first_name||user.username}</span>
      <button className="ghost" onClick={logout}>Log out</button>
    </> : <>
      <button className="ghost" onClick={()=>{setAuthMode("login");setAuthOpen(true)}}>Log in</button>
      <button className="primary" onClick={()=>{setAuthMode("register");setAuthOpen(true)}}>Join SkillSwap</button>
    </>}
   </div>
  </nav>

  <section id="top" className="hero">
   <div className="copy">
    <div className="eyebrow">✦ LEARNING POWERED BY PEOPLE</div>
    <h1>Swap skills.<br/><span>Grow together.</span></h1>
    <p>Your knowledge already has value. Trade what you know for what you want to learn — no money required.</p>
    <div className="builder glass">
     <label>I CAN TEACH<input value={teach} onChange={e=>setTeach(e.target.value)}/></label>
     <div className="swap">⇄</div>
     <label>I WANT TO LEARN<input value={learn} onChange={e=>setLearn(e.target.value)}/></label>
     <button className="primary" onClick={findMatches}>Find my match →</button>
    </div>
    <div className="trust"><span>● Community-powered learning</span><span>★ Reputation based</span><span>✓ No payments</span></div>
   </div>

   <div className="visual">
    <div className="orb"></div>
    <button className="person p1 glass visual-button" onClick={()=>{setTeach("Python");openSkills()}}><div className="portrait purple">👩🏾‍💻</div><b>I teach Python 🐍</b></button>
    <button className="person p2 glass visual-button" onClick={()=>{setLearn("Photography");openSkills()}}><div className="portrait orange">📷</div><b>I teach Photography 📸</b></button>
    <div className="badge">96%<small>MATCH</small></div>
    <button className="chip c1" onClick={()=>setTeach("React")}>React ⚛</button>
    <button className="chip c2" onClick={()=>setLearn("UI/UX Design")}>Design ✦</button>
    <button className="chip c3" onClick={()=>setLearn("Guitar")}>Guitar ♫</button>
   </div>
  </section>

  {user && <section className="profile-strip glass">
    <div>
      <div className="eyebrow">YOUR SKILLSWAP PROFILE</div>
      <h3>{user.first_name||user.username} {user.last_name||""}</h3>
      <p>{user.profile?.bio||"Tell people what you enjoy teaching and what you want to learn."}</p>
      <div className="profile-actions">
       <button className="outline" onClick={()=>setProfileOpen(true)}>Edit profile</button>
       <button className="primary" onClick={()=>setSkillsOpen(true)}>Manage my skills</button>
      </div>
    </div>
    <div className="profile-meta">
      <span>📍 {user.profile?.location||"Location not set"}</span>
      <span>🔄 {user.profile?.session_preference||"both"}</span>
      <span>⭐ {user.profile?.average_rating||"0.00"}</span>
      <span>🎓 {teachSkills.length} teaching</span>
      <span>🌱 {learnSkills.length} learning</span>
    </div>
  </section>}

  <section id="discover" className="section">
   <div className="heading">
    <div><div className="eyebrow">SMART MATCHING</div><h2>{searched?"Your compatible SkillSwaps":"Meet your next SkillSwap"}</h2></div>
    <button className="outline" onClick={openSkills}>Explore all skills ↗</button>
   </div>

   {matches.length ? <div className="cards">{matches.map((m,i)=><article className="card glass" key={(m.user_id||m.name)+"-"+i}>
    <div className="avatar">{m.icon}</div>
    <div className="row"><h3>{m.name}</h3><span>{m.score}% match</span></div>
    <p><b>Can teach you</b> {m.teaches}</p>
    <p><b>You can teach</b> {m.wants}</p>
    <small>⭐ {m.rating} · {m.swaps} successful swaps</small>
    <button className="primary mini" onClick={()=>openProposal(m)}>Propose swap ↗</button>
   </article>)}</div> :
   <div className="empty-state glass"><div>🧭</div><h3>No matches yet</h3><p>Add more teach/learn skills to improve your chances.</p><button className="primary" onClick={()=>setSkillsOpen(true)}>Add skills</button></div>}
  </section>

  {user && <RequestsPanel swaps={swaps} currentUserId={user.id} onAction={handleSwapAction} />}

  <section id="how" className="how glass">
   <div className="eyebrow">THREE SIMPLE MOVES</div><h2>Your knowledge is your currency.</h2>
   <div className="steps">
    <button onClick={openSkills}><b>01</b><h3>Show what you know</h3><p>Add skills you can teach and skills you want.</p></button>
    <button onClick={findMatches}><b>02</b><h3>Meet your match</h3><p>Find people whose skills complement yours.</p></button>
    <button onClick={()=>document.getElementById("discover")?.scrollIntoView({behavior:"smooth"})}><b>03</b><h3>Swap & grow</h3><p>Propose a swap and build your reputation.</p></button>
   </div>
  </section>

  <section id="community" className="community section">
   <div className="eyebrow">EXPLORE THE COMMUNITY</div>
   <h2>There is always something new to learn.</h2>
   <div className="category-list">
    {["💻 Technology","🎨 Creative","🌍 Languages","🎵 Music","💼 Business","✨ Lifestyle"].map(x=><button key={x} onClick={openSkills}>{x}</button>)}
   </div>
  </section>

  {authOpen && <div className="modal-backdrop" onMouseDown={()=>setAuthOpen(false)}>
   <div className="auth-modal glass" onMouseDown={e=>e.stopPropagation()}>
    <button className="modal-close" onClick={()=>setAuthOpen(false)}>×</button>
    <div className="eyebrow">{authMode==="register"?"JOIN THE COMMUNITY":"WELCOME BACK"}</div>
    <h2>{authMode==="register"?"Create your SkillSwap account":"Log in to SkillSwap"}</h2>
    <form onSubmit={submitAuth}>
     {authMode==="register"&&<div className="form-grid"><input placeholder="First name" value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})}/><input placeholder="Last name" value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})}/></div>}
     <input required placeholder="Username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/>
     {authMode==="register"&&<input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>}
     <input required minLength="8" type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
     {authError&&<p className="auth-error">{authError}</p>}
     <button className="primary auth-submit" disabled={loading}>{loading?"Working...":authMode==="register"?"Create account":"Log in"}</button>
    </form>
    <button className="switch-auth" onClick={()=>setAuthMode(authMode==="register"?"login":"register")}>{authMode==="register"?"Already have an account? Log in":"New here? Create an account"}</button>
   </div>
  </div>}

  {profileOpen && <div className="modal-backdrop" onMouseDown={()=>setProfileOpen(false)}>
   <div className="auth-modal glass" onMouseDown={e=>e.stopPropagation()}>
    <button className="modal-close" onClick={()=>setProfileOpen(false)}>×</button>
    <div className="eyebrow">YOUR PROFILE</div><h2>Make your profile useful to swappers.</h2>
    <form onSubmit={saveProfile}>
     <textarea placeholder="Short bio" value={profileForm.bio} onChange={e=>setProfileForm({...profileForm,bio:e.target.value})}/>
     <input placeholder="Location e.g. Nairobi" value={profileForm.location} onChange={e=>setProfileForm({...profileForm,location:e.target.value})}/>
     <input placeholder="Availability e.g. Weekends, 2–6 PM" value={profileForm.availability_note} onChange={e=>setProfileForm({...profileForm,availability_note:e.target.value})}/>
     <select value={profileForm.session_preference} onChange={e=>setProfileForm({...profileForm,session_preference:e.target.value})}><option value="both">Online or in person</option><option value="online">Online</option><option value="in_person">In person</option></select>
     <input placeholder="Avatar image URL (optional)" value={profileForm.avatar_url} onChange={e=>setProfileForm({...profileForm,avatar_url:e.target.value})}/>
     <button className="primary auth-submit">Save profile</button>
    </form>
   </div>
  </div>}

  {skillsOpen && <div className="modal-backdrop" onMouseDown={()=>setSkillsOpen(false)}>
   <div className="skills-modal glass" onMouseDown={e=>e.stopPropagation()}>
    <button className="modal-close" onClick={()=>setSkillsOpen(false)}>×</button>
    <div className="eyebrow">YOUR SKILL WALLET</div><h2>What can you trade?</h2>
    <form className="skill-add" onSubmit={addSkill}>
     <select required value={skillForm.skill_id} onChange={e=>setSkillForm({...skillForm,skill_id:e.target.value})}><option value="">Choose a skill</option>{catalog.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
     <select value={skillForm.kind} onChange={e=>setSkillForm({...skillForm,kind:e.target.value})}><option value="teach">I can teach</option><option value="learn">I want to learn</option></select>
     <select value={skillForm.level} onChange={e=>setSkillForm({...skillForm,level:e.target.value})}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select>
     <button className="primary">Add skill</button>
    </form>
    <div className="skill-columns">
     <div><h3>🎓 Skills I teach</h3>{teachSkills.length?teachSkills.map(s=><div className="skill-row" key={s.id}><span><b>{s.skill.name}</b><small>{s.level}</small></span><button onClick={()=>removeSkill(s.id)}>×</button></div>):<p>No teaching skills yet.</p>}</div>
     <div><h3>🌱 Skills I want</h3>{learnSkills.length?learnSkills.map(s=><div className="skill-row" key={s.id}><span><b>{s.skill.name}</b><small>{s.level}</small></span><button onClick={()=>removeSkill(s.id)}>×</button></div>):<p>No learning skills yet.</p>}</div>
    </div>
   </div>
  </div>}

  {proposalOpen && selectedMatch && <div className="modal-backdrop" onMouseDown={()=>setProposalOpen(false)}>
   <div className="auth-modal glass" onMouseDown={e=>e.stopPropagation()}>
    <button className="modal-close" onClick={()=>setProposalOpen(false)}>×</button>
    <div className="eyebrow">PROPOSE A SKILLSWAP</div><h2>You ↔ {selectedMatch.name}</h2>
    <form onSubmit={submitProposal}>
     <label className="field-label">I will teach
      <select value={proposalForm.offered_skill} onChange={e=>setProposalForm({...proposalForm,offered_skill:e.target.value})}>{selectedMatch.i_teach_them.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
     </label>
     <label className="field-label">I want to learn
      <select value={proposalForm.requested_skill} onChange={e=>setProposalForm({...proposalForm,requested_skill:e.target.value})}>{selectedMatch.they_teach_me.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
     </label>
     <textarea value={proposalForm.message} onChange={e=>setProposalForm({...proposalForm,message:e.target.value})}/>
     <button className="primary auth-submit">Send proposal ↗</button>
    </form>
   </div>
  </div>}
 </main>
}
