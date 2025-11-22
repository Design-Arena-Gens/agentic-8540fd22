/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Send, Trash2 } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

export default function Chat({
  onGameHtml,
}: {
  onGameHtml: (html: string) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "sys",
      role: "system",
      content:
        "Bir oyun fikri yaz?n. ?rn: 'Basit bir Pong oyunu' veya 'Uzayda asteroidlerden ka?'.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const canSend = input.trim().length > 0 && !loading;

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSend) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/generate-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg.content }),
      });
      if (!res.ok) throw new Error("API error");
      const data = (await res.json()) as { html: string; note?: string };
      const html = data.html ?? "";
      onGameHtml(html);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            data.note ??
            "Oyun olu?turuldu. Sa?daki ?nizleme penceresinde ?al???r durumda.",
        },
      ]);
    } catch (err: unknown) {
      onGameHtml(defaultFallbackGame("Bir hata olu?tu, yerel ?rnek y?klendi."));
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "?zg?n?m, bir sorun olu?tu. Yerel ?rnek oyun y?klendi ve oynanabilir.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setMessages((prev) => prev.slice(0, 1));
    setInput("");
    onGameHtml(initialPreviewHtml);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="font-semibold">Text-to-Game Chat</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          title="Konu?may? temizle"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={listRef}
        className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "rounded-lg border p-3 text-sm",
              m.role === "user"
                ? "bg-white"
                : m.role === "assistant"
                ? "bg-muted"
                : "bg-accent"
            )}
          >
            <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              {m.role}
            </div>
            <div className="whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Oyun fikrini yaz ve G?nder'e bas..."
            className="min-h-[80px] flex-1"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={!canSend}
            className="self-stretch"
            title="G?nder"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

const initialPreviewHtml = `
<!DOCTYPE html><html lang="tr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Preview</title>
<style>
  html,body { margin:0; padding:0; height:100%; background:#0b1020; color:#e2e8f0; font:14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;}
  .center { height:100%; display:grid; place-items:center; text-align:center; padding:24px;}
  .badge { display:inline-block; background:#1f2937; padding:6px 10px; border-radius:999px; color:#a3bffa; border:1px solid #334155;}
  a { color:#93c5fd; }
</style>
</head><body>
  <div class="center">
    <div>
      <div class="badge">?nizleme</div>
      <h1>Sa?da oyun burada ?al??acak</h1>
      <p>Soldaki sohbete oyun fikrini yaz ve g?nder.</p>
      <p>?rn: <em>Basit bir Pong oyunu</em> ya da <em>Flappy Bird klonu</em>.</p>
    </div>
  </div>
</body></html>`;

function defaultFallbackGame(message: string) {
  return `
<!DOCTYPE html><html lang="tr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Yerel ?rnek Oyun</title>
<style>
  html,body { margin:0; height:100%; background:#0b1020; color:#e2e8f0; font:14px/1.4 system-ui;}
  canvas { display:block; margin:0 auto; background:#0f172a; border:1px solid #334155;}
  #hud { position:fixed; top:8px; left:8px; background:#111827cc; padding:6px 10px; border-radius:8px; border:1px solid #374151;}
</style>
</head><body>
  <div id="hud">${message}</div>
  <canvas id="game" width="640" height="400"></canvas>
  <script>
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let px = 40, py = canvas.height/2, vx = 0, vy = 0, speed = 2.4;
  let key = {};
  window.addEventListener('keydown', e => key[e.key] = true);
  window.addEventListener('keyup', e => key[e.key] = false);
  const stars = Array.from({length: 120}, () => [Math.random()*canvas.width, Math.random()*canvas.height, Math.random()*2+0.5]);
  const targets = Array.from({length: 6}, () => ({x: 200+Math.random()*380, y: 40+Math.random()*320, r: 8, hit:false}));
  let score = 0;
  function step() {
    requestAnimationFrame(step);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // stars
    for (const s of stars) {
      s[0]-=s[2]*0.6; if (s[0] < 0) s[0] = canvas.width;
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(s[0], s[1], 2, 2);
    }
    // input
    vx = (key['ArrowRight']?1:0) - (key['ArrowLeft']?1:0);
    vy = (key['ArrowDown']?1:0) - (key['ArrowUp']?1:0);
    const len = Math.hypot(vx, vy) || 1;
    px += (vx/len)*speed; py += (vy/len)*speed;
    px = Math.max(8, Math.min(canvas.width-8, px));
    py = Math.max(8, Math.min(canvas.height-8, py));
    // player
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI*2); ctx.fill();
    // targets
    for (const t of targets) {
      if (!t.hit) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI*2); ctx.fill();
        const dx = px-t.x, dy = py-t.y;
        if (dx*dx + dy*dy < (8+t.r)*(8+t.r)) { t.hit = true; score++; }
      }
    }
    // score
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px system-ui';
    ctx.fillText('Skor: '+score+' / '+targets.length, 10, canvas.height-10);
  }
  step();
  </script>
</body></html>`;
}

