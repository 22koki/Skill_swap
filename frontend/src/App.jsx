import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000/api";

const fallbackMatches = [
  {name:"Alex M.",teaches:"Photography",wants:"Python",score:96,rating:4.8,swaps:18,icon:"📸"},
  {name:"Jane K.",teaches:"Graphic Design",wants:"Photography",score:84,rating:4.9,swaps:27,icon:"🎨"},
  {name:"Brian T.",teaches:"Video Editing",wants:"React",score:78,rating:4.7,swaps:12,icon:"🎬"}
];

export default function App(){
 const [teach,setTeach]=useState("Python");
 const [learn,setLearn]=useState("Photography");
 const [searched,setSearched]=useState(false);
 const [matches,setMatches]=useState(fallbackMatches);
 const [authOpen,setAuthOpen]=useState(false);
 const [authMode,setAuthMode]=useState("login");
 const [token,setToken]=useState(localStorage.getItem("skillswap_access") || "");
 const [user,setUser]=useState(null);
 const [form,setForm]=useState({username:"",email:"",password:"",first_name:"",last_name:""});
 const [authError,setAuthError]=useState("");
 const [loading,setLoading]=useState(false);

 useEffect(()=>{ if(token) loadMe(token); },[token]);

 async function loadMe(access){
  try{
   const res=await fetch(API+"/auth/me/",{headers:{Authorization:"Bearer "+access}});
   if(!res.ok) throw new Error();
   setUser(await res.json());
  }catch{
   localStorage.removeItem("skillswap_access");
   setToken("");
   setUser(null);
  }
 }

 async function submitAuth(e){
  e.preventDefault();
  setLoading(true); setAuthError("");
  try{
   const endpoint=authMode==="register" ? "/auth/register/" : "/auth/login/";
   const payload=authMode==="register" ? form : {username:form.username,password:form.password};
   const res=await fetch(API+endpoint,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)
   });
   const data=await res.json();
   if(!res.ok) throw new Error(data.detail || Object.values(data).flat().join(" ") || "Unable to continue.");
   const access=data.access;
   localStorage.setItem("skillswap_access",access);
   setToken(access);
   setAuthOpen(false);
   if(data.user) setUser(data.user);
  }catch(err){ setAuthError(err.message); }
  finally{ setLoading(false); }
 }

 async function findMatches(){
  setSearched(true);
  if(!token) return;
  try{
   const res=await fetch(API+"/skills/matches/",{headers:{Authorization:"Bearer "+token}});
   if(res.ok){
    const data=await res.json();
    if(data.length){
     setMatches(data.map((m,i)=>({
      name:m.name,
      teaches:m.they_teach_me.join(", ") || "A skill you need",
      wants:m.i_teach_them.join(", ") || "A skill you teach",
      score:m.score,
      rating:m.average_rating || 0,
      swaps:m.completed_swaps || 0,
      icon:["📸","🎨","🎬","💻","🎸"][i%5]
     })));
    }
   }
  }catch{}
 }

 function logout(){
  localStorage.removeItem("skillswap_access");
  setToken(""); setUser(null); setMatches(fallbackMatches);
 }

 return <main className="app">
  <nav className="nav glass">
   <a className="brand" href="#"><span>↔</span>SkillSwap</a>
   <div className="links"><a href="#discover">Discover</a><a href="#how">How it works</a><a href="#community">Community</a></div>
   <div className="actions">
    {user ? <>
      <span className="welcome">Hi, {user.first_name || user.username}</span>
      <button className="ghost" onClick={logout}>Log out</button>
    </> : <>
      <button className="ghost" onClick={()=>{setAuthMode("login");setAuthOpen(true)}}>Log in</button>
      <button className="primary" onClick={()=>{setAuthMode("register");setAuthOpen(true)}}>Join SkillSwap</button>
    </>}
   </div>
  </nav>

  <section className="hero">
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
    <div className="person p1 glass"><div className="portrait purple">👩🏾‍💻</div><b>I teach Python 🐍</b></div>
    <div className="person p2 glass"><div className="portrait orange">📷</div><b>I teach Photography 📸</b></div>
    <div className="badge">96%<small>MATCH</small></div>
    <span className="chip c1">React ⚛</span><span className="chip c2">Design ✦</span><span className="chip c3">Guitar ♫</span>
   </div>
  </section>

  {user && <section className="profile-strip glass">
    <div>
      <div className="eyebrow">YOUR SKILLSWAP PROFILE</div>
      <h3>{user.first_name || user.username} {user.last_name || ""}</h3>
      <p>{user.profile?.bio || "Add a bio, location and availability from the profile API."}</p>
    </div>
    <div className="profile-meta">
      <span>📍 {user.profile?.location || "Location not set"}</span>
      <span>🔄 {user.profile?.session_preference || "both"}</span>
      <span>⭐ {user.profile?.average_rating || "0.00"}</span>
    </div>
  </section>}

  <section id="discover" className="section">
   <div className="heading"><div><div className="eyebrow">SMART MATCHING</div><h2>{searched ? "Best matches for "+teach+" ↔ "+learn : "Meet your next SkillSwap"}</h2></div><button className="outline">Explore all skills ↗</button></div>
   {!token && searched && <div className="notice glass">Sign in to calculate real matches from your saved teach/learn skills. Preview matches are shown below.</div>}
   <div className="cards">{matches.map(m=><article className="card glass" key={m.name}><div className="avatar">{m.icon}</div><div className="row"><h3>{m.name}</h3><span>{m.score}% match</span></div><p><b>Teaches</b> {m.teaches}</p><p><b>Wants</b> {m.wants}</p><small>⭐ {m.rating} · {m.swaps} successful swaps</small><button className="primary mini">Propose swap ↗</button></article>)}</div>
  </section>

  <section id="how" className="how glass">
   <div className="eyebrow">THREE SIMPLE MOVES</div><h2>Your knowledge is your currency.</h2>
   <div className="steps">
    <div><b>01</b><h3>Show what you know</h3><p>Add skills you can teach and skills you want.</p></div>
    <div><b>02</b><h3>Meet your match</h3><p>Find people whose skills complement yours.</p></div>
    <div><b>03</b><h3>Swap & grow</h3><p>Book, chat, learn, teach and build reputation.</p></div>
   </div>
  </section>

  {authOpen && <div className="modal-backdrop" onMouseDown={()=>setAuthOpen(false)}>
    <div className="auth-modal glass" onMouseDown={e=>e.stopPropagation()}>
      <button className="modal-close" onClick={()=>setAuthOpen(false)}>×</button>
      <div className="eyebrow">{authMode==="register" ? "JOIN THE COMMUNITY" : "WELCOME BACK"}</div>
      <h2>{authMode==="register" ? "Create your SkillSwap account" : "Log in to SkillSwap"}</h2>
      <form onSubmit={submitAuth}>
       {authMode==="register" && <div className="form-grid">
         <input placeholder="First name" value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})}/>
         <input placeholder="Last name" value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})}/>
       </div>}
       <input required placeholder="Username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/>
       {authMode==="register" && <input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>}
       <input required minLength="8" type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
       {authError && <p className="auth-error">{authError}</p>}
       <button className="primary auth-submit" disabled={loading}>{loading ? "Working..." : authMode==="register" ? "Create account" : "Log in"}</button>
      </form>
      <button className="switch-auth" onClick={()=>setAuthMode(authMode==="register"?"login":"register")}>
       {authMode==="register" ? "Already have an account? Log in" : "New here? Create an account"}
      </button>
    </div>
  </div>}
 </main>
}
