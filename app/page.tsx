'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:          '#05070f',
  bg2:         '#0a0e1c',
  bg3:         '#0f1628',
  bg4:         '#141d36',
  line:        'rgba(99,102,241,0.12)',
  lineStrg:    'rgba(99,102,241,0.28)',
  text:        '#F1F5F9',
  text2:       '#CBD5E1',
  text3:       '#94A3B8',
  text4:       '#475569',
  indigo:      '#818CF8',
  violet:      '#A78BFA',
  cyan:        '#22D3EE',
  amber:       '#FBBF24',
  green:       '#34D399',
  red:         '#F87171',
  indigoSoft:  'rgba(129,140,248,0.12)',
  cyanSoft:    'rgba(34,211,238,0.10)',
  amberSoft:   'rgba(251,191,36,0.10)',
  greenSoft:   'rgba(52,211,153,0.10)',
};

// ── Hero Canvas — GPU cluster network ────────────────────────────────────────
function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    type Node = { x: number; y: number; node: number; gpu: number };
    type Spark = { from: Node; to: Node; t: number; speed: number; color: string };

    const NODES = 3; const GPUS_PER = 4;
    let nodes: Node[] = [];
    let sparks: Spark[] = [];

    const build = () => {
      nodes = [];
      const W = canvas.width, H = canvas.height;
      for (let n = 0; n < NODES; n++) {
        const cx = W * 0.15 + (W * 0.7) * (n / (NODES - 1));
        const cy = H * 0.5;
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
      const interNode = a.node !== b.node;
      sparks.push({ from: a, to: b, t: 0, speed: 0.008 + Math.random() * 0.012, color: interNode ? C.violet : C.cyan });
    };

    let lastSpawn = 0;
    const draw = (ts: number) => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // intra-node rings
      for (let n = 0; n < NODES; n++) {
        const grp = nodes.filter(nd => nd.node === n);
        for (let i = 0; i < grp.length; i++) {
          for (let j = i + 1; j < grp.length; j++) {
            ctx.beginPath();
            ctx.moveTo(grp[i].x, grp[i].y);
            ctx.lineTo(grp[j].x, grp[j].y);
            ctx.strokeStyle = 'rgba(34,211,238,0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        // node label ring
        const cx = grp.reduce((s, nd) => s + nd.x, 0) / grp.length;
        const cy = grp.reduce((s, nd) => s + nd.y, 0) / grp.length;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(W, H) * 0.095, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(99,102,241,0.07)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // inter-node connections
      for (let a = 0; a < NODES - 1; a++) {
        const ga = nodes.filter(nd => nd.node === a);
        const gb = nodes.filter(nd => nd.node === a + 1);
        for (let i = 0; i < ga.length; i++) {
          const j = i % gb.length;
          ctx.beginPath();
          ctx.moveTo(ga[i].x, ga[i].y);
          ctx.lineTo(gb[j].x, gb[j].y);
          ctx.strokeStyle = 'rgba(167,139,250,0.1)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // GPU dots
      nodes.forEach(nd => {
        const grad = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, 10);
        grad.addColorStop(0, nd.node === 0 ? 'rgba(129,140,248,0.9)' : nd.node === 1 ? 'rgba(34,211,238,0.9)' : 'rgba(167,139,250,0.9)');
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // node labels
      for (let n = 0; n < NODES; n++) {
        const grp = nodes.filter(nd => nd.node === n);
        const cx = grp.reduce((s, nd) => s + nd.x, 0) / grp.length;
        const cy = grp.reduce((s, nd) => s + nd.y, 0) / grp.length + Math.min(W, H) * 0.12;
        ctx.font = `11px var(--font-geist-mono, monospace)`;
        ctx.fillStyle = C.text4;
        ctx.textAlign = 'center';
        ctx.fillText(`NODE-${n}`, cx, cy);
      }

      // traveling sparks
      sparks = sparks.filter(s => s.t <= 1);
      sparks.forEach(s => {
        s.t += s.speed;
        const x = s.from.x + (s.to.x - s.from.x) * s.t;
        const y = s.from.y + (s.to.y - s.from.y) * s.t;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.sin(s.t * Math.PI) * 0.9 + 0.1;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      if (ts - lastSpawn > 180) { spawnSpark(); lastSpawn = ts; }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

// ── ZeRO Stage Explorer ───────────────────────────────────────────────────────
const ZERO_STAGES = [
  {
    id: 0,
    label: 'Baseline',
    subtitle: 'No sharding',
    description: 'Every GPU holds a full copy of model parameters, gradients, and optimizer states. Memory scales linearly with replicas.',
    paramColor: C.indigo,
    gradColor: C.cyan,
    optColor: C.amber,
    paramSharded: false,
    gradSharded: false,
    optSharded: false,
    memReduction: '1×',
  },
  {
    id: 1,
    label: 'ZeRO-1',
    subtitle: 'Optimizer state sharding',
    description: 'Optimizer states (Adam moments, variance) are partitioned across GPUs. Parameters and gradients are replicated. ~4× memory reduction for Adam.',
    paramColor: C.indigo,
    gradColor: C.cyan,
    optColor: C.amber,
    paramSharded: false,
    gradSharded: false,
    optSharded: true,
    memReduction: '4×',
  },
  {
    id: 2,
    label: 'ZeRO-2',
    subtitle: 'Grad + optimizer sharding',
    description: 'Gradients are also partitioned after each reduce. Each GPU only stores its slice. ~8× memory reduction versus baseline.',
    paramColor: C.indigo,
    gradColor: C.cyan,
    optColor: C.amber,
    paramSharded: false,
    gradSharded: true,
    optSharded: true,
    memReduction: '8×',
  },
  {
    id: 3,
    label: 'ZeRO-3',
    subtitle: 'Full parameter sharding',
    description: 'Parameters are also partitioned. Each GPU owns 1/N of the model. Layers are gathered on-demand during forward/backward. Enables trillion-parameter models.',
    paramColor: C.indigo,
    gradColor: C.cyan,
    optColor: C.amber,
    paramSharded: true,
    gradSharded: true,
    optSharded: true,
    memReduction: 'N×',
  },
];

const GPU_COUNT = 8;

function ZeroExplorer() {
  const [active, setActive] = useState(3);
  const stage = ZERO_STAGES[active];

  const renderGpu = (i: number) => {
    const slice = Math.floor(GPU_COUNT / GPU_COUNT);
    const sections = [
      { label: 'Param', sharded: stage.paramSharded, color: C.indigo, softColor: C.indigoSoft },
      { label: 'Grad',  sharded: stage.gradSharded,  color: C.cyan,   softColor: C.cyanSoft  },
      { label: 'Opt',   sharded: stage.optSharded,   color: C.amber,  softColor: C.amberSoft },
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
                  <div key={gi} style={{
                    height: 8, flex: 1,
                    background: gi === i ? sec.color : sec.softColor,
                    borderRadius: 2,
                    opacity: gi === i ? 1 : 0.35,
                    transition: 'background 0.3s',
                  }} />
                ))}
              </div>
            ) : (
              <div style={{ height: 8, background: sec.color, borderRadius: 2, opacity: 0.8, transition: 'background 0.3s' }} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ background: C.bg2, border: `1px solid ${C.lineStrg}`, borderRadius: 16, padding: '32px 28px' }}>
      {/* Stage buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {ZERO_STAGES.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)} style={{
            padding: '8px 18px', borderRadius: 8, border: `1px solid ${active === s.id ? C.indigo : C.lineStrg}`,
            background: active === s.id ? C.indigoSoft : 'transparent',
            color: active === s.id ? C.indigo : C.text3,
            cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-geist-sans)',
            transition: 'all 0.2s',
          }}>{s.label}</button>
        ))}
      </div>

      {/* Description */}
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

      {/* GPU grid */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: C.text4, fontFamily: 'var(--font-geist-mono)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          {GPU_COUNT} GPUs across cluster
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: GPU_COUNT }).map((_, i) => renderGpu(i))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
        {[
          { label: 'Model Parameters', color: C.indigo, sharded: stage.paramSharded },
          { label: 'Gradients', color: C.cyan, sharded: stage.gradSharded },
          { label: 'Optimizer States', color: C.amber, sharded: stage.optSharded },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, opacity: 0.85 }} />
            <span style={{ fontSize: 12, color: C.text3 }}>{item.label}</span>
            <span style={{ fontSize: 11, color: item.sharded ? C.green : C.text4, fontFamily: 'var(--font-geist-mono)' }}>
              {item.sharded ? 'sharded' : 'replicated'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Code Examples ─────────────────────────────────────────────────────────────
const CODE_EXAMPLES = [
  {
    label: 'LLaMA 70B',
    lang: 'python',
    code: `from higgsfield.llama import Llama70b
from higgsfield.loaders import LlamaLoader
from higgsfield.experiment import experiment

import torch.optim as optim
from alpaca import get_alpaca_data

@experiment("alpaca")
def train(params):
    model = Llama70b(
        zero_stage=3,
        fast_attn=False,
        precision="bf16"
    )

    optimizer = optim.AdamW(
        model.parameters(),
        lr=1e-5,
        weight_decay=0.0
    )

    dataset = get_alpaca_data(split="train")
    train_loader = LlamaLoader(dataset, max_words=2048)

    for batch in train_loader:
        optimizer.zero_grad()
        loss = model(batch)
        loss.backward()
        optimizer.step()

    model.push_to_hub('alpaca-70b')`,
  },
  {
    label: 'Mistral 7B',
    lang: 'python',
    code: `from higgsfield.mistral import Mistral7b
from higgsfield.loaders import MistralLoader
from higgsfield.experiment import experiment

import torch.optim as optim

@experiment("mistral-finetune")
def train(params):
    model = Mistral7b(
        zero_stage=2,
        precision="bf16"
    )

    optimizer = optim.AdamW(
        model.parameters(),
        lr=2e-5,
        weight_decay=0.01
    )

    train_loader = MistralLoader(
        your_dataset,
        max_words=4096
    )

    for batch in train_loader:
        optimizer.zero_grad()
        loss = model(batch)
        loss.backward()
        optimizer.step()

    model.push_to_hub('mistral-finetuned')`,
  },
  {
    label: 'RL / PPO',
    lang: 'python',
    code: `from higgsfield.llama import Llama7b
from higgsfield.rl.ppo import PPOTrainer
from higgsfield.experiment import experiment

@experiment("rlhf-ppo")
def train(params):
    actor = Llama7b(zero_stage=3, precision="bf16")
    critic = Llama7b(zero_stage=3, precision="bf16")

    trainer = PPOTrainer(
        actor=actor,
        critic=critic,
        kl_coef=0.1,
        gamma=1.0,
        lam=0.95,
    )

    for step, batch in enumerate(reward_dataloader):
        # generate completions
        completions = actor.generate(batch["prompts"])

        # score with reward model
        rewards = reward_model(completions)

        # PPO update
        trainer.step(
            queries=batch["prompts"],
            responses=completions,
            scores=rewards,
        )

    actor.push_to_hub("rlhf-llama-7b")`,
  },
  {
    label: 'Custom Sharding',
    lang: 'python',
    code: `from higgsfield.training import FullyShardedParallel
from higgsfield.experiment import experiment
from torch.distributed.fsdp import (
    FullyShardedDataParallel as FSDP,
    MixedPrecision,
)
import torch

@experiment("custom-fsdp")
def train(params):
    # Bring your own model — wrap with FSDP
    model = MyHugeTransformer(layers=96, dim=12288)

    mp_policy = MixedPrecision(
        param_dtype=torch.bfloat16,
        reduce_dtype=torch.float32,
        buffer_dtype=torch.float32,
    )

    sharded = FullyShardedParallel(
        model,
        mixed_precision=mp_policy,
        sharding_strategy="FULL_SHARD",
    )

    # Standard PyTorch loop — no custom APIs
    for batch in dataloader:
        loss = sharded(batch)
        loss.backward()
        optimizer.step()`,
  },
];

function tokenize(code: string) {
  const keywords = /\b(from|import|def|return|for|in|if|class|as|with|yield|lambda|True|False|None|and|or|not|pass|break|continue|raise)\b/g;
  const strings = /("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*')/g;
  const comments = /(#.*)/g;
  const decorators = /(@\w+)/g;
  const numbers = /\b(\d+\.?\d*)\b/g;
  const builtins = /\b(print|len|range|enumerate|zip|map|filter|list|dict|set|tuple|str|int|float|bool|type|super|self)\b/g;

  const spans: { start: number; end: number; color: string }[] = [];
  const addSpans = (re: RegExp, color: string) => {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(code)) !== null) {
      spans.push({ start: m.index, end: m.index + m[0].length, color });
    }
  };
  addSpans(comments, C.text4);
  addSpans(strings, C.green);
  addSpans(decorators, C.amber);
  addSpans(keywords, C.violet);
  addSpans(builtins, C.cyan);
  addSpans(numbers, C.amber);

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
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.line}`, background: C.bg3 }}>
        {CODE_EXAMPLES.map((e, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: '12px 20px', border: 'none', background: 'transparent',
            color: active === i ? C.text : C.text4,
            borderBottom: active === i ? `2px solid ${C.indigo}` : '2px solid transparent',
            cursor: 'pointer', fontSize: 13, fontWeight: 500,
            fontFamily: 'var(--font-geist-sans)', transition: 'color 0.2s',
          }}>{e.label}</button>
        ))}
      </div>
      {/* Code */}
      <div style={{ padding: '24px 28px', overflowX: 'auto' }}>
        <pre style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre', fontFamily: 'var(--font-geist-mono)' }}>
          {parts.map((p, i) => (
            <span key={i} style={{ color: p.color }}>{p.text}</span>
          ))}
        </pre>
      </div>
    </div>
  );
}

// ── Training Simulator ────────────────────────────────────────────────────────
const LOG_LINES_TEMPLATE = [
  { t: 300,  msg: '[node-0] Initializing process group (NCCL backend)' },
  { t: 600,  msg: '[node-1] Initializing process group (NCCL backend)' },
  { t: 900,  msg: '[node-2] Initializing process group (NCCL backend)' },
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
    reset();
    setRunning(true);

    LOG_LINES_TEMPLATE.forEach(({ t, msg }) => {
      const color = msg.includes('[fault]') || msg.includes('dropped') ? C.red :
                    msg.includes('[recovery]') || msg.includes('[checkpoint]') ? C.amber :
                    msg.includes('[all]') || msg.includes('ZeRO') ? C.green :
                    msg.startsWith('step=') ? C.text2 : C.text3;
      const id = setTimeout(() => {
        setLogs(prev => [...prev.slice(-30), { msg, color }]);
      }, t);
      timerRef.current.push(id);
    });

    // loss curve
    const losses = [1.423, 1.391, 1.377, 1.361, 1.348, 1.329, 1.312, 1.298];
    losses.forEach((l, i) => {
      const id = setTimeout(() => setLoss(prev => [...prev, l]), 2600 + i * 680);
      timerRef.current.push(id);
    });

    // step counter
    let s = 4201;
    intervalRef.current = setInterval(() => {
      setStep(s++);
      setUtilization(prev => prev.map((u, i) => {
        const base = GPU_UTIL_SEED[i];
        return Math.min(100, Math.max(0, base + Math.round((Math.random() - 0.5) * 8)));
      }));
      if (s > 4209) { if (intervalRef.current) clearInterval(intervalRef.current); setRunning(false); }
    }, 680);
  }, [reset]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => () => {
    timerRef.current.forEach(clearTimeout);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const maxLoss = 1.5;
  const minLoss = 1.2;

  return (
    <div style={{ background: C.bg2, border: `1px solid ${C.lineStrg}`, borderRadius: 16, padding: '28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Training Simulator</div>
          <div style={{ fontSize: 13, color: C.text3, marginTop: 2 }}>3 nodes × 4 GPUs — LLaMA 70B fine-tune on Alpaca</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {running ? (
            <button onClick={reset} style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${C.red}`, background: 'transparent', color: C.red, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Stop</button>
          ) : (
            <button onClick={start} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.indigo, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {logs.length ? 'Restart' : 'Start Training'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Log terminal */}
        <div ref={logRef} style={{ background: C.bg, borderRadius: 10, border: `1px solid ${C.line}`, padding: '14px 16px', height: 220, overflowY: 'auto', fontFamily: 'var(--font-geist-mono)', fontSize: 11, lineHeight: 1.7 }}>
          {logs.length === 0 && <span style={{ color: C.text4 }}>$ Press "Start Training" to begin simulation...</span>}
          {logs.map((l, i) => <div key={i} style={{ color: l.color }}>{l.msg}</div>)}
          {running && <span style={{ color: C.green }}>▊</span>}
        </div>

        {/* Loss curve + stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: C.bg, borderRadius: 10, border: `1px solid ${C.line}`, padding: '12px 14px', flex: 1 }}>
            <div style={{ fontSize: 11, color: C.text4, fontFamily: 'var(--font-geist-mono)', marginBottom: 8 }}>TRAINING LOSS</div>
            <svg width="100%" height="70" viewBox="0 0 200 70" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="0" y2="70" stroke={C.line} strokeWidth="1" />
              <line x1="0" y1="70" x2="200" y2="70" stroke={C.line} strokeWidth="1" />
              {loss.length > 1 && (
                <polyline
                  points={loss.map((l, i) => {
                    const x = (i / Math.max(loss.length - 1, 1)) * 200;
                    const y = 70 - ((l - minLoss) / (maxLoss - minLoss)) * 70;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke={C.indigo}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {loss.map((l, i) => {
                const x = (i / Math.max(loss.length - 1, 1)) * 200;
                const y = 70 - ((l - minLoss) / (maxLoss - minLoss)) * 70;
                return <circle key={i} cx={x} cy={y} r="3" fill={C.indigo} />;
              })}
            </svg>
            {loss.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 10, color: C.text4, fontFamily: 'var(--font-geist-mono)' }}>step {step}</span>
                <span style={{ fontSize: 11, color: C.indigo, fontFamily: 'var(--font-geist-mono)', fontWeight: 700 }}>loss {loss[loss.length - 1]?.toFixed(3)}</span>
              </div>
            )}
          </div>

          <div style={{ background: C.bg, borderRadius: 10, border: `1px solid ${C.line}`, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: C.text4, fontFamily: 'var(--font-geist-mono)', marginBottom: 8 }}>GPU UTILIZATION</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {utilization.slice(0, 8).map((u, i) => (
                <div key={i}>
                  <div style={{ fontSize: 9, color: C.text4, fontFamily: 'var(--font-geist-mono)', marginBottom: 3 }}>G{i}</div>
                  <div style={{ height: 4, background: C.bg3, borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${u}%`, background: u > 85 ? C.green : u > 60 ? C.amber : C.red, borderRadius: 2, transition: 'width 0.5s' }} />
                  </div>
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

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    title: 'ZeRO-3 Sharding',
    body: 'Train trillion-parameter models by partitioning parameters, gradients, and optimizer states across all GPUs in the cluster.',
    color: C.indigo,
    softColor: C.indigoSoft,
    icon: '⬡',
  },
  {
    title: 'Fault Tolerance',
    body: 'Automatic failure detection and recovery. Jobs resume from last checkpoint when a GPU or node drops without manual intervention.',
    color: C.cyan,
    softColor: C.cyanSoft,
    icon: '↺',
  },
  {
    title: 'Simple Python API',
    body: 'The @experiment decorator is all you need. No YAML configs, no 600-argument CLI — just standard PyTorch with a clean wrapper.',
    color: C.violet,
    softColor: 'rgba(167,139,250,0.1)',
    icon: '{ }',
  },
  {
    title: 'GitHub Actions CI',
    body: 'Higgsfield generates deploy & run workflows automatically. Merge to main and your experiment runs on your cluster — no extra setup.',
    color: C.amber,
    softColor: C.amberSoft,
    icon: '⟳',
  },
];

// ── Architecture Steps ────────────────────────────────────────────────────────
const ARCH_STEPS = [
  { n: '1', title: 'Install on nodes', body: 'Higgsfield installs Docker, deploy keys, and the higgsfield binary on every server via SSH.' },
  { n: '2', title: 'Define experiments', body: 'Decorate your training function with @experiment. Higgsfield auto-generates GitHub Actions YAML for each one.' },
  { n: '3', title: 'Push to GitHub', body: 'A git push triggers the workflow, deploying and launching your training job on all registered nodes.' },
  { n: '4', title: 'Monitor via UI', body: 'Access the experiment run UI through GitHub to launch runs, watch logs, and save checkpoints to Hugging Face Hub.' },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 56,
        background: 'rgba(5,7,15,0.88)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${C.line}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.5px' }}>Higgsfield</span>
          <span style={{ fontSize: 11, color: C.indigo, fontFamily: 'var(--font-geist-mono)', background: C.indigoSoft, padding: '2px 8px', borderRadius: 4 }}>Explorer</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <a href="#zero" style={{ fontSize: 13, color: C.text3, transition: 'color 0.2s' }}>ZeRO</a>
          <a href="#code" style={{ fontSize: 13, color: C.text3 }}>Code</a>
          <a href="#simulator" style={{ fontSize: 13, color: C.text3 }}>Simulate</a>
          <a href="https://github.com/higgsfield-ai/higgsfield" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: C.text, background: C.indigoSoft, border: `1px solid ${C.indigo}`, borderRadius: 8, padding: '5px 14px' }}>
            GitHub ↗
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', height: 520, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}><HeroCanvas /></div>
        {/* Gradient veil */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, background: `linear-gradient(transparent, ${C.bg})` }} />
        <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: C.indigo, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase' }}>
            Multi-Node GPU Orchestration
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: C.text, lineHeight: 1.08, letterSpacing: '-1.5px', maxWidth: 720 }}>
            Train LLMs at Scale<br />
            <span style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.violet})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Without Crying
            </span>
          </h1>
          <p style={{ fontSize: 17, color: C.text3, maxWidth: 520, lineHeight: 1.6 }}>
            Fault-tolerant, scalable GPU orchestration for billions to trillions of parameters.
            ZeRO-3, FSDP, and GitHub CI in one clean Python API.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="https://github.com/higgsfield-ai/higgsfield" target="_blank" rel="noopener noreferrer"
              style={{ padding: '10px 24px', background: C.indigo, color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
              View on GitHub
            </a>
            <a href="#zero"
              style={{ padding: '10px 24px', background: 'transparent', color: C.text, border: `1px solid ${C.lineStrg}`, borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
              Explore ZeRO Stages
            </a>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, background: C.bg2 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 32px', display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
          {[
            { label: 'GitHub Stars', value: '3.7k' },
            { label: 'Max ZeRO Stage', value: '3' },
            { label: 'Supported Models', value: 'LLaMA · Mistral · Custom' },
            { label: 'CI Integration', value: 'GitHub Actions' },
          ].map(s => (
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
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: C.bg2, border: `1px solid ${C.lineStrg}`, borderRadius: 14, padding: '24px 20px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: f.softColor, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: 18, color: f.color }}>
                  {f.icon}
                </div>
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
          <p style={{ fontSize: 14, color: C.text3, marginBottom: 32, maxWidth: 600, lineHeight: 1.6 }}>
            Higgsfield exposes ZeRO-3 through a single parameter. See exactly how each stage distributes memory across your GPU cluster.
          </p>
          <ZeroExplorer />
        </section>

        {/* Code Explorer */}
        <section id="code" style={{ paddingBottom: 80 }}>
          <div style={{ fontSize: 11, color: C.violet, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>API examples</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.5px', marginBottom: 8 }}>The @experiment API</h2>
          <p style={{ fontSize: 14, color: C.text3, marginBottom: 32, maxWidth: 600, lineHeight: 1.6 }}>
            Standard PyTorch with one decorator. No YAML, no argparse boilerplate, no framework-specific rewrites.
          </p>
          <CodeExplorer />
        </section>

        {/* Training Simulator */}
        <section id="simulator" style={{ paddingBottom: 80 }}>
          <div style={{ fontSize: 11, color: C.amber, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Interactive</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.5px', marginBottom: 8 }}>Cluster Simulator</h2>
          <p style={{ fontSize: 14, color: C.text3, marginBottom: 32, maxWidth: 600, lineHeight: 1.6 }}>
            Watch a simulated multi-node run including a mid-training GPU failure and automatic recovery.
          </p>
          <TrainingSimulator />
        </section>

        {/* Architecture */}
        <section style={{ paddingBottom: 80 }}>
          <div style={{ fontSize: 11, color: C.green, fontFamily: 'var(--font-geist-mono)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>How it works</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.5px', marginBottom: 36 }}>From commit to cluster</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {ARCH_STEPS.map((s, i) => (
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
          <div style={{ background: `linear-gradient(135deg, rgba(129,140,248,0.08), rgba(167,139,250,0.08))`, border: `1px solid ${C.indigo}30`, borderRadius: 20, padding: '40px 36px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.3px' }}>Get started in minutes</h2>
            <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 20px', fontFamily: 'var(--font-geist-mono)', fontSize: 13 }}>
              <div style={{ color: C.text4, marginBottom: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Install</div>
              <div><span style={{ color: C.text4 }}>$ </span><span style={{ color: C.green }}>pip install</span><span style={{ color: C.text2 }}> higgsfield==0.0.3</span></div>
            </div>
            <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 20px', fontFamily: 'var(--font-geist-mono)', fontSize: 13 }}>
              <div style={{ color: C.text4, marginBottom: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Initialize project</div>
              <div><span style={{ color: C.text4 }}>$ </span><span style={{ color: C.green }}>higgsfield</span><span style={{ color: C.text2 }}> init my-llm-project</span></div>
              <div style={{ marginTop: 4 }}><span style={{ color: C.text4 }}>$ </span><span style={{ color: C.green }}>higgsfield</span><span style={{ color: C.text2 }}> node add --host 10.0.0.1 --user ubuntu</span></div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="https://github.com/higgsfield-ai/higgsfield/blob/main/setup.md" target="_blank" rel="noopener noreferrer"
                style={{ padding: '10px 22px', background: C.indigo, color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
                Full Setup Guide ↗
              </a>
              <a href="https://github.com/higgsfield-ai/higgsfield/blob/main/tutorial.md" target="_blank" rel="noopener noreferrer"
                style={{ padding: '10px 22px', background: 'transparent', color: C.text2, border: `1px solid ${C.lineStrg}`, borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
                Tutorials ↗
              </a>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.line}`, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: C.bg2 }}>
        <div style={{ fontSize: 13, color: C.text4 }}>
          Interactive explorer for <a href="https://github.com/higgsfield-ai/higgsfield" target="_blank" rel="noopener noreferrer" style={{ color: C.indigo }}>higgsfield-ai/higgsfield</a>
        </div>
        <div style={{ fontSize: 11, color: C.text4, fontFamily: 'var(--font-geist-mono)' }}>
          john3913/gshultz
        </div>
      </footer>

    </div>
  );
}
