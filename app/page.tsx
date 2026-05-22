'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

// ── Dark palette (GPU Orchestration) ─────────────────────────────────────────
const C = {
  bg: '#05070f', bg2: '#0a0e1c', bg3: '#0f1628', bg4: '#141d36',
  line: 'rgba(99,102,241,0.12)', lineStrg: 'rgba(99,102,241,0.28)',
  text: '#F1F5F9', text2: '#CBD5E1', text3: '#94A3B8', text4: '#475569',
  indigo: '#818CF8', violet: '#A78BFA', cyan: '#22D3EE',
  amber: '#FBBF24', green: '#34D399', red: '#F87171',
  indigoSoft: 'rgba(129,140,248,0.12)', cyanSoft: 'rgba(34,211,238,0.10)',
  amberSoft: 'rgba(251,191,36,0.10)', greenSoft: 'rgba(52,211,153,0.10)',
};

// ── Light palette (Apple + Google Antigravity) ────────────────────────────────
const L = {
  bg: '#FFFFFF', bg2: '#F8F9FA', bg3: '#F1F3F4', bg4: '#E8EAED',
  line: 'rgba(0,0,0,0.07)', lineStrg: 'rgba(0,0,0,0.13)',
  text: '#1d1d1f', text2: '#3C4043', text3: '#5F6368', text4: '#9AA0A6',
  blue: '#1A73E8', blueSoft: 'rgba(26,115,232,0.08)',
  green: '#34A853', greenSoft: 'rgba(52,168,83,0.08)',
  red: '#EA4335', redSoft: 'rgba(234,67,53,0.08)',
  yellow: '#FBBC04', yellowSoft: 'rgba(251,188,4,0.08)',
  orange: '#FA7B17', orangeSoft: 'rgba(250,123,23,0.08)',
  purple: '#7B52F3', purpleSoft: 'rgba(123,82,243,0.08)',
};

// ── Hero Canvas — GPU cluster network ─────────────────────────────────────────
function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    type Node = { x: number; y: number; node: number; gpu: number };
    type Spark = { from: Node; to: Node; t: number; speed: number; color: string };
    const NODES = 3; const GPUS_PER = 4;
    let nodes: Node[] = []; let sparks: Spark[] = [];
    const build = () => {
      nodes = [];
      const W = canvas.width, H = canvas.height;
      for (let n = 0; n < NODES; n++) {
        const cx = W * 0.15 + (W * 0.7) * (n / (NODES - 1)), cy = H * 0.5;
        for (let g = 0; g < GPUS_PER; g++) {
          const angle = (g / GPUS_PER) * Math.PI * 2 - Math.PI / 2;
          const r = Math.min(W, H) * 0.08;
          nodes.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, node: n, gpu: g });
        }
      }
    };
    build();
    const spawnSpark = () => {
      if (nodes.length < 2) return;
      const a = nodes[Math.floor(Math.random() * nodes.length)];
      const b = nodes[Math.floor(Math.random() * nodes.length)];
      if (a === b) return;
      sparks.push({ from: a, to: b, t: 0, speed: 0.008 + Math.random() * 0.012, color: a.node !== b.node ? C.violet : C.cyan });
    };
    let lastSpawn = 0;
    const draw = (ts: number) => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      for (let n = 0; n < NODES; n++) {
        const grp = nodes.filter(nd => nd.node === n);
        for (let i = 0; i < grp.length; i++) for (let j = i + 1; j < grp.length; j++) {
          ctx.beginPath(); ctx.moveTo(grp[i].x, grp[i].y); ctx.lineTo(grp[j].x, grp[j].y);
          ctx.strokeStyle = 'rgba(34,211,238,0.08)'; ctx.lineWidth = 1; ctx.stroke();
        }
        const cx = grp.reduce((s, nd) => s + nd.x, 0) / grp.length;
        const cy = grp.reduce((s, nd) => s + nd.y, 0) / grp.length;
        ctx.beginPath(); ctx.arc(cx, cy, Math.min(W, H) * 0.095, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(99,102,241,0.07)'; ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]); ctx.stroke(); ctx.setLineDash([]);
      }
      for (let a = 0; a < NODES - 1; a++) {
        const ga = nodes.filter(nd => nd.node === a), gb = nodes.filter(nd => nd.node === a + 1);
        for (let i = 0; i < ga.length; i++) {
          const j = i % gb.length;
          ctx.beginPath(); ctx.moveTo(ga[i].x, ga[i].y); ctx.lineTo(gb[j].x, gb[j].y);
          ctx.strokeStyle = 'rgba(167,139,250,0.1)'; ctx.lineWidth = 1; ctx.stroke();
        }
      }
      nodes.forEach(nd => {
        const grad = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, 10);
        grad.addColorStop(0, nd.node === 0 ? 'rgba(129,140,248,0.9)' : nd.node === 1 ? 'rgba(34,211,238,0.9)' : 'rgba(167,139,250,0.9)');
        grad.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(nd.x, nd.y, 5, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
        ctx.beginPath(); ctx.arc(nd.x, nd.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
      });
      for (let n = 0; n < NODES; n++) {
        const grp = nodes.filter(nd => nd.node === n);
        const cx = grp.reduce((s, nd) => s + nd.x, 0) / grp.length;
        const cy = grp.reduce((s, nd) => s + nd.y, 0) / grp.length + Math.min(W, H) * 0.12;
        ctx.font = '11px var(--font-geist-mono, monospace)'; ctx.fillStyle = C.text4;
        ctx.textAlign = 'center'; ctx.fillText(`NODE-${n}`, cx, cy);
      }
      sparks = sparks.filter(s => s.t <= 1);
      sparks.forEach(s => {
        s.t += s.speed;
        const x = s.from.x + (s.to.x - s.from.x) * s.t, y = s.from.y + (s.to.y - s.from.y) * s.t;
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.sin(s.t * Math.PI) * 0.9 + 0.1; ctx.fill(); ctx.globalAlpha = 1;
      });
      if (ts - lastSpawn > 180) { spawnSpark(); lastSpawn = ts; }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

// ── Antigravity floating dots canvas (light, Google-multicolor) ───────────────
function AntigravityCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const COLORS = ['#1A73E8', '#34A853', '#FBBC04', '#EA4335', '#FA7B17', '#7B52F3'];
    type Dot = { x: number; y: number; vx: number; vy: number; w: number; h: number; alpha: number; color: string };
    let dots: Dot[] = [];
    const init = () => {
      const W = canvas.width, H = canvas.height;
      dots = Array.from({ length: 80 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
        w: 4 + Math.random() * 12, h: 3 + Math.random() * 7,
        alpha: 0.18 + Math.random() * 0.32,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    };
    init();
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      dots.forEach(d => {
        ctx.save(); ctx.globalAlpha = d.alpha;
        ctx.fillStyle = d.color;
        ctx.beginPath(); ctx.ellipse(d.x, d.y, d.w / 2, d.h / 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
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

// ── ZeRO Stage Explorer ────────────────────────────────────────────────────────
const ZERO_STAGES = [
  { id: 0, label: 'Baseline', subtitle: 'No sharding', description: 'Every GPU holds a full copy of model parameters, gradients, and optimizer states. Memory scales linearly with replicas.', paramSharded: false, gradSharded: false, optSharded: false, memReduction: '1×' },
  { id: 1, label: 'ZeRO-1', subtitle: 'Optimizer state sharding', description: 'Optimizer states (Adam moments, variance) are partitioned across GPUs. Parameters and gradients are replicated. ~4× memory reduction for Adam.', paramSharded: false, gradSharded: false, optSharded: true, memReduction: '4×' },
  { id: 2, label: 'ZeRO-2', subtitle: 'Grad + optimizer sharding', description: 'Gradients are also partitioned after each reduce. Each GPU only stores its slice. ~8× memory reduction versus baseline.', paramSharded: false, gradSharded: true, optSharded: true, memReduction: '8×' },
  { id: 3, label: 'ZeRO-3', subtitle: 'Full parameter sharding', description: 'Parameters are also partitioned. Each GPU owns 1/N of the model. Layers are gathered on-demand during forward/backward. Enables trillion-parameter models.', paramSharded: true, gradSharded: true, optSharded: true, memReduction: 'N×' },
];
const GPU_COUNT = 8;

function ZeroExplorer() {
  const [active, setActive] = useState(3);
  const stage = ZERO_STAGES[active];
  const renderGpu = (i: number) => {
    const sections = [
      { label: 'Param', sharded: stage.paramSharded, color: C.indigo, soft: C.indigoSoft },
      { label: 'Grad',  sharded: stage.gradSharded,  color: C.cyan,   soft: C.cyanSoft   },
      { label: 'Opt',   sharded: stage.optSharded,   color: C.amber,  soft: C.amberSoft  },
    ];
    return (
      <div key={i} style={{ flex: 1, minWidth: 0, border: `1px solid ${C.lineStrg}`, borderRadius: 8, padding: '8px 6px', background: C.bg2 }}>
        <div style={{ fontSize: 9, color: C.text4, fontFamily: 'var(--font-geist-mono)', textAlign: 'center', marginBottom: 6 }}>GPU {i}</div>
        {sections.map(sec => (
          <div key={sec.label} style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 8, color: C.text4, fontFamily: 'var(--font-geist-mono)', marginBottom: 2 }}>{sec.label}</div>
            {sec.sharded ? (
              <div style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: GPU_COUNT }).map((_, gi) => (
                  <div key={gi} style={{ height: 8, flex: 1, background: gi === i ? sec.color : sec.soft, borderRadius: 2, opacity: gi === i ? 1 : 0.35, transition: 'background 0.3s' }} />
                ))}
              </div>
            ) : (
              <div style={{ height: 8, background: sec.color, borderRadius: 2, opacity: 0.8 }} />
            )}
          </div>
        ))}
      </div>
    );
  };
  return (
    <div style={{ background: C.bg2, border: `1px solid ${C.lineStrg}`, borderRadius: 16, padding: '32px 28px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {ZERO_STAGES.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)} style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${active === s.id ? C.indigo : C.lineStrg}`, background: active === s.id ? C.indigoSoft : 'transparent', color: active === s.id ? C.indigo : C.text3, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}>{s.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>{stage.label} — {stage.subtitle}</div>
          <div style={{ fontSize: 14, color: C.text3, maxWidth: 560, lineHeight: 1.6 }}>{stage.description}</div>
        </div>
        <div style={{ textAlign: 'center', background: C.bg3, border: `1px solid ${C.indigo}`, borderRadius: 10, padding: '12px 20px', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: C.text4, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: 1 }}>Memory Reduction</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.indigo, fontFamily: 'var(--font-geist-mono)' }}>{stage.memReduction}</div>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: C.text4, fontFamily: 'var(--font-geist-mono)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{GPU_COUNT} GPUs across cluster</div>
        <div style={{ display: 'flex', gap: 6 }}>{Array.from({ length: GPU_COUNT }).map((_, i) => renderGpu(i))}</div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
        {[{ label: 'Model Parameters', color: C.indigo, sharded: stage.paramSharded }, { label: 'Gradients', color: C.cyan, sharded: stage.gradSharded }, { label: 'Optimizer States', color: C.amber, sharded: stage.optSharded }].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, opacity: 0.85 }} />
            <span style={{ fontSize: 12, color: C.text3 }}>{item.label}</span>
            <span style={{ fontSize: 11, color: item.sharded ? C.green : C.text4, fontFamily: 'var(--font-geist-mono)' }}>{item.sharded ? 'sharded' : 'replicated'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Code Examples ──────────────────────────────────────────────────────────────
const CODE_EXAMPLES = [
  { label: 'LLaMA 70B', code: `from higgsfield.llama import Llama70b\nfrom higgsfield.loaders import LlamaLoader\nfrom higgsfield.experiment import experiment\nimport torch.optim as optim\nfrom alpaca import get_alpaca_data\n\n@experiment("alpaca")\ndef train(params):\n    model = Llama70b(zero_stage=3, fast_attn=False, precision="bf16")\n    optimizer = optim.AdamW(model.parameters(), lr=1e-5, weight_decay=0.0)\n    dataset = get_alpaca_data(split="train")\n    train_loader = LlamaLoader(dataset, max_words=2048)\n    for batch in train_loader:\n        optimizer.zero_grad()\n        loss = model(batch)\n        loss.backward()\n        optimizer.step()\n    model.push_to_hub('alpaca-70b')` },
  { label: 'Mistral 7B', code: `from higgsfield.mistral import Mistral7b\nfrom higgsfield.loaders import MistralLoader\nfrom higgsfield.experiment import experiment\nimport torch.optim as optim\n\n@experiment("mistral-finetune")\ndef train(params):\n    model = Mistral7b(zero_stage=2, precision="bf16")\n    optimizer = optim.AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)\n    train_loader = MistralLoader(your_dataset, max_words=4096)\n    for batch in train_loader:\n        optimizer.zero_grad()\n        loss = model(batch)\n        loss.backward()\n        optimizer.step()\n    model.push_to_hub('mistral-finetuned')` },
  { label: 'RL / PPO', code: `from higgsfield.llama import Llama7b\nfrom higgsfield.rl.ppo import PPOTrainer\nfrom higgsfield.experiment import experiment\n\n@experiment("rlhf-ppo")\ndef train(params):\n    actor = Llama7b(zero_stage=3, precision="bf16")\n    critic = Llama7b(zero_stage=3, precision="bf16")\n    trainer = PPOTrainer(actor=actor, critic=critic, kl_coef=0.1, gamma=1.0, lam=0.95)\n    for step, batch in enumerate(reward_dataloader):\n        completions = actor.generate(batch["prompts"])\n        rewards = reward_model(completions)\n        trainer.step(queries=batch["prompts"], responses=completions, scores=rewards)\n    actor.push_to_hub("rlhf-llama-7b")` },
  { label: 'Custom FSDP', code: `from higgsfield.training import FullyShardedParallel\nfrom higgsfield.experiment import experiment\nfrom torch.distributed.fsdp import FullyShardedDataParallel as FSDP, MixedPrecision\nimport torch\n\n@experiment("custom-fsdp")\ndef train(params):\n    model = MyHugeTransformer(layers=96, dim=12288)\n    mp_policy = MixedPrecision(\n        param_dtype=torch.bfloat16,\n        reduce_dtype=torch.float32,\n        buffer_dtype=torch.float32,\n    )\n    sharded = FullyShardedParallel(model, mixed_precision=mp_policy, sharding_strategy="FULL_SHARD")\n    for batch in dataloader:\n        loss = sharded(batch)\n        loss.backward()\n        optimizer.step()` },
];

function tokenize(code: string) {
  const keywords = /\b(from|import|def|return|for|in|if|class|as|with|yield|lambda|True|False|None|and|or|not|pass|break|continue|raise)\b/g;
  const strings = /("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*')/g;
  const comments = /(#.*)/g;
  const decorators = /(@\w+)/g;
  const numbers = /\b(\d+\.?\d*)\b/g;
  const builtins = /\b(print|len|range|enumerate|zip|map|filter|list|dict|set|tuple|str|int|float|bool|type|super|self)\b/g;
  const spans: { start: number; end: number; color: string }[] = [];
  const add = (re: RegExp, color: string) => { let m; re.lastIndex = 0; while ((m = re.exec(code)) !== null) spans.push({ start: m.index, end: m.index + m[0].length, color }); };
  add(comments, C.text4); add(strings, C.green); add(decorators, C.amber);
  add(keywords, C.violet); add(builtins, C.cyan); add(numbers, C.amber);
  spans.sort((a, b) => a.start - b.start);
  const parts: { text: string; color: string }[] = [];
  let pos = 0;
  for (const s of spans) {
    if (s.start < pos) continue;
    if (s.start > pos) parts.push({ text: code.slice(pos, s.start), color: C.text2 });
    parts.push({ text: code.slice(s.start, s.end), color: s.color });
    pos = s.end;
  }
  if (pos < code.length) parts.push({ text: code.slice(pos), color: C.text2 });
  return parts;
}

function CodeExplorer() {
  const [active, setActive] = useState(0);
  const ex = CODE_EXAMPLES[active];
  const parts = tokenize(ex.code);
  return (
    <div style={{ background: C.bg2, border: `1px solid ${C.lineStrg}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.line}`, background: C.bg3 }}>
        {CODE_EXAMPLES.map((e, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ padding: '12px 20px', border: 'none', background: 'transparent', color: active === i ? C.text : C.text4, borderBottom: active === i ? `2px solid ${C.indigo}` : '2px solid transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'color 0.2s' }}>{e.label}</button>
        ))}
      </div>
      <div style={{ padding: '24px 28px', overflowX: 'auto' }}>
        <pre style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre', fontFamily: 'var(--font-geist-mono)' }}>
          {parts.map((p, i) => <span key={i} style={{ color: p.color }}>{p.text}</span>)}
        </pre>
      </div>
    </div>
  );
}

// ── Training Simulator ─────────────────────────────────────────────────────────
const LOG_LINES_TEMPLATE = [
  { t: 300, msg: '[node-0] Initializing process group (NCCL backend)' },
  { t: 600, msg: '[node-1] Initializing process group (NCCL backend)' },
  { t: 900, msg: '[node-2] Initializing process group (NCCL backend)' },
  { t: 1400, msg: '[all]   ZeRO-3 enabled across 12 GPUs' },
  { t: 1800, msg: '[node-0] Loading model shards onto 4 × A100-80GB' },
  { t: 2200, msg: '[checkpoint] Resuming from step 4200' },
  { t: 2600, msg: 'step=4201 loss=1.423 grad_norm=0.82 lr=1.0e-05' },
  { t: 3200, msg: 'step=4202 loss=1.391 grad_norm=0.78 lr=1.0e-05' },
  { t: 3800, msg: 'step=4203 loss=1.377 grad_norm=0.71 lr=1.0e-05' },
  { t: 4200, msg: '[node-1] GPU 1 dropped — re-routing gradient allreduce' },
  { t: 4400, msg: '[fault] Detected worker failure, rescheduling job' },
  { t: 4800, msg: '[recovery] Restoring from last checkpoint (step 4203)' },
  { t: 5200, msg: 'step=4204 loss=1.361 grad_norm=0.69 lr=1.0e-05' },
  { t: 5600, msg: 'step=4205 loss=1.348 grad_norm=0.65 lr=1.0e-05' },
  { t: 6000, msg: 'step=4206 loss=1.329 grad_norm=0.61 lr=1.0e-05' },
  { t: 6400, msg: '[checkpoint] Saved checkpoint at step 4206' },
  { t: 6800, msg: 'step=4207 loss=1.312 grad_norm=0.58 lr=1.0e-05' },
  { t: 7400, msg: 'step=4208 loss=1.298 grad_norm=0.54 lr=1.0e-05' },
];
const GPU_UTIL_SEED = [82, 91, 78, 95, 88, 71, 93, 86, 79, 92, 85, 74];

function TrainingSimulator() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<{ msg: string; color: string }[]>([]);
  const [step, setStep] = useState(0);
  const [loss, setLoss] = useState<number[]>([]);
  const [utilization, setUtilization] = useState(GPU_UTIL_SEED.map(() => 0));
  const logRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reset = useCallback(() => {
    timerRef.current.forEach(clearTimeout);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setLogs([]); setStep(0); setLoss([]); setRunning(false);
    setUtilization(GPU_UTIL_SEED.map(() => 0));
  }, []);
  const start = useCallback(() => {
    reset(); setRunning(true);
    LOG_LINES_TEMPLATE.forEach(({ t, msg }) => {
      const color = msg.includes('[fault]') || msg.includes('dropped') ? C.red : msg.includes('[recovery]') || msg.includes('[checkpoint]') ? C.amber : msg.includes('[all]') || msg.includes('ZeRO') ? C.green : msg.startsWith('step=') ? C.text2 : C.text3;
      const id = setTimeout(() => setLogs(prev => [...prev.slice(-30), { msg, color }]), t);
      timerRef.current.push(id);
    });
    const losses = [1.423, 1.391, 1.377, 1.361, 1.348, 1.329, 1.312, 1.298];
    losses.forEach((l, i) => { const id = setTimeout(() => setLoss(prev => [...prev, l]), 2600 + i * 680); timerRef.current.push(id); });
    let s = 4201;
    intervalRef.current = setInterval(() => {
      setStep(s++);
      setUtilization(prev => prev.map((u, i) => { const base = GPU_UTIL_SEED[i]; return Math.min(100, Math.max(0, base + Math.round((Math.random() - 0.5) * 8))); }));
      if (s > 4209) { if (intervalRef.current) clearInterval(intervalRef.current); setRunning(false); }
    }, 680);
  }, [reset]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logs]);
  useEffect(() => () => { timerRef.current.forEach(clearTimeout); if (intervalRef.current) clearInterval(intervalRef.current); }, []);
  const maxLoss = 1.5, minLoss = 1.2;
  return (
    <div style={{ background: C.bg2, border: `1px solid ${C.lineStrg}`, borderRadius: 16, padding: '28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Training Simulator</div>
          <div style={{ fontSize: 13, color: C.text3, marginTop: 2 }}>3 nodes × 4 GPUs — LLaMA 70B fine-tune on Alpaca</div>
        </div>
        {running ? <button onClick={reset} style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${C.red}`, background: 'transparent', color: C.red, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Stop</button>
          : <button onClick={start} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.indigo, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{logs.length ? 'Restart' : 'Start Training'}</button>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div ref={logRef} style={{ background: C.bg, borderRadius: 10, border: `1px solid ${C.line}`, padding: '14px 16px', height: 220, overflowY: 'auto', fontFamily: 'var(--font-geist-mono)', fontSize: 11, lineHeight: 1.7 }}>
          {logs.length === 0 && <span style={{ color: C.text4 }}>$ Press "Start Training" to begin simulation...</span>}
          {logs.map((l, i) => <div key={i} style={{ color: l.color }}>{l.msg}</div>)}
          {running && <span style={{ color: C.green }}>▊</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: C.bg, borderRadius: 10, border: `1px solid ${C.line}`, padding: '12px 14px', flex: 1 }}>
            <div style={{ fontSize: 11, color: C.text4, fontFamily: 'var(--font-geist-mono)', marginBottom: 8 }}>TRAINING LOSS</div>
            <svg width="100%" height="70" viewBox="0 0 200 70" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="0" y2="70" stroke={C.line} strokeWidth="1" />
              <line x1="0" y1="70" x2="200" y2="70" stroke={C.line} strokeWidth="1" />
              {loss.length > 1 && <polyline points={loss.map((l, i) => `${(i / Math.max(loss.length - 1, 1)) * 200},${70 - ((l - minLoss) / (maxLoss - minLoss)) * 70}`).join(' ')} fill="none" stroke={C.indigo} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {loss.map((l, i) => { const x = (i / Math.max(loss.length - 1, 1)) * 200, y = 70 - ((l - minLoss) / (maxLoss - minLoss)) * 70; return <circle key={i} cx={x} cy={y} r="3" fill={C.indigo} />; })}
            </svg>
            {loss.length > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}><span style={{ fontSize: 10, color: C.text4, fontFamily: 'var(--font-geist-mono)' }}>step {step}</span><span style={{ fontSize: 11, color: C.indigo, fontFamily: 'var(--font-geist-mono)', fontWeight: 700 }}>loss {loss[loss.length - 1]?.toFixed(3)}</span></div>}
          </div>
          <div style={{ background: C.bg, borderRadius: 10, border: `1px solid ${C.line}`, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: C.text4, fontFamily: 'var(--font-geist-mono)', marginBottom: 8 }}>GPU UTILIZATION</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {utilization.slice(0, 8).map((u, i) => (
                <div key={i}>
                  <div style={{ fontSize: 9, color: C.text4, fontFamily: 'var(--font-geist-mono)', marginBottom: 3 }}>G{i}</div>
                  <div style={{ height: 4, background: C.bg3, borderRadius: 2 }}><div style={{ height: '100%', width: `${u}%`, background: u > 85 ? C.green : u > 60 ? C.amber : C.red, borderRadius: 2, transition: 'width 0.5s' }} /></div>
                  <div style={{ fontSize: 9, color: C.text4, fontFamily: 'var(--font-geist-mono)', marginTop: 1 }}>{u}%</div>
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
  { id: 'kling3', label: 'Kling 3.0', tag: 'Characters · Audio', color: L.blue, soft: L.blueSoft },
  { id: 'sora2', label: 'Sora 2', tag: 'Epic scale · Physics', color: L.purple, soft: L.purpleSoft },
  { id: 'veo31', label: 'Veo 3.1', tag: 'Nature · Ref images', color: L.green, soft: L.greenSoft },
  { id: 'wan27', label: 'Wan 2.7', tag: '60fps · Artistic', color: L.orange, soft: L.orangeSoft },
  { id: 'seedance', label: 'Seedance 2.0', tag: 'Multimodal · Complex', color: L.red, soft: L.redSoft },
  { id: 'hailuo', label: 'Hailuo 2.3', tag: 'VFX · Fluid motion', color: '#0EA5E9', soft: 'rgba(14,165,233,0.08)' },
];

const CAMERA_GROUPS: Record<string, string[]> = {
  Follow:   ['Action Run', 'FPV Drone', 'Handheld', 'Snorricam', 'Head Tracking'],
  Dolly:    ['Dolly In', 'Dolly Out', 'Dolly Zoom In', 'Super Dolly In', 'Truck'],
  Orbit:    ['360 Orbit', 'Arc', 'Lazy Susan', 'Robo Arm'],
  Crane:    ['Crane Up', 'Crane Down', 'Overhead', 'Levitation'],
  Effect:   ['Bullet Time', 'Dutch Angle', 'Whip Pan', 'Crash Zoom In', 'Rack Focus'],
};

const LOOK_OPTIONS = ['Cinematic', 'VHS', 'Super 8MM', 'Anamorphic', 'Abstract', 'Noir'];

const GENRE_TEMPLATES = [
  { genre: 'Action Chase', model: 'Kling 3.0', color: L.red, desc: 'High-energy pursuit with kinetic movement and urgency.', prompt: 'A woman in a tactical jacket sprints through a rain-soaked night market, weaving between stalls. Steam rises from food carts. Neon signs fracture in every puddle.\nCamera: Action Run — low behind her, matching pace.\nA metal gate drops ahead. She slides under it without breaking stride.\nStyle: Cinematic. Cold blue shadows, warm amber market light.' },
  { genre: 'Sci-Fi VFX', model: 'Sora 2', color: L.purple, desc: 'Zero-gravity, energy effects, portal/transformation moments.', prompt: 'A battle-worn space station corridor, emergency lighting, debris floating in zero gravity. A soldier in heavy tactical armor pulls herself along a handrail, rifle raised.\nCamera: FPV Drone drifting just ahead through the corridor.\nStyle: Cinematic, cold steel blue, high contrast. Apply Plasma Explosion at the detonation.' },
  { genre: 'Nature Landscape', model: 'Veo 3.1', color: L.green, desc: 'Sweeping environments, weather, environmental cinematography.', prompt: 'A vast glacier at golden hour, surface cracked with deep blue fissures. Mist drifts low across the ice. An Arctic fox pauses at the edge of a crevasse, ears perked.\nCamera: Slow Crane Up, revealing the scale of the ice field.\nStyle: Natural, cold palette, overcast diffused light.' },
  { genre: 'Fashion Editorial', model: 'Kling 3.0', color: L.orange, desc: 'High-fashion visual storytelling with editorial composition.', prompt: 'A model in a sculptural ivory couture gown stands in a brutalist concrete stairwell. Shaft of light cuts across the floor from a high window.\nCamera: Arc — slow 180-degree sweep revealing the silhouette.\nStyle: Editorial. Hard directional light, deep shadow contrast, desaturated.' },
  { genre: 'Horror Atmosphere', model: 'Wan 2.6', color: '#6B21A8', desc: 'Dread-building with environmental tension and shadow play.', prompt: 'A long hospital corridor at 3am. Fluorescent tubes flicker — one, then two. A wheelchair sits unmanned at the far end, slowly turning.\nCamera: Static locked-off. Zero movement. No pan, no zoom.\nStyle: Desaturated with harsh tungsten highlights. Deep shadow pools.' },
  { genre: 'Product UGC', model: 'Kling 3.0', color: L.blue, desc: 'Social-first product reveal with authentic energy.', prompt: 'Hands hold a matte black espresso cup. Steam curls above. A single slow drip of coffee falls from the rim. Clean white marble countertop, morning light from the left.\nCamera: Dolly In — slow push toward the cup.\nStyle: Warm, soft natural light. Shallow depth of field.' },
  { genre: 'Romance', model: 'Wan 2.5', color: '#E879F9', desc: 'Intimate, soft-focus emotional storytelling.', prompt: 'Two people on a rain-slicked Paris bridge, umbrellas touching. Streetlamps create halos in the wet air. One leans in; the other smiles before looking away.\nCamera: Handheld — gentle sway, intimate proximity.\nStyle: Warm sodium light, soft chromatic fringing, slightly overexposed.' },
  { genre: 'Dance Performance', model: 'Minimax Hailuo 2.3', color: '#14B8A6', desc: 'Fluid motion and rhythmic physics for dance and sport.', prompt: 'A contemporary dancer in a white studio, high-contrast lighting. She executes a series of sharp isolations followed by a slow floor sequence. Sweat catches the light.\nCamera: Arc — smooth 270-degree sweep at hip height.\nStyle: Hard key light, deep shadows, clean white walls.' },
  { genre: 'Portrait Intro', model: 'Kling 3.0', color: '#F59E0B', desc: 'Character-first reveals for films, series, and social content.', prompt: 'A middle-aged architect in a partially-demolished building. Concrete dust in the air. She examines a blueprint, pencil behind her ear, glasses on.\nCamera: Static. Subject walks INTO frame from left, stops center. Holds.\nStyle: Documentary. Cool overcast light, no fill, natural contrast.' },
  { genre: 'Comedy', model: 'Seedance 2.0', color: '#10B981, #34D399', desc: 'Timing-first setups with physical performance beats.', prompt: 'A food delivery rider arrives with a towering stack of pizza boxes on a bicycle. Every cobblestone bump threatens the structure. He sees the destination — a hill.\nCamera: Action Run beside him, slightly low, matching speed.\nStyle: Saturated, naturalistic daylight. Warm, slightly overexposed.' },
];

const DISCIPLINE_TIERS = [
  {
    tier: 'Tier 1 — Workflow', color: L.blue, soft: L.blueSoft,
    patterns: [
      { name: 'Lock-before-generate', body: 'Lock subject, scene, camera, and lighting BEFORE prompting. Decisions made during iteration drift from original intent.' },
      { name: 'Single-Variable Iteration', body: 'Change exactly one variable per regeneration. Multi-variable changes make diagnosis impossible.' },
      { name: 'Iteration-is-craft', body: 'Production AI-cinema runs at ~1% image acceptance, ~1.5% video acceptance. The iteration loop IS the craft.' },
      { name: 'Inventory Checklist', body: 'Silently catalog who / where / doing what / with what camera / mood from the brief before composing.' },
    ],
  },
  {
    tier: 'Tier 2 — Output', color: L.green, soft: L.greenSoft,
    patterns: [
      { name: 'Visual Markers Only', body: 'Describe characters by visible markers (clothing, build, posture, action), not proper names or unobservable attributes.' },
      { name: 'Camera Contract', body: 'State camera behavior as an explicit rule before action — "Static locked-off. Zero movement." Anchors the model\'s output.' },
      { name: 'Under 200 Words', body: 'Soft prompt cap from MCSLA. Going over signals padding rather than locking — tighten the prompt.' },
    ],
  },
  {
    tier: 'Tier 3 — Architecture', color: L.purple, soft: L.purpleSoft,
    patterns: [
      { name: '3-Stage Chain', body: 'Multi-step production: character → image → video. Each stage produces an artifact the next stage consumes.' },
      { name: 'Pre-Delivery Checklist', body: 'Before sending a prompt, run a self-repair pass against failure modes. 60–90 seconds saves iteration credit burns.' },
      { name: 'Strict-Order Workflow', body: 'Step N+1 can\'t start until Step N is approved. Skipping phases surfaces drift that\'s expensive to fix downstream.' },
    ],
  },
];

// ── MCSLA Prompt Builder ───────────────────────────────────────────────────────
function MCSLABuilder({ camera, setCamera }: { camera: string; setCamera: (c: string) => void }) {
  const [model, setModel] = useState('kling3');
  const [subject, setSubject] = useState('');
  const [look, setLook] = useState('Cinematic');
  const [action, setAction] = useState('');
  const [aspect, setAspect] = useState('16:9');
  const [duration, setDuration] = useState('8s');
  const [copied, setCopied] = useState(false);

  const modelLabel = VMODES.find(m => m.id === model)?.label ?? 'Kling 3.0';
  const prompt = `Model: ${modelLabel}\nAspect: ${aspect} | Duration: ${duration} | Style: ${look}\n\n${subject || '[describe your subject]'}.\nCamera: ${camera || '[select a camera preset]'}.\n${action || '[describe the action]'}.\nStyle: ${look}. Cinematic color grade.`;

  const copy = () => { navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const row = (label: string, content: React.ReactNode) => (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 16, alignItems: 'start', marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: L.text4, textTransform: 'uppercase', letterSpacing: 1.5, paddingTop: 8 }}>{label}</div>
      <div>{content}</div>
    </div>
  );

  const pill = (active: boolean, color: string, soft: string, onClick: () => void, children: React.ReactNode) => (
    <button onClick={onClick} style={{ padding: '6px 14px', borderRadius: 100, border: `1px solid ${active ? color : L.line}`, background: active ? soft : 'transparent', color: active ? color : L.text3, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>{children}</button>
  );

  return (
    <div style={{ background: L.bg, border: `1px solid ${L.lineStrg}`, borderRadius: 20, padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        {/* Left: inputs */}
        <div>
          {row('Model', (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {VMODES.map(m => pill(model === m.id, m.color, m.soft, () => setModel(m.id), m.label))}
            </div>
          ))}
          {row('Camera', (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {camera ? (
                <span style={{ padding: '6px 14px', borderRadius: 100, background: L.blueSoft, border: `1px solid ${L.blue}`, color: L.blue, fontSize: 12, fontWeight: 600 }}>{camera}</span>
              ) : (
                <span style={{ fontSize: 12, color: L.text4, fontStyle: 'italic' }}>Select from Camera Library below</span>
              )}
              {camera && <button onClick={() => setCamera('')} style={{ fontSize: 11, color: L.text4, background: 'none', border: 'none', cursor: 'pointer' }}>✕ clear</button>}
            </div>
          ))}
          {row('Subject', (
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Describe your subject — character, object, environment" style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: `1px solid ${L.lineStrg}`, fontSize: 13, color: L.text, background: L.bg2, outline: 'none', fontFamily: 'var(--font-geist-sans)' }} />
          ))}
          {row('Look', (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {LOOK_OPTIONS.map(l => pill(look === l, L.orange, L.orangeSoft, () => setLook(l), l))}
            </div>
          ))}
          {row('Action', (
            <textarea value={action} onChange={e => setAction(e.target.value)} rows={3} placeholder="Describe the movement, event, or sequence" style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: `1px solid ${L.lineStrg}`, fontSize: 13, color: L.text, background: L.bg2, outline: 'none', resize: 'vertical', fontFamily: 'var(--font-geist-sans)' }} />
          ))}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginTop: 4 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['16:9', '9:16', '1:1'].map(a => pill(aspect === a, L.text3, L.bg3, () => setAspect(a), a))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['5s', '8s', '10s', '15s'].map(d => pill(duration === d, L.text3, L.bg3, () => setDuration(d), d))}
            </div>
          </div>
        </div>

        {/* Right: live prompt */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: L.text4, textTransform: 'uppercase', letterSpacing: 1.5 }}>Generated Prompt</div>
            <button onClick={copy} style={{ padding: '5px 14px', borderRadius: 100, border: `1px solid ${copied ? L.green : L.line}`, background: copied ? L.greenSoft : L.bg2, color: copied ? L.green : L.text3, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>{copied ? 'Copied ✓' : 'Copy'}</button>
          </div>
          <div style={{ flex: 1, background: L.bg2, borderRadius: 12, border: `1px solid ${L.line}`, padding: '16px 18px', fontFamily: 'var(--font-geist-mono)', fontSize: 12.5, lineHeight: 1.8, color: L.text2, whiteSpace: 'pre-wrap', minHeight: 260 }}>{prompt}</div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 11, color: L.text4 }}>MCSLA:</div>
            {['Model', 'Camera', 'Subject', 'Look', 'Action'].map((layer, i) => (
              <span key={layer} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: [L.blueSoft, 'rgba(250,123,23,0.08)', L.greenSoft, L.yellowSoft, L.redSoft][i], color: [L.blue, L.orange, L.green, '#92400e', L.red][i], fontWeight: 600 }}>{layer}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Camera Library ─────────────────────────────────────────────────────────────
function CameraLibrary({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) {
  const [tab, setTab] = useState('Follow');
  const tabs = Object.keys(CAMERA_GROUPS);
  return (
    <div style={{ background: L.bg, border: `1px solid ${L.lineStrg}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${L.line}`, background: L.bg2, padding: '0 8px' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 16px', border: 'none', background: 'transparent', color: tab === t ? L.blue : L.text3, borderBottom: tab === t ? `2px solid ${L.blue}` : '2px solid transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'color 0.15s' }}>{t}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 11, color: L.text4 }}>click to insert into builder</div>
      </div>
      <div style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {CAMERA_GROUPS[tab].map(preset => (
          <button key={preset} onClick={() => onSelect(preset)} style={{ padding: '8px 16px', borderRadius: 100, border: `1px solid ${selected === preset ? L.blue : L.line}`, background: selected === preset ? L.blueSoft : L.bg2, color: selected === preset ? L.blue : L.text2, cursor: 'pointer', fontSize: 13, fontWeight: selected === preset ? 700 : 400, transition: 'all 0.15s', boxShadow: selected === preset ? `0 0 0 2px ${L.blueSoft}` : 'none' }}>{preset}</button>
        ))}
      </div>
    </div>
  );
}

// ── Video Model Grid ───────────────────────────────────────────────────────────
const MODEL_ROWS = [
  { name: 'Kling 3.0', real: 5, char: 5, motion: 5, audio: true, dur: '3–15s', tier: 'Premium', best: 'Cinematic · Character · Long-form audio', color: L.blue },
  { name: 'Sora 2', real: 4, char: 3, motion: 5, audio: false, dur: '—', tier: 'Premium', best: 'Epic scale · Action · Crowd physics', color: L.purple },
  { name: 'Veo 3.1', real: 5, char: 4, motion: 4, audio: true, dur: '4–8s', tier: 'Premium', best: 'Nature · Environment · Ref image consistency', color: L.green },
  { name: 'Wan 2.7', real: 4, char: 4, motion: 5, audio: true, dur: '2–15s', tier: 'Mid', best: '60fps · First+last frame · Artistic', color: L.orange },
  { name: 'Seedance 2.0', real: 5, char: 5, motion: 5, audio: true, dur: '10s', tier: 'Mid', best: '12-asset multimodal · Lip-sync · Complex motion', color: L.red },
  { name: 'Hailuo 2.3', real: 5, char: 4, motion: 5, audio: false, dur: '6–10s', tier: 'Mid', best: 'VFX · Fluid motion · Anime · Dance physics', color: '#0EA5E9' },
];

function Stars({ n }: { n: number }) {
  return <span style={{ color: L.yellow, fontSize: 12 }}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;
}

function VideoModelGrid() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${L.line}` }}>
            {['Model', 'Realism', 'Character', 'Motion', 'Audio', 'Duration', 'Tier', 'Best for'].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: L.text4, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODEL_ROWS.map((m, i) => (
            <tr key={m.name} style={{ borderBottom: `1px solid ${L.line}`, background: i % 2 === 0 ? 'transparent' : L.bg2 }}>
              <td style={{ padding: '12px 14px', fontWeight: 700, color: m.color, whiteSpace: 'nowrap' }}>{m.name}</td>
              <td style={{ padding: '12px 14px' }}><Stars n={m.real} /></td>
              <td style={{ padding: '12px 14px' }}><Stars n={m.char} /></td>
              <td style={{ padding: '12px 14px' }}><Stars n={m.motion} /></td>
              <td style={{ padding: '12px 14px', textAlign: 'center' }}>{m.audio ? <span style={{ color: L.green, fontWeight: 700 }}>✓</span> : <span style={{ color: L.text4 }}>—</span>}</td>
              <td style={{ padding: '12px 14px', color: L.text3, whiteSpace: 'nowrap', fontFamily: 'var(--font-geist-mono)', fontSize: 12 }}>{m.dur}</td>
              <td style={{ padding: '12px 14px' }}><span style={{ padding: '2px 8px', borderRadius: 4, background: m.tier === 'Premium' ? L.purpleSoft : L.greenSoft, color: m.tier === 'Premium' ? L.purple : L.green, fontSize: 11, fontWeight: 700 }}>{m.tier}</span></td>
              <td style={{ padding: '12px 14px', color: L.text3 }}>{m.best}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Genre Gallery ──────────────────────────────────────────────────────────────
function GenreGallery() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const copy = (i: number, text: string) => { navigator.clipboard.writeText(text); setCopied(i); setTimeout(() => setCopied(null), 1500); };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
      {GENRE_TEMPLATES.map((t, i) => (
        <div key={i} style={{ background: L.bg, border: `1px solid ${L.lineStrg}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s', cursor: 'pointer' }} onClick={() => setExpanded(expanded === i ? null : i)}>
          <div style={{ padding: '20px', borderLeft: `3px solid ${t.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: L.text }}>{t.genre}</div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: L.bg2, color: L.text3, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{t.model}</span>
            </div>
            <div style={{ fontSize: 13, color: L.text3, lineHeight: 1.5 }}>{t.desc}</div>
          </div>
          {expanded === i && (
            <div style={{ background: L.bg2, borderTop: `1px solid ${L.line}`, padding: '16px 20px' }} onClick={e => e.stopPropagation()}>
              <pre style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-geist-mono)', color: L.text2, margin: 0, marginBottom: 12 }}>{t.prompt}</pre>
              <button onClick={() => copy(i, t.prompt)} style={{ padding: '6px 16px', borderRadius: 100, border: `1px solid ${copied === i ? L.green : L.blue}`, background: copied === i ? L.greenSoft : L.blueSoft, color: copied === i ? L.green : L.blue, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{copied === i ? 'Copied ✓' : 'Copy Prompt'}</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── DISCIPLINE Framework ────────────────────────────────────────────────────────
function DisciplineGuide() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {DISCIPLINE_TIERS.map(tier => (
        <div key={tier.tier} style={{ background: L.bg, border: `1px solid ${L.lineStrg}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ background: tier.soft, borderBottom: `1px solid ${L.line}`, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: tier.color, textTransform: 'uppercase', letterSpacing: 1.5 }}>{tier.tier}</div>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tier.patterns.map(p => (
              <div key={p.name} style={{ paddingLeft: 12, borderLeft: `2px solid ${tier.soft}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: L.text, marginBottom: 3 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: L.text3, lineHeight: 1.55 }}>{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Prompt Studio wrapper (manages shared camera state) ───────────────────────
function PromptStudio() {
  const [camera, setCamera] = useState('');
  return (
    <>
      <MCSLABuilder camera={camera} setCamera={setCamera} />
      <div style={{ marginTop: 20 }}>
        <CameraLibrary selected={camera} onSelect={setCamera} />
      </div>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>

      {/* ──────── DARK SECTION: GPU Orchestration ──────── */}

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 56, background: 'rgba(5,7,15,0.88)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.5px' }}>Higgsfield</span>
          <span style={{ fontSize: 11, color: C.indigo, fontFamily: 'var(--font-geist-mono)', background: C.indigoSoft, padding: '2px 8px', borderRadius: 4 }}>Explorer</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <a href="#zero" style={{ fontSize: 13, color: C.text3 }}>ZeRO</a>
          <a href="#code" style={{ fontSize: 13, color: C.text3 }}>Code</a>
          <a href="#simulator" style={{ fontSize: 13, color: C.text3 }}>Simulate</a>
          <span style={{ color: C.text4, fontSize: 13 }}>|</span>
          <a href="#prompt-studio" style={{ fontSize: 13, color: '#FBBC04' }}>Prompt Studio</a>
          <a href="#models" style={{ fontSize: 13, color: C.text3 }}>Models</a>
          <a href="#genre" style={{ fontSize: 13, color: C.text3 }}>Templates</a>
          <a href="https://github.com/higgsfield-ai/higgsfield" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: C.text, background: C.indigoSoft, border: `1px solid ${C.indigo}`, borderRadius: 8, padding: '5px 14px' }}>GitHub ↗</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', height: 520, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}><HeroCanvas /></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, background: `linear-gradient(transparent, ${C.bg})` }} />
        <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: C.indigo, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase' }}>Multi-Node GPU Orchestration</div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: C.text, lineHeight: 1.08, letterSpacing: '-1.5px', maxWidth: 720 }}>
            Train LLMs at Scale<br />
            <span style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.violet})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Without Crying</span>
          </h1>
          <p style={{ fontSize: 17, color: C.text3, maxWidth: 520, lineHeight: 1.6 }}>Fault-tolerant, scalable GPU orchestration for billions to trillions of parameters. ZeRO-3, FSDP, and GitHub CI in one clean Python API.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="https://github.com/higgsfield-ai/higgsfield" target="_blank" rel="noopener noreferrer" style={{ padding: '10px 24px', background: C.indigo, color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>View on GitHub</a>
            <a href="#zero" style={{ padding: '10px 24px', background: 'transparent', color: C.text, border: `1px solid ${C.lineStrg}`, borderRadius: 10, fontSize: 14, fontWeight: 600 }}>Explore ZeRO Stages</a>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, background: C.bg2 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 32px', display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
          {[{ label: 'GitHub Stars', value: '3.7k' }, { label: 'Max ZeRO Stage', value: '3' }, { label: 'Supported Models', value: 'LLaMA · Mistral · Custom' }, { label: 'CI Integration', value: 'GitHub Actions' }].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: 'var(--font-geist-mono)', letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.text4, marginTop: 2, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>

        {/* Features */}
        <section style={{ padding: '80px 0 48px' }}>
          <div style={{ fontSize: 11, color: C.indigo, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>What it does</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.5px', marginBottom: 40 }}>Four problems, one framework</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { title: 'ZeRO-3 Sharding', body: 'Train trillion-parameter models by partitioning parameters, gradients, and optimizer states across all GPUs in the cluster.', color: C.indigo, soft: C.indigoSoft, icon: '⬡' },
              { title: 'Fault Tolerance', body: 'Automatic failure detection and recovery. Jobs resume from last checkpoint when a GPU or node drops without manual intervention.', color: C.cyan, soft: C.cyanSoft, icon: '↺' },
              { title: 'Simple Python API', body: 'The @experiment decorator is all you need. No YAML configs, no 600-argument CLI — just standard PyTorch with a clean wrapper.', color: C.violet, soft: 'rgba(167,139,250,0.1)', icon: '{ }' },
              { title: 'GitHub Actions CI', body: 'Higgsfield generates deploy & run workflows automatically. Merge to main and your experiment runs on your cluster — no extra setup.', color: C.amber, soft: C.amberSoft, icon: '⟳' },
            ].map(f => (
              <div key={f.title} style={{ background: C.bg2, border: `1px solid ${C.lineStrg}`, borderRadius: 14, padding: '24px 20px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: f.soft, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: 18, color: f.color }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: C.text3, lineHeight: 1.65 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ZeRO Explorer */}
        <section id="zero" style={{ paddingBottom: 80 }}>
          <div style={{ fontSize: 11, color: C.cyan, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Memory sharding</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.5px', marginBottom: 8 }}>ZeRO Stage Explorer</h2>
          <p style={{ fontSize: 14, color: C.text3, marginBottom: 32, maxWidth: 600, lineHeight: 1.6 }}>Higgsfield exposes ZeRO-3 through a single parameter. See exactly how each stage distributes memory across your GPU cluster.</p>
          <ZeroExplorer />
        </section>

        {/* Code Explorer */}
        <section id="code" style={{ paddingBottom: 80 }}>
          <div style={{ fontSize: 11, color: C.violet, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>API examples</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.5px', marginBottom: 8 }}>The @experiment API</h2>
          <p style={{ fontSize: 14, color: C.text3, marginBottom: 32, maxWidth: 600, lineHeight: 1.6 }}>Standard PyTorch with one decorator. No YAML, no argparse boilerplate, no framework-specific rewrites.</p>
          <CodeExplorer />
        </section>

        {/* Training Simulator */}
        <section id="simulator" style={{ paddingBottom: 80 }}>
          <div style={{ fontSize: 11, color: C.amber, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Interactive</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.5px', marginBottom: 8 }}>Cluster Simulator</h2>
          <p style={{ fontSize: 14, color: C.text3, marginBottom: 32, maxWidth: 600, lineHeight: 1.6 }}>Watch a simulated multi-node run including a mid-training GPU failure and automatic recovery.</p>
          <TrainingSimulator />
        </section>

        {/* Architecture */}
        <section style={{ paddingBottom: 80 }}>
          <div style={{ fontSize: 11, color: C.green, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>How it works</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.5px', marginBottom: 36 }}>From commit to cluster</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { n: '1', title: 'Install on nodes', body: 'Higgsfield installs Docker, deploy keys, and the higgsfield binary on every server via SSH.' },
              { n: '2', title: 'Define experiments', body: 'Decorate your training function with @experiment. Higgsfield auto-generates GitHub Actions YAML for each one.' },
              { n: '3', title: 'Push to GitHub', body: 'A git push triggers the workflow, deploying and launching your training job on all registered nodes.' },
              { n: '4', title: 'Monitor via UI', body: 'Access the experiment run UI through GitHub to launch runs, watch logs, and save checkpoints to Hugging Face Hub.' },
            ].map((s, i) => (
              <div key={i} style={{ background: C.bg2, border: `1px solid ${C.lineStrg}`, borderRadius: 14, padding: '24px 20px', position: 'relative' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: C.line, fontFamily: 'var(--font-geist-mono)', position: 'absolute', top: 12, right: 16 }}>{s.n}</div>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.indigoSoft, border: `1px solid ${C.indigo}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: C.indigo, fontFamily: 'var(--font-geist-mono)', marginBottom: 14 }}>{s.n}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: C.text3, lineHeight: 1.65 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Get started */}
        <section style={{ paddingBottom: 100 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.08), rgba(167,139,250,0.08))', border: `1px solid ${C.indigo}30`, borderRadius: 20, padding: '40px 36px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.3px' }}>Get started in minutes</h2>
            <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 20px', fontFamily: 'var(--font-geist-mono)', fontSize: 13 }}>
              <div style={{ color: C.text4, marginBottom: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Install</div>
              <div><span style={{ color: C.text4 }}>$ </span><span style={{ color: C.green }}>pip install</span><span style={{ color: C.text2 }}> higgsfield==0.0.3</span></div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="https://github.com/higgsfield-ai/higgsfield/blob/main/setup.md" target="_blank" rel="noopener noreferrer" style={{ padding: '10px 22px', background: C.indigo, color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>Full Setup Guide ↗</a>
              <a href="https://github.com/higgsfield-ai/higgsfield/blob/main/tutorial.md" target="_blank" rel="noopener noreferrer" style={{ padding: '10px 22px', background: 'transparent', color: C.text2, border: `1px solid ${C.lineStrg}`, borderRadius: 10, fontSize: 14, fontWeight: 600 }}>Tutorials ↗</a>
            </div>
          </div>
        </section>

      </div>

      {/* ──────── TRANSITION: dark → light ──────── */}
      <div style={{ background: 'linear-gradient(180deg, #05070f 0%, #1a1a2e 30%, #f8f9fa 100%)', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: 'rgba(251,188,4,0.8)', fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase' }}>Also from Higgsfield</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>AI Video Generation Platform</div>
      </div>

      {/* ──────── LIGHT SECTION: Prompt Studio ──────── */}
      <div style={{ background: L.bg }}>

        {/* Antigravity hero */}
        <section style={{ position: 'relative', height: 420, overflow: 'hidden', background: L.bg }}>
          <AntigravityCanvas />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: `linear-gradient(transparent, ${L.bg})` }} />
          <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: L.bg2, border: `1px solid ${L.line}`, borderRadius: 100, padding: '6px 16px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: L.green, display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: L.text3, fontWeight: 600 }}>OSideMedia · higgsfield-ai-prompt-skill v3.7.16</span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, color: L.text, lineHeight: 1.1, letterSpacing: '-2px', maxWidth: 680 }}>
              Cinematic AI Video,{' '}
              <span style={{ background: 'linear-gradient(90deg, #1A73E8, #34A853, #FBBC04, #EA4335)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Perfected</span>
            </h2>
            <p style={{ fontSize: 16, color: L.text3, maxWidth: 520, lineHeight: 1.65 }}>
              MCSLA formula · 15+ generation models · 40+ camera presets · 10 genre templates · DISCIPLINE framework
            </p>
          </div>
        </section>

        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px' }}>

          {/* MCSLA Builder + Camera Library */}
          <section id="prompt-studio" style={{ paddingBottom: 80 }}>
            <div style={{ fontSize: 11, color: L.blue, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Interactive</div>
            <h3 style={{ fontSize: 28, fontWeight: 800, color: L.text, letterSpacing: '-0.8px', marginBottom: 6 }}>MCSLA Prompt Builder</h3>
            <p style={{ fontSize: 14, color: L.text3, marginBottom: 28, maxWidth: 600, lineHeight: 1.6 }}>
              Model · Camera · Subject · Look · Action — the five-layer formula for production-grade Higgsfield prompts. Select a camera preset below to insert it into the builder.
            </p>
            <PromptStudio />
          </section>

          {/* Video Model Guide */}
          <section id="models" style={{ paddingBottom: 80 }}>
            <div style={{ fontSize: 11, color: L.green, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Model selection</div>
            <h3 style={{ fontSize: 28, fontWeight: 800, color: L.text, letterSpacing: '-0.8px', marginBottom: 6 }}>Video Model Guide</h3>
            <p style={{ fontSize: 14, color: L.text3, marginBottom: 28, maxWidth: 600, lineHeight: 1.6 }}>
              The right model is the biggest quality factor after the prompt. Compare Higgsfield AI's generation engines across realism, character fidelity, motion quality, and audio support.
            </p>
            <div style={{ background: L.bg, border: `1px solid ${L.lineStrg}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <VideoModelGrid />
            </div>
          </section>

          {/* Genre Templates */}
          <section id="genre" style={{ paddingBottom: 80 }}>
            <div style={{ fontSize: 11, color: L.orange, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Ready to use</div>
            <h3 style={{ fontSize: 28, fontWeight: 800, color: L.text, letterSpacing: '-0.8px', marginBottom: 6 }}>Genre Templates</h3>
            <p style={{ fontSize: 14, color: L.text3, marginBottom: 28, maxWidth: 600, lineHeight: 1.6 }}>
              Production-annotated prompts for 10 genres. Click any card to expand the full prompt and copy it to your clipboard.
            </p>
            <GenreGallery />
          </section>

          {/* DISCIPLINE Framework */}
          <section style={{ paddingBottom: 100 }}>
            <div style={{ fontSize: 11, color: L.purple, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Cross-cutting patterns</div>
            <h3 style={{ fontSize: 28, fontWeight: 800, color: L.text, letterSpacing: '-0.8px', marginBottom: 6 }}>DISCIPLINE Framework</h3>
            <p style={{ fontSize: 14, color: L.text3, marginBottom: 8, maxWidth: 600, lineHeight: 1.6 }}>
              9 named patterns across workflow, output, and architecture — observed from the 2026 Cannes production cycle where 15 people shipped a 90-minute AI feature in 14 days.
            </p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
              {[{ label: 'Workflow', color: L.blue }, { label: 'Output', color: L.green }, { label: 'Architecture', color: L.purple }].map(t => (
                <span key={t.label} style={{ padding: '4px 12px', borderRadius: 100, border: `1px solid ${t.color}30`, fontSize: 12, color: t.color, fontWeight: 600 }}>{t.label}</span>
              ))}
            </div>
            <DisciplineGuide />
          </section>

        </div>
      </div>

      {/* ──────── Footer ──────── */}
      <footer style={{ borderTop: `1px solid ${L.line}`, padding: '24px 32px', background: L.bg2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: L.text3 }}>
            GPU framework: <a href="https://github.com/higgsfield-ai/higgsfield" target="_blank" rel="noopener noreferrer" style={{ color: L.blue }}>higgsfield-ai/higgsfield</a>
          </span>
          <span style={{ fontSize: 13, color: L.text3 }}>
            Prompt skill: <a href="https://github.com/OSideMedia/higgsfield-ai-prompt-skill" target="_blank" rel="noopener noreferrer" style={{ color: L.blue }}>OSideMedia/higgsfield-ai-prompt-skill</a>
          </span>
        </div>
        <div style={{ fontSize: 11, color: L.text4, fontFamily: 'var(--font-geist-mono)' }}>john3913/gshultz</div>
      </footer>

    </div>
  );
}
