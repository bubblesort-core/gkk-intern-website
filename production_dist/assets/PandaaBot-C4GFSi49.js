import{r as n,j as e,A as K,m as f,R as ye,s as je}from"./MaintenanceGuard-mWJrpls_.js";import{u as ve}from"./main-Cc3eBK_D.js";const re="https://script.google.com/macros/s/AKfycbx9RK4LFMYblIWeQGdQDJpvepjC4FJ22UqkwmQusFxxJF3qSMQDB8JEV1rSJP6GALc/exec",Ne=()=>typeof window<"u"&&window.crypto&&window.crypto.randomUUID?window.crypto.randomUUID():Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15),ke=/\b(status|application|applied|shortlist|shortlisted|selected|selection|review)\b/i,de=ye.memo(({msg:l})=>e.jsxs(f.div,{initial:{opacity:0,scale:.95,y:10},animate:{opacity:1,scale:1,y:0},className:`flex flex-col ${l.type==="user"?"items-end":"items-start"} will-change-transform`,style:{transform:"translateZ(0)"},children:[e.jsx("div",{className:`max-w-[85%] p-4 rounded-[18px] text-[14px] leading-relaxed shadow-lg ${l.type==="user"?"bg-[#3b42f2] text-white rounded-br-none shadow-[#3b42f2]/20":"bg-[#1a1a2e] border border-white/5 text-white/95 rounded-bl-none"}`,children:l.text}),e.jsx("span",{className:"text-[9px] text-white/20 mt-1.5 px-3 font-bold uppercase tracking-widest",children:l.timestamp.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})})]}));de.displayName="ChatTile";const Se=({playClick:l,supabase:c,contactSource:W})=>{const[b,P]=n.useState(!1),[p,w]=n.useState("WELCOME"),[o,E]=n.useState(()=>localStorage.getItem("pandaa_user_name")||""),[v]=n.useState(()=>{let t=localStorage.getItem("pandaa_user_token");return t||(t=Ne(),localStorage.setItem("pandaa_user_token",t)),t}),[le,ce]=n.useState(""),[h,G]=n.useState(null),[B,pe]=n.useState(null),[he,U]=n.useState(null),[M,$]=n.useState(""),[y,T]=n.useState(0),[N,q]=n.useState(0),[xe,V]=n.useState(!1),[x,F]=n.useState(0),[m,L]=n.useState(""),[d,D]=n.useState(""),[u,j]=n.useState(()=>{const t=localStorage.getItem("pandaa_chat_messages");if(t)try{return JSON.parse(t).map(r=>({...r,timestamp:new Date(r.timestamp)}))}catch(a){console.error("Error parsing saved messages:",a)}return[]}),[k,J]=n.useState(""),[g,_]=n.useState(!1),[R,Y]=n.useState(!1),[Z,ue]=n.useState(!1),Q=n.useRef(null),I=n.useMemo(()=>/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(m),[m]),X=n.useMemo(()=>d.trim().length>=10,[d]),z=n.useMemo(()=>I&&X&&!R,[I,X,R]);n.useEffect(()=>{if(x>0){const t=setInterval(()=>F(a=>Math.max(0,a-1)),1e3);return()=>clearInterval(t)}},[x]);const me=async()=>{try{return(await(await fetch("https://api.ipify.org?format=json")).json()).ip}catch{try{return(await(await fetch("https://ipapi.co/json/")).json()).ip}catch{const a=await(await fetch("https://api.seeip.org/jsonip")).json();return a.ip||a.ip_address||""}}};n.useEffect(()=>{if(!b||Z)return;(async()=>{try{const a=await me();if(a){ce(a);const s=localStorage.getItem("pandaa_user_name")||o||"",{data:i}=await c.from("pandaa_usage").upsert({ip_address:a,user_name:s,last_active:new Date().toISOString()},{onConflict:"ip_address"}).select().single();i&&(pe(i.id),T(i.ai_message_count||0),q(i.contact_refine_count||0),U(new Date(i.cycle_start||i.created_at)),V(i.is_blocked||!1),i.user_name&&!o&&(E(i.user_name),localStorage.setItem("pandaa_user_name",i.user_name)))}const{data:r}=await c.from("pandaa_sessions").select("*").eq("token",v).single();if(r)G(r.id),r.name&&!o&&(E(r.name),localStorage.setItem("pandaa_user_name",r.name));else{const{data:s}=await c.from("pandaa_sessions").insert({token:v,name:o||localStorage.getItem("pandaa_user_name")||""}).select().single();s&&G(s.id)}}catch(a){console.error("Pandaa sync error:",a)}finally{ue(!0)}})()},[Z,b,c,o,v]),n.useEffect(()=>{u.length>0&&localStorage.setItem("pandaa_chat_messages",JSON.stringify(u))},[u]),n.useEffect(()=>{b&&p==="CHAT_MAIN"&&h&&u.length<=1&&(async()=>{const{data:a}=await c.from("pandaa_chat_history").select("*").eq("session_id",h).order("created_at",{ascending:!0});if(a&&a.length>0){const r=a.map(s=>({id:s.id.toString(),type:s.role==="user"?"user":"bot",text:s.content,timestamp:new Date(s.created_at)}));u.length===0&&j(r)}else u.length===0&&j([{id:"init",type:"bot",text:"Welcome to GKK Interns! I'm PANDAA, your growth assistant. Ready to start your tech journey?",timestamp:new Date}])})()},[b,p,h,u.length,o,c]);const ee=async(t,a="chat",r="")=>{try{const{data:s,error:i}=await c.functions.invoke("pandaa-assistant",{body:{prompt:t,userName:o,email:r||m||"",mode:a}});if(i)throw i;if(s&&s.success===!1)throw new Error(s.error||"Assistant function returned failure");return s?.response||null}catch(s){return console.error("PANDAA assistant function error:",s),null}},C=async(t,a)=>{h&&await c.from("pandaa_chat_history").insert({session_id:h,role:t,content:a})},A=async t=>{B&&await c.from("pandaa_usage").update(t).eq("id",B),t.user_name&&h&&await c.from("pandaa_sessions").update({name:t.user_name}).eq("id",h)},te=n.useCallback(()=>{Q.current?.scrollIntoView({behavior:"smooth"})},[]);n.useEffect(()=>{b&&p==="CHAT_MAIN"&&te()},[u,b,p,g,te]);const ae=async()=>{if(!k.trim()||xe||x>0)return;const t=new Date;let a=y;const r=he;if(r&&t.getTime()-r.getTime()>1440*60*1e3&&(a=0,T(0),U(t),await A({cycle_start:t.toISOString(),ai_message_count:0,is_blocked:!1}),V(!1)),a>=15){j(S=>[...S,{id:"limit-"+Date.now(),type:"bot",text:"Daily message limit (15) reached. Please try again after 24 hours.",timestamp:new Date}]);return}l();const s={id:Date.now().toString(),type:"user",text:k,timestamp:new Date};j(S=>[...S,s]),C("user",k);const i=a+1;T(i),A({ai_message_count:i,last_active:t.toISOString(),ip_address:le||void 0}),F(3);const H=k;J(""),_(!0);const O=H.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{1,}/i)?.[0];O&&L(O);const se=O||m,we=await ee(H,"chat",se),ie=ke.test(H),oe=we||(ie&&!se?"I can check your application status. Please share the Gmail address you used while applying.":ie?"I could not fetch your live application status right now. Please retry in a moment, or share your application Gmail again.":"I could not fetch a live reply just now. Please ask again in a moment, and I can also help with general knowledge questions.");_(!1),j(S=>[...S,{id:"bot-"+Date.now(),type:"bot",text:oe,timestamp:new Date}]),C("assistant",oe)},ne=async()=>{if(!M.trim()&&!o)return;const t=M.trim()||o;if(l(),t&&t!==o&&(E(t),localStorage.setItem("pandaa_user_name",t),await A({user_name:t,last_name_change:new Date().toISOString()})),$(""),w("CHAT_MAIN"),!h&&!u.length){const a=`Welcome to GKK Interns, ${t||"there"}! I'm here to guide you through your career launch. How can I help today?`;j([{id:"init-"+Date.now(),type:"bot",text:a,timestamp:new Date}]),C("assistant",a)}},ge=async()=>{l(),h&&await c.from("pandaa_chat_history").delete().eq("session_id",h),localStorage.removeItem("pandaa_chat_messages");const t=`Memory cleared. Ready for a new start. How can I assist you, ${o}?`;j([{id:"reset-"+Date.now(),type:"bot",text:t,timestamp:new Date}]),C("assistant",t)},fe=async()=>{if(N>=3||!d.trim())return;l();const t=N+1;q(t),A({contact_refine_count:t}),_(!0);const a=await ee(d,"refine");_(!1),a&&D(a.trim())},be=async()=>{if(z){l(),Y(!0);try{re&&await fetch(re,{method:"POST",mode:"no-cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:m,message:d,source:W,token:v,name:o})}),await c.from("pandaa_inquiries").insert({session_id:h,email:m,message:d,source:W,name:o}),w("SUCCESS"),L(""),D(""),setTimeout(()=>w("WELCOME"),3e3)}catch(t){console.error("Submission error:",t),alert("Connection error. Please try again.")}finally{Y(!1)}}};return e.jsxs("div",{className:"pandaa-root fixed bottom-8 right-12 z-9999 font-sans",style:{position:"fixed",right:"3rem",bottom:"2rem",zIndex:9999,pointerEvents:"auto",fontFamily:"inherit"},children:[e.jsx("style",{children:`
                .pandaa-root, .pandaa-root * {
                    box-sizing: border-box;
                }

                .pandaa-root h1,
                .pandaa-root h2,
                .pandaa-root h3,
                .pandaa-root h4,
                .pandaa-root p,
                .pandaa-root label {
                    margin: 0;
                    line-height: 1.25;
                }

                .pandaa-root {
                    font-family: 'Space Grotesk', 'Inter', 'Segoe UI', sans-serif;
                    line-height: 1.35;
                    color: #f4f6ff;
                }

                .pandaa-root button,
                .pandaa-root input,
                .pandaa-root textarea {
                    font-family: inherit;
                    appearance: none;
                    -webkit-appearance: none;
                    font-size: 14px;
                }

                .pandaa-root .pandaa-window {
                    width: min(95vw, 560px) !important;
                    max-width: 560px !important;
                    min-width: 340px;
                    min-height: 560px;
                    max-height: 85vh;
                    border-radius: 24px;
                    overflow: hidden;
                }

                .pandaa-root .pandaa-scroll-area {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(59, 66, 242, 0.7) rgba(255, 255, 255, 0.08);
                }

                .pandaa-root .pandaa-scroll-area::-webkit-scrollbar {
                    width: 10px;
                }

                .pandaa-root .pandaa-scroll-area::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.06);
                    border-radius: 999px;
                }

                .pandaa-root .pandaa-scroll-area::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, rgba(59, 66, 242, 0.95), rgba(59, 66, 242, 0.55));
                    border-radius: 999px;
                    border: 2px solid rgba(10, 10, 15, 0.75);
                }

                .pandaa-root .pandaa-scroll-area::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, rgba(79, 87, 255, 0.95), rgba(79, 87, 255, 0.65));
                }

                .pandaa-root .pandaa-header {
                    padding: 18px 20px;
                    background: linear-gradient(180deg, #121520 0%, #10131d 100%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.09);
                }

                .pandaa-root .pandaa-title {
                    font-size: 29px;
                    font-weight: 900;
                    letter-spacing: 0.01em;
                    text-transform: uppercase;
                    line-height: 1.02;
                }

                .pandaa-root .pandaa-subtitle {
                    margin-top: 8px;
                    color: rgba(228, 233, 255, 0.66);
                    font-size: 18px;
                    line-height: 1.2;
                    font-weight: 500;
                }

                .pandaa-root .pandaa-welcome {
                    gap: 24px;
                    padding: 28px;
                }

                .pandaa-root .pandaa-welcome-actions {
                    width: 100%;
                    max-width: 340px;
                    display: grid;
                    gap: 12px;
                }

                .pandaa-root .pandaa-action-card {
                    width: 100%;
                    min-height: 72px;
                    padding: 14px 14px;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    background: rgba(255, 255, 255, 0.03);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-align: left;
                }

                .pandaa-root .pandaa-action-icon {
                    width: 40px;
                    height: 40px;
                    flex: 0 0 40px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .pandaa-root .pandaa-action-copy {
                    min-width: 0;
                }

                .pandaa-root .pandaa-action-copy h4 {
                    margin: 0;
                    font-size: 15px;
                    line-height: 1.15;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: 0;
                }

                .pandaa-root .pandaa-action-copy p {
                    margin: 4px 0 0;
                    font-size: 11px;
                    line-height: 1.2;
                    color: rgba(255, 255, 255, 0.62);
                }

                .pandaa-root .pandaa-contact,
                .pandaa-root .pandaa-chat-main,
                .pandaa-root .pandaa-chat-entry,
                .pandaa-root .pandaa-success {
                    padding: 22px;
                }

                .pandaa-root .pandaa-contact h2,
                .pandaa-root .pandaa-chat-entry h2,
                .pandaa-root .pandaa-success h2 {
                    font-size: 31px;
                    font-weight: 900;
                    letter-spacing: 0;
                    text-transform: uppercase;
                    line-height: 1.05;
                }

                .pandaa-root .pandaa-contact p,
                .pandaa-root .pandaa-chat-entry p,
                .pandaa-root .pandaa-success p {
                    color: rgba(230, 235, 255, 0.68);
                    font-size: 15px;
                }

                .pandaa-root .pandaa-contact label {
                    color: rgba(215, 221, 255, 0.72);
                    font-size: 11px;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    font-weight: 700;
                }

                .pandaa-root .pandaa-contact input,
                .pandaa-root .pandaa-contact textarea,
                .pandaa-root .pandaa-chat-main input,
                .pandaa-root .pandaa-chat-entry input {
                    border-radius: 14px;
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    background: rgba(255, 255, 255, 0.03);
                    color: #f4f6ff;
                    font-size: 18px;
                    font-weight: 500;
                    line-height: 1.35;
                    padding: 13px 14px;
                }

                .pandaa-root .pandaa-contact input::placeholder,
                .pandaa-root .pandaa-contact textarea::placeholder,
                .pandaa-root .pandaa-chat-main input::placeholder,
                .pandaa-root .pandaa-chat-entry input::placeholder {
                    color: rgba(227, 232, 255, 0.42);
                }

                .pandaa-root .pandaa-contact textarea {
                    min-height: 120px;
                    resize: none;
                }

                .pandaa-root .pandaa-contact button,
                .pandaa-root .pandaa-chat-entry button,
                .pandaa-root .pandaa-chat-main button {
                    min-height: 44px;
                    border-radius: 12px;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                }

                .pandaa-root .pandaa-chat-meta {
                    font-size: 11px;
                    color: rgba(232, 237, 255, 0.74);
                }

                .pandaa-root .pandaa-input-row {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .pandaa-root .pandaa-chat-input {
                    width: 100%;
                    min-height: 48px;
                    padding-right: 52px;
                }

                .pandaa-root .pandaa-send-btn {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                @media (max-width: 640px) {
                    .pandaa-root {
                        right: 12px !important;
                        bottom: 12px !important;
                    }

                    .pandaa-root .pandaa-window {
                        width: calc(100vw - 24px) !important;
                        min-width: 0;
                        max-width: none !important;
                        height: min(82vh, 700px);
                        min-height: 520px;
                    }

                    .pandaa-root .pandaa-welcome {
                        padding: 22px;
                        gap: 18px;
                    }

                    .pandaa-root .pandaa-title,
                    .pandaa-root .pandaa-contact h2,
                    .pandaa-root .pandaa-chat-entry h2,
                    .pandaa-root .pandaa-success h2 {
                        font-size: 25px;
                    }

                    .pandaa-root .pandaa-subtitle,
                    .pandaa-root .pandaa-contact p,
                    .pandaa-root .pandaa-chat-entry p,
                    .pandaa-root .pandaa-success p,
                    .pandaa-root .pandaa-contact input,
                    .pandaa-root .pandaa-contact textarea,
                    .pandaa-root .pandaa-chat-main input,
                    .pandaa-root .pandaa-chat-entry input {
                        font-size: 16px;
                    }
                }
            `}),e.jsx(K,{children:!b&&e.jsx(f.button,{initial:{scale:0,opacity:0},animate:{scale:1,opacity:1},exit:{scale:0,opacity:0},onClick:()=>{P(!0),l()},className:"w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(59,66,242,0.4)] bg-[#3b42f2] group",style:{width:"56px",height:"56px",borderRadius:"9999px",display:"flex",alignItems:"center",justifyContent:"center",background:"#3b42f2",border:"none",cursor:"pointer",boxShadow:"0 8px 32px rgba(59,66,242,0.4)"},children:e.jsx("svg",{width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:"white",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"})})})}),e.jsx(K,{mode:"wait",children:b&&e.jsxs(f.div,{initial:{opacity:0,scale:.95,y:30},animate:{opacity:1,scale:1,y:0},exit:{opacity:0,scale:.95,y:30},className:"pandaa-window absolute bottom-0 right-0 w-[94vw] max-w-120 h-185 bg-[#0a0a0f] border border-white/10 rounded-4xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden",style:{width:"min(95vw, 560px)",maxWidth:"560px",height:"min(740px, 85vh)",minHeight:"560px",background:"#0a0a0f",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"24px",boxShadow:"0 20px 60px rgba(0,0,0,0.5)",display:"flex",flexDirection:"column",overflow:"hidden"},children:[e.jsxs("div",{className:"pandaa-header p-6 bg-[#12121e] border-b border-white/5 flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-9 h-9 rounded-full bg-[#1a1a2e] border border-[#3b42f2]/20 flex items-center justify-center shadow-lg",children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"#3b42f2",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"})})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-base text-white leading-tight uppercase font-black tracking-tight",children:"PANDAA"}),e.jsxs("div",{className:"flex items-center gap-1.5 mt-0.5",children:[e.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-[#06e4f9] animate-pulse"}),e.jsx("span",{className:"text-[10px] text-white/50 font-medium tracking-tight uppercase",children:"GKK INTERN Help V1.3"})]})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[p==="CHAT_MAIN"&&e.jsx("button",{title:"Reset Conversation",onClick:ge,className:"p-1.5 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"}),e.jsx("path",{d:"M21 3v5h-5"}),e.jsx("path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"}),e.jsx("path",{d:"M3 21v-5h5"})]})}),p!=="WELCOME"&&p!=="SUCCESS"&&e.jsx("button",{onClick:()=>w("WELCOME"),className:"p-1.5 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white",children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"m15 18-6-6 6-6"})})}),e.jsx("button",{onClick:()=>P(!1),className:"p-1.5 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white",children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M18 6 6 18M6 6l12 12"})})})]})]}),e.jsx("div",{className:"flex-1 overflow-hidden relative flex flex-col bg-[#0a0a0f]",children:e.jsxs(K,{mode:"wait",children:[p==="WELCOME"&&e.jsxs(f.div,{initial:{x:15,opacity:0},animate:{x:0,opacity:1},exit:{x:-15,opacity:0},className:"pandaa-welcome flex-1 flex flex-col p-8 items-center justify-center text-center space-y-10",style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:"24px",padding:"32px"},children:[e.jsxs("div",{className:"space-y-3",children:[e.jsx("h2",{className:"pandaa-title text-2xl font-black text-white tracking-tighter uppercase leading-tight",children:"GKK INTERN Assistant"}),e.jsx("p",{className:"pandaa-subtitle text-white/60 text-[14px]",children:"Launch your career with expert guidance."})]}),e.jsxs("div",{className:"pandaa-welcome-actions w-full max-w-85 space-y-4",style:{width:"100%",maxWidth:"340px",display:"grid",gap:"12px"},children:[e.jsxs("button",{onClick:()=>w("CONTACT"),className:"pandaa-action-card w-full p-4.5 bg-white/3 border border-white/5 rounded-[22px] hover:bg-white/6 hover:border-[#3b42f2]/30 transition-all text-left flex items-center gap-4 group",style:{width:"100%",minHeight:"72px",padding:"16px",borderRadius:"16px",border:"1px solid rgba(255,255,255,0.14)",display:"flex",alignItems:"center",gap:"12px",textAlign:"left",background:"rgba(255,255,255,0.03)"},children:[e.jsx("div",{className:"pandaa-action-icon w-10 h-10 rounded-xl bg-[#3b42f2] flex items-center justify-center shadow-lg shadow-[#3b42f2]/30 group-hover:scale-105 transition-transform",children:e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"white",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{width:"20",height:"16",x:"2",y:"4",rx:"2"}),e.jsx("path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"})]})}),e.jsxs("div",{className:"pandaa-action-copy",children:[e.jsx("h4",{className:"text-white text-[15px] uppercase tracking-tighter",children:"Support Message"}),e.jsx("p",{className:"text-white/40 text-[11px]",children:"Direct GKK inquiry"})]})]}),e.jsxs("button",{onClick:()=>{w(o?"CHAT_MAIN":"CHAT_ENTRY")},className:"pandaa-action-card w-full p-4.5 bg-white/3 border border-white/5 rounded-[22px] hover:bg-white/6 hover:border-[#3b42f2]/30 transition-all text-left flex items-center gap-4 group",style:{width:"100%",minHeight:"72px",padding:"16px",borderRadius:"16px",border:"1px solid rgba(255,255,255,0.14)",display:"flex",alignItems:"center",gap:"12px",textAlign:"left",background:"rgba(255,255,255,0.03)"},children:[e.jsx("div",{className:"pandaa-action-icon w-10 h-10 rounded-xl bg-[#1a1a2e] border border-[#3b42f2]/20 flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner",children:e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"#3b42f2",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"})})}),e.jsxs("div",{className:"pandaa-action-copy",children:[e.jsx("h4",{className:"text-white text-[15px] uppercase tracking-tighter",children:"Chat with AI"}),e.jsx("p",{className:"text-white/40 text-[11px]",children:"Powered by GKK Intelligence"})]})]})]})]},"welcome"),p==="CONTACT"&&e.jsxs(f.div,{initial:{x:15,opacity:0},animate:{x:0,opacity:1},exit:{x:-15,opacity:0},className:"pandaa-contact flex-1 flex flex-col p-8 space-y-8 overflow-y-auto",children:[e.jsxs("div",{className:"space-y-1",children:[e.jsx("h2",{className:"text-xl font-black text-white uppercase tracking-tighter",children:"Support Message"}),e.jsxs("p",{className:"text-white/60 text-[12px] font-medium",children:["Trace ID: ",v.substring(0,8)]})]}),e.jsxs("div",{className:"space-y-5",children:[e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex justify-between items-center pr-1",children:[e.jsx("label",{className:"text-[9px] font-black text-white/30 uppercase tracking-[0.15em] pl-1",children:"Your Email"}),m&&!I&&e.jsx("span",{className:"text-[8px] text-red-500 font-bold",children:"@gmail.com required"})]}),e.jsx("input",{type:"email",placeholder:"name@gmail.com",value:m,onChange:t=>L(t.target.value),className:`w-full bg-white/2 border rounded-2xl p-3.5 text-white text-[14px] outline-none transition-all font-medium ${m&&!I?"border-red-500/30":"border-white/5 focus:border-[#3b42f2]/50"}`})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between pl-1",children:[e.jsxs("div",{className:"flex flex-col",children:[e.jsx("label",{className:"text-[9px] font-black text-white/30 uppercase tracking-[0.15em]",children:"Need Help?"}),d&&d.length<10&&e.jsxs("span",{className:"text-[8px] text-red-500 font-bold",children:[10-d.length," more chars"]})]}),e.jsx("button",{disabled:N>=3||!d.trim()||g,onClick:fe,className:`text-[8px] font-black px-2 py-0.5 rounded-lg border transition-all ${N>=3||!d.trim()||g?"bg-white/5 border-white/5 text-white/10 cursor-not-allowed":"bg-[#3b42f2]/10 border-[#3b42f2]/20 text-[#3b42f2] hover:bg-[#3b42f2]/20"}`,children:g?"REFINING...":`REFINE (${3-N})`})]}),e.jsx("textarea",{placeholder:"How can we assist you?",value:d,onChange:t=>D(t.target.value),rows:5,className:`w-full bg-white/2 border rounded-2xl p-3.5 text-white text-[14px] outline-none transition-all resize-none leading-relaxed font-medium ${d&&d.length<10?"border-red-500/30":"border-white/5 focus:border-[#3b42f2]/50"}`})]}),e.jsx("button",{disabled:!z,onClick:be,className:`w-full py-3.5 rounded-2xl font-black text-[15px] transition-all flex items-center justify-center gap-2.5 uppercase tracking-widest ${z?"bg-[#3b42f2] text-white shadow-lg shadow-[#3b42f2]/20 hover:scale-[1.01] active:scale-[0.99]":"bg-white/5 text-white/10 cursor-not-allowed border border-white/5"}`,children:R?"DISPATCHING...":"Send Message"})]})]},"contact"),p==="SUCCESS"&&e.jsxs(f.div,{initial:{opacity:0,scale:.9},animate:{opacity:1,scale:1},exit:{opacity:0,scale:1.1},className:"pandaa-success flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6",children:[e.jsx("div",{className:"w-24 h-24 rounded-full bg-[#0ef992]/10 border border-[#0ef992]/20 flex items-center justify-center shadow-[0_0_50px_rgba(14,249,146,0.1)]",children:e.jsx(f.svg,{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"#0ef992",strokeWidth:"3",strokeLinecap:"round",strokeLinejoin:"round",initial:{pathLength:0},animate:{pathLength:1},transition:{duration:.6,ease:"easeOut"},children:e.jsx("polyline",{points:"20 6 9 17 4 12"})})}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("h2",{className:"text-2xl font-black text-white uppercase tracking-tighter",children:"Message Logged"}),e.jsx("p",{className:"text-[#0ef992] text-[13px] font-black uppercase tracking-widest",children:"GKK Trace Success"})]}),e.jsx("p",{className:"text-white/40 text-[12px] max-w-50 leading-relaxed",children:"Your inquiry has been received. Returning to home..."})]},"success"),p==="CHAT_ENTRY"&&e.jsxs(f.div,{initial:{x:15,opacity:0},animate:{x:0,opacity:1},exit:{x:-15,opacity:0},className:"pandaa-chat-entry flex-1 flex flex-col p-8 items-center justify-center text-center space-y-8",children:[e.jsx("div",{className:"w-16 h-16 rounded-3xl bg-white/3 border border-white/10 flex items-center justify-center shadow-inner",children:e.jsx("svg",{width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",stroke:"#3b42f2",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"})})}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("h2",{className:"text-xl font-black text-white uppercase tracking-tighter",children:"GKK Help Session"}),e.jsx("p",{className:"text-white/60 text-[13px] font-medium",children:"Please enter your name to begin"})]}),e.jsxs("div",{className:"w-full max-w-70 space-y-4",children:[e.jsx("input",{type:"text",placeholder:"YOUR NAME",value:M,onChange:t=>$(t.target.value),onKeyDown:t=>t.key==="Enter"&&ne(),className:"w-full bg-white/3 border border-white/10 rounded-[20px] p-4 text-center text-white outline-none focus:border-[#3b42f2] transition-all text-lg font-black uppercase tracking-widest"}),e.jsx("button",{onClick:ne,className:"w-full py-3.5 bg-[#3b42f2] text-white rounded-[20px] font-black text-base shadow-lg shadow-[#3b42f2]/20 hover:scale-[1.01] active:scale-[0.99] transition-all uppercase tracking-tighter",children:"Start Session"})]})]},"entry"),p==="CHAT_MAIN"&&e.jsxs(f.div,{initial:{x:15,opacity:0},animate:{x:0,opacity:1},exit:{x:-15,opacity:0},className:"pandaa-chat-main flex-1 flex flex-col overflow-hidden",children:[e.jsxs("div",{className:"px-6 py-4 bg-[#161625] border-b border-white/5 flex items-center justify-between shadow-sm",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-8 h-8 rounded-lg bg-[#3b42f2]/10 border border-[#3b42f2]/20 flex items-center justify-center",children:e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"#3b42f2",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"})})}),e.jsxs("div",{className:"flex flex-col",children:[e.jsxs("span",{className:"text-white text-[12px] font-black flex items-center gap-1.5 uppercase tracking-tight",children:["Active Assistant ",e.jsx("span",{className:"w-1 h-1 rounded-full bg-[#06e4f9] animate-pulse"})]}),e.jsxs("span",{className:"text-[9px] text-white/50 font-bold uppercase tracking-widest",children:["Chatting as: ",e.jsx("button",{onClick:()=>w("CHAT_ENTRY"),className:"text-[#3b42f2] hover:underline",children:o})]})]})]}),e.jsxs("div",{className:`px-2 py-0.5 rounded-lg border text-[8px] font-black tracking-widest uppercase transition-colors ${y>=15?"bg-red-500/10 border-red-500/20 text-red-500":"bg-[#3b42f2]/10 border-[#3b42f2]/20 text-[#3b42f2]"}`,children:[15-y,"/15 MESSAGES LEFT"]})]}),e.jsxs("div",{className:"pandaa-scroll-area flex-1 overflow-y-auto p-6 space-y-5 scroll-smooth bg-[#0a0a0f]/50",children:[u.map(t=>e.jsx(de,{msg:t},t.id)),g&&e.jsxs("div",{className:"flex items-center gap-1.5 p-3.5 bg-[#1a1a2e] border border-white/5 rounded-2xl w-16",children:[e.jsx("span",{className:"w-1.5 h-1.5 bg-[#3b42f2] rounded-full animate-bounce"}),e.jsx("span",{className:"w-1.5 h-1.5 bg-[#3b42f2] rounded-full animate-bounce [animation-delay:0.2s]"}),e.jsx("span",{className:"w-1.5 h-1.5 bg-[#3b42f2] rounded-full animate-bounce [animation-delay:0.4s]"})]}),e.jsx("div",{ref:Q,className:"h-2"})]}),e.jsxs("div",{className:"p-6 border-t border-white/5 bg-[#0a0a0f] space-y-4",children:[e.jsxs("div",{className:"pandaa-input-row relative flex items-center gap-3",children:[e.jsx("input",{type:"text",value:k,disabled:y>=15||g||x>0,onChange:t=>J(t.target.value),onKeyDown:t=>t.key==="Enter"&&ae(),placeholder:y>=15?"LIMIT REACHED":x>0?`COOLDOWN: ${x}s`:g?"PANDAA is thinking...":"Type your message...",className:`pandaa-chat-input w-full bg-[#1a1a2e] border text-white rounded-[18px] py-3.5 pl-5 pr-12 text-[14px] outline-none transition-all placeholder:text-white/30 font-medium ${y>=15||x>0?"border-red-500/20 cursor-not-allowed":"border-white/5 focus:border-[#3b42f2]/50"}`}),e.jsx("button",{disabled:y>=15||g||x>0,onClick:ae,className:`pandaa-send-btn absolute right-2 p-2 text-white rounded-xl transition-all flex items-center justify-center shadow-lg ${y>=15||g||x>0?"bg-white/5 cursor-not-allowed text-white/20":"bg-[#3b42f2] hover:scale-105 active:scale-95 shadow-[#3b42f2]/30"}`,children:x>0?e.jsxs("span",{className:"text-[10px] font-bold",children:[x,"s"]}):e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polygon",{points:"22 2 15 22 11 13 2 9 22 2"})})})]}),e.jsx("div",{className:"flex justify-center",children:e.jsxs("p",{className:"pandaa-chat-meta text-[8px] text-white/40 font-bold tracking-[0.2em] uppercase",children:["PANDAA GKK V1.3 • ",v.substring(0,10)]})})]})]},"chat")]})})]})})]})},Ce=()=>{const{playClick:l}=ve();return e.jsx(Se,{playClick:l,supabase:je,contactSource:"LANDING_PAGE"})};export{Ce as PandaaBot};
