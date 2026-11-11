 "use client";
import {useMemo,useState} from "react";
import Link from "next/link";
type Q={subject:string;question:string;options:string[];answer:number;explanation:string};
const bank:Q[]=[
{subject:"Punjab GK",question:"Which city is the capital of Punjab (India)?",options:["Amritsar","Chandigarh","Ludhiana","Patiala"],answer:1,explanation:"Chandigarh is the capital of Punjab and Haryana and a Union Territory."},
{subject:"Punjab GK",question:"The Golden Temple is located in which city?",options:["Jalandhar","Patiala","Amritsar","Bathinda"],answer:2,explanation:"Sri Harmandir Sahib is located in Amritsar."},
{subject:"Punjab GK",question:"Which river flows through the Majha region?",options:["Ravi","Yamuna","Narmada","Godavari"],answer:0,explanation:"The Ravi is one of the rivers associated with Punjab's Majha region."},
{subject:"Computer",question:"Which shortcut copies selected text?",options:["Ctrl+X","Ctrl+C","Ctrl+V","Ctrl+Z"],answer:1,explanation:"Ctrl+C copies selected content."},
{subject:"Computer",question:"Which is an input device?",options:["Monitor","Printer","Keyboard","Speaker"],answer:2,explanation:"A keyboard sends input to a computer."},
{subject:"Computer",question:"CPU stands for:",options:["Central Processing Unit","Computer Personal Unit","Central Program Utility","Control Processing User"],answer:0,explanation:"CPU means Central Processing Unit."},
{subject:"Reasoning",question:"Find the next number: 2, 4, 8, 16, __",options:["18","24","32","36"],answer:2,explanation:"Each term doubles; 16 × 2 = 32."},
{subject:"Reasoning",question:"If CAT is coded as DBU, DOG is coded as:",options:["EPH","CNG","FQI","EOG"],answer:0,explanation:"Each letter moves one step forward: D→E, O→P, G→H."},
{subject:"English",question:"Choose the synonym of 'Rapid'.",options:["Slow","Quick","Weak","Late"],answer:1,explanation:"Rapid means quick or fast."},
{subject:"Punjabi",question:"'ਪਾਣੀ' ਦਾ ਸਮਾਨਾਰਥਕ ਸ਼ਬਦ ਕਿਹੜਾ ਹੈ?",options:["ਜਲ","ਅੱਗ","ਹਵਾ","ਧਰਤੀ"],answer:0,explanation:"ਜਲ ਪਾਣੀ ਦਾ ਸਮਾਨਾਰਥਕ ਸ਼ਬਦ ਹੈ।"},
{subject:"Indian GK",question:"The Constitution of India came into effect on:",options:["15 Aug 1947","26 Jan 1950","26 Nov 1949","2 Oct 1950"],answer:1,explanation:"It came into effect on 26 January 1950."},
{subject:"Maths",question:"What is 15% of 200?",options:["20","25","30","35"],answer:2,explanation:"0.15 × 200 = 30."}
];
export default function Quiz(){const [subject,setSubject]=useState("All"),[index,setIndex]=useState(0),[answers,setAnswers]=useState<Record<number,number>>({}),[submitted,setSubmitted]=useState(false);
const filtered=useMemo(()=>subject==="All"?bank:bank.filter(q=>q.subject===subject),[subject]);const q=filtered[index];const score=filtered.reduce((s,x,i)=>s+(answers[i]===x.answer?1:0),0);
function reset(s=subject){setSubject(s);setIndex(0);setAnswers({});setSubmitted(false)}
return <main className="wrap" style={{padding:"32px 22px 60px"}}><Link href="/">← Home</Link><h1>MCQ Quiz / ਬਹੁ-ਵਿਕਲਪੀ ਪ੍ਰਸ਼ਨ</h1><p>Practice by subject, submit answers, and review explanations.</p>
<div className="tools"><select value={subject} onChange={e=>reset(e.target.value)}><option>All</option>{Array.from(new Set(bank.map(x=>x.subject))).map(s=><option key={s}>{s}</option>)}</select><span className="meta">{filtered.length} practice questions</span></div>
{submitted?<div className="card"><h2>Result: {score}/{filtered.length}</h2><p>Score: {Math.round(score/filtered.length*100)}%</p>{filtered.map((x,i)=><article key={i} style={{borderTop:"1px solid #e4eaf2",padding:"14px 0"}}><b>{i+1}. {x.question}</b><p>Your answer: {x.options[answers[i]]??"Not attempted"} · Correct: {x.options[x.answer]}</p><p className="meta">{x.explanation}</p></article>)}<button className="btn" onClick={()=>reset()}>Practice again</button></div>
: q?<div className="qbox"><div className="sectionHead"><b>Question {index+1} / {filtered.length}</b><span className="pill">{q.subject}</span></div><h2>{q.question}</h2>{q.options.map((o,i)=><button key={i} className="option" style={{borderColor:answers[index]===i?"#2457a7":undefined,background:answers[index]===i?"#edf4ff":undefined}} onClick={()=>setAnswers(a=>({...a,[index]:i}))}>{String.fromCharCode(65+i)}. {o}</button>)}<div className="tools"><button className="btn secondary" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>Previous</button><button className="btn" onClick={()=>index===filtered.length-1?setSubmitted(true):setIndex(i=>i+1)}>{index===filtered.length-1?"Submit Quiz":"Next →"}</button></div></div>:<p>No questions for this subject.</p>}
</main>}
