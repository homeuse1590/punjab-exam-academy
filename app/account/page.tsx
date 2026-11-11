"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function Account() {
 const [mode,setMode]=useState<"login"|"signup">("login");
 const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [name,setName]=useState("");
 const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
 async function submit(){
  if(!supabase){setMessage("Account services are not configured yet. Set Supabase URL and anon key in .env.local.");return;}
  if(!email.trim()||password.length<8){setMessage("Enter a valid email and password (minimum 8 characters).");return;}
  setBusy(true);setMessage("");
  if(mode==="signup"){
   const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{display_name:name.trim()}}});
   if(error){setMessage(error.message);setBusy(false);return;}
   setMessage("Account registration submitted. Check your email to verify your account, then sign in.");
  }else{
   const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
   setMessage(error?"Sign-in failed. Check credentials and email verification.":"Signed in successfully.");
  }
  setBusy(false);
 }
 async function logout(){if(supabase)await supabase.auth.signOut();setMessage("Signed out.");}
 return <main className="wrap" style={{padding:"35px 22px 60px"}}><Link href="/">← Home</Link><h1>Student Account / ਵਿਦਿਆਰਥੀ ਖਾਤਾ</h1>
 <div className="card" style={{maxWidth:560}}><div className="tools"><button className={mode==="login"?"btn":"btn secondary"} onClick={()=>setMode("login")}>Login</button><button className={mode==="signup"?"btn":"btn secondary"} onClick={()=>setMode("signup")}>Create account</button></div>
 {mode==="signup"&&<input autoComplete="name" placeholder="Display name (optional)" value={name} onChange={e=>setName(e.target.value)}/>}
 <input autoComplete="email" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
 <input autoComplete={mode==="login"?"current-password":"new-password"} type="password" placeholder="Password (8+ characters)" value={password} onChange={e=>setPassword(e.target.value)}/>
 <button className="btn" disabled={busy} onClick={submit}>{busy?"Please wait…":mode==="login"?"Sign in":"Register"}</button>
 <button className="btn secondary" onClick={logout}>Sign out</button>{message&&<p role="status" aria-live="polite">{message}</p>}
 <p className="meta">Never share your password. Use a unique password for this website.</p></div></main>
}
