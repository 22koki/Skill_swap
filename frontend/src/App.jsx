import { useEffect, useMemo, useRef, useState } from "react";
import RequestsPanel from "./RequestsPanel";
import BookingsPanel from "./BookingsPanel";
import ScheduleSwapModal from "./ScheduleSwapModal";
import RescheduleModal from "./RescheduleModal";
import CalendarPanel from "./CalendarPanel";
import ChatPanel from "./ChatPanel";
import WorkspacePanel from "./WorkspacePanel";
import ReviewModal from "./ReviewModal";
import SkillPassport from "./SkillPassport";
import AvailabilityModal from "./AvailabilityModal";
import SmartMatchCard from "./SmartMatchCard";
import ProgressionPanel from "./ProgressionPanel";
import AchievementUnlock from "./AchievementUnlock";
import NotificationCenter from "./NotificationCenter";
import SkillNetwork from "./SkillNetwork";
import SkillCircles from "./SkillCircles";
import UniversalSearch from "./UniversalSearch";
import ReportModal from "./ReportModal";
import SafetyCenter from "./SafetyCenter";
import HomeDashboard from "./HomeDashboard";
import SavedPanel from "./SavedPanel";
import LearningGoals from "./LearningGoals";
import { getSkillVisual } from "./skillVisuals";

const API = "http://127.0.0.1:8000/api";
const WS_BASE = API.replace(/^http/,"ws").replace(/\/api$/,"");
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
 const [scheduleSuggestions,setScheduleSuggestions]=useState([]);
 const [scheduleSuggestionsLoading,setScheduleSuggestionsLoading]=useState(false);
 const [scheduleAvailabilityComplete,setScheduleAvailabilityComplete]=useState(false);
 const [scheduleError,setScheduleError]=useState("");
 const [rescheduleOpen,setRescheduleOpen]=useState(false);
 const [rescheduleBooking,setRescheduleBooking]=useState(null);
 const [rescheduleSuggestions,setRescheduleSuggestions]=useState([]);
 const [rescheduleSuggestionsLoading,setRescheduleSuggestionsLoading]=useState(false);
 const [rescheduleForm,setRescheduleForm]=useState({
  starts_at:"",
  duration_minutes:"60",
  mode:"online",
  meeting_link:"",
  location_note:"",
  note:""
 });
 const [calendarOpen,setCalendarOpen]=useState(false);
 const [calendarEvents,setCalendarEvents]=useState([]);
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
 const [chatPartnerTyping,setChatPartnerTyping]=useState(false);
 const [chatPartnerOnline,setChatPartnerOnline]=useState(false);
 const [chatPartnerLastSeen,setChatPartnerLastSeen]=useState(null);
 const [presenceByUser,setPresenceByUser]=useState({});
 const activitySocketRef=useRef(null);
 const chatSocketRef=useRef(null);
 const circleSocketRef=useRef(null);
 const typingTimerRef=useRef(null);
 const circleTypingTimerRef=useRef(null);
 const [workspaceOpen,setWorkspaceOpen]=useState(false);
 const [workspace,setWorkspace]=useState(null);
 const [workspaceForm,setWorkspaceForm]=useState({goals:"",lesson_plan:"",shared_notes:"",progress_percentage:0});
 const [workspaceResourceForm,setWorkspaceResourceForm]=useState({title:"",url:"",kind:"link"});
 const [workspaceChecklistText,setWorkspaceChecklistText]=useState("");
 const [workspaceSaving,setWorkspaceSaving]=useState(false);
 const [workspaceAISetup,setWorkspaceAISetup]=useState({
  goal:"",
  learner_level:"beginner",
  learning_style:"step_by_step",
  session_count:3
 });
 const [workspaceAIGenerating,setWorkspaceAIGenerating]=useState(false);
 const [workspaceAIAddingChecklist,setWorkspaceAIAddingChecklist]=useState(false);
 const [workspaceAISavingPlan,setWorkspaceAISavingPlan]=useState(false);
 const [recapReflection,setRecapReflection]=useState("");
 const [recapChallenge,setRecapChallenge]=useState("");
 const [recapConfidence,setRecapConfidence]=useState(3);
 const [recapGenerating,setRecapGenerating]=useState(false);
 const [recapAddingChecklist,setRecapAddingChecklist]=useState(false);
 const [reviewOpen,setReviewOpen]=useState(false);
 const [reviewBooking,setReviewBooking]=useState(null);
 const [reviewSaving,setReviewSaving]=useState(false);
 const [passportOpen,setPassportOpen]=useState(false);
 const [passport,setPassport]=useState(null);
 const [passportLoading,setPassportLoading]=useState(false);
 const [availabilityOpen,setAvailabilityOpen]=useState(false);
 const [availabilitySlots,setAvailabilitySlots]=useState([]);
 const [availabilitySaving,setAvailabilitySaving]=useState(false);
 const [progression,setProgression]=useState(null);
 const [progressionOpen,setProgressionOpen]=useState(false);
 const [achievementUnlock,setAchievementUnlock]=useState(null);
 const [notificationOpen,setNotificationOpen]=useState(false);
 const [notifications,setNotifications]=useState([]);
 const [notificationUnread,setNotificationUnread]=useState(0);
 const [notificationPreferences,setNotificationPreferences]=useState({
  swaps:true,messages:true,sessions:true,reviews:true,progress:true,matches:true
 });
 const [networkOpen,setNetworkOpen]=useState(false);
 const [networkData,setNetworkData]=useState(null);
 const [networkLoading,setNetworkLoading]=useState(false);
 const [savedOpen,setSavedOpen]=useState(false);
 const [goalsOpen,setGoalsOpen]=useState(false);
 const [bookmarks,setBookmarks]=useState([]);
 const [bookmarkCollections,setBookmarkCollections]=useState([]);
 const [circlesOpen,setCirclesOpen]=useState(false);
 const [circles,setCircles]=useState([]);
 const [circlesLoading,setCirclesLoading]=useState(false);
 const [activeCircle,setActiveCircle]=useState(null);
 const [circleMessages,setCircleMessages]=useState([]);
 const [circleFocusId,setCircleFocusId]=useState(null);
 const [circleOnlineIds,setCircleOnlineIds]=useState([]);
 const [circleTypingUsers,setCircleTypingUsers]=useState([]);
 const [universalSearchOpen,setUniversalSearchOpen]=useState(false);
 const [universalSearchQuery,setUniversalSearchQuery]=useState("");
 const [universalSearchData,setUniversalSearchData]=useState({people:[],skills:[],circles:[],mentors:[],counts:{}});
 const [universalSearchLoading,setUniversalSearchLoading]=useState(false);
 const [safetyOpen,setSafetyOpen]=useState(false);
 const [safetyData,setSafetyData]=useState(null);
 const [safetyLoading,setSafetyLoading]=useState(false);
 const [moderationQueue,setModerationQueue]=useState([]);
 const [moderationLoading,setModerationLoading]=useState(false);
 const [reportTarget,setReportTarget]=useState(null);
 const [reportSaving,setReportSaving]=useState(false);
 const [reportForm,setReportForm]=useState({reason:"harassment",details:""});
 const [dashboardData,setDashboardData]=useState(null);
 const [dashboardLoading,setDashboardLoading]=useState(false);
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
 useEffect(()=>{ if(token){ loadMe(); loadMySkills(); loadSwaps(); loadBookings(); loadConversations(); loadAvailability(); loadCommunityUsers(); loadProgression(false); loadNotifications(); loadNotificationPreferences(); loadDashboard(); loadBookmarks(); } },[token]);
 useEffect(()=>{
  if(!token) return;
  const id=setInterval(()=>loadNotifications(false),60000);
  return ()=>clearInterval(id);
 },[token]);

 useEffect(()=>{
  if(!token) return;
  let disposed=false;
  let retryTimer=null;

  function connect(){
   const access=localStorage.getItem("skillswap_access")||token;
   if(!access||disposed) return;
   const socket=new WebSocket(WS_BASE+"/ws/activity/?token="+encodeURIComponent(access));
   activitySocketRef.current=socket;

   socket.onmessage=event=>{
    let data;
    try{data=JSON.parse(event.data)}catch{return}
    if(data.event==="notification"&&data.notification){
     const item=data.notification;
     setNotifications(prev=>{
      const exists=prev.some(n=>n.id===item.id);
      if(!exists&&!item.is_read) setNotificationUnread(count=>count+1);
      return [item,...prev.filter(n=>n.id!==item.id)];
     });
     setNotice(item.title+(item.body?" · "+item.body:""));
     loadConversations();
     if(item.action_type==="booking") loadBookings();
     if(item.action_type==="swap") loadSwaps();
     loadDashboard();
    }
    if(data.event==="presence"&&data.presence){
     const p=data.presence;
     setPresenceByUser(prev=>({...prev,[p.user_id]:p}));
    }
   };
   socket.onclose=()=>{
    if(activitySocketRef.current===socket) activitySocketRef.current=null;
    if(!disposed) retryTimer=setTimeout(connect,2500);
   };
  }

  connect();
  return ()=>{
   disposed=true;
   if(retryTimer) clearTimeout(retryTimer);
   activitySocketRef.current?.close();
   activitySocketRef.current=null;
  };
 },[token]);

 useEffect(()=>{
  if(!activeConversation?.partner_id) return;
  const presence=presenceByUser[activeConversation.partner_id];
  if(presence){
   setChatPartnerOnline(!!presence.online);
   setChatPartnerLastSeen(presence.last_seen||null);
  }
 },[activeConversation?.partner_id,presenceByUser]);

 useEffect(()=>{
  if(!chatOpen||!activeConversation?.partner_id) return;
  if(activitySocketRef.current?.readyState===WebSocket.OPEN){
   activitySocketRef.current.send(JSON.stringify({event:"presence_query",user_id:activeConversation.partner_id}));
  }
 },[activeConversation?.partner_id,chatOpen]);

 useEffect(()=>{
  if(!chatOpen||!activeConversation?.swap||!token) return;
  let disposed=false;
  let retryTimer=null;
  setChatPartnerTyping(false);

  function connectChat(){
   if(disposed) return;
   const access=localStorage.getItem("skillswap_access")||token;
   const socket=new WebSocket(WS_BASE+"/ws/chat/"+activeConversation.swap+"/?token="+encodeURIComponent(access));
   chatSocketRef.current=socket;

   socket.onopen=()=>{
    socket.send(JSON.stringify({event:"read"}));
    activitySocketRef.current?.send(JSON.stringify({event:"presence_query",user_id:activeConversation.partner_id}));
   };
   socket.onmessage=event=>{
    let data;
    try{data=JSON.parse(event.data)}catch{return}
    if(data.event==="message"&&data.message){
     setChatMessages(prev=>prev.some(m=>m.id===data.message.id)?prev:[...prev,data.message]);
     if(data.message.sender!==user?.id&&socket.readyState===WebSocket.OPEN){
      socket.send(JSON.stringify({event:"read"}));
     }
     loadConversations();
    }else if(data.event==="typing"){
     setChatPartnerTyping(!!data.typing);
    }else if(data.event==="presence"){
     setChatPartnerOnline(!!data.online);
    }else if(data.event==="read"){
     const ids=new Set(data.message_ids||[]);
     setChatMessages(prev=>prev.map(m=>ids.has(m.id)?{...m,read_at:data.read_at}:m));
     loadConversations();
    }else if(data.event==="blocked"){
     setNotice(data.detail||"This chat is no longer available.");
     setChatOpen(false);
     setActiveConversation(null);
     setChatMessages([]);
    }
   };
   socket.onclose=()=>{
    if(chatSocketRef.current===socket) chatSocketRef.current=null;
    if(!disposed) retryTimer=setTimeout(connectChat,1800);
   };
  }

  connectChat();
  return ()=>{
   disposed=true;
   if(retryTimer) clearTimeout(retryTimer);
   chatSocketRef.current?.close();
   chatSocketRef.current=null;
   setChatPartnerTyping(false);
  };
 },[chatOpen,activeConversation?.swap,token]);

 useEffect(()=>{
  if(!circlesOpen||!activeCircle?.id||!activeCircle?.membership||!token) return;
  let disposed=false;
  let retryTimer=null;
  setCircleOnlineIds([]);
  setCircleTypingUsers([]);

  function connectCircle(){
   if(disposed) return;
   const access=localStorage.getItem("skillswap_access")||token;
   const socket=new WebSocket(WS_BASE+"/ws/circles/"+activeCircle.id+"/?token="+encodeURIComponent(access));
   circleSocketRef.current=socket;

   socket.onmessage=event=>{
    let data;
    try{data=JSON.parse(event.data)}catch{return}
    if(data.event==="message"&&data.message){
     setCircleMessages(prev=>prev.some(m=>m.id===data.message.id)?prev:[...prev,data.message]);
    }else if(data.event==="presence"){
     setCircleOnlineIds(prev=>{
      const next=new Set(prev);
      if(data.online) next.add(data.user_id); else next.delete(data.user_id);
      return Array.from(next);
     });
    }else if(data.event==="typing"){
     setCircleTypingUsers(prev=>{
      const others=prev.filter(item=>item.user_id!==data.user_id);
      return data.typing?[...others,{user_id:data.user_id,name:data.user_name}]:others;
     });
    }
   };
   socket.onclose=()=>{
    if(circleSocketRef.current===socket) circleSocketRef.current=null;
    if(!disposed) retryTimer=setTimeout(connectCircle,1800);
   };
  }

  connectCircle();
  return ()=>{
   disposed=true;
   if(retryTimer) clearTimeout(retryTimer);
   circleSocketRef.current?.close();
   circleSocketRef.current=null;
   setCircleOnlineIds([]);
   setCircleTypingUsers([]);
  };
 },[circlesOpen,activeCircle?.id,activeCircle?.membership?.id,token]);

 useEffect(()=>{
  if(!universalSearchOpen) return;
  const id=setTimeout(()=>runUniversalSearch(universalSearchQuery),220);
  return ()=>clearTimeout(id);
 },[universalSearchQuery,universalSearchOpen]);

 useEffect(()=>{
  const onKey=e=>{
   if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="k"){
    e.preventDefault();
    openUniversalSearch();
   }
  };
  window.addEventListener("keydown",onKey);
  return ()=>window.removeEventListener("keydown",onKey);
 },[]);

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

 async function loadBookmarks(){
  if(!localStorage.getItem("skillswap_access")&&!token)return;
  try{
   const [saved,folders]=await Promise.all([api("/bookmarks/"),api("/bookmarks/collections/")]);
   if(saved.ok&&folders.ok){
    setBookmarks(await saved.json());
    setBookmarkCollections(await folders.json());
   }
  }catch(err){console.error("Could not load bookmarks",err)}
 }
 async function bookmarkAction(method,path,body){
  const res=await api(path,{method,...(body?{body:JSON.stringify(body)}:{})});
  if(!res.ok){
   const data=await res.json().catch(()=>({}));
   throw new Error(data.detail||data.non_field_errors?.[0]||"Bookmark action failed.");
  }
  await loadBookmarks();
 }
 async function saveBookmark(target_type,target_id){
  if(!user){setAuthMode("login");setAuthOpen(true);return}
  await bookmarkAction("POST","/bookmarks/",{target_type,target_id});
  setNotice("Added to your saved library ♥");
 }
 async function removeBookmark(id){
  await bookmarkAction("DELETE","/bookmarks/"+id+"/");
  setNotice("Bookmark removed.");
 }
 async function assignBookmark(item,collectionId){
  const ids=item.collection_ids.includes(collectionId)
   ?item.collection_ids.filter(id=>id!==collectionId)
   :[...item.collection_ids,collectionId];
  await bookmarkAction("PATCH","/bookmarks/"+item.id+"/",{collection_ids:ids});
 }
 const bookmarkProps={bookmarks,collections:bookmarkCollections,onSave:saveBookmark,onRemove:removeBookmark,onAssign:assignBookmark};
 
 async function loadCatalog(){
  try{
   const res=await fetch(API+"/skills/");
   if(res.ok) setCatalog(await res.json());
  }catch{}
 }

 async function loadDashboard(){
  if(!token && !localStorage.getItem("skillswap_access")) return;
  setDashboardLoading(true);
  try{
   const res=await api("/auth/dashboard/");
   if(res.ok) setDashboardData(await res.json());
  }catch{}finally{
   setDashboardLoading(false);
  }
 }

 async function loadCommunityUsers(){
  try{
   const access=localStorage.getItem("skillswap_access")||"";
   const headers=access?{Authorization:"Bearer "+access}:{};
   const res=await fetch(API+"/auth/community/",{headers});
   if(res.ok){
    const data=await res.json();
    const normalized=data.map(person=>({
      ...person,
      teaches:person.they_teach_me?.length
        ? person.they_teach_me.map(s=>s.name).join(", ")
        : person.teach_skills?.map(s=>s.name).join(", ")||"No teaching skills yet",
      wants:person.i_teach_them?.length
        ? person.i_teach_them.map(s=>s.name).join(", ")
        : person.learn_skills?.map(s=>s.name).join(", ")||"No learning skills yet",
      rating:person.average_rating||0,
      swaps:person.completed_swaps||0,
      preview:false
    }));
    setCommunityUsers(normalized);
    if(!searched) setMatches(normalized);
   }
  }catch{}
 }

 async function loadSafetyCenter(){
  if(!user) return;
  setSafetyLoading(true);
  try{
   const res=await api("/auth/safety/");
   if(res.ok) setSafetyData(await res.json());
   if(user.is_staff){
    setModerationLoading(true);
    const modRes=await api("/auth/safety/moderation/");
    if(modRes.ok) setModerationQueue(await modRes.json());
    setModerationLoading(false);
   }
  }finally{
   setSafetyLoading(false);
  }
 }

 async function openSafetyCenter(){
  setSafetyOpen(true);
  await loadSafetyCenter();
 }

 function openReport(target){
  if(!user){setAuthMode("login");setAuthOpen(true);return;}
  setReportTarget(target);
  setReportForm({reason:"harassment",details:""});
 }

 async function submitSafetyReport(e){
  e.preventDefault();
  if(!reportTarget) return;
  setReportSaving(true);
  try{
   const res=await api("/auth/safety/reports/",{
    method:"POST",
    body:JSON.stringify({
     target_type:reportTarget.target_type,
     target_id:reportTarget.target_id||null,
     reported_user:reportTarget.reported_user||null,
     reason:reportForm.reason,
     details:reportForm.details
    })
   });
   const data=await res.json().catch(()=>({}));
   if(!res.ok){setNotice(data.detail||"Could not submit report.");return;}
   setReportTarget(null);
   setNotice("Report submitted to SkillSwap Safety 🛡");
   if(safetyOpen) await loadSafetyCenter();
  }finally{setReportSaving(false);}
 }

 async function blockUser(userId){
  if(!userId||userId===user?.id) return;
  const res=await api("/auth/safety/block/"+userId+"/",{method:"POST"});
  const data=await res.json().catch(()=>({}));
  if(!res.ok){setNotice(data.detail||"Could not block this user.");return;}
  setPassportOpen(false);setPassport(null);
  setMatches(prev=>prev.filter(item=>item.user_id!==userId));
  setCommunityUsers(prev=>prev.filter(item=>item.user_id!==userId));
  setConversations(prev=>prev.filter(item=>item.partner_id!==userId));
  if(activeConversation?.partner_id===userId){setChatOpen(false);setActiveConversation(null);setChatMessages([]);}
  setNotice("User blocked. They can no longer directly interact with you.");
  await loadSafetyCenter();
 }

 async function unblockUser(userId){
  const res=await api("/auth/safety/block/"+userId+"/",{method:"DELETE"});
  if(res.ok){
   setNotice("User unblocked.");
   await loadSafetyCenter();
   await loadCommunityUsers();
   await loadDashboard();
  }
 }

 async function moderateReport(id,action){
  const payload=action==="restrict"?{days:7}:{};
  const res=await api("/auth/safety/moderation/"+id+"/"+action+"/",{method:"POST",body:JSON.stringify(payload)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok){setNotice(data.detail||"Could not update report.");return;}
  setModerationQueue(prev=>prev.map(item=>item.id===data.id?data:item));
  setNotice("Moderation action applied.");
 }

 async function moderateCircleMember(circleId,userId,action){
  const res=await api("/circles/"+circleId+"/members/"+userId+"/"+action+"/",{method:"POST"});
  const data=await res.json().catch(()=>({}));
  if(!res.ok){setNotice(data.detail||"Could not moderate member.");return;}
  setActiveCircle(data);
  setCircles(prev=>prev.map(item=>item.id===data.id?data:item));
  setNotice("Circle moderation updated.");
 }

 async function deleteCircleMessage(circleId,messageId){
  const res=await api("/circles/"+circleId+"/messages/"+messageId+"/",{method:"DELETE"});
  if(res.ok){
   setCircleMessages(prev=>prev.filter(item=>item.id!==messageId));
   setNotice("Circle message removed.");
  }
 }

 async function runUniversalSearch(query=""){
  setUniversalSearchLoading(true);
  try{
   const res=await api("/auth/search/?q="+encodeURIComponent(query));
   if(res.ok) setUniversalSearchData(await res.json());
  }finally{
   setUniversalSearchLoading(false);
  }
 }

 async function openUniversalSearch(){
  setUniversalSearchOpen(true);
  await runUniversalSearch("");
 }

 async function handleUniversalPerson(person){
  setUniversalSearchOpen(false);
  await openPassport(person.user_id);
 }

 async function handleUniversalSkill(skill){
  setUniversalSearchOpen(false);
  setTeach(skill.name);
  setLearn(skill.name);
  document.getElementById("discover")?.scrollIntoView({behavior:"smooth"});
  setNotice("Showing SkillSwap around "+skill.name+".");
 }

 async function handleUniversalCircle(circle){
  setUniversalSearchOpen(false);
  setCircleFocusId(circle.id);
  setCirclesOpen(true);
  await loadCircles();
  await openCircle(circle.id);
 }

 async function loadCircles(){
  setCirclesLoading(true);
  try{
   const res=await api("/circles/");
   if(res.ok) setCircles(await res.json());
  }finally{
   setCirclesLoading(false);
  }
 }

 async function openSkillCircles(){
  setCircleFocusId(null);
  setCirclesOpen(true);
  await loadCircles();
 }

 async function openCircle(circleId){
  const res=await api("/circles/"+circleId+"/");
  const data=await res.json();
  if(!res.ok){
   setNotice(data.detail||"Could not open this circle.");
   return;
  }
  setActiveCircle(data);
  if(data.membership){
   const msgRes=await api("/circles/"+circleId+"/messages/");
   if(msgRes.ok) setCircleMessages(await msgRes.json());
   else setCircleMessages([]);
  }else{
   setCircleMessages([]);
  }
 }

 async function createCircle(payload){
  const res=await api("/circles/",{method:"POST",body:JSON.stringify(payload)});
  const data=await res.json();
  if(!res.ok){
   setNotice(data.detail||"Could not create the circle.");
   return false;
  }
  setCircles(prev=>[data,...prev]);
  setActiveCircle(data);
  setNotice("Skill Circle created 👥");
  return true;
 }

 async function joinCircle(circleId,role="learner"){
  if(!user){
   setAuthMode("login");setAuthOpen(true);return;
  }
  const res=await api("/circles/"+circleId+"/join/",{method:"POST",body:JSON.stringify({role})});
  const data=await res.json();
  if(!res.ok){setNotice(data.detail||"Could not join circle.");return;}
  setActiveCircle(data);
  setCircles(prev=>prev.map(c=>c.id===data.id?data:c));
  const msgRes=await api("/circles/"+circleId+"/messages/");
  if(msgRes.ok) setCircleMessages(await msgRes.json());
  setNotice("Joined "+data.title+" ✨");
 }

 async function leaveCircle(circleId){
  const res=await api("/circles/"+circleId+"/leave/",{method:"POST"});
  const data=await res.json();
  if(!res.ok){setNotice(data.detail||"Could not leave circle.");return;}
  setActiveCircle(data);
  setCircles(prev=>prev.map(c=>c.id===data.id?data:c));
  setCircleMessages([]);
  setNotice("You left the circle.");
 }

 async function sendCircleMessage(circleId,body){
  const socket=circleSocketRef.current;
  if(socket&&socket.readyState===WebSocket.OPEN){
   socket.send(JSON.stringify({event:"message",body}));
   return;
  }
  const res=await api("/circles/"+circleId+"/messages/",{method:"POST",body:JSON.stringify({body})});
  if(res.ok){
   const data=await res.json();
   setCircleMessages(prev=>prev.some(m=>m.id===data.id)?prev:[...prev,data]);
  }else{
   const data=await res.json().catch(()=>({}));
   setNotice(data.detail||"Could not send message.");
  }
 }

 function sendCircleTyping(typing){
  const socket=circleSocketRef.current;
  if(socket&&socket.readyState===WebSocket.OPEN){
   socket.send(JSON.stringify({event:"typing",typing}));
   if(circleTypingTimerRef.current) clearTimeout(circleTypingTimerRef.current);
   if(typing) circleTypingTimerRef.current=setTimeout(()=>{
    socket.readyState===WebSocket.OPEN&&socket.send(JSON.stringify({event:"typing",typing:false}));
   },1200);
  }
 }

 async function addCircleTask(circleId,text){
  const res=await api("/circles/"+circleId+"/tasks/",{method:"POST",body:JSON.stringify({text})});
  if(res.ok) await openCircle(circleId);
 }

 async function toggleCircleTask(taskId,is_done){
  const res=await api("/circles/tasks/"+taskId+"/",{method:"PATCH",body:JSON.stringify({is_done})});
  if(res.ok&&activeCircle) await openCircle(activeCircle.id);
 }

 async function addCircleResource(circleId,payload){
  const res=await api("/circles/"+circleId+"/resources/",{method:"POST",body:JSON.stringify(payload)});
  if(res.ok) await openCircle(circleId);
  else{
   const data=await res.json().catch(()=>({}));
   setNotice(data.detail||"Could not share resource.");
  }
 }

 async function scheduleCircleSession(circleId,payload){
  const normalized={...payload,starts_at:new Date(payload.starts_at).toISOString(),duration_minutes:Number(payload.duration_minutes||60)};
  const res=await api("/circles/"+circleId+"/sessions/",{method:"POST",body:JSON.stringify(normalized)});
  if(res.ok){
   await openCircle(circleId);
   setNotice("Group session scheduled 📅");
  }else{
   const data=await res.json().catch(()=>({}));
   setNotice(data.detail||"Could not schedule session.");
  }
 }

 async function generateCircleAIPlan(circleId,payload){
  const res=await api("/circles/"+circleId+"/ai-plan/",{method:"POST",body:JSON.stringify(payload)});
  const data=await res.json();
  if(!res.ok){setNotice(data.detail||"Could not generate the group roadmap.");return;}
  setActiveCircle(data);
  setCircles(prev=>prev.map(c=>c.id===data.id?data:c));
  setNotice(data.ai_plan_source==="openai"?"AI group roadmap generated ✦":"Smart group roadmap generated ✦");
 }

 async function openSkillNetwork(){
  setNetworkOpen(true);
  if(networkData) return;
  setNetworkLoading(true);
  try{
   const res=await api("/auth/network/");
   const data=await res.json();
   if(!res.ok){
    setNotice(data.detail||"Could not load the Skill Network.");
    setNetworkOpen(false);
    return;
   }
   setNetworkData(data);
  }catch{
   setNotice("Could not load the Skill Network.");
   setNetworkOpen(false);
  }finally{
   setNetworkLoading(false);
  }
 }

 async function refreshSkillNetwork(){
  setNetworkLoading(true);
  try{
   const res=await api("/auth/network/");
   if(res.ok) setNetworkData(await res.json());
  }finally{
   setNetworkLoading(false);
  }
 }

 async function loadNotifications(syncUi=true){
  if(!token && !localStorage.getItem("skillswap_access")) return;
  try{
   const res=await api("/notifications/");
   if(!res.ok) return;
   const data=await res.json();
   setNotifications(data.notifications||[]);
   setNotificationUnread(data.unread_count||0);
   if(syncUi && notificationOpen) setNotificationOpen(true);
  }catch{}
 }

 async function loadNotificationPreferences(){
  if(!token && !localStorage.getItem("skillswap_access")) return;
  try{
   const res=await api("/notifications/preferences/");
   if(res.ok) setNotificationPreferences(await res.json());
  }catch{}
 }

 async function markNotificationRead(item){
  if(!item || item.is_read) return;
  const res=await api("/notifications/"+item.id+"/read/",{method:"POST"});
  if(res.ok){
   setNotifications(prev=>prev.map(n=>n.id===item.id?{...n,is_read:true}:n));
   setNotificationUnread(prev=>Math.max(0,prev-1));
  }
 }

 async function markAllNotificationsRead(){
  const res=await api("/notifications/read-all/",{method:"POST"});
  if(res.ok){
   setNotifications(prev=>prev.map(n=>({...n,is_read:true})));
   setNotificationUnread(0);
  }
 }

 async function updateNotificationPreference(key,value){
  setNotificationPreferences(prev=>({...prev,[key]:value}));
  const res=await api("/notifications/preferences/",{
   method:"PATCH",body:JSON.stringify({[key]:value})
  });
  if(!res.ok) setNotificationPreferences(prev=>({...prev,[key]:!value}));
 }

 async function handleNotificationAction(item){
  await markNotificationRead(item);
  setNotificationOpen(false);

  if(item.action_type==="message" && item.target_id){
   await openChat(item.target_id);
   return;
  }
  if(item.action_type==="swap"){
   document.getElementById("requests")?.scrollIntoView({behavior:"smooth"});
   return;
  }
  if(item.action_type==="booking"){
   document.getElementById("bookings")?.scrollIntoView({behavior:"smooth"});
   return;
  }
  if(item.action_type==="progression"){
   await loadProgression(false);
   setProgressionOpen(true);
   return;
  }
  if(item.action_type==="passport"){
   await openPassport(item.target_id||user?.id);
   return;
  }
  if(item.action_type==="review"){
   if(user?.id) await openPassport(user.id);
   return;
  }
  if(item.action_type==="circle" && item.target_id){
   setCirclesOpen(true);
   await loadCircles();
   await openCircle(item.target_id);
  }
 }

 async function loadProgression(checkUnlock=false){
  const currentUser=user;
  const userId=currentUser?.id;
  if(!userId && !localStorage.getItem("skillswap_access")) return;
  try{
   let resolvedId=userId;
   if(!resolvedId){
    const meRes=await api("/auth/me/");
    if(!meRes.ok) return;
    const meData=await meRes.json();
    resolvedId=meData.id;
   }

   const res=await api("/auth/progression/"+resolvedId+"/");
   if(!res.ok) return;
   const data=await res.json();
   setProgression(data);

   const storageKey="skillswap_seen_achievements_"+resolvedId;
   const raw=localStorage.getItem(storageKey);
   const unlockedKeys=(data.unlocked||[]).map(item=>item.key);

   if(raw===null){
    localStorage.setItem(storageKey,JSON.stringify(unlockedKeys));
   }else if(checkUnlock){
    let seen=[];
    try{ seen=JSON.parse(raw)||[]; }catch{}
    const newlyUnlocked=(data.unlocked||[]).filter(item=>!seen.includes(item.key));
    if(newlyUnlocked.length){
     setAchievementUnlock(newlyUnlocked[0]);
     localStorage.setItem(storageKey,JSON.stringify([...new Set([...seen,...unlockedKeys])]));
    }
   }
  }catch{}
 }

 async function loadAvailability(){
  if(!token && !localStorage.getItem("skillswap_access")) return;
  try{
   const res=await api("/auth/availability/");
   if(res.ok){
    const data=await res.json();
    setAvailabilitySlots(data.map(slot=>({
      ...slot,
      start_time:String(slot.start_time).slice(0,5),
      end_time:String(slot.end_time).slice(0,5)
    })));
   }
  }catch{}
 }

 function openAvailability(){
  if(!token){
   setAuthMode("login");
   setAuthOpen(true);
   return;
  }
  setAvailabilityOpen(true);
 }

 async function saveAvailability(){
  setAvailabilitySaving(true);
  try{
   const payload=availabilitySlots.map(slot=>({
    weekday:Number(slot.weekday),
    start_time:String(slot.start_time).slice(0,5),
    end_time:String(slot.end_time).slice(0,5)
   }));
   const res=await api("/auth/availability/",{
    method:"PUT",
    body:JSON.stringify(payload)
   });
   const data=await res.json().catch(()=>[]);
   if(!res.ok){
    setNotice(data.detail||Object.values(data).flat().join(" ")||"Could not save availability.");
    return;
   }
   setAvailabilitySlots(data.map(slot=>({
    ...slot,
    start_time:String(slot.start_time).slice(0,5),
    end_time:String(slot.end_time).slice(0,5)
   })));
   setAvailabilityOpen(false);
   setNotice("Availability saved · match scores refreshed 📅");
   await loadCommunityUsers();
   if(searched && mySkills.length) await findMatches(false);
  }finally{
   setAvailabilitySaving(false);
  }
 }

 async function openPassport(userId){
  setPassportLoading(true);
  try{
   const res=await api("/auth/passports/"+userId+"/");
   const data=await res.json();
   if(!res.ok){
    setNotice(data.detail||"Could not load Skill Passport.");
    return;
   }
   setPassport(data);
   setPassportOpen(true);
  }catch{
   setNotice("Could not load Skill Passport.");
  }finally{
   setPassportLoading(false);
  }
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
   setRecapReflection(data.my_recap?.reflection||"");
   setRecapChallenge(data.my_recap?.challenge||"");
   setRecapConfidence(data.my_recap?.confidence||3);
   setWorkspaceAISetup({
    goal:data.ai_goal||data.goals||"",
    learner_level:data.ai_learner_level||"beginner",
    learning_style:data.ai_learning_style||"step_by_step",
    session_count:data.ai_session_count||3
   });
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

 async function generateWorkspaceAIPlan(){
  if(!workspace?.booking) return;
  setWorkspaceAIGenerating(true);
  try{
   const res=await api("/workspaces/bookings/"+workspace.booking+"/ai-plan/generate/",{
    method:"POST",
    body:JSON.stringify(workspaceAISetup)
   });
   const data=await res.json();
   if(!res.ok){
    setNotice(data.detail||"Could not generate the learning plan.");
    return;
   }
   setWorkspace(data);
   setNotice(data.ai_plan_source==="openai"?"AI learning plan generated ✦":"Smart learning plan generated ✦");
  }catch{
   setNotice("Could not generate the learning plan.");
  }finally{
   setWorkspaceAIGenerating(false);
  }
 }

 async function addWorkspaceAIPlanChecklist(){
  if(!workspace?.booking) return;
  setWorkspaceAIAddingChecklist(true);
  try{
   const res=await api("/workspaces/bookings/"+workspace.booking+"/ai-plan/checklist/",{method:"POST"});
   const data=await res.json();
   if(!res.ok){
    setNotice(data.detail||"Could not add plan tasks.");
    return;
   }
   setWorkspace(data.workspace||workspace);
   setNotice((data.created?.length||0)+" AI plan tasks added to the shared checklist.");
  }finally{
   setWorkspaceAIAddingChecklist(false);
  }
 }

 async function saveWorkspaceAIPlan(){
  if(!workspace?.booking || !workspace?.ai_plan) return;
  setWorkspaceAISavingPlan(true);
  try{
   const res=await api("/workspaces/bookings/"+workspace.booking+"/",{
    method:"PATCH",
    body:JSON.stringify({ai_plan:workspace.ai_plan})
   });
   const data=await res.json();
   if(!res.ok){
    setNotice(data.detail||"Could not save roadmap edits.");
    return;
   }
   setWorkspace(data);
   setNotice("AI roadmap edits saved.");
  }finally{
   setWorkspaceAISavingPlan(false);
  }
 }

 async function generateSessionRecap(){
  if(!workspace?.booking) return;
  setRecapGenerating(true);
  try{
   const res=await api("/workspaces/bookings/"+workspace.booking+"/recap/generate/",{
    method:"POST",
    body:JSON.stringify({
      reflection:recapReflection,
      challenge:recapChallenge,
      confidence:Number(recapConfidence)
    })
   });
   const data=await res.json();
   if(!res.ok){
    setNotice(data.detail||"Could not generate your session recap.");
    return;
   }
   setWorkspace(prev=>({...prev,my_recap:data}));
   setNotice(data.source==="openai"?"AI session recap generated ✦":"Smart session recap generated ✦");
  }catch{
   setNotice("Could not generate your session recap.");
  }finally{
   setRecapGenerating(false);
  }
 }

 async function addRecapChecklist(){
  if(!workspace?.booking) return;
  setRecapAddingChecklist(true);
  try{
   const res=await api("/workspaces/bookings/"+workspace.booking+"/recap/checklist/",{method:"POST"});
   const data=await res.json();
   if(!res.ok){
    setNotice(data.detail||"Could not add recap next steps.");
    return;
   }
   setWorkspace(data.workspace||workspace);
   setNotice((data.created?.length||0)+" personalized next steps added to the checklist.");
  }finally{
   setRecapAddingChecklist(false);
  }
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
  const body=chatDraft.trim();
  const socket=chatSocketRef.current;
  if(socket&&socket.readyState===WebSocket.OPEN){
   setChatDraft("");
   setChatSending(true);
   socket.send(JSON.stringify({event:"typing",typing:false}));
   socket.send(JSON.stringify({event:"message",body}));
   setTimeout(()=>setChatSending(false),180);
   return;
  }
  setChatSending(true);
  try{
   const res=await api("/messages/swaps/"+activeConversation.swap+"/",{
    method:"POST",
    body:JSON.stringify({body})
   });
   const data=await res.json();
   if(!res.ok){
    setNotice(data.detail||"Could not send message.");
    return;
   }
   setChatMessages(prev=>prev.some(m=>m.id===data.id)?prev:[...prev,data]);
   setChatDraft("");
   loadConversations();
  }catch{
   setNotice("Could not send message.");
  }finally{
   setChatSending(false);
  }
 }

 function sendChatTyping(typing){
  const socket=chatSocketRef.current;
  if(socket&&socket.readyState===WebSocket.OPEN){
   socket.send(JSON.stringify({event:"typing",typing}));
   if(typingTimerRef.current) clearTimeout(typingTimerRef.current);
   if(typing) typingTimerRef.current=setTimeout(()=>{
    socket.readyState===WebSocket.OPEN&&socket.send(JSON.stringify({event:"typing",typing:false}));
   },1200);
  }
 }

 async function loadScheduleSuggestions(swapId,duration=60,target="schedule"){
  const setLoading=target==="reschedule"?setRescheduleSuggestionsLoading:setScheduleSuggestionsLoading;
  const setItems=target==="reschedule"?setRescheduleSuggestions:setScheduleSuggestions;
  setLoading(true);
  try{
   const res=await api("/bookings/swaps/"+swapId+"/suggestions/?duration="+Number(duration||60));
   const data=await res.json();
   if(res.ok){
    setItems(data.suggestions||[]);
    if(target==="schedule") setScheduleAvailabilityComplete(!!data.availability_complete);
   }else{
    setItems([]);
   }
  }catch{
   setItems([]);
  }finally{
   setLoading(false);
  }
 }

 async function openCalendar(){
  setCalendarOpen(true);
  const res=await api("/bookings/calendar/");
  if(res.ok){
   const data=await res.json();
   setCalendarEvents(data.events||[]);
  }
 }

 async function openCalendarBooking(bookingId){
  setCalendarOpen(false);
  await openWorkspace(bookingId);
 }

 async function openCalendarCircle(circleId){
  setCalendarOpen(false);
  setCircleFocusId(circleId);
  setCirclesOpen(true);
  await loadCircles();
  await openCircle(circleId);
 }

 async function openReschedule(booking){
  setRescheduleBooking(booking);
  setRescheduleForm({
   starts_at:"",
   duration_minutes:String(booking.duration_minutes||60),
   mode:booking.mode||"online",
   meeting_link:booking.meeting_link||"",
   location_note:booking.location_note||"",
   note:""
  });
  setRescheduleSuggestions([]);
  setRescheduleOpen(true);
  await loadScheduleSuggestions(booking.swap,booking.duration_minutes||60,"reschedule");
 }

 async function submitReschedule(e){
  e.preventDefault();
  if(!rescheduleBooking) return;
  const startsAt=new Date(rescheduleForm.starts_at);
  if(Number.isNaN(startsAt.getTime())){
   setNotice("Choose a valid new date and time.");
   return;
  }
  const payload={
   proposed_starts_at:startsAt.toISOString(),
   proposed_duration_minutes:Number(rescheduleForm.duration_minutes),
   proposed_mode:rescheduleForm.mode,
   proposed_meeting_link:rescheduleForm.mode==="online"?rescheduleForm.meeting_link:"",
   proposed_location_note:rescheduleForm.mode==="in_person"?rescheduleForm.location_note:"",
   note:rescheduleForm.note
  };
  const res=await api("/bookings/"+rescheduleBooking.id+"/reschedule/",{method:"POST",body:JSON.stringify(payload)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok){
   const conflict=data.schedule_check?.messages?.join(" ");
   setNotice(conflict||data.detail||"Could not propose the new time.");
   return;
  }
  setRescheduleOpen(false);
  setRescheduleBooking(null);
  setNotice("Reschedule proposal sent ↻");
  await loadBookings();
  await loadDashboard();
  if(calendarOpen) await openCalendar();
  loadDashboard();
 }

 async function handleRescheduleAction(id,action){
  const res=await api("/bookings/reschedules/"+id+"/"+action+"/",{method:"POST"});
  const data=await res.json().catch(()=>({}));
  if(!res.ok){
   setNotice(data.detail||"Could not update the reschedule proposal.");
   return;
  }
  setBookings(prev=>prev.map(item=>item.id===data.id?data:item));
  setNotice(action==="accept"?"New session time accepted 📅":action==="decline"?"Reschedule proposal declined.":"Reschedule proposal cancelled.");
  if(calendarOpen) await openCalendar();
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
  setScheduleError("");
  setScheduleSuggestions([]);
  setScheduleOpen(true);
  loadScheduleSuggestions(swap.id,60,"schedule");
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
   loadDashboard();
   setTimeout(()=>document.getElementById("bookings")?.scrollIntoView({behavior:"smooth"}),50);
  }else{
   const data=await res.json().catch(()=>({}));
   const conflict=(data.starts_at||[]).flat?.().join?.(" ") || data.schedule_check?.messages?.join(" ");
   const details=conflict || data.non_field_errors?.join?.(" ") || data.detail || "Could not schedule the session.";
   setScheduleError(details);
   setNotice(details);
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
   await loadProgression(true);
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
    await loadProgression(true);
    setNotice("Session completed 🎉");
    loadDashboard();
    openReview(updated);
   }else{
    setNotice("Booking cancelled.");
    loadDashboard();
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
   loadDashboard();
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
  setToken(""); setUser(null); setMySkills([]); setSwaps([]); setBookings([]); setConversations([]);
  setChatOpen(false); setActiveConversation(null); setChatMessages([]); setChatPartnerTyping(false); setChatPartnerOnline(false); setChatPartnerLastSeen(null); setPresenceByUser({});
  setWorkspaceOpen(false); setWorkspace(null); setReviewOpen(false); setReviewBooking(null);
  setPassportOpen(false); setPassport(null); setAvailabilityOpen(false); setAvailabilitySlots([]);
  setProgression(null); setProgressionOpen(false); setAchievementUnlock(null);
  setNotificationOpen(false); setNotifications([]); setNotificationUnread(0);
  setNetworkOpen(false); setNetworkData(null);
  setSavedOpen(false); setGoalsOpen(false); setBookmarks([]); setBookmarkCollections([]);
  setCirclesOpen(false); setCircles([]); setActiveCircle(null); setCircleMessages([]); setCircleFocusId(null);
  setScheduleOpen(false); setSelectedSwap(null); setScheduleSuggestions([]); setScheduleError("");
  setRescheduleOpen(false); setRescheduleBooking(null); setRescheduleSuggestions([]);
  setCalendarOpen(false); setCalendarEvents([]);
  setUniversalSearchOpen(false); setUniversalSearchQuery(""); setUniversalSearchData({people:[],skills:[],circles:[],mentors:[],counts:{}});
  setSafetyOpen(false); setSafetyData(null); setModerationQueue([]); setReportTarget(null);
  setSearched(false); setMatches(communityUsers.map(person=>({...person,score:null,confidence:"",breakdown:{},reasons:[],missing:[],suggested_times:[]})));
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

 async function findMatches(scroll=true){
  setSearched(true);
  if(scroll) document.getElementById("discover")?.scrollIntoView({behavior:"smooth"});
  if(!token){
   setMatches(communityUsers.map(person=>({...person,score:null,confidence:"",breakdown:{},reasons:[],missing:[],suggested_times:[]})));
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
   setMatches(data.map(m=>({
    ...m,
    teaches:m.they_teach_me.map(x=>x.name).join(", ")||"Partial match",
    wants:m.i_teach_them.map(x=>x.name).join(", ")||"Partial match",
    rating:m.average_rating||0,
    swaps:m.completed_swaps||0,
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
   loadDashboard();
  }else{
   const data=await res.json().catch(()=>({}));
   setNotice(data.detail||data.non_field_errors?.[0]||"Could not send proposal.");
  }
 }

 function openSkills(){ if(!token){setAuthMode("login");setAuthOpen(true)} else setSkillsOpen(true) }

 return <main className="app">
  {notice && <button className="toast" onClick={()=>setNotice("")}>{notice} ×</button>}

  <nav className="nav glass nav-refined">
   <a className="brand" href="#top"><span>↔</span><b>SkillSwap</b></a>

   <div className="links nav-main-links">
    <a className="nav-primary-link" href="#discover">Discover</a>

    {user && <a className="nav-primary-link request-nav-link" href="#requests">
      Requests
      {swaps.filter(s=>s.recipient===user.id&&s.status==="proposed").length>0 &&
       <span>{swaps.filter(s=>s.recipient===user.id&&s.status==="proposed").length}</span>}
    </a>}

    {user && <a className="nav-primary-link" href="#bookings">Bookings</a>}

    {user && <button className="nav-primary-link nav-message-button" onClick={()=>{
      const first=conversations[0];
      if(first) openChat(first.swap);
      else setNotice("Your messages will appear after you accept a SkillSwap.");
    }}>
      Messages
      {conversations.reduce((sum,c)=>sum+(c.unread_count||0),0)>0 &&
       <span>{conversations.reduce((sum,c)=>sum+(c.unread_count||0),0)}</span>}
    </button>}

    <details className="nav-dropdown nav-explore" onToggle={e=>{
      if(e.currentTarget.open){
       document.querySelectorAll(".nav-dropdown[open]").forEach(item=>{
        if(item!==e.currentTarget) item.removeAttribute("open");
       });
      }
     }}>
      <summary>Explore <span>⌄</span></summary>
      <div className="nav-dropdown-menu nav-explore-menu">
       <div className="nav-dropdown-label">EXPLORE SKILLSWAP</div>
       <a href="#how" onClick={e=>e.currentTarget.closest("details")?.removeAttribute("open")}>
        <span className="nav-menu-icon">✦</span>
        <span><b>How it works</b><small>See the SkillSwap journey</small></span>
       </a>
       <a href="#community" onClick={e=>e.currentTarget.closest("details")?.removeAttribute("open")}>
        <span className="nav-menu-icon">👥</span>
        <span><b>Community</b><small>Browse people and skills</small></span>
       </a>
       <button onClick={e=>{e.currentTarget.closest("details")?.removeAttribute("open");openSkillNetwork();}}>
        <span className="nav-menu-icon">🕸</span>
        <span><b>Skill Network</b><small>Explore the knowledge graph</small></span>
       </button>
       <button onClick={e=>{e.currentTarget.closest("details")?.removeAttribute("open");openSkillCircles();}}>
        <span className="nav-menu-icon">👥</span>
        <span><b>Skill Circles</b><small>Learn together in small groups</small></span>
       </button>
      </div>
    </details>
   </div>

   <div className="actions nav-actions">
    <button className="nav-search-button" onClick={openUniversalSearch} aria-label="Search SkillSwap">
      <span>⌕</span><b>Search</b><kbd>⌘ K</kbd>
    </button>
    {user ? <>
      <button className="ghost" onClick={()=>setSavedOpen(true)} aria-label="Saved bookmarks and collections">♡ Saved</button>
      <button className="ghost" onClick={()=>setGoalsOpen(true)} aria-label="Personal learning goals">🎯 Goals</button>
      <button className="notification-bell nav-icon-button" onClick={()=>{setNotificationOpen(true);loadNotifications();}} aria-label="Notifications">
       <span className="notification-bell-icon">🔔</span>
       {notificationUnread>0 && <b>{notificationUnread>99?"99+":notificationUnread}</b>}
      </button>

      <details className="nav-dropdown nav-account" onToggle={e=>{
       if(e.currentTarget.open){
        document.querySelectorAll(".nav-dropdown[open]").forEach(item=>{
         if(item!==e.currentTarget) item.removeAttribute("open");
        });
       }
      }}>
       <summary>
        <span className="nav-account-avatar">
         {user.profile?.avatar_url
          ? <img src={user.profile.avatar_url} alt="" />
          : <span>{(user.first_name||user.username||"S").slice(0,1).toUpperCase()}</span>}
        </span>
        <span className="nav-account-copy">
         <small>Signed in as</small>
         <b>{user.first_name||user.username}</b>
        </span>
        <span className="nav-chevron">⌄</span>
       </summary>

       <div className="nav-dropdown-menu nav-account-menu">
        <div className="nav-account-menu-head">
         <div className="nav-account-avatar large">
          {user.profile?.avatar_url
           ? <img src={user.profile.avatar_url} alt="" />
           : <span>{(user.first_name||user.username||"S").slice(0,1).toUpperCase()}</span>}
         </div>
         <div>
          <b>{user.first_name||user.username}</b>
          <small>@{user.username}</small>
         </div>
        </div>

        <button onClick={e=>{e.currentTarget.closest("details")?.removeAttribute("open");setProfileOpen(true);}}>
         <span className="nav-menu-icon">👤</span>
         <span><b>My profile</b><small>Skills, availability and details</small></span>
        </button>
        <button disabled={passportLoading} onClick={e=>{e.currentTarget.closest("details")?.removeAttribute("open");openPassport(user.id);}}>
         <span className="nav-menu-icon">🛂</span>
         <span><b>Skill Passport</b><small>Your learning identity</small></span>
        </button>
        <button onClick={e=>{e.currentTarget.closest("details")?.removeAttribute("open");openSafetyCenter();}}>
         <span className="nav-menu-icon">🛡</span>
         <span><b>Safety Center</b><small>Blocks, reports and account standing</small></span>
        </button>
        <button className="nav-logout-item" onClick={logout}>
         <span className="nav-menu-icon">↪</span>
         <span><b>Log out</b><small>Sign out of SkillSwap</small></span>
        </button>
       </div>
      </details>
    </> : <>
      <button className="ghost nav-login-button" onClick={()=>{setAuthMode("login");setAuthOpen(true)}}>Log in</button>
      <button className="primary nav-join-button" onClick={()=>{setAuthMode("register");setAuthOpen(true)}}>Join SkillSwap</button>
    </>}
   </div>
  </nav>

  {user && <HomeDashboard
    user={user}
    data={dashboardData}
    loading={dashboardLoading}
    onRefresh={loadDashboard}
    onCalendar={openCalendar}
    onWorkspace={openWorkspace}
    onChat={openChat}
    onRequests={()=>document.getElementById("requests")?.scrollIntoView({behavior:"smooth"})}
    onCircle={openCalendarCircle}
    onProposal={openProposal}
    onProgression={()=>setProgressionOpen(true)}
    onDiscover={()=>findMatches(true)}
    onPassport={openPassport}
  />}

  {!user && <section id="top" className="hero">
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
  </section>}

  {user && <section className="profile-strip glass">
    <div>
      <div className="eyebrow">YOUR SKILLSWAP PROFILE</div>
      <h3>{user.first_name||user.username} {user.last_name||""}</h3>
      <p>{user.profile?.bio||"Tell people what you enjoy teaching and what you want to learn."}</p>
      <div className="profile-actions">
       <button className="outline" onClick={()=>setProfileOpen(true)}>Edit profile</button>
       <button className="outline" onClick={openAvailability}>📅 Weekly availability</button>
       <button className="outline progression-profile-button" onClick={()=>setProgressionOpen(true)} disabled={!progression}>
        {progression ? progression.level.icon+" Level "+progression.level.level+" · "+progression.level.name : "🏆 Progression"}
       </button>
       <button className="outline passport-profile-button" disabled={passportLoading} onClick={()=>openPassport(user.id)}>🛂 View Skill Passport</button>
       <button className="primary" onClick={()=>setSkillsOpen(true)}>Manage my skills</button>
      </div>
    </div>
    <div className="profile-reputation-wrap">
      {progression && <button className="profile-level-card" onClick={()=>setProgressionOpen(true)}>
        <div className="profile-level-icon">{progression.level.icon}</div>
        <div className="profile-level-copy">
          <small>LEVEL {progression.level.level}</small>
          <b>{progression.level.name}</b>
          <div className="profile-level-track"><i style={{width:progression.level_progress+"%"}}></i></div>
          <span>{progression.xp.toLocaleString()} XP · 🔥 {progression.current_streak} week streak</span>
        </div>
        <em>→</em>
      </button>}
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

   {matches.length ? <div className="smart-match-grid">
    {matches.map(match=><SmartMatchCard
      key={match.user_id}
      match={match}
      user={user}
      onProposal={openProposal}
      onPassport={openPassport}
      onAvailability={openAvailability}
      bookmarkProps={bookmarkProps}
      onNotice={message=>{
        if(!user && message.startsWith("Log in")){
          setAuthMode("login");
          setAuthOpen(true);
        }
        setNotice(message);
      }}
    />)}
   </div> :
   <div className="empty-state glass"><div>🧭</div><h3>No matches yet</h3><p>Add more teach/learn skills to improve your chances.</p><button className="primary" onClick={()=>setSkillsOpen(true)}>Add skills</button></div>}
  </section>

  {user && <RequestsPanel swaps={swaps} bookings={bookings} currentUserId={user.id} currentUser={user} onAction={handleSwapAction} onSchedule={openSchedule} onMessage={openChat} />}

  {user && <BookingsPanel
    bookings={bookings}
    currentUser={user}
    onAction={handleBookingAction}
    onMessage={openChat}
    onWorkspace={openWorkspace}
    onReview={openReview}
    onReschedule={openReschedule}
    onRescheduleAction={handleRescheduleAction}
    onCalendar={openCalendar}
  />}

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
    suggestions={scheduleSuggestions}
    suggestionsLoading={scheduleSuggestionsLoading}
    availabilityComplete={scheduleAvailabilityComplete}
    scheduleError={scheduleError}
    onRefreshSuggestions={duration=>loadScheduleSuggestions(selectedSwap.id,duration,"schedule")}
    onClose={()=>{setScheduleOpen(false);setSelectedSwap(null);setScheduleError("")}}
    onSubmit={submitBooking}
  />}

  <RescheduleModal
    booking={rescheduleOpen?rescheduleBooking:null}
    form={rescheduleForm}
    setForm={setRescheduleForm}
    suggestions={rescheduleSuggestions}
    loadingSuggestions={rescheduleSuggestionsLoading}
    onRefreshSuggestions={duration=>rescheduleBooking&&loadScheduleSuggestions(rescheduleBooking.swap,duration,"reschedule")}
    onClose={()=>{setRescheduleOpen(false);setRescheduleBooking(null)}}
    onSubmit={submitReschedule}
  />

  <CalendarPanel
    open={calendarOpen}
    events={calendarEvents}
    onClose={()=>setCalendarOpen(false)}
    onOpenBooking={openCalendarBooking}
    onOpenCircle={openCalendarCircle}
  />

  <LearningGoals open={goalsOpen} onClose={()=>setGoalsOpen(false)} api={api} catalog={catalog} />

  <SavedPanel open={savedOpen} onClose={()=>{setSavedOpen(false);loadBookmarks()}} token={token} catalog={catalog} people={communityUsers} circles={circles} />

  <UniversalSearch
    open={universalSearchOpen}
    query={universalSearchQuery}
    setQuery={setUniversalSearchQuery}
    data={universalSearchData}
    loading={universalSearchLoading}
    onClose={()=>setUniversalSearchOpen(false)}
    onPerson={handleUniversalPerson}
    onSkill={handleUniversalSkill}
    onCircle={handleUniversalCircle}
    onPropose={match=>{setUniversalSearchOpen(false);openProposal(match);}}
    currentUser={user}
    bookmarkProps={bookmarkProps}
  />

  <SkillCircles
    open={circlesOpen}
    circles={circles}
    loading={circlesLoading}
    catalog={catalog}
    user={user}
    activeCircle={activeCircle}
    messages={circleMessages}
    onClose={()=>{setCirclesOpen(false);setCircleFocusId(null)}}
    onCreate={createCircle}
    onOpenCircle={openCircle}
    onJoin={joinCircle}
    onLeave={leaveCircle}
    onSendMessage={sendCircleMessage}
    onTyping={sendCircleTyping}
    onlineMemberIds={circleOnlineIds}
    typingUsers={circleTypingUsers}
    onAddTask={addCircleTask}
    onToggleTask={toggleCircleTask}
    onAddResource={addCircleResource}
    onScheduleSession={scheduleCircleSession}
    onGenerateAIPlan={generateCircleAIPlan}
    onPassport={openPassport}
    onModerateMember={moderateCircleMember}
    onDeleteMessage={deleteCircleMessage}
    onReport={openReport}
    focusCircleId={circleFocusId}
    bookmarkProps={bookmarkProps}
  />

  <SkillNetwork
    open={networkOpen}
    data={networkData}
    loading={networkLoading}
    onClose={()=>setNetworkOpen(false)}
    onPassport={openPassport}
    onPropose={openProposal}
    currentUser={user}
    onRefresh={refreshSkillNetwork}
  />

  <NotificationCenter
    open={notificationOpen}
    notifications={notifications}
    unreadCount={notificationUnread}
    preferences={notificationPreferences}
    onClose={()=>setNotificationOpen(false)}
    onMarkRead={markNotificationRead}
    onMarkAllRead={markAllNotificationsRead}
    onAction={handleNotificationAction}
    onPreferenceChange={updateNotificationPreference}
  />

  <ProgressionPanel
    open={progressionOpen}
    progression={progression}
    onClose={()=>setProgressionOpen(false)}
  />

  <AchievementUnlock
    achievement={achievementUnlock}
    onClose={()=>setAchievementUnlock(null)}
  />

  <AvailabilityModal
    open={availabilityOpen}
    slots={availabilitySlots}
    setSlots={setAvailabilitySlots}
    onClose={()=>setAvailabilityOpen(false)}
    onSave={saveAvailability}
    saving={availabilitySaving}
  />

  <SkillPassport
    open={passportOpen}
    passport={passport}
    currentUserId={user?.id}
    onBlock={blockUser}
    bookmarkProps={bookmarkProps}
    onReport={openReport}
    onClose={()=>{setPassportOpen(false);setPassport(null)}}
  />

  <SafetyCenter
    open={safetyOpen}
    data={safetyData}
    loading={safetyLoading}
    isStaff={!!user?.is_staff}
    moderationQueue={moderationQueue}
    moderationLoading={moderationLoading}
    onClose={()=>setSafetyOpen(false)}
    onUnblock={unblockUser}
    onRefresh={loadSafetyCenter}
    onModerationAction={moderateReport}
  />

  <ReportModal
    target={reportTarget}
    form={reportForm}
    setForm={setReportForm}
    onClose={()=>setReportTarget(null)}
    onSubmit={submitSafetyReport}
    saving={reportSaving}
  />

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
    aiSetup={workspaceAISetup}
    setAiSetup={setWorkspaceAISetup}
    onGenerateAIPlan={generateWorkspaceAIPlan}
    aiGenerating={workspaceAIGenerating}
    onAddAIPlanChecklist={addWorkspaceAIPlanChecklist}
    aiAddingChecklist={workspaceAIAddingChecklist}
    onPlanChange={plan=>setWorkspace(prev=>({...prev,ai_plan:plan}))}
    onSaveAIPlan={saveWorkspaceAIPlan}
    aiSavingPlan={workspaceAISavingPlan}
    recapReflection={recapReflection}
    setRecapReflection={setRecapReflection}
    recapChallenge={recapChallenge}
    setRecapChallenge={setRecapChallenge}
    recapConfidence={recapConfidence}
    setRecapConfidence={setRecapConfidence}
    onGenerateRecap={generateSessionRecap}
    recapGenerating={recapGenerating}
    onAddRecapChecklist={addRecapChecklist}
    recapAddingChecklist={recapAddingChecklist}
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
    onTyping={sendChatTyping}
    partnerTyping={chatPartnerTyping}
    partnerOnline={chatPartnerOnline}
    partnerLastSeen={chatPartnerLastSeen}
    onReport={openReport}
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
