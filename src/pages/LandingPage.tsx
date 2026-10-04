import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, ArrowRight, ShieldCheck, Brain, Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { EXAMPLE_DECISION } from '@/lib/exampleData';
import { useState, useEffect } from 'react';

const NODES = [
  { label: 'ASSUMPTIONS', angle: -90, radius: 140 },
  { label: 'EVIDENCE GAPS', angle: -30, radius: 160 },
  { label: 'TENSIONS', angle: 30, radius: 140 },
  { label: 'PERSPECTIVES', angle: 90, radius: 160 },
  { label: 'QUESTIONS', angle: 150, radius: 140 },
  { label: 'OUTSIDE THE FRAME', angle: 210, radius: 160 },
];

function Constellation() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 200, y: 200 });

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const center = { x: 200, y: 200 };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 400 / rect.height;
    setMousePos({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
  };

  // Subtle parallax offset based on mouse position
  const parallaxX = ((mousePos.x - center.x) / center.x) * 8;
  const parallaxY = ((mousePos.y - center.y) / center.y) * 8;

  return (
    <div className="relative w-full aspect-square max-w-[420px] mx-auto">
      <svg viewBox="0 0 400 400" className="w-full h-full" onMouseMove={handleMouseMove} onMouseLeave={() => setMousePos({ x: 200, y: 200 })}>
        {/* Outer rings with parallax */}
        <circle cx={center.x + parallaxX * 0.3} cy={center.y + parallaxY * 0.3} r="190" fill="none" stroke="#27272a" strokeWidth="0.5" opacity="0.3" style={{ transition: 'all 0.3s ease' }} />
        <circle cx={center.x + parallaxX * 0.5} cy={center.y + parallaxY * 0.5} r="150" fill="none" stroke="#27272a" strokeWidth="0.5" opacity="0.2" style={{ transition: 'all 0.3s ease' }} />
        <circle cx={center.x + parallaxX * 0.7} cy={center.y + parallaxY * 0.7} r="100" fill="none" stroke="#27272a" strokeWidth="0.5" opacity="0.15" style={{ transition: 'all 0.3s ease' }} />

        {/* Connection lines */}
        {NODES.map((node, i) => {
          const rad = (node.angle * Math.PI) / 180;
          const x = center.x + Math.cos(rad) * node.radius;
          const y = center.y + Math.sin(rad) * node.radius;
          const isActive = hovered === i || hovered === null;
          return (
            <line
              key={`line-${i}`}
              x1={center.x}
              y1={center.y}
              x2={x}
              y2={y}
              stroke={isActive ? '#3f3f46' : '#27272a'}
              strokeWidth={hovered === i ? 1 : 0.5}
              opacity={mounted ? (isActive ? 0.6 : 0.2) : 0}
              style={{ transition: 'all 0.3s ease' }}
            />
          );
        })}

        {/* Center node */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: mounted ? 1 : 0, opacity: mounted ? 1 : 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ transformOrigin: 'center' }}
        >
          <circle cx={center.x + parallaxX} cy={center.y + parallaxY} r="42" fill="#111113" stroke="#3f3f46" strokeWidth="1" style={{ transition: 'all 0.2s ease' }} />
          <circle cx={center.x + parallaxX} cy={center.y + parallaxY} r="42" fill="none" stroke="#7dd3fc" strokeWidth="0.5" opacity="0.3" className="animate-pulse-slow" style={{ transition: 'all 0.2s ease' }} />
          <text x={center.x + parallaxX} y={center.y + parallaxY - 4} textAnchor="middle" className="fill-[#f4f4f5]" style={{ fontSize: 7, fontWeight: 600, letterSpacing: '0.05em', transition: 'all 0.2s ease' }}>
            YOUR
          </text>
          <text x={center.x + parallaxX} y={center.y + parallaxY + 6} textAnchor="middle" className="fill-[#f4f4f5]" style={{ fontSize: 7, fontWeight: 600, letterSpacing: '0.05em', transition: 'all 0.2s ease' }}>
            DECISION
          </text>
        </motion.g>

        {/* Orbital nodes */}
        {NODES.map((node, i) => {
          const rad = (node.angle * Math.PI) / 180;
          const x = center.x + Math.cos(rad) * node.radius;
          const y = center.y + Math.sin(rad) * node.radius;
          const isHovered = hovered === i;
          return (
            <motion.g
              key={`node-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: mounted ? 1 : 0, opacity: mounted ? 1 : 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
              style={{ transformOrigin: `${x}px ${y}px`, cursor: 'pointer' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <motion.circle
                cx={x}
                cy={y}
                r={isHovered ? 30 : 26}
                fill="#111113"
                stroke={isHovered ? '#7dd3fc' : '#3f3f46'}
                strokeWidth="0.8"
                animate={{ r: isHovered ? 30 : 26 }}
                style={{ transition: 'all 0.3s ease' }}
              />
              <circle cx={x} cy={y} r={26} fill="none" stroke="#7dd3fc" strokeWidth="0.3" opacity={isHovered ? 0.4 : 0.1} />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={isHovered ? 'fill-[#7dd3fc]' : 'fill-[#a1a1aa]'}
                style={{ fontSize: 5.5, fontWeight: 500, letterSpacing: '0.03em' }}
              >
                {node.label}
              </text>
            </motion.g>
          );
        })}

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => {
          const angle = (i * 60 * Math.PI) / 180;
          const r = 100 + (i % 2) * 40;
          const px = center.x + Math.cos(angle) * r;
          const py = center.y + Math.sin(angle) * r;
          return (
            <motion.circle
              key={`particle-${i}`}
              cx={px}
              cy={py}
              r="1.5"
              fill="#7dd3fc"
              opacity="0.4"
              animate={{
                cy: [py, py - 12, py],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.3,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#f4f4f5]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#27272a]/50 backdrop-blur-xl bg-[#0a0a0b]/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost">Sign in</Link>
            <Link to="/signup" className="btn-primary">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 glow-accent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7dd3fc]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#27272a] bg-[#111113]/50 text-xs text-[#a1a1aa]"
              >
                <Brain size={12} className="text-[#7dd3fc]" />
                AI reasoning auditor
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-2"
              >
                <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
                  AI for the things
                  <br />
                  your reasoning
                  <br />
                  <span className="font-serif italic text-[#7dd3fc]">missed.</span>
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-[#a1a1aa] leading-relaxed max-w-md"
              >
                Every decision has a visible side. UNSEEN helps you inspect what might be outside the frame — assumptions, evidence gaps, tensions, and perspectives you haven't considered.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Link to="/signup" className="btn-primary text-base px-6 py-3">
                  Examine a decision
                  <ArrowRight size={16} />
                </Link>
                <Link to="/signup" state={{ exampleMode: true }} className="btn-secondary text-base px-6 py-3">
                  <Sparkles size={16} />
                  Try an example
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-center gap-2 text-sm text-[#71717a]"
              >
                <ShieldCheck size={14} className="text-[#86efac]" />
                Your decision stays yours.
              </motion.div>
            </div>

            {/* Right: constellation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <Constellation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="relative py-24 border-t border-[#27272a]/50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mb-16"
          >
            <p className="text-sm text-[#71717a] uppercase tracking-wider mb-3">The difference</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance">
              Most tools ask <span className="text-[#a1a1aa]">"What should I choose?"</span>
              <br />
              UNSEEN asks <span className="font-serif italic text-[#7dd3fc]">"What might I be missing?"</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Assumptions', desc: 'What are you taking for granted? UNSEEN surfaces hidden assumptions and shows you how to test them.' },
              { title: 'Evidence Gaps', desc: 'What do you not actually know? UNSEEN identifies missing information and how to verify it.' },
              { title: 'Reasoning Tensions', desc: 'Where does your reasoning conflict with your priorities? UNSEEN reveals the contradictions.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="surface-card p-6"
              >
                <h3 className="text-base font-medium text-[#f4f4f5] mb-2">{item.title}</h3>
                <p className="text-sm text-[#a1a1aa] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-24 border-t border-[#27272a]/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-sm text-[#71717a] uppercase tracking-wider mb-3">The process</p>
              <h2 className="text-3xl font-semibold tracking-tight mb-8">A reasoning audit, not a recommendation.</h2>
              <div className="space-y-6">
                {[
                  { n: '01', t: 'Share your reasoning', d: 'Walk through a guided reflection about your decision, options, and priorities.' },
                  { n: '02', t: 'AI maps your blind spots', d: 'UNSEEN analyzes your reasoning for assumptions, gaps, tensions, and overlooked factors.' },
                  { n: '03', t: 'Challenge your thinking', d: 'Engage in adaptive one-question-at-a-time dialogue that surfaces what you might be missing.' },
                  { n: '04', t: 'You decide', d: 'UNSEEN never tells you what to choose. It helps you see the path more clearly.' },
                ].map((step) => (
                  <div key={step.n} className="flex gap-4">
                    <span className="text-sm text-[#52525b] font-mono tabular-nums shrink-0 mt-0.5">{step.n}</span>
                    <div>
                      <h3 className="text-base font-medium text-[#f4f4f5]">{step.t}</h3>
                      <p className="text-sm text-[#a1a1aa] mt-1">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-card p-8 space-y-6">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-[#7dd3fc]" />
                <span className="text-sm font-medium text-[#f4f4f5]">Example audit output</span>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="label-badge label-user">User provided</span>
                  <p className="mt-2 text-sm text-[#a1a1aa]">"Good stipend, close to home, gives industry experience."</p>
                </div>
                <div>
                  <span className="label-badge label-ai">AI inference</span>
                  <p className="mt-2 text-sm text-[#a1a1aa]">"You may be assuming convenience will outweigh the academic cost."</p>
                </div>
                <div className="pt-4 border-t border-[#27272a]">
                  <span className="label-badge label-uncertain">Uncertainty</span>
                  <p className="mt-2 text-sm text-[#a1a1aa]">Mentorship quality and project ownership are unknown.</p>
                </div>
              </div>
              <div className="pt-4 border-t border-[#27272a]">
                <p className="text-xs text-[#71717a] italic">UNSEEN challenges your reasoning, not your autonomy.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 border-t border-[#27272a]/50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance mb-4">
            What might you be missing?
          </h2>
          <p className="text-[#a1a1aa] mb-8 max-w-md mx-auto">
            Examine a decision in under five minutes. No recommendation. Just clarity.
          </p>
          <Link to="/signup" className="btn-primary text-base px-8 py-3.5 inline-flex">
            Start examining
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#27272a]/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <Logo size="sm" />
          <p className="text-xs text-[#52525b]">Your decision stays yours.</p>
        </div>
      </footer>
    </div>
  );
}
