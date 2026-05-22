'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

// ── Apple/Anthropic unified dark palette ─────────────────────────────────────
const A = {
  bg:          '#000000',
  bg2:         '#111111',
  bg3:         '#1c1c1e',
  bg4:         '#2c2c2e',
  border:      'rgba(255,255,255,0.08)',
  borderStrg:  'rgba(255,255,255,0.15)',
  text:        '#f5f5f7',
  text2:       '#d2d2d7',
  text3:       '#a1a1a6',
  text4:       '#6e6e73',
  coral:       '#FF6B35',
  coralSoft:   'rgba(255,107,53,0.12)',
  purple:      '#BF5AF2',
  purpleSoft:  'rgba(191,90,242,0.12)',
  green:       '#30D158',
  greenSoft:   'rgba(48,209,88,0.12)',
  amber:       '#FFD60A',
  amberSoft:   'rgba(255,214,10,0.10)',
  blue:        '#0A84FF',
  blueSoft:    'rgba(10,132,255,0.12)',
  cyan:        '#5AC8FA',
  cyanSoft:    'rgba(90,200,250,0.10)',
  red:         '#FF453A',
};

// ── GPU cluster canvas ────────────────────────────────────────────────────────
function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    type N = { x: number; y: number; node: number };
    type S = { from: N; to: N; t: number; speed: number; color: string };
    const NODES = 3; const GPUS = 4;
    let nodes: N[] = []; let sparks: S[] = [];
    const build = () => {
      nodes = [];
      const W = canvas.width, H = canvas.height;
      for (let n = 0; n < NODES; n++) {
        const cx = W * 0.15 + (W * 0.7) * (n / (NODES - 1)), cy = H * 0.5;
        for (let g = 0; g < GPUS; g++) {
          const angle = (g / GPUS) * Math.PI * 2 - Math.PI / 2;
          nodes.push({ x: cx + Math.cos(angle) * Math.min(W, H) * 0.08, y: cy + Math.sin(angle) * Math.min(W, H) * 0.08, node: n });
        }
      }
    };
    build();
    const spawn = () => {
      if (nodes.length < 2) return;
      const a = nodes[Math.floor(Math.random() * nodes.length)];
      const b = nodes[Math.floor(Math.random() * nodes.length)];
      if (a === b) return;
      sparks.push({ from: a, to: b, t: 0, speed: 0.006 + Math.random() * 0.01, color: a.node !== b.node ? A.coral : A.purple });
    };
    let last = 0;
    const draw = (ts: number) => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      for (let n = 0; n < NODES; n++) {
        const grp = nodes.filter(nd => nd.node === n);
        for (let i = 0; i < grp.length; i++) for (let j = i + 1; j < grp.length; j++) {
          ctx.beginPath(); ctx.moveTo(grp[i].x, grp[i].y); ctx.lineTo(grp[j].x, grp[j].y);
          ctx.strokeStyle = 'rgba(90,200,250,0.06)'; ctx.lineWidth = 1; ctx.stroke();
        }
        const cx = grp.reduce((s, nd) => s + nd.x, 0) / grp.length, cy = grp.reduce((s, nd) => s + nd.y, 0) / grp.length;
        ctx.beginPath(); ctx.arc(cx, cy, Math.min(W, H) * 0.1, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(191,90,242,0.05)'; ctx.setLineDash([3, 10]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
      }
      for (let a = 0; a < NODES - 1; a++) {
        const ga = nodes.filter(nd => nd.node === a), gb = nodes.filter(nd => nd.node === a + 1);
        for (let i = 0; i < ga.length; i++) {
          ctx.beginPath(); ctx.moveTo(ga[i].x, ga[i].y); ctx.lineTo(gb[i % gb.length].x, gb[i % gb.length].y);
          ctx.strokeStyle = 'rgba(255,107,53,0.07)'; ctx.lineWidth = 1; ctx.stroke();
        }
      }
      nodes.forEach(nd => {
        const c = nd.node === 0 ? A.coral : nd.node === 1 ? A.cyan : A.purple;
        const g = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, 12);
        g.addColorStop(0, c + 'aa'); g.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(nd.x, nd.y, 6, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(nd.x, nd.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = A.text; ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1;
      });
      sparks = sparks.filter(s => s.t <= 1);
      sparks.forEach(s => {
        s.t += s.speed;
        const x = s.from.x + (s.to.x - s.from.x) * s.t, y = s.from.y + (s.to.y - s.from.y) * s.t;
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.sin(s.t * Math.PI) * 0.85 + 0.1; ctx.fill(); ctx.globalAlpha = 1;
      });
      if (ts - last > 200) { spawn(); last = ts; }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

// ── Antigravity dots canvas ───────────────────────────────────────────────────
function AntigravityCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    type D = { x: number; y: number; vx: number; vy: number; w: number; h: number; a: number; c: string };
    const COLS = [A.coral, A.purple, A.green, A.amber, A.blue];
    let dots: D[] = [];
    const init = () => { const W = canvas.width, H = canvas.height; dots = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, w: 4 + Math.random() * 14, h: 3 + Math.random() * 8, a: 0.08 + Math.random() * 0.2, c: COLS[Math.floor(Math.random() * COLS.length)] })); };
    init();
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      dots.forEach(d => {
        ctx.save(); ctx.globalAlpha = d.a; ctx.fillStyle = d.c;
        ctx.beginPath(); ctx.ellipse(d.x, d.y, d.w / 2, d.h / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        d.x += d.vx; d.y += d.vy;
        if (d.x < -20) d.x = W + 20; if (d.x > W + 20) d.x = -20;
        if (d.y < -20) d.y = H + 20; if (d.y > H + 20) d.y = -20;
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

// ── Scrollspy sticky section nav ──────────────────────────────────────────────
const NAV_SECTIONS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'framework',  label: 'GPU Framework' },
  { id: 'zero',       label: 'ZeRO Stages' },
  { id: 'api',        label: 'Code API' },
  { id: 'simulator',  label: 'Simulator' },
  { id: 'prompt',     label: 'Prompt Studio' },
  { id: 'models',     label: 'Models' },
  { id: 'templates',  label: 'Templates' },
  { id: 'discipline', label: 'DISCIPLINE' },
];

function SectionNav({ visible }: { visible: boolean }) {
  const [active, setActive] = useState('overview');
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { threshold: 0.25, rootMargin: '-64px 0px -40% 0px' });
    NAV_SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);
  return (
    <div style={{ position: 'sticky', top: 48, zIndex: 90, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${A.border}`, transform: visible ? 'translateY(0)' : 'translateY(-100%)', transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ display: 'flex', gap: 0, padding: '0 32px', maxWidth: 1200, margin: '0 auto' }}>
        {NAV_SECTIONS.map(s => (
          <a key={s.id} href={`#${s.id}`} style={{ padding: '13px 20px', fontSize: 13, fontWeight: 500, color: active === s.id ? A.text : A.text4, borderBottom: active === s.id ? `2px solid ${A.coral}` : '2px solid transparent', whiteSpace: 'nowrap', transition: 'color 0.2s' }}>{s.label}</a>
        ))}
      </div>
    </div>
  );
}

// ── ZeRO Stage Explorer ────────────────────────────────────────────────────────
const ZERO_STAGES = [
  { id: 0, label: 'Baseline', subtitle: 'No sharding', description: 'Every GPU holds a full replica of all model state — parameters, gradients, and optimizer states. Memory scales 1:1 with replicas. The ceiling is a single GPU\'s VRAM.', paramSharded: false, gradSharded: false, optSharded: false, memReduction: '1×' },
  { id: 1, label: 'ZeRO-1', subtitle: 'Optimizer sharding', description: 'Optimizer states (Adam moments, variance) are partitioned across GPUs. Parameters and gradients stay replicated. ~4× memory reduction for Adam.', paramSharded: false, gradSharded: false, optSharded: true, memReduction: '4×' },
  { id: 2, label: 'ZeRO-2', subtitle: 'Grad + optimizer', description: 'Gradients are also partitioned after each reduce step. Each GPU stores only its gradient slice. ~8× overall memory reduction versus baseline.', paramSharded: false, gradSharded: true, optSharded: true, memReduction: '8×' },
  { id: 3, label: 'ZeRO-3', subtitle: 'Full sharding', description: 'Parameters are also partitioned. Each GPU owns 1/N of the model. Layers are gathered on-demand during forward and backward passes. Scales to trillion-parameter models.', paramSharded: true, gradSharded: true, optSharded: true, memReduction: 'N×' },
];
const GPU_N = 8;

function ZeroExplorer() {
  const [active, setActive] = useState(3);
  const s = ZERO_STAGES[active];
  const renderGpu = (i: number) => {
    const rows = [
      { lbl: 'Param', sharded: s.paramSharded, color: A.coral },
      { lbl: 'Grad',  sharded: s.gradSharded,  color: A.cyan  },
      { lbl: 'Opt',   sharded: s.optSharded,   color: A.amber },
    ];
    return (
      <div key={i} style={{ flex: 1, minWidth: 0, border: `1px solid ${A.borderStrg}`, borderRadius: 10, padding: '8px 5px', background: A.bg2 }}>
        <div style={{ fontSize: 9, color: A.text4, fontFamily: 'var(--font-geist-mono)', textAlign: 'center', marginBottom: 6 }}>GPU {i}</div>
        {rows.map(r => (
          <div key={r.lbl} style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 8, color: A.text4, fontFamily: 'var(--font-geist-mono)', marginBottom: 2 }}>{r.lbl}</div>
            {r.sharded ? (
              <div style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: GPU_N }).map((_, gi) => <div key={gi} style={{ height: 7, flex: 1, background: gi === i ? r.color : r.color + '30', borderRadius: 2, transition: 'background 0.3s' }} />)}
              </div>
            ) : <div style={{ height: 7, background: r.color + 'cc', borderRadius: 2 }} />}
          </div>
        ))}
      </div>
    );
  };
  return (
    <div style={{ background: A.bg2, border: `1px solid ${A.borderStrg}`, borderRadius: 20, padding: '32px 28px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {ZERO_STAGES.map(st => (
          <button key={st.id} onClick={() => setActive(st.id)} style={{ padding: '8px 20px', borderRadius: 980, border: `1px solid ${active === st.id ? A.coral : A.border}`, background: active === st.id ? A.coralSoft : 'transparent', color: active === st.id ? A.coral : A.text4, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}>{st.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: A.text, marginBottom: 6 }}>{s.label} — {s.subtitle}</div>
          <div style={{ fontSize: 14, color: A.text3, maxWidth: 560, lineHeight: 1.65 }}>{s.description}</div>
        </div>
        <div style={{ textAlign: 'center', background: A.bg3, border: `1px solid ${A.coral}50`, borderRadius: 12, padding: '14px 24px', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: A.text4, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Memory Reduction</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: A.coral, fontFamily: 'var(--font-geist-mono)' }}>{s.memReduction}</div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 10, color: A.text4, fontFamily: 'var(--font-geist-mono)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>{GPU_N} GPUs across cluster</div>
        <div style={{ display: 'flex', gap: 5 }}>{Array.from({ length: GPU_N }).map((_, i) => renderGpu(i))}</div>
      </div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 14 }}>
        {[{ lbl: 'Parameters', color: A.coral, sharded: s.paramSharded }, { lbl: 'Gradients', color: A.cyan, sharded: s.gradSharded }, { lbl: 'Optimizer States', color: A.amber, sharded: s.optSharded }].map(item => (
          <div key={item.lbl} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, opacity: 0.85 }} />
            <span style={{ fontSize: 12, color: A.text3 }}>{item.lbl}</span>
            <span style={{ fontSize: 11, color: item.sharded ? A.green : A.text4, fontFamily: 'var(--font-geist-mono)' }}>{item.sharded ? 'sharded' : 'replicated'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Code Explorer ──────────────────────────────────────────────────────────────
const CODE_EX = [
  { label: 'LLaMA 70B', code: `from higgsfield.llama import Llama70b\nfrom higgsfield.loaders import LlamaLoader\nfrom higgsfield.experiment import experiment\nimport torch.optim as optim\nfrom alpaca import get_alpaca_data\n\n@experiment("alpaca")\ndef train(params):\n    model = Llama70b(zero_stage=3, fast_attn=False, precision="bf16")\n    optimizer = optim.AdamW(model.parameters(), lr=1e-5, weight_decay=0.0)\n    dataset = get_alpaca_data(split="train")\n    train_loader = LlamaLoader(dataset, max_words=2048)\n    for batch in train_loader:\n        optimizer.zero_grad()\n        loss = model(batch)\n        loss.backward()\n        optimizer.step()\n    model.push_to_hub('alpaca-70b')` },
  { label: 'Mistral 7B', code: `from higgsfield.mistral import Mistral7b\nfrom higgsfield.loaders import MistralLoader\nfrom higgsfield.experiment import experiment\nimport torch.optim as optim\n\n@experiment("mistral-finetune")\ndef train(params):\n    model = Mistral7b(zero_stage=2, precision="bf16")\n    optimizer = optim.AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)\n    train_loader = MistralLoader(your_dataset, max_words=4096)\n    for batch in train_loader:\n        optimizer.zero_grad()\n        loss = model(batch)\n        loss.backward()\n        optimizer.step()\n    model.push_to_hub('mistral-finetuned')` },
  { label: 'RL / PPO', code: `from higgsfield.llama import Llama7b\nfrom higgsfield.rl.ppo import PPOTrainer\nfrom higgsfield.experiment import experiment\n\n@experiment("rlhf-ppo")\ndef train(params):\n    actor = Llama7b(zero_stage=3, precision="bf16")\n    critic = Llama7b(zero_stage=3, precision="bf16")\n    trainer = PPOTrainer(actor=actor, critic=critic, kl_coef=0.1)\n    for step, batch in enumerate(reward_dataloader):\n        completions = actor.generate(batch["prompts"])\n        rewards = reward_model(completions)\n        trainer.step(\n            queries=batch["prompts"],\n            responses=completions,\n            scores=rewards,\n        )\n    actor.push_to_hub("rlhf-llama-7b")` },
  { label: 'Custom FSDP', code: `from higgsfield.training import FullyShardedParallel\nfrom higgsfield.experiment import experiment\nfrom torch.distributed.fsdp import MixedPrecision\nimport torch\n\n@experiment("custom-fsdp")\ndef train(params):\n    model = MyHugeTransformer(layers=96, dim=12288)\n    mp_policy = MixedPrecision(\n        param_dtype=torch.bfloat16,\n        reduce_dtype=torch.float32,\n        buffer_dtype=torch.float32,\n    )\n    sharded = FullyShardedParallel(\n        model,\n        mixed_precision=mp_policy,\n        sharding_strategy="FULL_SHARD",\n    )\n    for batch in dataloader:\n        loss = sharded(batch)\n        loss.backward()\n        optimizer.step()` },
];

function tokenize(code: string) {
  const kw = /\b(from|import|def|return|for|in|if|class|as|with|yield|lambda|True|False|None|and|or|not|pass|break|continue|raise)\b/g;
  const st = /("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*')/g;
  const cm = /(#.*)/g;
  const dc = /(@\w+)/g;
  const nm = /\b(\d+\.?\d*)\b/g;
  const bi = /\b(print|len|range|enumerate|zip|map|filter|list|dict|set|tuple|str|int|float|bool|type|super|self)\b/g;
  const spans: { s: number; e: number; c: string }[] = [];
  const add = (re: RegExp, c: string) => { let m; re.lastIndex = 0; while ((m = re.exec(code)) !== null) spans.push({ s: m.index, e: m.index + m[0].length, c }); };
  add(cm, A.text4); add(st, A.green); add(dc, A.amber); add(kw, A.purple); add(bi, A.cyan); add(nm, A.amber);
  spans.sort((a, b) => a.s - b.s);
  const parts: { text: string; color: string }[] = [];
  let pos = 0;
  for (const sp of spans) {
    if (sp.s < pos) continue;
    if (sp.s > pos) parts.push({ text: code.slice(pos, sp.s), color: A.text2 });
    parts.push({ text: code.slice(sp.s, sp.e), color: sp.c });
    pos = sp.e;
  }
  if (pos < code.length) parts.push({ text: code.slice(pos), color: A.text2 });
  return parts;
}

function CodeExplorer() {
  const [active, setActive] = useState(0);
  const parts = tokenize(CODE_EX[active].code);
  return (
    <div style={{ background: A.bg2, border: `1px solid ${A.borderStrg}`, borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${A.border}`, background: A.bg3, overflowX: 'auto' }}>
        {CODE_EX.map((e, i) => <button key={i} onClick={() => setActive(i)} style={{ padding: '12px 22px', border: 'none', background: 'transparent', color: active === i ? A.text : A.text4, borderBottom: active === i ? `2px solid ${A.coral}` : '2px solid transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', transition: 'color 0.2s' }}>{e.label}</button>)}
      </div>
      <div style={{ padding: '28px', overflowX: 'auto' }}>
        <pre style={{ fontSize: 13, lineHeight: 1.75, whiteSpace: 'pre', fontFamily: 'var(--font-geist-mono)', margin: 0 }}>
          {parts.map((p, i) => <span key={i} style={{ color: p.color }}>{p.text}</span>)}
        </pre>
      </div>
    </div>
  );
}

// ── Training Simulator ─────────────────────────────────────────────────────────
const LOGS = [
  { t: 300, msg: '[node-0] Initializing process group (NCCL backend)' },
  { t: 600, msg: '[node-1] Initializing process group (NCCL backend)' },
  { t: 900, msg: '[node-2] Initializing process group (NCCL backend)' },
  { t: 1400, msg: '[all]   ZeRO-3 enabled — 12 GPU collective' },
  { t: 1800, msg: '[node-0] Loading shards onto 4 × A100-80GB' },
  { t: 2200, msg: '[checkpoint] Resuming from step 4200' },
  { t: 2600, msg: 'step=4201  loss=1.423  grad_norm=0.82  lr=1.0e-05' },
  { t: 3200, msg: 'step=4202  loss=1.391  grad_norm=0.78  lr=1.0e-05' },
  { t: 3800, msg: 'step=4203  loss=1.377  grad_norm=0.71  lr=1.0e-05' },
  { t: 4200, msg: '[node-1] GPU 1 dropped — rerouting allreduce' },
  { t: 4400, msg: '[fault]  Worker failure detected — rescheduling' },
  { t: 4800, msg: '[recovery] Restored from checkpoint step 4203' },
  { t: 5200, msg: 'step=4204  loss=1.361  grad_norm=0.69  lr=1.0e-05' },
  { t: 5700, msg: 'step=4205  loss=1.348  grad_norm=0.65  lr=1.0e-05' },
  { t: 6100, msg: 'step=4206  loss=1.329  grad_norm=0.61  lr=1.0e-05' },
  { t: 6600, msg: '[checkpoint] Saved checkpoint at step 4206' },
  { t: 7000, msg: 'step=4207  loss=1.312  grad_norm=0.58  lr=1.0e-05' },
  { t: 7500, msg: 'step=4208  loss=1.298  grad_norm=0.54  lr=1.0e-05' },
];
const UTIL_SEED = [82, 91, 78, 95, 88, 71, 93, 86];

function TrainingSimulator() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<{ msg: string; color: string }[]>([]);
  const [step, setStep] = useState(0);
  const [loss, setLoss] = useState<number[]>([]);
  const [util, setUtil] = useState(UTIL_SEED.map(() => 0));
  const logRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const reset = useCallback(() => { timers.current.forEach(clearTimeout); if (interval.current) clearInterval(interval.current); setLogs([]); setStep(0); setLoss([]); setRunning(false); setUtil(UTIL_SEED.map(() => 0)); }, []);
  const start = useCallback(() => {
    reset(); setRunning(true);
    LOGS.forEach(({ t, msg }) => {
      const c = msg.includes('[fault]') || msg.includes('dropped') ? A.red : msg.includes('[recovery]') || msg.includes('[checkpoint]') ? A.amber : msg.includes('[all]') || msg.includes('ZeRO') ? A.green : msg.startsWith('step=') ? A.text2 : A.text3;
      timers.current.push(setTimeout(() => setLogs(p => [...p.slice(-30), { msg, color: c }]), t));
    });
    [1.423, 1.391, 1.377, 1.361, 1.348, 1.329, 1.312, 1.298].forEach((l, i) => { timers.current.push(setTimeout(() => setLoss(p => [...p, l]), 2600 + i * 680)); });
    let s = 4201;
    interval.current = setInterval(() => {
      setStep(s++); setUtil(p => p.map((u, i) => Math.min(100, Math.max(0, UTIL_SEED[i] + Math.round((Math.random() - 0.5) * 9)))));
      if (s > 4209) { if (interval.current) clearInterval(interval.current); setRunning(false); }
    }, 680);
  }, [reset]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logs]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); if (interval.current) clearInterval(interval.current); }, []);
  const maxL = 1.5, minL = 1.2;
  return (
    <div style={{ background: A.bg2, border: `1px solid ${A.borderStrg}`, borderRadius: 20, padding: '28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: A.text }}>Training Simulator</div>
          <div style={{ fontSize: 13, color: A.text3, marginTop: 3 }}>3 nodes × 4 GPUs — LLaMA 70B · Alpaca fine-tune</div>
        </div>
        {running ? <button onClick={reset} style={{ padding: '8px 22px', borderRadius: 980, border: `1px solid ${A.red}`, background: 'transparent', color: A.red, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Stop</button>
          : <button onClick={start} style={{ padding: '8px 22px', borderRadius: 980, border: 'none', background: A.coral, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>{logs.length ? 'Restart' : 'Start Training'}</button>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div ref={logRef} style={{ background: A.bg, borderRadius: 12, border: `1px solid ${A.border}`, padding: '14px 16px', height: 220, overflowY: 'auto', fontFamily: 'var(--font-geist-mono)', fontSize: 11, lineHeight: 1.75 }}>
          {!logs.length && <span style={{ color: A.text4 }}>$ Ready — press Start Training</span>}
          {logs.map((l, i) => <div key={i} style={{ color: l.color }}>{l.msg}</div>)}
          {running && <span style={{ color: A.green }}>▊</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: A.bg, borderRadius: 12, border: `1px solid ${A.border}`, padding: '12px 14px', flex: 1 }}>
            <div style={{ fontSize: 10, color: A.text4, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Training Loss</div>
            <svg width="100%" height="66" viewBox="0 0 200 66" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="0" y2="66" stroke={A.border} strokeWidth="1" />
              <line x1="0" y1="66" x2="200" y2="66" stroke={A.border} strokeWidth="1" />
              {loss.length > 1 && <polyline points={loss.map((l, i) => `${(i / Math.max(loss.length - 1, 1)) * 200},${66 - ((l - minL) / (maxL - minL)) * 66}`).join(' ')} fill="none" stroke={A.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {loss.map((l, i) => { const x = (i / Math.max(loss.length - 1, 1)) * 200, y = 66 - ((l - minL) / (maxL - minL)) * 66; return <circle key={i} cx={x} cy={y} r="3" fill={A.coral} />; })}
            </svg>
            {loss.length > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}><span style={{ fontSize: 10, color: A.text4, fontFamily: 'var(--font-geist-mono)' }}>step {step}</span><span style={{ fontSize: 11, color: A.coral, fontFamily: 'var(--font-geist-mono)', fontWeight: 700 }}>{loss[loss.length - 1]?.toFixed(3)}</span></div>}
          </div>
          <div style={{ background: A.bg, borderRadius: 12, border: `1px solid ${A.border}`, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: A.text4, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>GPU Utilization</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {util.map((u, i) => (
                <div key={i}>
                  <div style={{ fontSize: 9, color: A.text4, fontFamily: 'var(--font-geist-mono)', marginBottom: 3 }}>G{i}</div>
                  <div style={{ height: 4, background: A.bg3, borderRadius: 2 }}><div style={{ height: '100%', width: `${u}%`, background: u > 85 ? A.green : u > 60 ? A.amber : A.red, borderRadius: 2, transition: 'width 0.5s' }} /></div>
                  <div style={{ fontSize: 9, color: A.text4, fontFamily: 'var(--font-geist-mono)', marginTop: 1 }}>{u}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Prompt Studio data ─────────────────────────────────────────────────────────
const VMODES = [
  { id: 'kling3',    label: 'Kling 3.0',     tag: 'Characters · Audio',    color: A.coral,  soft: A.coralSoft  },
  { id: 'sora2',    label: 'Sora 2',          tag: 'Epic scale · Physics',  color: A.purple, soft: A.purpleSoft },
  { id: 'veo31',    label: 'Veo 3.1',         tag: 'Nature · Ref images',   color: A.green,  soft: A.greenSoft  },
  { id: 'wan27',    label: 'Wan 2.7',         tag: '60fps · Artistic',      color: A.amber,  soft: A.amberSoft  },
  { id: 'seedance', label: 'Seedance 2.0',    tag: 'Multimodal · Complex',  color: A.cyan,   soft: A.cyanSoft   },
  { id: 'hailuo',   label: 'Hailuo 2.3',      tag: 'VFX · Fluid motion',    color: A.blue,   soft: A.blueSoft   },
];
const CAMERA_GROUPS: Record<string, string[]> = {
  Follow:  ['Action Run', 'FPV Drone', 'Handheld', 'Snorricam', 'Head Tracking'],
  Dolly:   ['Dolly In', 'Dolly Out', 'Dolly Zoom In', 'Super Dolly In', 'Truck'],
  Orbit:   ['360 Orbit', 'Arc', 'Lazy Susan', 'Robo Arm'],
  Crane:   ['Crane Up', 'Crane Down', 'Overhead', 'Levitation'],
  Effect:  ['Bullet Time', 'Dutch Angle', 'Whip Pan', 'Crash Zoom In', 'Rack Focus'],
};
const LOOKS = ['Cinematic', 'VHS', 'Super 8MM', 'Anamorphic', 'Noir', 'Abstract'];
const GENRE_TEMPLATES = [
  { genre: 'Action Chase', model: 'Kling 3.0', color: A.red, desc: 'High-energy pursuit — foot chases, vehicle pursuits, rooftop escapes.', prompt: 'A woman in a tactical jacket sprints through a rain-soaked night market.\nWeaving between stalls and startled vendors. Steam rises from food carts.\nNeon signs fracture in every puddle.\nCamera: Action Run — low behind her, matching pace.\nA metal gate drops ahead. She slides under it without breaking stride.\nStyle: Cinematic. Cold blue shadows, warm amber market light.' },
  { genre: 'Sci-Fi VFX', model: 'Sora 2', color: A.purple, desc: 'Zero-gravity, energy effects, portal and transformation moments.', prompt: 'A battle-worn space station corridor, emergency lighting, debris floating.\nA soldier in tactical armor pulls herself along a handrail, rifle raised.\nAhead — a sealed blast door, sparking at the seams.\nCamera: FPV Drone drifting just ahead through the corridor.\nStyle: Cinematic, cold steel blue, high contrast.' },
  { genre: 'Nature Landscape', model: 'Veo 3.1', color: A.green, desc: 'Sweeping environments, weather phenomena, environmental cinematography.', prompt: 'A vast glacier at golden hour, surface cracked with deep blue fissures.\nMist drifts low across the ice. An Arctic fox pauses at the edge.\nCamera: Slow Crane Up, revealing the scale of the ice field.\nStyle: Natural, cold palette, overcast diffused light.' },
  { genre: 'Fashion Editorial', model: 'Kling 3.0', color: A.amber, desc: 'High-fashion visual storytelling with editorial composition.', prompt: 'A model in sculptural ivory couture in a brutalist concrete stairwell.\nA shaft of light cuts across the floor from a high window.\nCamera: Arc — slow 180-degree sweep revealing the silhouette.\nStyle: Editorial. Hard directional light, deep shadow contrast.' },
  { genre: 'Horror Atmosphere', model: 'Wan 2.6', color: '#8B5CF6', desc: 'Dread-building through environmental tension and shadow play.', prompt: 'A long hospital corridor at 3am. Fluorescent tubes flicker — one, then two.\nA wheelchair sits unmanned at the far end, slowly turning.\nCamera: Static locked-off. Zero movement. No pan, no zoom.\nStyle: Desaturated with harsh tungsten highlights. Deep shadow pools.' },
  { genre: 'Product UGC', model: 'Kling 3.0', color: A.blue, desc: 'Social-first product reveals with authentic energy.', prompt: 'Hands hold a matte black espresso cup. Steam curls above.\nA single slow drip of coffee falls from the rim.\nClean white marble countertop, morning light from the left.\nCamera: Dolly In — slow push toward the cup.\nStyle: Warm, soft natural light. Shallow depth of field.' },
  { genre: 'Romance', model: 'Wan 2.5', color: '#EC4899', desc: 'Intimate, soft-focus emotional storytelling.', prompt: 'Two people on a rain-slicked Paris bridge, umbrellas touching.\nStreetlamps create halos in the wet air. One leans in; the other smiles.\nCamera: Handheld — gentle sway, intimate proximity.\nStyle: Warm sodium light, soft chromatic fringing.' },
  { genre: 'Dance Performance', model: 'Hailuo 2.3', color: A.cyan, desc: 'Fluid motion and rhythmic physics for dance and sport.', prompt: 'A contemporary dancer in a white studio, high-contrast lighting.\nShe executes sharp isolations followed by a slow floor sequence.\nSweat catches the key light.\nCamera: Arc — smooth 270-degree sweep at hip height.\nStyle: Hard key light, deep shadows, clean white walls.' },
  { genre: 'Portrait Intro', model: 'Kling 3.0', color: '#F59E0B', desc: 'Character-first reveals for films, series, and social content.', prompt: 'A middle-aged architect in a partially-demolished building.\nConcrete dust in the air. She examines a blueprint, pencil behind her ear.\nCamera: Static. Subject walks INTO frame from left, stops center. Holds.\nStyle: Documentary. Cool overcast light, no fill, natural contrast.' },
  { genre: 'Comedy', model: 'Seedance 2.0', color: A.green, desc: 'Timing-first setups with physical performance beats.', prompt: 'A food delivery rider arrives with a towering stack of pizza boxes on a bicycle.\nEvery cobblestone bump threatens the structure. He sees the destination — a hill.\nCamera: Action Run beside him, slightly low, matching speed.\nStyle: Saturated, naturalistic daylight. Warm, slightly overexposed.' },
];
const DISCIPLINE_TIERS = [
  { tier: 'Tier 1 — Workflow', color: A.coral, patterns: [
    { name: 'Lock-before-generate', body: 'Lock subject, scene, camera, and lighting before prompting. Decisions during iteration drift from original intent.' },
    { name: 'Single-Variable Iteration', body: 'Change exactly one variable per regeneration. Multi-variable changes make root-cause diagnosis impossible.' },
    { name: 'Iteration-is-craft', body: 'AI cinema runs at ~1% image acceptance, ~1.5% video acceptance. The iteration loop IS the craft — not a sign of failure.' },
  ]},
  { tier: 'Tier 2 — Output', color: A.cyan, patterns: [
    { name: 'Visual Markers Only', body: 'Describe characters by visible markers — clothing, build, posture, action. Not proper names or unobservable attributes.' },
    { name: 'Camera Contract', body: '"Static locked-off. Zero movement." State camera behavior as an explicit rule before action. Anchors the model\'s output.' },
    { name: 'Under 200 Words', body: 'Soft cap from MCSLA. Going over signals padding rather than precision — tighten until every word earns its place.' },
  ]},
  { tier: 'Tier 3 — Architecture', color: A.purple, patterns: [
    { name: '3-Stage Chain', body: 'Character → image → video. Each stage produces an artifact the next stage consumes. Never collapse stages.' },
    { name: 'Pre-Delivery Checklist', body: 'Before sending a prompt, run a self-repair pass against known failure modes. 90 seconds saves credit burns downstream.' },
    { name: 'Strict-Order Workflow', body: 'Step N+1 can\'t start until Step N is approved. Skipping phases surfaces drift that\'s expensive to fix later.' },
  ]},
];

// ── MCSLA Builder ──────────────────────────────────────────────────────────────
function MCSLABuilder({ camera, setCamera }: { camera: string; setCamera: (c: string) => void }) {
  const [model, setModel] = useState('kling3');
  const [subject, setSubject] = useState('');
  const [look, setLook] = useState('Cinematic');
  const [action, setAction] = useState('');
  const [aspect, setAspect] = useState('16:9');
  const [duration, setDuration] = useState('8s');
  const [copied, setCopied] = useState(false);
  const modelLabel = VMODES.find(m => m.id === model)?.label ?? 'Kling 3.0';
  const prompt = `Model: ${modelLabel}\nAspect: ${aspect} | Duration: ${duration} | Style: ${look}\n\n${subject || '[describe your subject]'}.\nCamera: ${camera || '[select from Camera Library]'}.\n${action || '[describe the action]'}.\nStyle: ${look}. Cinematic color grade.`;
  const copy = () => { navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const pill = (active: boolean, color: string, soft: string, fn: () => void, label: string) => (
    <button onClick={fn} style={{ padding: '6px 15px', borderRadius: 980, border: `1px solid ${active ? color : A.border}`, background: active ? soft : 'transparent', color: active ? color : A.text3, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>{label}</button>
  );
  const row = (label: string, node: React.ReactNode) => (
    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 16, alignItems: 'start', marginBottom: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: A.text4, textTransform: 'uppercase', letterSpacing: 1.5, paddingTop: 8 }}>{label}</div>
      <div>{node}</div>
    </div>
  );
  return (
    <div style={{ background: A.bg2, border: `1px solid ${A.borderStrg}`, borderRadius: 24, padding: '32px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        <div>
          {row('Model', <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{VMODES.map(m => pill(model === m.id, m.color, m.soft, () => setModel(m.id), m.label))}</div>)}
          {row('Camera', (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {camera ? <span style={{ padding: '6px 15px', borderRadius: 980, background: A.coralSoft, border: `1px solid ${A.coral}`, color: A.coral, fontSize: 12, fontWeight: 600 }}>{camera}</span> : <span style={{ fontSize: 13, color: A.text4, fontStyle: 'italic' }}>Select from Camera Library ↓</span>}
              {camera && <button onClick={() => setCamera('')} style={{ fontSize: 11, color: A.text4, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>}
            </div>
          ))}
          {row('Subject', <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Character, object, environment…" style={{ width: '100%', padding: '9px 14px', borderRadius: 12, border: `1px solid ${A.borderStrg}`, background: A.bg3, color: A.text, fontSize: 13, outline: 'none' }} />)}
          {row('Look', <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{LOOKS.map(l => pill(look === l, A.amber, A.amberSoft, () => setLook(l), l))}</div>)}
          {row('Action', <textarea value={action} onChange={e => setAction(e.target.value)} rows={3} placeholder="Movement, event, or sequence…" style={{ width: '100%', padding: '9px 14px', borderRadius: 12, border: `1px solid ${A.borderStrg}`, background: A.bg3, color: A.text, fontSize: 13, outline: 'none', resize: 'vertical' }} />)}
          <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
            <div style={{ display: 'flex', gap: 6 }}>{['16:9', '9:16', '1:1'].map(a => pill(aspect === a, A.text3, A.bg4, () => setAspect(a), a))}</div>
            <div style={{ display: 'flex', gap: 6 }}>{['5s', '8s', '10s', '15s'].map(d => pill(duration === d, A.text3, A.bg4, () => setDuration(d), d))}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: A.text4, textTransform: 'uppercase', letterSpacing: 1.5 }}>Generated Prompt</div>
            <button onClick={copy} style={{ padding: '5px 16px', borderRadius: 980, border: `1px solid ${copied ? A.green : A.border}`, background: copied ? A.greenSoft : A.bg3, color: copied ? A.green : A.text3, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>{copied ? 'Copied ✓' : 'Copy'}</button>
          </div>
          <div style={{ flex: 1, background: A.bg, borderRadius: 14, border: `1px solid ${A.border}`, padding: '18px', fontFamily: 'var(--font-geist-mono)', fontSize: 12.5, lineHeight: 1.8, color: A.text3, whiteSpace: 'pre-wrap', minHeight: 260 }}>{prompt}</div>
          <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: A.text4 }}>MCSLA</span>
            {['Model', 'Camera', 'Subject', 'Look', 'Action'].map((l, i) => <span key={l} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: [A.coralSoft, A.purpleSoft, A.greenSoft, A.amberSoft, A.blueSoft][i], color: [A.coral, A.purple, A.green, A.amber, A.blue][i], fontWeight: 700 }}>{l}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function CameraLibrary({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) {
  const [tab, setTab] = useState('Follow');
  return (
    <div style={{ background: A.bg2, border: `1px solid ${A.borderStrg}`, borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${A.border}`, overflowX: 'auto', padding: '0 8px' }}>
        {Object.keys(CAMERA_GROUPS).map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 18px', border: 'none', background: 'transparent', color: tab === t ? A.text : A.text4, borderBottom: tab === t ? `2px solid ${A.coral}` : '2px solid transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', transition: 'color 0.2s' }}>{t}</button>)}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 11, color: A.text4 }}>tap preset → inserts into builder</div>
      </div>
      <div style={{ padding: '18px 24px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {CAMERA_GROUPS[tab].map(p => (
          <button key={p} onClick={() => onSelect(p)} style={{ padding: '8px 18px', borderRadius: 980, border: `1px solid ${selected === p ? A.coral : A.border}`, background: selected === p ? A.coralSoft : A.bg3, color: selected === p ? A.coral : A.text2, cursor: 'pointer', fontSize: 13, fontWeight: selected === p ? 700 : 400, transition: 'all 0.15s' }}>{p}</button>
        ))}
      </div>
    </div>
  );
}

function PromptStudio() {
  const [camera, setCamera] = useState('');
  return (<><MCSLABuilder camera={camera} setCamera={setCamera} /><div style={{ marginTop: 16 }}><CameraLibrary selected={camera} onSelect={setCamera} /></div></>);
}

const MODEL_ROWS = [
  { name: 'Kling 3.0',     real: 5, char: 5, motion: 5, audio: true,  dur: '3–15s',  tier: 'Premium', color: A.coral,  best: 'Cinematic · Character · Long-form audio' },
  { name: 'Sora 2',        real: 4, char: 3, motion: 5, audio: false, dur: '—',      tier: 'Premium', color: A.purple, best: 'Epic scale · Action · Crowd physics' },
  { name: 'Veo 3.1',       real: 5, char: 4, motion: 4, audio: true,  dur: '4–8s',   tier: 'Premium', color: A.green,  best: 'Nature · Environment · Ref images' },
  { name: 'Wan 2.7',       real: 4, char: 4, motion: 5, audio: true,  dur: '2–15s',  tier: 'Mid',     color: A.amber,  best: '60fps · First+last frame · Artistic' },
  { name: 'Seedance 2.0',  real: 5, char: 5, motion: 5, audio: true,  dur: '10s',    tier: 'Mid',     color: A.cyan,   best: '12-asset multimodal · Lip-sync' },
  { name: 'Hailuo 2.3',    real: 5, char: 4, motion: 5, audio: false, dur: '6–10s',  tier: 'Mid',     color: A.blue,   best: 'VFX · Fluid motion · Anime · Dance' },
];

function GenreGallery() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const copy = (i: number, text: string) => { navigator.clipboard.writeText(text); setCopied(i); setTimeout(() => setCopied(null), 1500); };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 12 }}>
      {GENRE_TEMPLATES.map((t, i) => (
        <div key={i} style={{ background: A.bg2, border: `1px solid ${A.borderStrg}`, borderRadius: 18, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s' }} onClick={() => setExpanded(expanded === i ? null : i)}>
          <div style={{ padding: '20px', borderLeft: `3px solid ${t.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: A.text }}>{t.genre}</div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: A.bg3, color: A.text4, fontWeight: 600, flexShrink: 0, marginLeft: 8, fontFamily: 'var(--font-geist-mono)' }}>{t.model}</span>
            </div>
            <div style={{ fontSize: 13, color: A.text3, lineHeight: 1.5 }}>{t.desc}</div>
          </div>
          {expanded === i && (
            <div style={{ background: A.bg3, borderTop: `1px solid ${A.border}`, padding: '16px 20px' }} onClick={e => e.stopPropagation()}>
              <pre style={{ fontSize: 12, lineHeight: 1.75, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-geist-mono)', color: A.text2, margin: '0 0 12px' }}>{t.prompt}</pre>
              <button onClick={() => copy(i, t.prompt)} style={{ padding: '6px 18px', borderRadius: 980, border: `1px solid ${copied === i ? A.green : A.coral}`, background: copied === i ? A.greenSoft : A.coralSoft, color: copied === i ? A.green : A.coral, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{copied === i ? 'Copied ✓' : 'Copy Prompt'}</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DisciplineGuide() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
      {DISCIPLINE_TIERS.map(tier => (
        <div key={tier.tier} style={{ background: A.bg2, border: `1px solid ${A.borderStrg}`, borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ background: tier.color + '15', borderBottom: `1px solid ${A.border}`, padding: '16px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: tier.color, textTransform: 'uppercase', letterSpacing: 2 }}>{tier.tier}</div>
          </div>
          <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tier.patterns.map(p => (
              <div key={p.name} style={{ paddingLeft: 14, borderLeft: `2px solid ${tier.color}40` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: A.text, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: A.text3, lineHeight: 1.6 }}>{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Section header helper ─────────────────────────────────────────────────────
function SH({ eyebrow, title, body, eyeColor = A.coral, chapter }: { eyebrow: string; title: string; body?: string; eyeColor?: string; chapter?: string }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
        {chapter && <span style={{ fontSize: 10, fontWeight: 700, color: A.text4, fontFamily: 'var(--font-geist-mono)', letterSpacing: 3 }}>{chapter}</span>}
        <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: eyeColor, fontWeight: 700 }}>{eyebrow}</div>
      </div>
      <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 400, color: A.text, letterSpacing: '-0.01em', lineHeight: 1.08, marginBottom: body ? 20 : 0, fontFamily: 'var(--font-abril), Georgia, serif' }}>{title}</h2>
      {body && <p style={{ fontSize: 17, color: A.text3, maxWidth: 580, lineHeight: 1.65, fontWeight: 400 }}>{body}</p>}
    </div>
  );
}

// ── Feature chips ─────────────────────────────────────────────────────────────
function Chips({ items, color }: { items: string[]; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {items.map(item => <span key={item} style={{ padding: '5px 14px', borderRadius: 980, border: `1px solid ${color}40`, background: color + '12', color, fontSize: 12, fontWeight: 600 }}>{item}</span>)}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function Page() {
  const [sectionNavVisible, setSectionNavVisible] = useState(false);
  useEffect(() => {
    const handle = () => setSectionNavVisible(window.scrollY > 480);
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: A.bg, color: A.text }}>

      {/* ── Global nav ── */}
      <nav style={{ position: 'fixed', top: 0, zIndex: 100, width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${A.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: `linear-gradient(135deg, ${A.coral}, ${A.purple})` }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: A.text, letterSpacing: '-0.5px' }}>Higgsfield</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="https://github.com/higgsfield-ai/higgsfield" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: A.text3 }}>GitHub</a>
          <a href="https://github.com/OSideMedia/higgsfield-ai-prompt-skill" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: A.text3 }}>Skill Docs</a>
          <a href="#prompt" style={{ padding: '6px 16px', borderRadius: 980, background: A.coral, color: '#fff', fontSize: 13, fontWeight: 600 }}>Open Studio</a>
        </div>
      </nav>

      {/* ── Section nav (scrollspy, appears after hero) ── */}
      <SectionNav visible={sectionNavVisible} />

      {/* ── Hero ── */}
      <section id="overview" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 48 }}>
        <div style={{ position: 'absolute', inset: 0 }}><HeroCanvas /></div>
        {/* radial glow */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,107,53,0.06) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, background: `linear-gradient(transparent, ${A.bg})` }} />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', maxWidth: 860, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 980, border: `1px solid ${A.border}`, background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: A.green }} />
            <span style={{ fontSize: 12, color: A.text3, letterSpacing: 0.5 }}>A Claude-Powered Developer Platform</span>
          </div>
          <h1 style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)', fontWeight: 400, color: A.text, lineHeight: 1.0, letterSpacing: '-0.01em', margin: 0, fontFamily: 'var(--font-abril), Georgia, serif' }}>
            Build the mind.<br />
            <span style={{ background: `linear-gradient(135deg, ${A.coral} 0%, ${A.purple} 60%, ${A.cyan} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Tell its story.</span>
          </h1>
          <p style={{ fontSize: 19, color: A.text3, lineHeight: 1.65, maxWidth: 600, fontWeight: 400, margin: 0 }}>
            Fault-tolerant distributed training for trillion-parameter models.
            Cinematic AI video generation from structured prompts.
            Two acts of the same creative journey — shaped by Claude,
            built for builders who think in chapters.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="#framework" style={{ padding: '13px 28px', borderRadius: 980, background: A.coral, color: '#fff', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Begin the journey</a>
            <a href="#prompt" style={{ padding: '13px 28px', borderRadius: 980, border: `1px solid ${A.borderStrg}`, background: 'rgba(255,255,255,0.05)', color: A.text, fontSize: 15, fontWeight: 600 }}>Enter the Studio</a>
          </div>
        </div>
        {/* scroll hint */}
        <div style={{ position: 'absolute', bottom: 40, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, color: A.text4, letterSpacing: 2, textTransform: 'uppercase' }}>Your story begins below</div>
          <div style={{ width: 1, height: 32, background: `linear-gradient(${A.text4}, transparent)` }} />
        </div>
      </section>

      {/* ── Two-product showcase (Apple "Meet your team") ── */}
      <section style={{ padding: '100px 0', borderTop: `1px solid ${A.border}` }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: A.text4, marginBottom: 14 }}>The Narrative Arc</div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 400, color: A.text, letterSpacing: '-0.01em', lineHeight: 1.08, fontFamily: 'var(--font-abril), Georgia, serif' }}>Act I, then Act II.</h2>
            <p style={{ fontSize: 16, color: A.text3, maxWidth: 480, margin: '16px auto 0', lineHeight: 1.65 }}>Train the intelligence. Then direct what it creates. Two products, one through-line.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              {
                name: 'Higgsfield', sub: 'GPU Orchestration Framework',
                body: 'Fault-tolerant multi-node distributed training for models with billions to trillions of parameters. ZeRO-3 sharding, PyTorch FSDP, and GitHub Actions CI in a single @experiment decorator.',
                chips: ['ZeRO-3 Sharding', 'Fault Tolerance', 'GitHub Actions CI', 'PyTorch Native'],
                color: A.purple, href: '#framework',
              },
              {
                name: 'Higgsfield AI', sub: 'Cinematic Video Generation',
                body: 'Generate production-grade cinematic AI video and images with 15+ generation engines, 40+ camera presets, the MCSLA formula, and Claude-powered prompt discipline.',
                chips: ['Kling 3.0', 'Sora 2 · Veo 3.1', 'MCSLA Builder', '10 Genre Templates'],
                color: A.coral, href: '#prompt',
              },
            ].map(card => (
              <a key={card.name} href={card.href} style={{ display: 'block', background: A.bg2, border: `1px solid ${A.borderStrg}`, borderRadius: 24, padding: '36px 32px', textDecoration: 'none', transition: 'border-color 0.25s', cursor: 'pointer' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: card.color + '20', border: `1px solid ${card.color}40`, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: card.color }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: A.text, marginBottom: 4, letterSpacing: '-0.02em' }}>{card.name}</div>
                <div style={{ fontSize: 13, color: card.color, fontWeight: 600, marginBottom: 16, letterSpacing: 0.5 }}>{card.sub}</div>
                <p style={{ fontSize: 15, color: A.text3, lineHeight: 1.65, marginBottom: 24 }}>{card.body}</p>
                <Chips items={card.chips} color={card.color} />
                <div style={{ marginTop: 24, fontSize: 14, color: card.color, fontWeight: 600 }}>Explore {card.name} →</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── GPU Framework ── */}
      <section id="framework" style={{ padding: '100px 0', borderTop: `1px solid ${A.border}` }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 32px' }}>
          <SH chapter="01 —" eyebrow="The Foundation" title="Train at any scale, without fear." body="Infrastructure failure shouldn't end your story. Higgsfield absorbs GPU failures, recovers checkpoints, and keeps the training run alive — across 3 nodes, 300, or 3,000. Write standard PyTorch. Higgsfield handles the rest." eyeColor={A.purple} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14, marginBottom: 60 }}>
            {[
              { title: 'ZeRO-3 Sharding', body: 'Partition parameters, gradients, and optimizer states across all GPUs. Train models that would never fit on a single device.', color: A.purple },
              { title: 'Fault Tolerance', body: 'GPU failures are detected and recovered automatically. Jobs resume from last checkpoint — no intervention, no lost progress.', color: A.coral },
              { title: 'Zero Config API', body: 'One @experiment decorator. No YAML, no 600-argument argparse. Standard PyTorch with a clean wrapper that does the heavy lifting.', color: A.cyan },
              { title: 'GitHub Actions CI', body: 'Higgsfield auto-generates deploy and run workflows. Push to main — your experiment starts on your cluster. No extra setup.', color: A.green },
            ].map(f => (
              <div key={f.title} style={{ background: A.bg2, border: `1px solid ${A.borderStrg}`, borderRadius: 20, padding: '26px 22px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: f.color + '18', border: `1px solid ${f.color}30`, marginBottom: 14 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: A.text, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: A.text3, lineHeight: 1.65 }}>{f.body}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 60, alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: A.text4, marginBottom: 12 }}>Supported Models</div>
              {[
                { label: 'LLaMA 70B / 2 / 3', desc: 'Alpaca, instruction tuning, RLHF' },
                { label: 'Mistral 7B', desc: 'Fast fine-tuning with ZeRO-2' },
                { label: 'Custom architectures', desc: 'Wrap any PyTorch model with FSDP' },
                { label: 'RL with PPO', desc: 'Actor-critic RLHF training loop built in' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: `1px solid ${A.border}` }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: A.purple, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: A.text }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: A.text4, marginTop: 2 }}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: A.text4, marginBottom: 12 }}>Cloud Compatibility</div>
              {['Azure', 'LambdaLabs', 'FluidStack', 'Any SSH-accessible GPU node'].map(c => (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: `1px solid ${A.border}` }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: A.coral, flexShrink: 0 }} />
                  <div style={{ fontSize: 14, color: A.text2 }}>{c}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ZeRO Explorer ── */}
      <section id="zero" style={{ padding: '100px 0', borderTop: `1px solid ${A.border}`, background: A.bg2 }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 32px' }}>
          <SH chapter="02 —" eyebrow="Memory Architecture" title="How trillion-parameter models fit." body="ZeRO sharding isn't magic — it's mathematics. Select a stage to watch your model's state distribute across the cluster, and understand exactly why each reduction matters." eyeColor={A.cyan} />
          <ZeroExplorer />
        </div>
      </section>

      {/* ── Code API ── */}
      <section id="api" style={{ padding: '100px 0', borderTop: `1px solid ${A.border}` }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 32px' }}>
          <SH chapter="03 —" eyebrow="The Interface" title="One decorator. Any model." body="The @experiment API wraps standard PyTorch with no opinion on your architecture, optimizer, or data pipeline. ZeRO stage, precision, and checkpointing — each a single keyword. Everything else stays yours." eyeColor={A.green} />
          <CodeExplorer />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 24 }}>
            {[{ v: 'ZeRO-3', d: 'One kwarg' }, { v: 'bf16', d: 'Mixed precision' }, { v: 'push_to_hub', d: 'HuggingFace export' }, { v: 'GitHub CI', d: 'Auto-generated workflow' }].map(s => (
              <div key={s.v} style={{ background: A.bg2, border: `1px solid ${A.border}`, borderRadius: 14, padding: '16px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: A.text, fontFamily: 'var(--font-geist-mono)' }}>{s.v}</div>
                <div style={{ fontSize: 12, color: A.text4, marginTop: 4 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Simulator ── */}
      <section id="simulator" style={{ padding: '100px 0', borderTop: `1px solid ${A.border}`, background: A.bg2 }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 32px' }}>
          <SH chapter="04 —" eyebrow="Live Training" title="Watch it break. Watch it heal." body="A 3-node, 12-GPU LLaMA 70B run: initialization, steady progress, a GPU failure at step 4203, automatic recovery, and continuation without intervention. This is fault tolerance as a first act." eyeColor={A.amber} />
          <TrainingSimulator />
        </div>
      </section>

      {/* ── Prompt Studio transition ── */}
      <section style={{ padding: '120px 32px', background: A.bg, borderTop: `1px solid ${A.border}`, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '8px 20px', borderRadius: 980, border: `1px solid ${A.coral}40`, background: A.coralSoft, marginBottom: 36 }}>
          <span style={{ fontSize: 11, color: A.coral, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Act II — Higgsfield AI</span>
        </div>
        <h2 style={{ fontSize: 'clamp(2.2rem, 6vw, 4.5rem)', fontWeight: 400, color: A.text, letterSpacing: '-0.01em', lineHeight: 1.05, maxWidth: 720, margin: '0 auto 24px', fontFamily: 'var(--font-abril), Georgia, serif' }}>
          You trained the model.<br />
          <span style={{ background: `linear-gradient(135deg, ${A.coral}, ${A.amber})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Now what will it make?</span>
        </h2>
        <p style={{ fontSize: 17, color: A.text3, maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.65 }}>
          Higgsfield AI is the cinematic video and image generation platform.
          The MCSLA formula, 15+ generation engines, and Claude-powered prompt
          discipline — in one interactive studio. Every frame a decision.
        </p>
        <Chips items={['Kling 3.0', 'Sora 2', 'Veo 3.1', 'Wan 2.7', 'Seedance 2.0', 'Hailuo 2.3', 'GPT Image', 'Flux Kontext']} color={A.coral} />
      </section>

      {/* ── Prompt Studio hero ── */}
      <section style={{ position: 'relative', height: 380, overflow: 'hidden', background: A.bg2, borderTop: `1px solid ${A.border}` }}>
        <AntigravityCanvas />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, background: `linear-gradient(transparent, ${A.bg2})` }} />
      </section>

      {/* ── MCSLA Builder ── */}
      <section id="prompt" style={{ padding: '80px 0 100px', background: A.bg2, borderBottom: `1px solid ${A.border}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 32px' }}>
          <SH chapter="05 —" eyebrow="The Formula" title="Five words that become cinema." body="Model · Camera · Subject · Look · Action. The MCSLA formula is a structured prompt language — not freestyle writing. Each layer adds precision. Each combination is a different film. Select a camera preset below to wire it directly into the builder." eyeColor={A.coral} />
          <PromptStudio />
        </div>
      </section>

      {/* ── Video Model Guide ── */}
      <section id="models" style={{ padding: '100px 0', borderTop: `1px solid ${A.border}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 32px' }}>
          <SH chapter="06 —" eyebrow="The Cast" title="The right model changes everything." body="Model selection is the first creative decision, not the last. Each generation engine tells stories differently — realism, character fidelity, motion quality, audio support. Know your cast before you call action." eyeColor={A.green} />
          <div style={{ background: A.bg2, border: `1px solid ${A.borderStrg}`, borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: `1px solid ${A.border}` }}>
                  {['Model', 'Realism', 'Character', 'Motion', 'Audio', 'Duration', 'Tier', 'Best for'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: A.text4, textTransform: 'uppercase', letterSpacing: 1.5, whiteSpace: 'nowrap' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {MODEL_ROWS.map((m, i) => (
                    <tr key={m.name} style={{ borderBottom: `1px solid ${A.border}`, background: i % 2 === 0 ? 'transparent' : A.bg3 }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: m.color, whiteSpace: 'nowrap' }}>{m.name}</td>
                      <td style={{ padding: '14px 16px', color: A.amber, fontSize: 12 }}>{'★'.repeat(m.real)}{'☆'.repeat(5 - m.real)}</td>
                      <td style={{ padding: '14px 16px', color: A.amber, fontSize: 12 }}>{'★'.repeat(m.char)}{'☆'.repeat(5 - m.char)}</td>
                      <td style={{ padding: '14px 16px', color: A.amber, fontSize: 12 }}>{'★'.repeat(m.motion)}{'☆'.repeat(5 - m.motion)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>{m.audio ? <span style={{ color: A.green, fontWeight: 700 }}>✓</span> : <span style={{ color: A.text4 }}>—</span>}</td>
                      <td style={{ padding: '14px 16px', color: A.text3, fontFamily: 'var(--font-geist-mono)', fontSize: 12, whiteSpace: 'nowrap' }}>{m.dur}</td>
                      <td style={{ padding: '14px 16px' }}><span style={{ padding: '2px 10px', borderRadius: 4, background: m.tier === 'Premium' ? A.purpleSoft : A.greenSoft, color: m.tier === 'Premium' ? A.purple : A.green, fontSize: 11, fontWeight: 700 }}>{m.tier}</span></td>
                      <td style={{ padding: '14px 16px', color: A.text3 }}>{m.best}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── Genre Templates ── */}
      <section id="templates" style={{ padding: '100px 0', borderTop: `1px solid ${A.border}`, background: A.bg2 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 32px' }}>
          <SH chapter="07 —" eyebrow="Genre Studies" title="Every genre has a grammar." body="From action chase to horror atmosphere, from romance to dance performance — these are annotated production prompts from real workflows. Each carries model recommendations, camera contract, and style intent. Click any card to read the full prompt." eyeColor={A.amber} />
          <GenreGallery />
        </div>
      </section>

      {/* ── DISCIPLINE Framework ── */}
      <section id="discipline" style={{ padding: '100px 0', borderTop: `1px solid ${A.border}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 32px' }}>
          <SH chapter="08 —" eyebrow="Production Craft" title="The rules of the discipline." body="Nine named patterns. Three tiers. One year of production fire. DISCIPLINE separates a 1% acceptance rate from burning credits on noise — forged across 15 people, 14 days, and one 90-minute AI feature at Cannes." eyeColor={A.purple} />
          <DisciplineGuide />
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '120px 32px', borderTop: `1px solid ${A.border}`, background: A.bg2, textAlign: 'center' }}>
        <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: A.text4, marginBottom: 20 }}>Your chapter starts now</div>
        <h2 style={{ fontSize: 'clamp(2.2rem, 6vw, 4.5rem)', fontWeight: 400, color: A.text, letterSpacing: '-0.01em', lineHeight: 1.05, maxWidth: 680, margin: '0 auto 24px', fontFamily: 'var(--font-abril), Georgia, serif' }}>
          What will you{' '}
          <span style={{ background: `linear-gradient(135deg, ${A.coral}, ${A.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>train</span>
          {' '}and{' '}
          <span style={{ background: `linear-gradient(135deg, ${A.amber}, ${A.coral})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>create</span>?
        </h2>
        <p style={{ fontSize: 17, color: A.text3, maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.65 }}>
          Every significant AI creation starts with infrastructure that holds
          and prompts that direct. You have both. Anthropic builds Claude to
          advance AI that is safe and beneficial — Higgsfield builds the tools
          that let you do the same.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://github.com/higgsfield-ai/higgsfield" target="_blank" rel="noopener noreferrer" style={{ padding: '14px 30px', borderRadius: 980, background: A.coral, color: '#fff', fontSize: 15, fontWeight: 600 }}>GPU Framework on GitHub ↗</a>
          <a href="https://higgsfield.ai" target="_blank" rel="noopener noreferrer" style={{ padding: '14px 30px', borderRadius: 980, border: `1px solid ${A.borderStrg}`, background: 'rgba(255,255,255,0.04)', color: A.text, fontSize: 15, fontWeight: 600 }}>Open Higgsfield AI ↗</a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${A.border}`, padding: '32px', background: A.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: A.text4 }}>GPU framework: <a href="https://github.com/higgsfield-ai/higgsfield" target="_blank" rel="noopener noreferrer" style={{ color: A.purple }}>higgsfield-ai/higgsfield</a></span>
          <span style={{ fontSize: 12, color: A.text4 }}>Prompt skill: <a href="https://github.com/OSideMedia/higgsfield-ai-prompt-skill" target="_blank" rel="noopener noreferrer" style={{ color: A.coral }}>OSideMedia/higgsfield-ai-prompt-skill</a></span>
          <span style={{ fontSize: 12, color: A.text4 }}>Powered by <span style={{ color: A.cyan }}>Claude</span> · Anthropic</span>
        </div>
        <div style={{ fontSize: 11, color: A.text4, fontFamily: 'var(--font-geist-mono)' }}>john3913/gshultz</div>
      </footer>

    </div>
  );
}
