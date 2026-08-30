from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

s = s.replace('<input id="email" type="email" placeholder="输入邮箱">', '<input id="email" type="text" autocomplete="username" placeholder="例如：admin">')
s = s.replace('<p>教师端 · 云端正式版</p>', '<p>教师账号 · 云端正式版</p>')
s = s.replace('<span id="sideEmail"></span>', '<span id="sideEmail"></span>')

old = "let state={classes:[],students:[],reasons:[],rewards:[],transactions:[],redemptions:[],user:null,selected:null,mode:'add'};"
new = "let state={classes:[],students:[],reasons:[],rewards:[],transactions:[],redemptions:[],user:null,teacher:null,selected:null,mode:'add'};"
s = s.replace(old, new)

old_auth = '''async function auth(){const {data:{session}}=await sb.auth.getSession(); if(session) enter(session.user); else showLogin(); sb.auth.onAuthStateChange((_e,s)=>{if(s)enter(s.user);else showLogin()})}
function showLogin(){$('login').classList.remove('hidden');$('app').classList.add('hidden')}
function enter(user){state.user=user;$('login').classList.add('hidden');$('app').classList.remove('hidden');$('userEmail').textContent=user.email||'';$('sideEmail').textContent=user.email||'';loadAll()}
$('loginBtn').onclick=async()=>{const email=$('email').value.trim(),password=$('password').value;if(!email||!password)return $('authMsg').textContent='请输入邮箱和密码';$('authMsg').textContent='登录中…';const {error}=await sb.auth.signInWithPassword({email,password});if(error)$('authMsg').textContent=error.message;else $('authMsg').textContent=''};
$('signup').onclick=async()=>{const email=$('email').value.trim(),password=$('password').value;if(!email||password.length<6)return $('authMsg').textContent='请输入邮箱，密码至少 6 位';const {error}=await sb.auth.signUp({email,password});$('authMsg').textContent=error?error.message:'注册成功，请按提示完成邮箱验证后登录。'};
$('logout').onclick=()=>sb.auth.signOut();'''
new_auth = '''function teacherEmail(username){return `${username.toLowerCase().replace(/[^a-z0-9._-]/g,'-')}@teacher.jifen.local`}
async function auth(){const {data:{session}}=await sb.auth.getSession(); if(session) enter(session.user); else showLogin(); sb.auth.onAuthStateChange((_e,s)=>{if(s)enter(s.user);else showLogin()})}
function showLogin(){$('login').classList.remove('hidden');$('app').classList.add('hidden')}
async function enter(user){state.user=user;const {data:teacher}=await sb.from('teacher_accounts').select('username,display_name').eq('user_id',user.id).maybeSingle();state.teacher=teacher||{username:user.user_metadata?.username||'',display_name:user.user_metadata?.display_name||''};$('login').classList.add('hidden');$('app').classList.remove('hidden');const label=state.teacher.display_name||state.teacher.username||'教师';$('userEmail').textContent=label;$('sideEmail').textContent=state.teacher.username||label;loadAll()}
$('loginBtn').onclick=async()=>{const username=$('email').value.trim().toLowerCase(),password=$('password').value;if(!username||!password)return $('authMsg').textContent='请输入教师账号和密码';if(!/^[a-z0-9._-]{3,32}$/.test(username))return $('authMsg').textContent='账号需为 3-32 位字母、数字、点、下划线或短横线';$('authMsg').textContent='登录中…';const {error}=await sb.auth.signInWithPassword({email:teacherEmail(username),password});if(error)$('authMsg').textContent='账号或密码错误';else $('authMsg').textContent=''};
$('signup').onclick=async()=>{const username=$('email').value.trim().toLowerCase(),password=$('password').value;if(!/^[a-z0-9._-]{3,32}$/.test(username))return $('authMsg').textContent='账号需为 3-32 位字母、数字、点、下划线或短横线';if(password.length<6)return $('authMsg').textContent='密码至少 6 位';$('authMsg').textContent='正在创建教师账号…';try{const r=await fetch(`${SUPABASE_URL}/functions/v1/teacher-register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password,display_name:username})});const data=await r.json();if(!r.ok)return $('authMsg').textContent=data.error||'注册失败';const {error}=await sb.auth.signInWithPassword({email:teacherEmail(username),password});$('authMsg').textContent=error?'账号已创建，请重新登录':'注册成功，正在进入系统…'}catch(e){$('authMsg').textContent='注册服务暂时不可用'}};
$('logout').onclick=()=>sb.auth.signOut();'''
if old_auth not in s:
    raise SystemExit('auth block not found; aborting')
s = s.replace(old_auth, new_auth)

p.write_text(s, encoding='utf-8')
