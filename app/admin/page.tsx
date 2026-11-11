"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Question={id?:string;subject:string;exam:string;question:string;options:string[];answer:number;explanation:string;language:string;difficulty:string;published:boolean};
type Resource={id?:string;type:"note"|"paper";title:string;description:string;file_url:string;published:boolean};
type Notice={id?:string;title:string;body:string;url:string;published:boolean};
const emptyQ:Question={subject:"Punjab GK",exam:"PSSSB",question:"",options:["","","",""],answer:0,explanation:"",language:"both",difficulty:"medium",published:false};
const emptyR:Resource={type:"note",title:"",description:"",file_url:"",published:false};
const emptyN:Notice={title:"",body:"",url:"",published:false};
export default function Admin(){
 const [email,setEmail]=useState(""),[pass,setPass]=useState(""),[session,setSession]=useState(false),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 const [tab,setTab]=useState<"questions"|"resources"|"notices">("questions");
 const [q,setQ]=useState<Question>(emptyQ),[r,setR]=useState<Resource>(emptyR),[n,setN]=useState<Notice>(emptyN);
 const [questions,setQuestions]=useState<any[]>([]),[resources,setResources]=useState<any[]>([]),[notices,setNotices]=useState<any[]>([]);
 async function login(){
  if(!supabase){setMsg("Configure Supabase URL and anon key in .env.local.");return;}
  if(!email.trim()||!pass){setMsg("Enter email and password.");return;}
  setBusy(true);setMsg("");
  const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password:pass});
  if(error||!data.user){setMsg("Login failed. Check credentials and email verification.");setBusy(false);return;}
  const {data:profile,error:pe}=await supabase.from("profiles").select("role").eq("id",data.user.id).maybeSingle();
  if(pe||profile?.role!=="admin"){await supabase.auth.signOut();setMsg("Access denied: account is not an administrator.");setBusy(false);return;}
  setSession(true);setMsg("Administrator verified.");setBusy(false);await load();
 }
 async function load(){
  if(!supabase)return;
  const [a,b,c]=await Promise.all([supabase.from("questions").select("*").order("created_at",{ascending:false}).limit(100),supabase.from("resources").select("*").order("created_at",{ascending:false}).limit(100),supabase.from("notifications").select("*").order("created_at",{ascending:false}).limit(100)]);
  if(a.error||b.error||c.error){setMsg("Could not load content. Verify schema and administrator RLS policies.");return;}
  setQuestions(a.data||[]);setResources(b.data||[]);setNotices(c.data||[]);
 }
 async function saveQuestion(){
  if(!supabase||!q.question.trim()||q.options.some(x=>!x.trim())||q.answer<0||q.answer>3){setMsg("Fill question and all four options; select a valid answer.");return;}
  setBusy(true);const payload={...q,options:q.options};
  const res=q.id?await supabase.from("questions").update(payload).eq("id",q.id):await supabase.from("questions").insert(payload);
  setMsg(res.error?res.error.message:"Question saved.");if(!res.error){setQ(emptyQ);await load();}setBusy(false);
 }
 async function saveResource(){
  if(!supabase||!r.title.trim()){setMsg("Resource title is required.");return;}
  setBusy(true);const res=r.id?await supabase.from("resources").update(r).eq("id",r.id):await supabase.from("resources").insert(r);
  setMsg(res.error?res.error.message:"Resource saved.");if(!res.error){setR(emptyR);await load();}setBusy(false);
 }
 async function saveNotice(){
  if(!supabase||!n.title.trim()||!n.body.trim()){setMsg("Notice title and body are required.");return;}
  setBusy(true);const res=n.id?await supabase.from("notifications").update(n).eq("id",n.id):await supabase.from("notifications").insert(n);
  setMsg(res.error?res.error.message:"Notice saved.");if(!res.error){setN(emptyN);await load();}setBusy(false);
 }
 async function remove(table:"questions"|"resources"|"notifications",id:string){
  if(!supabase||!confirm("Delete this item permanently?"))return;
  const {error}=await supabase.from(table).delete().eq("id",id);setMsg(error?error.message:"Deleted.");if(!error)await load();
 }
 async function logout(){if(supabase)await supabase.auth.signOut();setSession(false);setPass("");setMsg("Signed out.");}
useEffect(() => {
  const client = supabase;
if (!client) return;

  client.auth.getSession().then(async ({ data }) => {
  if (data.session) {
    const { data: profile } = await client
        .from("profiles")
        .select("role")
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (profile?.role === "admin") {
        setSession(true);
        await load();
      }
    }
  });
}, []);
 const field=(label:string,value:string,onChange:(v:string)=>void)=><label style={{display:"block",margin:"10px 0"}}>{label}<input value={value} onChange={e=>onChange(e.target.value)} style={{display:"block",width:"100%"}}/></label>;
 return <main className="wrap" style={{padding:"35px 22px 60px"}}><Link href="/">← Home</Link><h1>Admin Dashboard</h1>
 {!session?<div className="card" style={{maxWidth:520}}><h3>Administrator sign-in</h3><input type="email" autoComplete="username" placeholder="Admin email" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" autoComplete="current-password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)}/><button className="btn" disabled={busy} onClick={login}>{busy?"Verifying…":"Sign in"}</button></div>:<>
 <div className="tools"><button className="btn secondary" onClick={()=>setTab("questions")}>MCQs ({questions.length})</button><button className="btn secondary" onClick={()=>setTab("resources")}>Notes/Papers ({resources.length})</button><button className="btn secondary" onClick={()=>setTab("notices")}>Notices ({notices.length})</button><button className="btn" onClick={logout}>Logout</button></div>
 {tab==="questions"&&<div className="card"><h2>{q.id?"Edit MCQ":"Add MCQ"}</h2>{field("Subject",q.subject,v=>setQ({...q,subject:v}))}{field("Exam",q.exam,v=>setQ({...q,exam:v}))}{field("Question",q.question,v=>setQ({...q,question:v}))}{q.options.map((o,i)=>field("Option "+String.fromCharCode(65+i),o,v=>setQ({...q,options:q.options.map((x,j)=>j===i?v:x)})))}<label>Correct option <select value={q.answer} onChange={e=>setQ({...q,answer:Number(e.target.value)})}>{q.options.map((_,i)=><option value={i} key={i}>{String.fromCharCode(65+i)}</option>)}</select></label>{field("Explanation",q.explanation,v=>setQ({...q,explanation:v}))}<label>Language <select value={q.language} onChange={e=>setQ({...q,language:e.target.value})}><option value="both">Both</option><option value="en">English</option><option value="pa">Punjabi</option></select></label><label>Difficulty <select value={q.difficulty} onChange={e=>setQ({...q,difficulty:e.target.value})}><option>easy</option><option>medium</option><option>hard</option></select></label><label><input type="checkbox" checked={q.published} onChange={e=>setQ({...q,published:e.target.checked})}/> Publish</label><button className="btn" disabled={busy} onClick={saveQuestion}>Save MCQ</button><button className="btn secondary" onClick={()=>setQ(emptyQ)}>Clear</button></div>}
 {tab==="resources"&&<div className="card"><h2>Add/Edit Resource</h2><label>Type <select value={r.type} onChange={e=>setR({...r,type:e.target.value as any})}><option value="note">Study Note</option><option value="paper">Previous Paper</option></select></label>{field("Title",r.title,v=>setR({...r,title:v}))}{field("Description",r.description,v=>setR({...r,description:v}))}{field("File URL (Supabase Storage or trusted link)",r.file_url,v=>setR({...r,file_url:v}))}<label><input type="checkbox" checked={r.published} onChange={e=>setR({...r,published:e.target.checked})}/> Publish</label><button className="btn" disabled={busy} onClick={saveResource}>Save Resource</button><button className="btn secondary" onClick={()=>setR(emptyR)}>Clear</button></div>}
 {tab==="notices"&&<div className="card"><h2>Add/Edit Notice</h2>{field("Title",n.title,v=>setN({...n,title:v}))}{field("Notice body",n.body,v=>setN({...n,body:v}))}{field("Official URL",n.url,v=>setN({...n,url:v}))}<label><input type="checkbox" checked={n.published} onChange={e=>setN({...n,published:e.target.checked})}/> Publish</label><button className="btn" disabled={busy} onClick={saveNotice}>Save Notice</button><button className="btn secondary" onClick={()=>setN(emptyN)}>Clear</button></div>}
 <h2>Existing content</h2>{tab==="questions"&&questions.map(x=><article className="card" key={x.id}><b>{x.subject} · {x.question}</b><p>{x.published?"Published":"Draft"}</p><button onClick={()=>setQ(x)}>Edit</button><button onClick={()=>remove("questions",x.id)}>Delete</button></article>)}{tab==="resources"&&resources.map(x=><article className="card" key={x.id}><b>{x.type} · {x.title}</b><p>{x.published?"Published":"Draft"}</p><button onClick={()=>setR(x)}>Edit</button><button onClick={()=>remove("resources",x.id)}>Delete</button></article>)}{tab==="notices"&&notices.map(x=><article className="card" key={x.id}><b>{x.title}</b><p>{x.published?"Published":"Draft"}</p><button onClick={()=>setN(x)}>Edit</button><button onClick={()=>remove("notifications",x.id)}>Delete</button></article>)}
 </>}
 {msg&&<p role="status" aria-live="polite">{msg}</p>}<p className="meta">Admin API actions are also protected by Supabase RLS; this interface cannot bypass database policies.</p></main>;
}
