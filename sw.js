const EXAM_SCRIPT = String.raw`
(function(){
  if(window.__examScoresInstalled) return;
  window.__examScoresInstalled = true;
  const $ = id => document.getElementById(id);
  const esc2 = s => String(s ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const css = document.createElement('style');
  css.textContent = '.exam-panel{margin-top:12px}.exam-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:end}.exam-toolbar .field{flex:1;min-width:120px;margin:0}.exam-list{max-height:300px;overflow:auto}.exam-row{display:grid;grid-template-columns:1fr 80px 90px 70px;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid #f0f2f5;font-size:13px}.exam-row:last-child{border-bottom:0}.exam-score{font-size:18px;font-weight:900;color:#2563eb}.exam-empty{padding:20px;text-align:center;color:#748094}.exam-summary{display:flex;gap:18px;flex-wrap:wrap;margin-bottom:12px}.exam-summary b{font-size:20px;color:#2563eb}.exam-add{margin-top:12px;padding-top:12px;border-top:1px solid #eef1f5}@media(max-width:720px){.exam-row{grid-template-columns:1fr 65px 80px 55px}.exam-toolbar .field{min-width:100px}}';
  document.head.appendChild(css);
  function getSelected(){ return typeof state !== 'undefined' && state.selected ? state.selected : null; }
  async function loadScores(studentId){
    if(typeof sb === 'undefined') return [];
    const {data,error}=await sb.from('exam_scores').select('*').eq('student_id',studentId).order('exam_date',{ascending:false}).order('created_at',{ascending:false});
    if(error){ console.error(error); return []; }
    return data||[];
  }
  function examHtml(scores){
    const avg=scores.length?(scores.reduce((a,x)=>a+Number(x.score||0),0)/scores.length).toFixed(1):'0';
    const best=scores.length?Math.max(...scores.map(x=>Number(x.score||0))):0;
    return '<div class="panel exam-panel"><div class="panel-head">考试成绩 <button class="btn secondary" id="examRefresh">刷新</button></div><div class="panel-body">'
      +'<div class="exam-summary"><div>考试次数 <b>'+scores.length+'</b></div><div>平均分 <b>'+avg+'</b></div><div>最高分 <b>'+best+'</b></div></div>'
      +'<div class="exam-add"><div class="exam-toolbar">'
      +'<div class="field"><label>考试名称</label><input id="examName" placeholder="例如：期中考试"></div>'
      +'<div class="field"><label>科目</label><input id="examSubject" placeholder="数学"></div>'
      +'<div class="field"><label>日期</label><input id="examDate" type="date" value="'+new Date().toISOString().slice(0,10)+'"></div>'
      +'<div class="field"><label>得分</label><input id="examScore" type="number" min="0" step="0.5" placeholder="95"></div>'
      +'<div class="field"><label>满分</label><input id="examTotal" type="number" min="1" value="100"></div>'
      +'<button class="btn primary" id="examSave">＋ 记录成绩</button></div></div>'
      +'<div class="exam-list" style="margin-top:12px">'
      +(scores.length?scores.map(x=>'<div class="exam-row"><div><b>'+esc2(x.exam_name)+'</b><div style="color:#748094;margin-top:3px">'+esc2(x.subject||'')+' · '+esc2(x.exam_date||'')+(x.notes?' · '+esc2(x.notes):'')+'</div></div><div class="exam-score">'+Number(x.score)+'</div><div>满分 '+Number(x.total_score)+'</div><button class="btn secondary" data-del-exam="'+x.id+'">删除</button></div>').join(''):'<div class="exam-empty">还没有考试成绩，先记录一次吧。</div>')
      +'</div></div></div>';
  }
  async function renderExamSection(){
    const s=getSelected(), body=$('studentModalBody'); if(!s||!body) return;
    let panel=document.getElementById('examPanel');
    if(!panel){ panel=document.createElement('div'); panel.id='examPanel'; body.appendChild(panel); }
    panel.innerHTML='<div class="exam-empty">正在加载考试成绩…</div>';
    const scores=await loadScores(s.id);
    panel.innerHTML=examHtml(scores);
    if($('examRefresh')) $('examRefresh').onclick=renderExamSection;
    if($('examSave')) $('examSave').onclick=async function(){
      const name=$('examName').value.trim(), subject=$('examSubject').value.trim(), date=$('examDate').value, score=Number($('examScore').value), total=Number($('examTotal').value||100);
      if(!name||!subject||!date||Number.isNaN(score)||score<0||!total||score>total) return window.toast ? window.toast('请填写正确的考试名称、科目和分数') : alert('请填写正确的考试名称、科目和分数');
      const user=(typeof state !== 'undefined')?state.user:null;
      const {error}=await sb.from('exam_scores').insert({student_id:s.id,teacher_id:user&&user.id?user.id:null,exam_name:name,subject,exam_date:date,score,total_score:total});
      if(error) return window.toast?window.toast('保存失败：'+error.message):alert(error.message);
      if(window.toast) window.toast('考试成绩已保存');
      await renderExamSection();
    };
    panel.querySelectorAll('[data-del-exam]').forEach(btn=>btn.onclick=async()=>{
      if(!confirm('确定删除这条考试成绩吗？')) return;
      const {error}=await sb.from('exam_scores').delete().eq('id',btn.dataset.delExam);
      if(error) return window.toast?window.toast('删除失败：'+error.message):alert(error.message);
      if(window.toast) window.toast('已删除');
      await renderExamSection();
    });
  }
  function installButton(){
    const body=$('studentModalBody');
    if(!body) return;
    const tabs=body.querySelector('.tabs');
    if(!tabs || tabs.querySelector('#examScoresBtn')) return;
    const btn=document.createElement('button'); btn.id='examScoresBtn'; btn.className='tab'; btn.textContent='📚 考试成绩';
    btn.onclick=renderExamSection; tabs.appendChild(btn);
    renderExamSection();
  }
  const mo=new MutationObserver(()=>{ if($('studentModal')?.classList.contains('show')) installButton(); });
  mo.observe(document.body,{subtree:true,childList:true});
  setInterval(()=>{ if($('studentModal')?.classList.contains('show')) installButton(); },800);
})();
`;

self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (new URL(event.request.url).pathname.endsWith('/app.html')) {
    event.respondWith((async()=>{
      const res=await fetch(event.request);
      let text=await res.text();
      if(!text.includes('__examScoresInstalled')) text=text.replace('</body>','<script>'+EXAM_SCRIPT+'</script></body>');
      return new Response(text,{status:res.status,statusText:res.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
    })());
  }
});
