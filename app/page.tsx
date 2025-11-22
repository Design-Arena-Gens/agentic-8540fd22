import Chat from "@/components/chat/Chat";
import { useState } from "react";

export default function Page() {
  return <SplitView />;
}

function SplitView() {
  "use client";
  const [html, setHtml] = useState<string>(initialHtml);

  return (
    <div className="grid h-dvh grid-cols-1 md:grid-cols-2">
      <div className="border-r">
        <Chat onGameHtml={setHtml} />
      </div>
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">Preview</div>
          <div className="text-xs text-muted-foreground">
            Canl? oyun ?nizlemesi (iframe)
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <iframe
            title="game-preview"
            className="h-full w-full"
            sandbox="allow-scripts allow-pointer-lock allow-same-origin"
            srcDoc={html}
          />
        </div>
      </div>
    </div>
  );
}

const initialHtml = `
<!DOCTYPE html><html lang="tr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Text-to-Game Preview</title>
<style>
  html,body { margin:0; padding:0; height:100%; background:#0b1020; color:#e2e8f0; font:14px/1.4 system-ui;}
  .center { height:100%; display:grid; place-items:center; text-align:center; padding:24px;}
  .badge { display:inline-block; background:#1f2937; padding:6px 10px; border-radius:999px; color:#a3bffa; border:1px solid #334155;}
</style>
</head><body>
  <div class="center">
    <div>
      <div class="badge">Text-to-Game</div>
      <h1>Oyun ?nizlemesi burada</h1>
      <p>Soldaki sohbete oyun fikrini yaz?n.</p>
    </div>
  </div>
</body></html>`;

