/* ══ KEY MANAGEMENT ══════════════════════════════════════════════════ */
let API_KEY = '';

function saveKey() {
  var v = document.getElementById('apiIn').value.trim();
  var status = document.getElementById('keyStatus');
  if (!v || v.length < 10) {
    status.textContent = '✗ Please paste your full API key';
    status.className = '';
    return;
  }
  API_KEY = v;
  try { localStorage.setItem('orbit_key', v); } catch(e) {}
  status.textContent = '✓ Key saved! Agent activated.';
  status.className = 'ok';
  setTimeout(function() {
    document.getElementById('keyBanner').classList.add('off');
  }, 1000);
}

window.addEventListener('DOMContentLoaded', function() {
  try {
    var saved = localStorage.getItem('orbit_key');
    if (saved && saved.length > 10) {
      API_KEY = saved;
      document.getElementById('apiIn').value = saved;
      document.getElementById('keyStatus').textContent = '✓ Key active — agent running';
      document.getElementById('keyStatus').className = 'ok';
      document.getElementById('keyBanner').classList.add('off');
    }
  } catch(e) {}
  renderQueue();
  renderMemory();
});

/* ══ NAVIGATION ══════════════════════════════════════════════════════ */
var TITLES = {
  dash:'Dashboard', accounts:'Accounts', content:'AI Content Generator',
  scheduler:'Post Scheduler', media:'Media Generator', automation:'Agent Automation',
  analytics:'Analytics AI', comments:'Comment & DM AI', trends:'Trend Detection',
  competitor:'Competitor Analysis', growth:'Growth Optimizer',
  memory:'Agent Memory', safety:'Safety Layer', video:'Video Studio'
};

function go(id, el) {
  document.querySelectorAll('.tab').forEach(function(t){ t.classList.remove('on'); });
  document.querySelectorAll('.ni').forEach(function(n){ n.classList.remove('on'); });
  document.getElementById('tab-' + id).classList.add('on');
  el.classList.add('on');
  document.getElementById('pgTitle').textContent = TITLES[id] || id;
}

function goM(id, el) {
  document.querySelectorAll('.tab').forEach(function(t){ t.classList.remove('on'); });
  document.querySelectorAll('.mn').forEach(function(m){ m.classList.remove('on'); });
  document.getElementById('tab-' + id).classList.add('on');
  el.classList.add('on');
  document.getElementById('pgTitle').textContent = TITLES[id] || id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ══ PLATFORM TOGGLE ════════════════════════════════════════════════ */
function tpp(btn, code) {
  if (btn.classList.contains(code)) {
    btn.className = 'pp';
  } else {
    btn.classList.add(code);
  }
}
function activePlats(wrapId) {
  var btns = Array.from(document.querySelectorAll('#' + wrapId + ' .pp'))
    .filter(function(b) { return ['ig','fb','tt','yt','tw'].some(function(c){ return b.classList.contains(c); }); });
  return btns.map(function(b){ return b.textContent.trim(); }).join(', ') || 'Instagram';
}

/* ══ HELPERS ════════════════════════════════════════════════════════ */
function noKey(outId, btnId) {
  var o = document.getElementById(outId);
  o.style.display = '';
  o.innerHTML = '<span style="color:#ef4444;">⚠ No API key saved. Paste your Anthropic key in the banner at the top and click Save & Activate.</span>';
  if (btnId) document.getElementById(btnId).disabled = false;
}
function setLoad(outId, btnId) {
  var o = document.getElementById(outId);
  o.style.display = '';
  o.innerHTML = '<div class="spinning"><div class="sp"></div>AI agent working...</div>';
  if (btnId) document.getElementById(btnId).disabled = true;
}
function setOut(outId, btnId, text) {
  var o = document.getElementById(outId);
  o.textContent = text;
  addCopy(o);
  if (btnId) document.getElementById(btnId).disabled = false;
}
function errOut(outId, btnId, msg) {
  var o = document.getElementById(outId);
  o.innerHTML = '<span style="color:#ef4444;">Error: ' + msg + '</span>';
  if (btnId) document.getElementById(btnId).disabled = false;
}
function addCopy(el) {
  var b = document.createElement('button');
  b.className = 'cpb'; b.textContent = 'COPY';
  b.onclick = function() {
    navigator.clipboard.writeText(el.innerText.replace('COPY','').trim());
    b.textContent = '✓ COPIED';
    setTimeout(function(){ b.textContent = 'COPY'; }, 2000);
  };
  el.appendChild(b);
}

/* ══ CLAUDE API ═════════════════════════════════════════════════════ */
async function ai(prompt, maxTokens) {
  maxTokens = maxTokens || 1200;
  if (!API_KEY) throw new Error('NO_KEY');
  var res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-calls': 'true'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  var d = await res.json();
  if (d.error) throw new Error(d.error.message);
  return d.content.map(function(b){ return b.text || ''; }).join('\n').trim();
}

/* ══ DASHBOARD ══════════════════════════════════════════════════════ */
async function quickCap() {
  var topic = document.getElementById('qTopic').value.trim();
  var plat = document.getElementById('qPlat').value;
  if (!API_KEY) { noKey('qOut','qBtn'); return; }
  if (!topic) { document.getElementById('qOut').style.display=''; document.getElementById('qOut').innerHTML='<span style="color:var(--yellow)">Enter a topic first.</span>'; return; }
  setLoad('qOut','qBtn');
  try {
    var t = await ai('Write a viral ' + plat + ' caption with hashtags for: ' + topic + '. Make it engaging, include 10-15 hashtags, and add a call to action.', 500);
    setOut('qOut','qBtn',t);
  } catch(e) { errOut('qOut','qBtn',e.message); }
}

/* ══ ACCOUNTS ═══════════════════════════════════════════════════════ */
var accounts = JSON.parse(localStorage.getItem('orbit_accounts') || '[]');
function addAccount() {
  var platform = document.getElementById('acPlat').value;
  var handle = document.getElementById('acHandle').value.trim();
  var niche = document.getElementById('acNiche').value.trim();
  var followers = document.getElementById('acFollowers').value.trim();
  if (!handle) return;
  accounts.push({ platform, handle: handle.startsWith('@') ? handle : '@' + handle, niche, followers });
  localStorage.setItem('orbit_accounts', JSON.stringify(accounts));
  renderAccounts();
  document.getElementById('acHandle').value = '';
}
function renderAccounts() {
  var el = document.getElementById('acList');
  if (!accounts.length) { el.innerHTML = '<div style="color:var(--t3);font-size:12px;padding:8px 0;">No accounts connected yet.</div>'; return; }
  var icons = { Instagram:'📸', TikTok:'🎵', Facebook:'📘', YouTube:'📺', 'Twitter/X':'🐦' };
  el.innerHTML = accounts.map(function(a, i) {
    return '<div class="acc-card"><span class="acc-plat">' + (icons[a.platform]||'📱') + '</span><div class="acc-info"><div class="acc-handle">' + a.handle + '</div><div class="acc-sub">' + a.platform + (a.niche ? ' · ' + a.niche : '') + (a.followers ? ' · ' + a.followers + ' followers' : '') + '</div></div><button class="acc-del" onclick="delAccount(' + i + ')">✕</button></div>';
  }).join('');
}
function delAccount(i) { accounts.splice(i, 1); localStorage.setItem('orbit_accounts', JSON.stringify(accounts)); renderAccounts(); }
async function analyzeAccount() {
  var niche = document.getElementById('anNiche').value.trim();
  var followers = document.getElementById('anFollowers').value.trim();
  var goal = document.getElementById('anGoal').value;
  if (!API_KEY) { noKey('anOut','anBtn'); return; }
  if (!niche) { document.getElementById('anOut').style.display=''; document.getElementById('anOut').innerHTML='<span style="color:var(--yellow)">Enter your niche first.</span>'; return; }
  setLoad('anOut','anBtn');
  try {
    var t = await ai('Analyze this social media account and give actionable recommendations:\nNiche: ' + niche + '\nFollowers: ' + (followers||'unknown') + '\nGoal: ' + goal + '\n\nProvide: Profile optimization tips, content strategy, posting frequency, hashtag strategy, and 3 immediate action steps.', 900);
    setOut('anOut','anBtn',t);
  } catch(e) { errOut('anOut','anBtn',e.message); }
}

/* ══ AI CONTENT ═════════════════════════════════════════════════════ */
async function genContent() {
  var type = document.getElementById('ctType').value;
  var topic = document.getElementById('ctTopic').value.trim();
  var tone = document.getElementById('ctTone').value;
  var aud = document.getElementById('ctAud').value || 'general audience';
  if (!API_KEY) { noKey('ctOut','ctBtn'); return; }
  if (!topic) { document.getElementById('ctOut').innerHTML='<span style="color:var(--yellow)">Enter a topic first.</span>'; return; }
  setLoad('ctOut','ctBtn');
  try {
    var t = await ai('Create a ' + type + ' about: ' + topic + '\nTone: ' + tone + ' | Audience: ' + aud + '\nMake it highly engaging and optimized for maximum reach. Format it clearly and ready to post.', 1000);
    setOut('ctOut','ctBtn',t);
  } catch(e) { errOut('ctOut','ctBtn',e.message); }
}

/* ══ SCHEDULER ══════════════════════════════════════════════════════ */
var queue = JSON.parse(localStorage.getItem('orbit_queue') || '[]');
function addPost() {
  var cap = document.getElementById('schCap').value.trim();
  var plat = document.getElementById('schPlat').value;
  var time = document.getElementById('schTime').value;
  var status = document.getElementById('schStatus').value;
  if (!cap) return;
  queue.push({ cap, plat, time, status });
  localStorage.setItem('orbit_queue', JSON.stringify(queue));
  renderQueue();
  document.getElementById('schCap').value = '';
}
function renderQueue() {
  var el = document.getElementById('queueList');
  if (!el) return;
  if (!queue.length) { el.innerHTML = '<div style="color:var(--t3);font-size:12px;padding:10px;">No posts scheduled yet.</div>'; return; }
  el.innerHTML = queue.map(function(p, i) {
    return '<div class="slot"><span class="slot-time">' + (p.time ? p.time.replace('T',' ') : 'No time') + '</span><div class="slot-info"><div>' + p.cap.substring(0,55) + (p.cap.length>55?'...':'') + '</div><div class="slot-plat">' + p.plat + '</div></div><span class="' + p.status + '">' + (p.status==='status-sched'?'SCHEDULED':'DRAFT') + '</span><button class="slot-del" onclick="delPost(' + i + ')">✕</button></div>';
  }).join('');
}
function delPost(i) { queue.splice(i, 1); localStorage.setItem('orbit_queue', JSON.stringify(queue)); renderQueue(); }
async function bestTime() {
  var plat = document.getElementById('schPlat').value;
  if (!API_KEY) { noKey('btOut','btBtn'); return; }
  setLoad('btOut','btBtn');
  try {
    var t = await ai('What are the best times to post on ' + plat + ' for maximum engagement? Give specific times with timezone context and explain why each time works.', 500);
    setOut('btOut','btBtn',t);
  } catch(e) { errOut('btOut','btBtn',e.message); }
}

/* ══ MEDIA GEN ══════════════════════════════════════════════════════ */
async function genMedia() {
  var idea = document.getElementById('mgIdea').value.trim();
  var plat = document.getElementById('mgPlat').value;
  var style = document.getElementById('mgStyle').value;
  var niche = document.getElementById('mgNiche').value || 'general';
  if (!API_KEY) { noKey('mgOut','mgBtn'); return; }
  if (!idea) { document.getElementById('mgOut').innerHTML='<span style="color:var(--yellow)">Enter a content idea first.</span>'; return; }
  setLoad('mgOut','mgBtn');
  try {
    var t = await ai('Generate 5 detailed AI image prompts for ' + plat + ' in ' + niche + ' niche.\nIdea: ' + idea + ' | Style: ' + style + '\n\nFor each prompt:\nPROMPT [N]: [detailed, specific prompt ready for Midjourney or DALL-E 3]\nBEST FOR: [which tool works best]\nTIP: [one tip to improve the result]\n\nMake prompts detailed with lighting, composition, mood, colors.', 900);
    setOut('mgOut','mgBtn',t);
  } catch(e) { errOut('mgOut','mgBtn',e.message); }
}

/* ══ AUTOMATION ═════════════════════════════════════════════════════ */
async function runAuto() {
  var idea = document.getElementById('autoIdea').value.trim();
  var plat = document.getElementById('autoPlat').value;
  var type = document.getElementById('autoType').value;
  if (!API_KEY) { noKey('autoOut','autoBtn'); return; }
  if (!idea) { document.getElementById('autoOut').innerHTML='<span style="color:var(--yellow)">Enter a content idea first.</span>'; return; }
  setLoad('autoOut','autoBtn');
  try {
    var t = await ai('Run this automation workflow for ' + plat + ':\nType: ' + type + '\nIdea: ' + idea + '\n\nExecute the full workflow step by step, clearly labeled. Include everything needed to publish this content.', 1200);
    setOut('autoOut','autoBtn',t);
  } catch(e) { errOut('autoOut','autoBtn',e.message); }
}

/* ══ ANALYTICS ══════════════════════════════════════════════════════ */
async function analyzeStats() {
  var plat = document.getElementById('anPl').value;
  var fol = document.getElementById('anFol').value || '0';
  var like = document.getElementById('anLike').value || '0';
  var com = document.getElementById('anCom').value || '0';
  var reach = document.getElementById('anReach').value || '0';
  var freq = document.getElementById('anFreq').value;
  if (!API_KEY) { noKey('asOut','asBtn'); return; }
  setLoad('asOut','asBtn');
  try {
    var t = await ai('Analyze these ' + plat + ' stats and give a detailed performance report:\nFollowers: ' + fol + ' | Avg Likes: ' + like + ' | Avg Comments: ' + com + ' | Avg Reach: ' + reach + ' | Post Frequency: ' + freq + '\n\nInclude: Engagement rate calculation, benchmark comparison, what\'s working, what to improve, top 5 actionable recommendations, and a score out of 10.', 900);
    setOut('asOut','asBtn',t);
  } catch(e) { errOut('asOut','asBtn',e.message); }
}

/* ══ COMMENTS ═══════════════════════════════════════════════════════ */
async function genReply() {
  var msg = document.getElementById('cmMsg').value.trim();
  var type = document.getElementById('cmType').value;
  var niche = document.getElementById('cmNiche').value || 'general';
  var tone = document.getElementById('cmTone').value;
  if (!API_KEY) { noKey('cmOut','cmBtn'); return; }
  if (!msg) { document.getElementById('cmOut').innerHTML='<span style="color:var(--yellow)">Paste a comment or DM first.</span>'; return; }
  setLoad('cmOut','cmBtn');
  try {
    var t = await ai('Generate 5 different replies for this ' + type + ' in ' + niche + ' niche:\n"' + msg + '"\nTone: ' + tone + '\n\nFor each reply:\nREPLY [N]: [the reply text]\nWHY: [why this reply works]\n\nMake each reply unique in approach.', 800);
    setOut('cmOut','cmBtn',t);
  } catch(e) { errOut('cmOut','cmBtn',e.message); }
}

/* ══ TRENDS ═════════════════════════════════════════════════════════ */
async function getTrends() {
  var niche = document.getElementById('trNiche').value.trim();
  var plat = document.getElementById('trPlat').value;
  var type = document.getElementById('trType').value;
  if (!API_KEY) { noKey('trOut','trBtn'); return; }
  if (!niche) { document.getElementById('trOut').innerHTML='<span style="color:var(--yellow)">Enter your niche first.</span>'; return; }
  setLoad('trOut','trBtn');
  try {
    var t = await ai('Identify ' + type + ' for ' + niche + ' niche on ' + plat + '.\n\nProvide specific, actionable trend intelligence including: trending topics, content ideas to create NOW, hashtags to use, format recommendations, and why each trend is working. Be specific and current.', 1000);
    setOut('trOut','trBtn',t);
  } catch(e) { errOut('trOut','trBtn',e.message); }
}

/* ══ COMPETITOR ═════════════════════════════════════════════════════ */
async function analyzeComp() {
  var niche = document.getElementById('cpNiche').value.trim();
  var user = document.getElementById('cpUser').value.trim();
  var plat = document.getElementById('cpPlat').value;
  var fol = document.getElementById('cpFol').value || 'unknown';
  var type = document.getElementById('cpType').value;
  if (!API_KEY) { noKey('cpOut','cpBtn'); return; }
  if (!niche) { document.getElementById('cpOut').innerHTML='<span style="color:var(--yellow)">Enter your niche first.</span>'; return; }
  setLoad('cpOut','cpBtn');
  try {
    var t = await ai('Do a ' + type + ' for a ' + niche + ' ' + plat + ' account called ' + (user||'a typical competitor') + ' with ~' + fol + ' followers.\n\nBase this on typical successful accounts in this niche. Include: content strategy, posting patterns, engagement tactics, strengths, weaknesses I can exploit, and 3 ways to beat them.', 1000);
    setOut('cpOut','cpBtn',t);
  } catch(e) { errOut('cpOut','cpBtn',e.message); }
}

/* ══ GROWTH ═════════════════════════════════════════════════════════ */
async function growthPlan() {
  var plat = document.getElementById('grPlat').value;
  var fol = document.getElementById('grFol').value || '0';
  var goal = document.getElementById('grGoal').value.trim() || '10000 followers';
  var niche = document.getElementById('grNiche').value.trim() || 'general';
  var time = document.getElementById('grTime').value;
  if (!API_KEY) { noKey('grOut','grBtn'); return; }
  setLoad('grOut','grBtn');
  try {
    var t = await ai('Create a personalized 30-day ' + plat + ' growth plan:\nCurrent followers: ' + fol + ' | Goal: ' + goal + ' | Niche: ' + niche + ' | Daily time: ' + time + '\n\nInclude: Week-by-week breakdown, daily action items, content pillars, hashtag strategy, engagement tactics, milestones, and what to track. Be specific and actionable.', 1300);
    setOut('grOut','grBtn',t);
  } catch(e) { errOut('grOut','grBtn',e.message); }
}

/* ══ MEMORY ═════════════════════════════════════════════════════════ */
var memories = JSON.parse(localStorage.getItem('orbit_memory') || '[]');
function saveMemory() {
  var type = document.getElementById('memType').value;
  var text = document.getElementById('memText').value.trim();
  if (!text) return;
  memories.unshift({ type, text, date: new Date().toLocaleDateString() });
  localStorage.setItem('orbit_memory', JSON.stringify(memories));
  renderMemory();
  document.getElementById('memText').value = '';
}
function renderMemory() {
  var el = document.getElementById('memList');
  var cnt = document.getElementById('memCount');
  if (!el) return;
  if (cnt) cnt.textContent = memories.length ? '(' + memories.length + ')' : '';
  if (!memories.length) { el.innerHTML = '<div style="color:var(--t3);font-size:12px;padding:10px;">No memories saved yet.</div>'; return; }
  el.innerHTML = memories.map(function(m, i) {
    return '<div class="mem-card"><span style="font-size:16px;">' + m.type.split(' ')[0] + '</span><div style="flex:1;"><div class="mem-text">' + m.text + '</div><div class="mem-tag">' + m.type + ' · ' + m.date + '</div></div><button class="mem-del" onclick="delMemory(' + i + ')">✕</button></div>';
  }).join('');
}
function delMemory(i) { memories.splice(i, 1); localStorage.setItem('orbit_memory', JSON.stringify(memories)); renderMemory(); }
async function aiMemory() {
  if (!API_KEY) { noKey('amOut','amBtn'); return; }
  if (!memories.length) { document.getElementById('amOut').style.display=''; document.getElementById('amOut').innerHTML='<span style="color:var(--yellow)">Save some memories first.</span>'; return; }
  setLoad('amOut','amBtn');
  try {
    var memText = memories.map(function(m){ return m.type + ': ' + m.text; }).join('\n');
    var t = await ai('Analyze these social media insights and create a strategic summary:\n' + memText + '\n\nIdentify patterns, key learnings, and give 5 strategic recommendations based on what has worked and what hasn\'t.', 800);
    setOut('amOut','amBtn',t);
  } catch(e) { errOut('amOut','amBtn',e.message); }
}

/* ══ SAFETY ═════════════════════════════════════════════════════════ */
async function safetyCheck() {
  var text = document.getElementById('sfText').value.trim();
  var plat = document.getElement
