import { NextRequest } from "next/server";

type AnthropicMessageResponse = {
  content?: Array<
    | { type: "text"; text: string }
    | { type: "tool_use"; name: string; input: unknown; id: string }
  >;
};

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = (await req.json()) as { prompt?: string };
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const systemPrompt = buildSystemPrompt();

    if (!apiKey) {
      // Local fallback generator (no external calls)
      const html = localFallbackGame(prompt);
      return json({ html, note: "Yerel olu?turucu kullan?ld? (API anahtar? yok)." });
    }

    // Call Anthropic Messages API
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content:
              "Kullan?c? oyunu ??yle istiyor:\n\n" +
              prompt +
              "\n\nTalimat: T?m oyunu tek bir HTML belgesi olarak ?ret.",
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Anthropic API error:", res.status, text);
      const html = localFallbackGame(prompt);
      return json({
        html,
        note: "Anthropic iste?i ba?ar?s?z oldu, yerel ?rnek d?nd?r?ld?.",
      });
    }

    const data = (await res.json()) as AnthropicMessageResponse;
    const html = extractHtmlFromMessage(data) ?? localFallbackGame(prompt);
    return json({ html });
  } catch (err: unknown) {
    console.error("generate-game error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function json(obj: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(obj), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

function extractHtmlFromMessage(resp: AnthropicMessageResponse): string | null {
  if (!resp?.content) return null;
  const textBlocks = resp.content
    .filter((b) => (b as any).type === "text")
    .map((b) => (b as any).text as string);
  const combined = textBlocks.join("\n");
  // Try to find triple-backticked HTML, else return the raw text
  const fenceMatch =
    combined.match(/```html\s*([\s\S]+?)```/i) ||
    combined.match(/```[\s\S]*?<\/html>\s*```/i);
  if (fenceMatch && fenceMatch[1]) return fenceMatch[1].trim();
  // Try to detect doctype
  if (combined.toLowerCase().includes("<!doctype html") || combined.toLowerCase().includes("<html")) {
    return combined;
  }
  return null;
}

function buildSystemPrompt() {
  return `
Sen bir Oyun ?reticisisin. Kullan?c?n?n fikrinden tek dosyal?k, ?al???r bir mini oyun ?ret.
Gereksinimler:
- ??kt? TEK bir HTML belgesi olmal? (CSS ve JS g?m?l?).
- Harici k?t?phane veya a? iste?i kullanma.
- Oyun klavyeyle veya fareyle oynanmal?.
- K???k ekranlarda da ?al??mal?, canvas ?nerilir.
- G?venlik: sadece oyun alan?nda ?al??s?n; localStorage gibi kal?c? depolama kullanma.
- Kod sade, anla??l?r ve k?sa olsun.

?ablon:
<!DOCTYPE html>
<html>
  <head>... stil ...</head>
  <body>... canvas veya DOM tabanl? oyun ...</body>
</html>
`.trim();
}

function localFallbackGame(idea: string) {
  // Simple dynamic variation based on idea keywords
  const lower = idea.toLowerCase();
  if (lower.includes("pong")) return fallbackPong();
  if (lower.includes("flappy")) return fallbackFlappy();
  return fallbackCollector(idea);
}

function fallbackPong() {
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Pong</title>
<style>html,body{margin:0;height:100%;background:#0b1020;color:#e2e8f0}canvas{display:block;margin:0 auto;background:#0f172a;border:1px solid #334155}</style>
</head><body><canvas id="c" width="640" height="400"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let by=c.height/2, bx=c.width/2, vx=3, vy=2;
let lp=c.height/2-30, rp=c.height/2-30;
let scoreL=0, scoreR=0;
addEventListener('mousemove',e=>{rp=(e.clientY/c.getBoundingClientRect().height)*c.height-30;});
addEventListener('keydown',e=>{if(e.key==='ArrowUp') lp-=10; if(e.key==='ArrowDown') lp+=10;});
function step(){
  requestAnimationFrame(step);
  x.fillStyle='#0f172a'; x.fillRect(0,0,c.width,c.height);
  // paddles
  x.fillStyle='#22d3ee'; x.fillRect(10,lp,8,60);
  x.fillStyle='#f59e0b'; x.fillRect(c.width-18,rp,8,60);
  // ball
  x.fillStyle='#e2e8f0'; x.beginPath(); x.arc(bx,by,6,0,Math.PI*2); x.fill();
  bx+=vx; by+=vy;
  if(by<6||by>c.height-6) vy*=-1;
  // AI follow
  rp += (by- (rp+30))*0.12;
  // collide
  if(bx<18 && by>lp && by<lp+60){ vx=Math.abs(vx); }
  if(bx>c.width-18 && by>rp && by<rp+60){ vx=-Math.abs(vx); }
  if(bx<0){ scoreR++; reset(); }
  if(bx>c.width){ scoreL++; reset(); }
  x.fillStyle='#e2e8f0'; x.font='14px system-ui'; x.fillText(scoreL+' : '+scoreR, c.width/2-14, 20);
}
function reset(){ bx=c.width/2; by=c.height/2; vx*=-1; vy=2*(Math.random()>0.5?1:-1); }
step();
</script></body></html>`;
}

function fallbackFlappy() {
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Flappy</title>
<style>html,body{margin:0;height:100%;background:#0b1020;color:#e2e8f0}canvas{display:block;margin:0 auto;background:#0f172a;border:1px solid #334155}</style>
</head><body><canvas id="c" width="480" height="640"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let y=200, vy=0, g=0.35; let pipes=[]; let t=0; let score=0;
addEventListener('keydown',()=>{vy=-6;}); addEventListener('mousedown',()=>{vy=-6;});
function step(){
 requestAnimationFrame(step); t++;
 vy+=g; y+=vy;
 if(t%90===0){ const gap=140, top=40+Math.random()* (c.height-gap-80); pipes.push({x:c.width, top, gap}); }
 x.fillStyle='#0f172a'; x.fillRect(0,0,c.width,c.height);
 // pipes
 x.fillStyle='#22d3ee';
 for(const p of pipes){ p.x-=2.4; x.fillRect(p.x,0,40,p.top); x.fillRect(p.x,p.top+ p.gap,40,c.height-(p.top+p.gap)); if(p.x+40<0) { pipes.shift(); score++; } }
 // bird
 x.fillStyle='#f59e0b'; x.beginPath(); x.arc(120,y,10,0,Math.PI*2); x.fill();
 // collide
 for(const p of pipes){ if(120>p.x && 120<p.x+40 && (y< p.top || y> p.top+p.gap)) location.reload(); }
 if(y<0||y>c.height) location.reload();
 x.fillStyle='#e2e8f0'; x.font='16px system-ui'; x.fillText('Skor: '+score, 12, 24);
}
step();
</script></body></html>`;
}

function fallbackCollector(idea: string) {
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Collector</title>
<style>html,body{margin:0;height:100%;background:#0b1020;color:#e2e8f0}canvas{display:block;margin:0 auto;background:#0f172a;border:1px solid #334155}</style>
</head><body><canvas id="c" width="640" height="400"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let px=40,py=c.height/2, speed=2.5, score=0;
const keys={}; addEventListener('keydown',e=>keys[e.key]=true); addEventListener('keyup',e=>keys[e.key]=false);
const items=Array.from({length:10},()=>({x: Math.random()* (c.width-40)+20, y: Math.random()* (c.height-40)+20, r:6, got:false}));
function step(){
 requestAnimationFrame(step);
 x.fillStyle='#0f172a'; x.fillRect(0,0,c.width,c.height);
 const dx=(keys['ArrowRight']?1:0)-(keys['ArrowLeft']?1:0);
 const dy=(keys['ArrowDown']?1:0)-(keys['ArrowUp']?1:0);
 const l=Math.hypot(dx,dy)||1; px+=dx/l*speed; py+=dy/l*speed;
 px=Math.max(8,Math.min(c.width-8,px)); py=Math.max(8,Math.min(c.height-8,py));
 x.fillStyle='#22d3ee'; x.beginPath(); x.arc(px,py,8,0,Math.PI*2); x.fill();
 x.fillStyle='#f59e0b';
 for(const it of items){ if(!it.got){ x.beginPath(); x.arc(it.x,it.y,it.r,0,Math.PI*2); x.fill();
   const dd=(px-it.x)**2+(py-it.y)**2; if(dd<(8+it.r)**2){ it.got=true; score++; } } }
 x.fillStyle='#e2e8f0'; x.font='14px system-ui'; x.fillText('${idea.replace(/'/g,"")}', 10, 20);
 x.fillText('Skor: '+score+' / '+items.length, 10, 36);
}
step();
</script></body></html>`;
}

