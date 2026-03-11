/* ══ KEY MANAGEMENT ══════════════════════════════════════════════════ */
let API_KEY = localStorage.getItem('orbit_key') || '';
window.addEventListener('DOMContentLoaded', () => {
  if (API_KEY) {
    document.getElementById('apiIn').value = API_KEY;
    document.getElementById('keyStatus').textContent = '✓ Key active — agent running';
    document.getElementById('keyStatus').className = 'ok';
    document.getElementById('keyBanner').classList.add('off');
  }
  renderMemory();
  renderQueue();
});

function saveKey() {
  const v = document.getElementById('apiIn').value.trim();
  if (!v || v.length < 20) {
    document.getElementById('keyStatus').textContent = '✗ Key too short — paste the full key';
    document.getElementById('keyStatus').className = '';
    return;
  }
  API_KEY = v;
  localStorage.setItem('orbit_key', v);
  document.getElementById('keyStatus').textContent = '✓ Key saved — agent activated!';
  document.getElementById('keyStatus').className = 'ok';
  setTimeout(() => document.getElementById('keyBanner').classList.add('off'), 1200);
}

/* ══ NAVIGATION ══════════════════════════════════════════════════════ */
const TITLES = {
  dash:'Dashboard', accounts:'Account Integration', content:'AI Content Generator',
  scheduler:'Post Scheduler', media:'Media Generator', automation:'Agent Automation',
  analytics:'Analytics AI', comments:'Comment & DM AI', trends:'Trend Detection',
  competitor:'Competitor Analysis', growth:'Growth Optimizer',
  memory:'Agent Memory', safety:'Safety Layer', video:'Video Studio'
};
function go(id, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('on'));
  document.getElementById('tab-' + id).classList.add('on');
  el.classList.add('on');
  document.getElementById('pgTitle').textContent = TITLES[id];
}

/* ══ PLATFORM TOGGLE ═════════════════════════════════════════════════ */
function tpp(btn, code) {
  const cls = code; // ig, fb, tt, yt, tw
  if (btn.classList.contains(cls)) {
    btn.className = 'pp';
  } else {
    btn.classList.add(cls);
  }
}
function activePlats(wrapId) {
  const btns = Array.from(document.querySelectorAll(`#${wrapId} .pp`))
    .filter(b => ['ig','fb','tt','yt','tw'].some(c => b.classList.contains(c)));
  return btns.map(b => b.textContent.trim()).join(', ') || 'Instagram';
}

/* ══ HELPERS ═════════════════════════════════════════════════════════ */
function cc(el, cid) {
  const n = el.value.length;
  const e = document.getElementById(cid);
  if (!e) return;
  e.textContent = n + ' chars';
  e.className = 'cc' + (n > 2200 ? ' ov' : n > 1500 ? ' yw' : '');
}
function noKey(outId, btnId) {
  const o = document.getElementById(outId);
  o.style.display = '';
  o.innerHTML = '<span style="color:#ef4444;">⚠ No API key. Paste your Anthropic key in the banner at the top of the page.</span>';
  if (btnId) document.getElementById(btnId).disabled = false;
}
function setLoad(outId, btnId) {
  const o = document.getElementById(outId);
  o.style.display = '';
  o.innerHTML = '<div class="spinning"><div class="sp"></div>AI agent working...</div>';
  if (btnId) document.getElementById(btnId).disabled = true;
}
function setOut(outId, btnId, text) {
  const o = document.getElementById(outId);
  o.textContent = text;
  addCopy(o);
  if (btnId) document.getElementById(btnId).disabled = false;
}
function addCopy(el) {
  const b = document.createElement('button');
  b.className = 'cpb'; b.textContent = 'COPY';
  b.onclick = () => {
    navigator.clipboard.writeText(el.innerText.replace('COPY','').trim());
    b.textContent = '✓ COPIED';
    setTimeout(() => b.textContent = 'COPY', 2000);
  };
  el.appendChild(b);
}
function errOut(outId, btnId, msg) {
  const o = document.getElementById(outId);
  o.innerHTML = `<span style="color:#ef4444;">Error: ${msg}</span>`;
  if (btnId) document.getElementById(btnId).disabled = false;
}

/* ══ CLAUDE API ══════════════════════════════════════════════════════ */
async function ai(prompt, maxTokens = 1200) {
  if (!API_KEY) throw new Error('NO_KEY');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-calls': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const d = await res.json();
  if (d.error) throw new Error(d.error.message);
  return d.content.map(b => b.text || '').join('\n').trim();
}

/* ══ DASHBOARD: QUICK CAPTION ════════════════════════════════════════ */
async function quickCap() {
  const topic = document.getElementById('qTopic').value.trim();
  const plat = document.getElementById('qPlat').value;
  if (!API_KEY) { noKey('qOut', null); return; }
  if (!topic) { document.getElementById('qOut').innerHTML = '<span style="color:var(--yellow)">Enter a topic first.</span>'; return; }
  setLoad('qOut', null);
  try {
    const t = await ai(`Write one engaging ${plat} caption for: "${topic}". Include relevant emojis and 5 trending hashtags. Be concise and platform-appropriate.`);
    setOut('qOut', null, t);
  } catch(e) { errOut('qOut', null, e.message); }
}

/* ══ P1: ACCOUNT ANALYZER ════════════════════════════════════════════ */
let accounts = JSON.parse(localStorage.getItem('orbit_accounts') || '[]');
function renderAccounts() {
  const el = document.getElementById('acctList');
  if (!accounts.length) { el.innerHTML = '<div class="out-ph" style="padding:8px 0;">No accounts connected yet.</div>'; return; }
  el.innerHTML = accounts.map((a, i) => `
    <div class="slot">
      <span class="slot-time">${platformEmoji(a.platform)}</span>
      <div class="slot-info"><b>${a.handle}</b><div class="slot-plat">${a.platform}</div></div>
      <span class="slot-status status-pub">CONNECTED</span>
      <button class="slot-del" onclick="removeAcct(${i})">✕</button>
    </div>`).join('');
}
function platformEmoji(p) {
  return {Instagram:'📸',Facebook:'👥',TikTok:'🎵',YouTube:'▶',['Twitter/X']:'🐦'}[p] || '🌐';
}
function connectAcct(platform, code) {
  const handle = prompt(`Enter your ${platform} handle or page name:`);
  if (!handle) return;
  accounts.push({ platform, handle: handle.startsWith('@') ? handle : '@' + handle });
  localStorage.setItem('orbit_accounts', JSON.stringify(accounts));
  renderAccounts();
}
function removeAcct(i) {
  accounts.splice(i, 1);
  localStorage.setItem('orbit_accounts', JSON.stringify(accounts));
  renderAccounts();
}
window.addEventListener('DOMContentLoaded', renderAccounts);

async function analyzeAcct() {
  const handle = document.getElementById('acctHandle').value || 'unknown';
  const plat = document.getElementById('acctPlat').value;
  const niche = document.getElementById('acctNiche').value || 'general';
  const followers = document.getElementById('acctFollowers').value;
  if (!API_KEY) { noKey('acctOut','acctBtn'); return; }
  setLoad('acctOut','acctBtn');
  try {
    const t = await ai(`You are a social media strategist. Analyze this account profile:
Handle: ${handle} | Platform: ${plat} | Niche: ${niche} | Followers: ${followers}

Provide:
1. ACCOUNT HEALTH SCORE (X/10)
2. NICHE ASSESSMENT — market size, competition level, monetization potential
3. GROWTH STAGE — where they are in the growth journey
4. TOP 3 IMMEDIATE OPPORTUNITIES
5. TOP 3 RISKS or weaknesses at this stage
6. RECOMMENDED NEXT STEPS — specific actions this week
7. MONETIZATION TIMELINE — realistic path to income`);
    setOut('acctOut','acctBtn',t);
  } catch(e) { errOut('acctOut','acctBtn',e.message); }
}

/* ══ P1: CONTENT GENERATOR ═══════════════════════════════════════════ */
async function genContent() {
  const plats = activePlats('cgPlats');
  const type = document.getElementById('cgType').value;
  const topic = document.getElementById('cgTopic').value.trim();
  const tone = document.getElementById('cgTone').value;
  const audience = document.getElementById('cgAudience').value || 'general audience';
  const variants = document.getElementById('cgVar').value;
  if (!API_KEY) { noKey('cgOut','cgBtn'); return; }
  if (!topic) { document.getElementById('cgOut').innerHTML='<span style="color:var(--yellow)">Enter a topic first.</span>'; return; }
  setLoad('cgOut','cgBtn');
  try {
    const t = await ai(`You are a top social media copywriter. Generate ${variants} ${type} variant(s):
Platform(s): ${plats}
Topic: ${topic}
Tone: ${tone}
Audience: ${audience}

For each variant label it VARIANT 1, VARIANT 2 etc. and include:
- Full ${type} with emojis optimized for platform
- 10-15 targeted hashtags (if applicable)
- Strong call-to-action
- Best visual suggestion`, 1400);
    setOut('cgOut','cgBtn',t);
  } catch(e) { errOut('cgOut','cgBtn',e.message); }
}

/* ══ P1: SCHEDULER ═══════════════════════════════════════════════════ */
let queue = JSON.parse(localStorage.getItem('orbit_queue') || '[]');
function renderQueue() {
  const el = document.getElementById('schQueue');
  if (!queue.length) { el.innerHTML = '<div class="out-ph" style="padding:10px;">No posts scheduled yet.</div>'; return; }
  el.innerHTML = queue.map((p, i) => `
    <div class="slot">
      <span class="slot-time">${p.date}</span>
      <div class="slot-info">
        <div>${p.caption.substring(0,60)}${p.caption.length>60?'...':''}</div>
        <div class="slot-plat">${p.platform} · ${p.type}</div>
      </div>
      <span class="slot-status ${p.status==='Published'?'status-pub':p.status==='Draft'?'status-draft':'status-sched'}">${p.status.toUpperCase()}</span>
      <button class="slot-del" onclick="deletePost(${i})">✕</button>
    </div>`).join('');
}
function schedPost() {
  const caption = document.getElementById('schCaption').value.trim();
  const platform = document.getElementById('schPlat').value;
  const type = document.getElementById('schType').value;
  const date = document.getElementById('schDate').value.trim() || 'Unscheduled';
  const tags = document.getElementById('schTags').value;
  if (!caption) { alert('Enter a caption first.'); return; }
  queue.push({ caption, platform, type, date, tags, status: 'Scheduled', id: Date.now() });
  localStorage.setItem('orbit_queue', JSON.stringify(queue));
  renderQueue();
  document.getElementById('schCaption').value = '';
  document.getElementById('schDate').value = '';
  document.getElementById('schTags').value = '';
}
function deletePost(i) {
  queue.splice(i,1);
  localStorage.setItem('orbit_queue', JSON.stringify(queue));
  renderQueue();
}
async function aiSchedule() {
  const plat = document.getElementById('schPlat').value;
  const type = document.getElementById('schType').value;
  if (!API_KEY) { document.getElementById('aiSchOut').style.display=''; noKey('aiSchOut','aiSchBtn'); return; }
  document.getElementById('aiSchOut').style.display='';
  setLoad('aiSchOut','aiSchBtn');
  try {
    const t = await ai(`What are the 3 best times to post a ${type} on ${plat} for maximum engagement? Give day, time, and reason. Be specific and brief.`, 400);
    setOut('aiSchOut','aiSchBtn',t);
  } catch(e) { errOut('aiSchOut','aiSchBtn',e.message); }
}

/* ══ P1: MEDIA GENERATOR ═════════════════════════════════════════════ */
async function genMedia() {
  const type = document.getElementById('mgType').value;
  const topic = document.getElementById('mgTopic').value.trim();
  const style = document.getElementById('mgStyle').value;
  const colors = document.getElementById('mgColors').value;
  const text = document.getElementById('mgText').value;
  if (!API_KEY) { noKey('mgOut','mgBtn'); return; }
  if (!topic) { document.getElementById('mgOut').innerHTML='<span style="color:var(--yellow)">Enter a topic first.</span>'; return; }
  setLoad('mgOut','mgBtn');
  try {
    const t = await ai(`Generate 3 detailed AI image prompts for a ${type}:
Topic/Product: ${topic}
Visual Style: ${style}
Brand Colors: ${colors || 'not specified'}
Text on image: ${text || 'none'}

For each prompt:
1. PROMPT — detailed Midjourney/DALL-E prompt (60-80 words)
2. DIMENSIONS — recommended size for ${type}
3. TOOL — best AI tool to generate this (Midjourney/DALL-E/Firefly)
4. NOTES — quick tip for this specific use case

Label each PROMPT 1, PROMPT 2, PROMPT 3.`);
    setOut('mgOut','mgBtn',t);
  } catch(e) { errOut('mgOut','mgBtn',e.message); }
}

/* ══ P2: AUTOMATION WORKFLOW ═════════════════════════════════════════ */
async function runWorkflow() {
  const niche = document.getElementById('wfNiche').value.trim() || 'general';
  const plat = document.getElementById('wfPlat').value;
  const type = document.getElementById('wfType').value;
  const goal = document.getElementById('wfGoal').value;
  if (!API_KEY) { noKey('wfOut','wfBtn'); return; }
  setLoad('wfOut','wfBtn');
  try {
    const t = await ai(`You are an AI automation agent running a "${type}" workflow for:
Niche: ${niche} | Platform: ${plat} | Goal: ${goal}

Execute the full workflow step by step:

STEP 1 — TREND ANALYSIS: What's trending in ${niche} right now on ${plat}?
STEP 2 — POST CONCEPT: Generate the best post idea based on the trend
STEP 3 — CAPTION: Write the full optimized caption with emojis
STEP 4 — HASHTAGS: Generate 15 targeted hashtags
STEP 5 — VISUAL BRIEF: Describe the ideal image/video
STEP 6 — HOOK: Write 3 opening hook options
STEP 7 — SCHEDULE: Recommend best posting time
STEP 8 — EXPECTED RESULT: Predict engagement outcome

Format as a proper workflow with clear labels. Be specific and actionable.`, 1400);
    setOut('wfOut','wfBtn',t);
  } catch(e) { errOut('wfOut','wfBtn',e.message); }
}

/* ══ P3: ANALYTICS ═══════════════════════════════════════════════════ */
async function runAnalytics() {
  const plat = document.getElementById('anPlat').value;
  const data = document.getElementById('anData').value.trim();
  const types = document.getElementById('anTypes').value || 'various';
  const niche = document.getElementById('anNiche').value || 'general';
  const goal = document.getElementById('anGoal').value;
  if (!API_KEY) { noKey('anOut','anBtn'); return; }
  if (!data) { document.getElementById('anOut').innerHTML='<span style="color:var(--yellow)">Enter your performance data first.</span>'; return; }
  setLoad('anOut','anBtn');
  try {
    const t = await ai(`You are an expert social media analytics AI. Analyze this performance data:
Platform: ${plat} | Niche: ${niche} | Content Types: ${types} | Goal: ${goal}
Data: ${data}

Provide a full analytics report:
1. PERFORMANCE SCORE (X/10) with explanation
2. BEST PERFORMING CONTENT — what's working and why
3. WORST PERFORMING CONTENT — what's failing and why
4. ENGAGEMENT RATE ASSESSMENT — is it good/bad for ${plat}?
5. BEST POSTING TIMES — based on data patterns
6. CONTENT MIX RECOMMENDATION — ideal ratio of content types
7. GROWTH TRAJECTORY — are they growing, stalling, or declining?
8. TOP 5 ACTIONS — specific things to do this week
9. 30-DAY FORECAST — projected results if they follow advice`, 1400);
    setOut('anOut','anBtn',t);
  } catch(e) { errOut('anOut','anBtn',e.message); }
}

/* ══ P4: COMMENT & DM ════════════════════════════════════════════════ */
async function replyComment() {
  const brand = document.getElementById('cmBrand').value || 'the brand';
  const tone = document.getElementById('cmTone').value;
  const text = document.getElementById('cmText').value.trim();
  const type = document.getElementById('cmType').value;
  if (!API_KEY) { noKey('cmOut','cmBtn'); return; }
  if (!text) { document.getElementById('cmOut').innerHTML='<span style="color:var(--yellow)">Paste a comment or DM first.</span>'; return; }
  setLoad('cmOut','cmBtn');
  try {
    const t = await ai(`You are the social media manager for ${brand}. Handle this ${type}:

"${text}"

Brand tone: ${tone}

If it's a comment/DM reply: Write 3 reply options (SHORT, MEDIUM, DETAILED).
If spam detection: Assess if it's spam (YES/NO), explain why, suggest action.
If negative comment: Write a professional de-escalation response + a firmer version.

Label each option clearly.`);
    setOut('cmOut','cmBtn',t);
  } catch(e) { errOut('cmOut','cmBtn',e.message); }
}
async function genTemplates() {
  const niche = document.getElementById('cmNiche').value || 'general';
  const tpl = document.getElementById('cmTemplate').value;
  if (!API_KEY) { noKey('cmOut','cmTplBtn'); return; }
  setLoad('cmOut','cmTplBtn');
  try {
    const t = await ai(`Generate 5 ready-to-use social media reply templates for a ${niche} brand. Template type: "${tpl}".
Each template should be:
- Natural sounding, not robotic
- Under 150 characters where possible
- Include a [PERSONALIZATION] placeholder where relevant
- Labeled TEMPLATE 1 through TEMPLATE 5`);
    setOut('cmOut','cmTplBtn',t);
  } catch(e) { errOut('cmOut','cmTplBtn',e.message); }
}

/* ══ P5: TRENDS ══════════════════════════════════════════════════════ */
async function scanTrends() {
  const niche = document.getElementById('trNiche').value.trim() || 'general';
  const plat = document.getElementById('trPlat').value;
  const focus = document.getElementById('trFocus').value;
  const audience = document.getElementById('trAudience').value || 'general audience';
  if (!API_KEY) { noKey('trOut','trBtn'); return; }
  setLoad('trOut','trBtn');
  try {
    const t = await ai(`You are a social media trend analyst. Generate a trend intelligence report for:
Niche: ${niche} | Platform: ${plat} | Focus: ${focus} | Audience: ${audience}

Provide:
1. TOP 5 TRENDING TOPICS — for ${niche} on ${plat} right now (based on your knowledge)
2. VIRAL CONTENT FORMATS — what format is going viral in this niche
3. TRENDING HASHTAGS — 15 hashtags trending in ${niche}
4. TRENDING AUDIO/SOUNDS — (if TikTok/Reels) popular audio to use
5. CONTENT ANGLE — specific angle or hook that's getting traction
6. BEST TREND TO ACT ON — the #1 trend to create content about NOW
7. CONTENT IDEA — full post idea based on the top trend
8. URGENCY — how long this trend will last`, 1400);
    setOut('trOut','trBtn',t);
  } catch(e) { errOut('trOut','trBtn',e.message); }
}

/* ══ P6: COMPETITOR ══════════════════════════════════════════════════ */
async function analyzeCompetitor() {
  const niche = document.getElementById('cpNiche').value || 'general';
  const handles = document.getElementById('cpHandles').value || 'top competitors';
  const plat = document.getElementById('cpPlat').value;
  const focus = document.getElementById('cpFocus').value;
  const weakness = document.getElementById('cpWeakness').value || 'not specified';
  if (!API_KEY) { noKey('cpOut','cpBtn'); return; }
  setLoad('cpOut','cpBtn');
  try {
    const t = await ai(`You are a competitive intelligence analyst for social media. Analyze competitors in the ${niche} niche on ${plat}:
Competitors: ${handles}
Analysis focus: ${focus}
My weakness: ${weakness}

Provide:
1. COMPETITOR PROFILE — likely content strategy and positioning for each
2. WHAT'S WORKING FOR THEM — top content types and why they perform
3. THEIR POSTING STRATEGY — frequency, timing, format mix
4. THEIR HASHTAG APPROACH — how they use hashtags
5. ENGAGEMENT TACTICS — how they drive comments and shares
6. THEIR WEAKNESSES — gaps I can exploit
7. DIFFERENTIATION OPPORTUNITIES — how to stand out vs them
8. STEAL-WORTHY STRATEGIES — 3 tactics I should copy and adapt
9. MY ACTION PLAN — specific steps to outperform them`, 1400);
    setOut('cpOut','cpBtn',t);
  } catch(e) { errOut('cpOut','cpBtn',e.message); }
}

/* ══ P7: GROWTH ══════════════════════════════════════════════════════ */
async function optimizeGrowth() {
  const niche = document.getElementById('grNiche').value || 'general';
  const followers = document.getElementById('grFollowers').value;
  const plat = document.getElementById('grPlat').value;
  const goal = document.getElementById('grGoal').value;
  const freq = document.getElementByI
