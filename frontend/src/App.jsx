import { useState } from "react";

const matches=[
 {name:"Alex M.",teaches:"Photography",wants:"Python",score:96,rating:4.8,swaps:18,icon:"📸"},
 {name:"Jane K.",teaches:"Graphic Design",wants:"Photography",score:84,rating:4.9,swaps:27,icon:"🎨"},
 {name:"Brian T.",teaches:"Video Editing",wants:"React",score:78,rating:4.7,swaps:12,icon:"🎬"}
];

export default function App(){
 const [teach,setTeach]=useState("Python");
 const [learn,setLearn]=useState("Photography");
 const [searched,setSearched]=useState(false);

 return <main className="app">
  <nav className="nav glass">
   <a className="brand" href="#"><span>↔</span>SkillSwap</a>
   <div className="links"><a href="#discover">Discover</a><a href="#how">How it works</a><a href="#community">Community</a></div>
   <div className="actions"><button className="ghost">Log in</button><button className="primary">Join SkillSwap</button></div>
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
     <button className="primary" onClick={()=>setSearched(true)}>Find my match →</button>
    </div>
    <div className="trust"><span>● 12k+ learners</span><span>★ 4.9 rating</span><span>✓ No payments</span></div>
   </div>

   <div className="visual">
    <div className="orb"></div>
    <div className="person p1 glass"><div className="portrait purple">👩🏾‍💻</div><b>I teach Python 🐍</b></div>
    <div className="person p2 glass"><div className="portrait orange">📷</div><b>I teach Photography 📸</b></div>
    <div className="badge">96%<small>MATCH</small></div>
    <span className="chip c1">React ⚛</span><span className="chip c2">Design ✦</span><span className="chip c3">Guitar ♫</span>
   </div>
  </section>

  <section id="discover" className="section">
   <div className="heading"><div><div className="eyebrow">SMART MATCHING</div><h2>{searched ? "Best matches for "+teach+" ↔ "+learn : "Meet your next SkillSwap"}</h2></div><button className="outline">Explore all skills ↗</button></div>
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
 </main>
}
