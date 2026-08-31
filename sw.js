const CACHE='jifen-v20260831-6';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin===self.location.origin && (url.pathname.endsWith('/app.html')||url.pathname==='/'||url.pathname.endsWith('/index.html'))){
    event.respondWith((async()=>{
      try{
        const res=await fetch(event.request,{cache:'no-store'});
        const ct=res.headers.get('content-type')||'';
        if(!ct.includes('text/html')) return res;
        const text=await res.text();
        const css='<link rel="stylesheet" href="/mobile.css?v=6">';
        const patched=text.includes('mobile.css')?text:text.replace('</head>',css+'</head>');
        const headers=new Headers(res.headers); headers.set('Cache-Control','no-store');
        return new Response(patched,{status:res.status,statusText:res.statusText,headers});
      }catch(e){return caches.match(event.request)}
    })());
    return;
  }
  event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match(event.request)));
});
