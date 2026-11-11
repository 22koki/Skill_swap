import { useEffect, useMemo, useState } from "react";
import RequestsPanel from "./RequestsPanel";
import BookingsPanel from "./BookingsPanel";
import ScheduleSwapModal from "./ScheduleSwapModal";
import ChatPanel from "./ChatPanel";
import WorkspacePanel from "./WorkspacePanel";
import ReviewModal from "./ReviewModal";
import { getSkillVisual } from "./skillVisuals";

const API = "http://127.0.0.1:8000/api";
export default function App(){
 const [teach,setTeach]=useState("Python");
 const [learn,setLearn]=useState("Photography");
 const [searched,setSearched]=useState(false);
 const [matches,setMatches]=useState([]);
 const [communityUsers,setCommunityUsers]=useState([]);
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
 const [bookings,setBookings]=useState([]);
 const [scheduleOpen,setScheduleOpen]=useState(false);
 const [selectedSwap,setSelectedSwap]=useState(null);
 const [bookingForm,setBookingForm]=useState({
  starts_at:"",
  duration_minutes:"60",
  mode:"online",
  meeting_link:"",
  location_note:"",
  note:""
 });
 const [conversations,setConversations]=useState([]);
 const [chatOpen,setChatOpen]=useState(false);
 const [activeConversation,setActiveConversation]=useState(null);
 const [chatMessages,setChatMessages]=useState([]);
 const [chatDraft,setChatDraft]=useState("");
 const [chatSending,setChatSending]=useState(false);
 const [workspaceOpen,setWorkspaceOpen]=useState(false);
 const [workspace,setWorkspace]=useState(null);
 const [workspaceForm,setWorkspaceForm]=useState({goals:"",lesson_plan:"",shared_notes:"",progress_percentage:0});
 const [workspaceResourceForm,setWorkspaceResourceForm]=useState({title:"",url:"",kind:"link"});
 const [workspaceChecklistText,setWorkspaceChecklistText]=useState("");
 const [workspaceSaving,setWorkspaceSaving]=useState(false);
 const [reviewOpen,setReviewOpen]=useState(false);
 const [reviewBooking,setReviewBooking]=useState(null);
 const [reviewSaving,setReviewSaving]=useState(false);
 const [reviewForm,setReviewForm]=useState({
  overall_rating:5,
  teaching_quality:5,
  communication:5,
  reliability:5,
  friendliness:5,
  would_swap_again:true,
  comment:""
 });

 const teachSkills=useMemo(()=>mySkills.filter(s=>s.kind==="teach"),[mySkills]);
 const learnSkills=useMemo(()=>mySkills.filter(s=>s.kind==="learn"),[mySkills]);
 const teachVisual=getSkillVisual(teach);
 const learnVisual=getSkillVisual(learn);

 useEffect(()=>{ loadCatalog(); loadCommunityUsers(); },[]);
 useEffect(()=>{ if(token){ loadMe(); loadMySkills(); loadSwaps(); loadBookings(); loadConversations(); loadCommunityUsers(); } },[token]);

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

 async function loadCommunityUsers(){
  try{
   const access=localStorage.getItem("skillswap_access")||"";
   const headers=access?{Authorization:"Bearer "+access}:{};
   const res=await fetch(API+"/auth/community/",{headers});
   if(res.ok){
    const data=await res.json();
    setCommunityUsers(data);
    if(!searched) setMatches(data.map(person=>({
      ...person,
      name:person.name,
      teaches:person.teach_skills?.map(s=>s.name).join(", ")||"No teaching skills yet",
      wants:person.learn_skills?.map(s=>s.name).join(", ")||"No learning skills yet",
      rating:person.average_rating||0,
      swaps:person.completed_swaps||0,
      score:person.match_score,
      avatar_url:person.avatar_url,
      preview:false
    })));
   }
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

 async function loadBookings(){
  if(!token && !localStorage.getItem("skillswap_access")) return;
  try{
   const res=await api("/bookings/");
   if(res.ok) setBookings(await res.json());
  }catch{}
 }

 async function loadConversations(){
  if(!token && !localStorage.getItem("skillswap_access")) return;
  try{
   const res=await api("/messages/conversations/");
   if(res.ok) setConversations(await res.json());
  }catch{}
 }

 async function openChat(swapId){
  try{
   const res=await api("/messages/swaps/"+swapId+"/");
   const data=await res.json();
   if(!res.ok){
    setNotice(data.detail||"Chat is not available for this swap yet.");
    return;
   }
   setActiveConversation(data.conversation);
   setChatMessages(data.messages||[]);
   setChatDraft("");
   setChatOpen(true);
   loadConversations();
  }catch{
   setNotice("Could not open chat.");
  }
 }

 async function refreshActiveChat(){
  if(!activeConversation?.swap) return;
  try{
   const res=await api("/messages/swaps/"+activeConversation.swap+"/");
   if(res.ok){
    const data=await res.json();
    setActiveConversation(data.conversation);
    setChatMessages(data.messages||[]);
    loadConversations();
   }
  }catch{}
 }

 async function openWorkspace(bookingId){
  try{
   const res=await api("/workspaces/bookings/"+bookingId+"/");
   const data=await res.json();
   if(!res.ok){
    setNotice(data.detail||"Could not open workspace.");
    return;
   }
   setWorkspace(data);
   setWorkspaceForm({
    goals:data.goals||"",
    lesson_plan:data.lesson_plan||"",
    shared_notes:data.shared_notes||"",
    progress_percentage:data.progress_percentage||0
   });
   setWorkspaceResourceForm({title:"",url:"",kind:"link"});
   setWorkspaceChecklistText("");
   setWorkspaceOpen(true);
  }catch{
   setNotice("Could not open workspace.");
  }
 }

 async function refreshWorkspace(){
  if(!workspace?.booking) return;
  const res=await api("/workspaces/bookings/"+workspace.booking+"/");
  if(res.ok) setWorkspace(await res.json());
 }

 async function saveWorkspace(){
  if(!workspace?.booking) return;
  setWorkspaceSaving(true);
  try{
   const res=await api("/workspaces/bookings/"+workspace.booking+"/",{
    method:"PATCH",body:JSON.stringify(workspaceForm)
   });
   const data=await res.json();
   if(!res.ok){ setNotice(data.detail||"Could not save workspace."); return; }
   setWorkspace(data);
   setWorkspaceForm({
    goals:data.goals||"",lesson_plan:data.lesson_plan||"",
    shared_notes:data.shared_notes||"",progress_percentage:data.progress_percentage||0
   });
   setNotice("Workspace saved.");
  }finally{ setWorkspaceSaving(false); }
 }

 async function addWorkspaceResource(){
  if(!workspace?.booking || !workspaceResourceForm.title.trim() || !workspaceResourceForm.url.trim()) return;
  const res=await api("/workspaces/bookings/"+workspace.booking+"/resources/",{
   method:"POST",body:JSON.stringify(workspaceResourceForm)
  });
  if(res.ok){
   setWorkspaceResourceForm({title:"",url:"",kind:"link"});
   await refreshWorkspace();
  }else{
   const data=await res.json().catch(()=>({}));
   setNotice(data.detail||Object.values(data).flat().join(" ")||"Could not add resource.");
  }
 }

 async function deleteWorkspaceResource(id){
  const res=await api("/workspaces/resources/"+id+"/",{method:"DELETE"});
  if(res.ok) await refreshWorkspace();
 }

 async function addWorkspaceChecklist(){
  if(!workspace?.booking || !workspaceChecklistText.trim()) return;
  const res=await api("/workspaces/bookings/"+workspace.booking+"/checklist/",{
   method:"POST",body:JSON.stringify({text:workspaceChecklistText.trim()})
  });
  if(res.ok){
   setWorkspaceChecklistText("");
   await refreshWorkspace();
  }
 }

 async function toggleWorkspaceChecklist(item){
  const res=await api("/workspaces/checklist/"+item.id+"/",{
   method:"PATCH",body:JSON.stringify({is_done:!item.is_done})
  });
  if(res.ok) await refreshWorkspace();
 }

 async function deleteWorkspaceChecklist(id){
  const res=await api("/workspaces/checklist/"+id+"/",{method:"DELETE"});
  if(res.ok) await refreshWorkspace();
 }

 async function sendChatMessage(){
  if(!activeConversation?.swap || !chatDraft.trim()) return;
  setChatSending(true);
  try{
   const res=await api("/messages/swaps/"+activeConversation.swap+"/",{
    method:"POST",
    body:JSON.stringify({body:chatDraft.trim()})
   });
   const data=await res.json();
   if(!res.ok){
    setNotice(data.detail||"Could not send message.");
    return;
   }
   setChatMessages(prev=>[...prev,data]);
   setChatDraft("");
   loadConversations();
  }catch{
   setNotice("Could not send message.");
  }finally{
   setChatSending(false);
  }
 }

 function openSchedule(swap){
  setSelectedSwap(swap);
  setBookingForm({
   starts_at:"",
   duration_minutes:"60",
   mode:"online",
   meeting_link:"",
   location_note:"",
   note:""
  });
  setScheduleOpen(true);
 }

 async function submitBooking(e){
  e.preventDefault();
  if(!selectedSwap) return;
  const startsAt=new Date(bookingForm.starts_at);
  if(Number.isNaN(startsAt.getTime())){
   setNotice("Choose a valid date and time.");
   return;
  }
  const payload={
   swap:selectedSwap.id,
   starts_at:startsAt.toISOString(),
   duration_minutes:Number(bookingForm.duration_minutes),
   mode:bookingForm.mode,
   meeting_link:bookingForm.mode==="online"?bookingForm.meeting_link:"",
   location_note:bookingForm.mode==="in_person"?bookingForm.location_note:"",
   note:bookingForm.note
  };
  const res=await api("/bookings/",{method:"POST",body:JSON.stringify(payload)});
  if(res.ok){
   const created=await res.json();
   setBookings(prev=>[...prev.filter(b=>b.swap!==created.swap),created]);
   setScheduleOpen(false);
   setSelectedSwap(null);
   setNotice("Session scheduled 📅");
   setTimeout(()=>document.getElementById("bookings")?.scrollIntoView({behavior:"smooth"}),50);
  }else{
   const data=await res.json().catch(()=>({}));
   const details=Object.values(data).flat().join(" ");
   setNotice(details||"Could not schedule the session.");
  }
 }

 function openReview(booking){
  setReviewBooking(booking);
  setReviewForm({
   overall_rating:5,
   teaching_quality:5,
   communication:5,
   reliability:5,
   friendliness:5,
   would_swap_again:true,
   comment:""
  });
  setReviewOpen(true);
 }

 async function submitReview(){
  if(!reviewBooking) return;
  setReviewSaving(true);
  try{
   const res=await api("/reviews/",{
    method:"POST",
    body:JSON.stringify({booking:reviewBooking.id,...reviewForm})
   });
   const data=await res.json();
   if(!res.ok){
    setNotice(data.detail||Object.values(data).flat().join(" ")||"Could not submit review.");
    return;
   }
   setBookings(prev=>prev.map(b=>b.id===reviewBooking.id
    ? {...b,review_status:{can_review:false,reviewed:true}}
    : b
   ));
   setReviewOpen(false);
   setReviewBooking(null);
   setNotice("Review submitted ⭐");
   await loadMe();
   await loadSwaps();
  }finally{
   setReviewSaving(false);
  }
 }

 async function handleBookingAction(id, action){
  const res=await api("/bookings/"+id+"/"+action+"/",{method:"POST"});
  if(res.ok){
   const updated=await res.json();
   setBookings(prev=>prev.map(b=>b.id===id?updated:b));
   if(action==="complete"){
    await loadSwaps();
    await loadMe();
    setNotice("Session completed 🎉");
    openReview(updated);
   }else{
    setNotice("Booking cancelled.");
   }
  }else{
   const data=await res.json().catch(()=>({}));
   setNotice(data.detail||"Could not update booking.");
  }
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
  setToken(""); setUser(null); setMySkills([]); setSwaps([]); setBookings([]); setConversations([]); setChatOpen(false); setActiveConversation(null); setChatMessages([]); setWorkspaceOpen(false); setWorkspace(null); setReviewOpen(false); setReviewBooking(null); setMatches(communityUsers.map(person=>({...person,name:person.name,teaches:person.teach_skills?.map(s=>s.name).join(", ")||"No teaching skills yet",wants:person.learn_skills?.map(s=>s.name).join(", ")||"No learning skills yet",rating:person.average_rating||0,swaps:person.completed_swaps||0,score:person.match_score,avatar_url:person.avatar_url,preview:false})));
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
   setMatches(communityUsers.map(person=>({
    ...person,
    name:person.name,
    teaches:person.teach_skills?.map(s=>s.name).join(", ")||"No teaching skills yet",
    wants:person.learn_skills?.map(s=>s.name).join(", ")||"No learning skills yet",
    rating:person.average_rating||0,
    swaps:person.completed_swaps||0,
    score:person.match_score,
    avatar_url:person.avatar_url,
    preview:false
   })));
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
   if(!data.length){
    setNotice("No compatible users yet. Showing the wider SkillSwap community instead.");
    await loadCommunityUsers();
   }
  }
 }

 function openProposal(match){
  if(!token){ setAuthMode("login"); setAuthOpen(true); return; }
  if(match.preview){ setNotice("Preview card only. Add your skills and click Find my match to get real users."); setSkillsOpen(true); return; }

  const mutualOffer=match.i_teach_them?.[0];
  const mutualRequest=match.they_teach_me?.[0];

  if(!mutualOffer || !mutualRequest){
   setNotice("This is a one-way match. Add a skill they want before proposing a swap.");
   setSkillsOpen(true);
   return;
  }

  setSelectedMatch(match);
  setProposalForm({
   offered_skill:String(mutualOffer.id),
   requested_skill:String(mutualRequest.id),
   message:"Hey! I’d love to swap skills with you."
  });
  setProposalOpen(true);
 }

 async function submitProposal(e){
  e.preventDefault();

  if(!selectedMatch || !proposalForm.offered_skill || !proposalForm.requested_skill){
   setNotice("Choose a valid two-way skill exchange before sending.");
   return;
  }

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
    {user && <a href="#bookings">Bookings</a>}
    {user && <button className="nav-message-button" onClick={()=>{
      const first=conversations[0];
      if(first) openChat(first.swap);
      else setNotice("Your messages will appear after you accept a SkillSwap.");
    }}>
      Messages
      {conversations.reduce((sum,c)=>sum+(c.unread_count||0),0)>0 &&
        <span>{conversations.reduce((sum,c)=>sum+(c.unread_count||0),0)}</span>}
    </button>}
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

   <div className="match-showcase-hero">
    <div className="msh-ambient msh-ambient-left"></div>
    <div className="msh-ambient msh-ambient-right"></div>
    <div className="msh-orbit msh-orbit-1"></div>
    <div className="msh-orbit msh-orbit-2"></div>
    <div className="msh-orbit msh-orbit-3"></div>

    <button className="msh-chip msh-chip-react" onClick={()=>setTeach("React")}><span>⚛️</span> React</button>
    <button className="msh-chip msh-chip-guitar" onClick={()=>setLearn("Guitar")}><span>🎸</span> Guitar</button>
    <button className="msh-chip msh-chip-design" onClick={()=>setLearn("UI/UX Design")}><span>✦</span> Design</button>
    <button className="msh-chip msh-chip-django" onClick={()=>setTeach("Django")}><span>🌿</span> Django</button>

    <div className="msh-profile-wrap msh-profile-left">
      <article className="msh-profile-card msh-card-purple">
        <div className="msh-photo-wrap">
          <span className="msh-online"><i></i> Online</span>
          <img
            className="msh-photo"
            src={user?.profile?.avatar_url || "https://i.pravatar.cc/600?img=47"}
            alt=""
          />
        </div>
        <div className="msh-profile-info">
          <div className="msh-name-row">
            <div>
              <h3>{user ? ((user.first_name||user.username)+(user.last_name?" "+user.last_name:"")) : "Ava Chen"}</h3>
              <p>Software Developer</p>
            </div>
            <span className="msh-verified">✓</span>
          </div>
          <div className="msh-stats">
            <span>⭐ {user?.profile?.average_rating || "4.9"}</span>
            <span>↻ {user?.profile?.completed_swaps || 24} swaps</span>
          </div>
          <button className={"msh-skill-card " + teachVisual.className} onClick={openSkills}>
            <span>{teachVisual.icon}</span>
            <div><small>Teaches</small><strong>{teach || "Python"}</strong></div>
          </button>
        </div>
      </article>
      <div className="msh-podium msh-podium-purple"></div>
    </div>

    <div className="msh-center">
      <div className="msh-arc msh-arc-top"></div>
      <div className="msh-arc msh-arc-bottom"></div>
      <div className="msh-flying-skill msh-flying-top"><span>{teachVisual.icon}</span><b>{teach || "Python"}</b><em>→</em></div>
      <div className="msh-flying-skill msh-flying-bottom"><em>←</em><span>{learnVisual.icon}</span><b>{learn || "Photography"}</b></div>

      <div className="msh-match-core">
        <div className="msh-core-glow"></div>
        <strong>96%</strong>
        <span>MATCH</span>
        <small>{teach || "Python"} ↔ {learn || "Photography"}</small>
      </div>
    </div>

    <div className="msh-profile-wrap msh-profile-right">
      <article className="msh-profile-card msh-card-orange">
        <div className="msh-photo-wrap">
          <span className="msh-online"><i></i> Online</span>
          <img className="msh-photo" src="https://i.pravatar.cc/600?img=32" alt="" />
        </div>
        <div className="msh-profile-info">
          <div className="msh-name-row">
            <div>
              <h3>Maya Ortiz</h3>
              <p>Creative Photographer</p>
            </div>
            <span className="msh-verified">✓</span>
          </div>
          <div className="msh-stats">
            <span>⭐ 4.9</span>
            <span>↻ 42 swaps</span>
          </div>
          <button className={"msh-skill-card " + learnVisual.className} onClick={openSkills}>
            <span>{learnVisual.icon}</span>
            <div><small>Teaches</small><strong>{learn || "Photography"}</strong></div>
          </button>
        </div>
      </article>
      <div className="msh-podium msh-podium-orange"></div>
    </div>
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
    <div className="profile-reputation-wrap">
      <div className="profile-meta">
        <span>📍 {user.profile?.location||"Location not set"}</span>
        <span>🔄 {user.profile?.session_preference||"both"}</span>
        <span>⭐ {user.profile?.average_rating||"0.00"} · {user.profile?.review_count||0} reviews</span>
        <span>🎓 {teachSkills.length} teaching</span>
        <span>🌱 {learnSkills.length} learning</span>
        <span>🤝 {user.profile?.completed_swaps||0} completed</span>
      </div>

      {(user.profile?.review_count||0)>0 && <div className="profile-reputation-card">
        <div className="rep-score">
          <strong>{Number(user.profile?.average_rating||0).toFixed(1)}</strong>
          <span>★ reputation</span>
        </div>
        <div className="rep-metrics">
          <span><small>Teaching</small><b>{Number(user.profile?.teaching_rating||0).toFixed(1)}</b></span>
          <span><small>Communication</small><b>{Number(user.profile?.communication_rating||0).toFixed(1)}</b></span>
          <span><small>Reliability</small><b>{Number(user.profile?.reliability_rating||0).toFixed(1)}</b></span>
          <span><small>Friendliness</small><b>{Number(user.profile?.friendliness_rating||0).toFixed(1)}</b></span>
        </div>
        <div className="rep-footer">
          <b>{user.profile?.would_swap_again_percent||0}%</b>
          <span>would SkillSwap again</span>
        </div>
        <div className="rep-badges">
          {(user.profile?.completed_swaps||0)>=1 && <span>🤝 First Swap</span>}
          {(user.profile?.review_count||0)>=3 && Number(user.profile?.teaching_rating||0)>=4.5 && <span>🎓 Great Teacher</span>}
          {(user.profile?.review_count||0)>=3 && Number(user.profile?.reliability_rating||0)>=4.5 && <span>🛡️ Reliable Swapper</span>}
          {(user.profile?.review_count||0)>=3 && Number(user.profile?.communication_rating||0)>=4.5 && <span>💬 Great Communicator</span>}
          {(user.profile?.review_count||0)>=5 && Number(user.profile?.average_rating||0)>=4.7 && <span>⭐ Community Favorite</span>}
          {(user.profile?.completed_swaps||0)>=10 && <span>🏆 10+ Swaps</span>}
        </div>
      </div>}
    </div>
  </section>}

  <section id="discover" className="section">
   <div className="heading">
    <div><div className="eyebrow">SMART MATCHING</div><h2>{searched?"Your compatible SkillSwaps":"Meet your next SkillSwap"}</h2></div>
    <button className="outline" onClick={openSkills}>Explore all skills ↗</button>
   </div>

   {matches.length ? <div className="cards">{matches.map((m,i)=>{
    const initials=(m.name||m.username||"SS").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
    const hasMutual=!!(m.i_teach_them?.length && m.they_teach_me?.length);
    const hasAnyMatch=(m.score||0)>0;
    return <article className="card community-person-card glass" key={(m.user_id||m.name)+"-"+i}>
      <div className="community-card-top">
        <div className="community-avatar-wrap">
          {m.avatar_url
            ? <img className="community-avatar-img" src={m.avatar_url} alt="" />
            : <div className="community-avatar-fallback">{initials}</div>}
        </div>
        <div className="community-card-head">
          <h3>{m.name}</h3>
          {m.location && <small>📍 {m.location}</small>}
        </div>
        {m.score!==null && m.score!==undefined
          ? <span className={"community-match-pill "+(m.score>=100?"strong":m.score>0?"partial":"none")}>{m.score}% match</span>
          : <span className="community-match-pill community">Community</span>}
      </div>

      <div className="community-skill-block">
        <span>Can teach</span>
        <b>{m.teaches}</b>
      </div>
      <div className="community-skill-block">
        <span>Wants to learn</span>
        <b>{m.wants}</b>
      </div>

      <div className="community-card-footer">
        <small>⭐ {Number(m.rating||0).toFixed(1)} · {m.review_count||0} reviews · {m.swaps||0} swaps</small>
        {user
          ? hasMutual
            ? <button className="primary mini" onClick={()=>openProposal(m)}>Propose swap ↗</button>
            : hasAnyMatch
              ? <button className="outline mini partial-match-button" onClick={()=>openProposal(m)}>One-way match</button>
              : <button className="outline mini" onClick={()=>setNotice(m.name+" is in the community, but your skills do not overlap yet.")}>View member</button>
          : <button className="primary mini" onClick={()=>{setAuthMode("login");setAuthOpen(true)}}>Log in to connect</button>}
      </div>
    </article>
   })}</div> :
   <div className="empty-state glass"><div>🧭</div><h3>No matches yet</h3><p>Add more teach/learn skills to improve your chances.</p><button className="primary" onClick={()=>setSkillsOpen(true)}>Add skills</button></div>}
  </section>

  {user && <RequestsPanel swaps={swaps} bookings={bookings} currentUserId={user.id} currentUser={user} onAction={handleSwapAction} onSchedule={openSchedule} onMessage={openChat} />}

  {user && <BookingsPanel bookings={bookings} currentUser={user} onAction={handleBookingAction} onMessage={openChat} onWorkspace={openWorkspace} onReview={openReview} />}

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

  {scheduleOpen && selectedSwap && <ScheduleSwapModal
    swap={selectedSwap}
    form={bookingForm}
    setForm={setBookingForm}
    onClose={()=>{setScheduleOpen(false);setSelectedSwap(null)}}
    onSubmit={submitBooking}
  />}

  <ReviewModal
    booking={reviewOpen ? reviewBooking : null}
    form={reviewForm}
    setForm={setReviewForm}
    onClose={()=>{setReviewOpen(false);setReviewBooking(null)}}
    onSubmit={submitReview}
    saving={reviewSaving}
  />

  <WorkspacePanel
    open={workspaceOpen}
    workspace={workspace}
    form={workspaceForm}
    setForm={setWorkspaceForm}
    resourceForm={workspaceResourceForm}
    setResourceForm={setWorkspaceResourceForm}
    checklistText={workspaceChecklistText}
    setChecklistText={setWorkspaceChecklistText}
    onClose={()=>setWorkspaceOpen(false)}
    onSave={saveWorkspace}
    onAddResource={addWorkspaceResource}
    onDeleteResource={deleteWorkspaceResource}
    onAddChecklist={addWorkspaceChecklist}
    onToggleChecklist={toggleWorkspaceChecklist}
    onDeleteChecklist={deleteWorkspaceChecklist}
    saving={workspaceSaving}
  />

  <ChatPanel
    open={chatOpen}
    conversation={activeConversation}
    messages={chatMessages}
    currentUserId={user?.id}
    draft={chatDraft}
    setDraft={setChatDraft}
    onClose={()=>setChatOpen(false)}
    onSend={sendChatMessage}
    onRefresh={refreshActiveChat}
    sending={chatSending}
    booking={activeConversation ? bookings.find(b=>b.swap===activeConversation.swap && b.status==="scheduled") : null}
  />

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
