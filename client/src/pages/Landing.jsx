import { useState, useEffect, useRef } from "react";

/* ── DESIGN TOKENS ── */
const C = {
  bg:        "#0F172A",
  surface:   "#1E293B",
  surface2:  "#272F42",
  border:    "#334155",
  fg:        "#F8FAFC",
  muted:     "#94A3B8",
  accent:    "#22C55E",
  accentDim: "#16A34A",
  red:       "#EF4444",
  blue:      "#60A5FA",
  yellow:    "#FBBF24",
  purple:    "#A78BFA",
};

/* ── ANIMATION HOOK ── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function FadeIn({ children, delay = 0, direction = "up" }) {
  const [ref, visible] = useInView();
  const translate = direction === "up" ? "translateY(28px)" : direction === "left" ? "translateX(-28px)" : "translateX(28px)";
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translate(0)" : translate,
      transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

const FEATURES = [
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, title: "Instant Endpoints", desc: "Define a route, pick a method, hit save — live in under 3 seconds. No deployment, no config." },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 13h4"/></svg>, title: "Faker Data Seeding", desc: "Auto-generate realistic names, emails, IDs, and dates with Faker.js — no manual data entry." },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>, title: "Error Simulation", desc: "Force 400, 401, 429, 500 responses with custom delays to test error handling before backend is ready." },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 10h16M4 14h8M4 18h6"/></svg>, title: "Request Logs", desc: "Every request logged in real-time — method, headers, body, timestamp. Debug without Postman." },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>, title: "Shareable Demo URLs", desc: "Share a public demo link with teammates, clients, or interviewers — one click, no auth needed." },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>, title: "Sort, Filter & Pagination", desc: "?page=2&limit=10&sort=createdAt works out of the box — zero backend code needed." },
];

const STEPS = [
  { num: "01", title: "Create a resource", desc: "Name your resource — users, products, orders — and set the response schema using our visual field builder." },
  { num: "02", title: "Configure the endpoint", desc: "Pick HTTP method, add fake data rules, set status codes, inject custom headers or delays." },
  { num: "03", title: "Hit the URL", desc: "Endpoint is live. Copy the URL, paste into your app or Postman, and build against real-looking data." },
];

const FAQS = [
  { q: "What is MockAPI?", a: "MockAPI is a REST API mocking tool that lets you create fake endpoints that return realistic data. Define your schema, get a live URL instantly — no backend needed." },
  { q: "Is it free to use?", a: "Yes, MockAPI is completely free to start. Create unlimited endpoints, seed data, and share demo URLs — all on the free plan." },
  { q: "Does it support all HTTP methods?", a: "Yes. MockAPI supports GET, POST, PUT, PATCH, and DELETE. Each endpoint can be configured independently with its own response, status code, and delay." },
  { q: "Can I share my mock API with others?", a: "Absolutely. Every project has a shareable demo URL that works without authentication. Share it with teammates, clients, or interviewers in one click." },
  { q: "How is it different from other mocking tools?", a: "MockAPI focuses on developer speed — no YAML config, no local setup. Create endpoints visually, seed with Faker data, simulate errors, and get logs in real-time. All from a browser." },
];


/* ── DEMO MODAL DATA ── */
const DEMO_ENDPOINTS = [
  {
    method: 'GET', label: 'List users', path: '/api/demo/users',
    status: 200, statusText: 'OK',
    lines: [
      '{ "data": [',
      '    { "id": "usr_01", "name": "Priya Sharma", "role": "admin" },',
      '    { "id": "usr_02", "name": "Arjun Dev",    "role": "member" },',
      '    { "id": "usr_03", "name": "Meera Nair",   "role": "member" }',
      '  ],',
      '  "total": 48, "page": 1, "latency": "11ms"',
      '}',
    ],
  },
  {
    method: 'POST', label: 'Create order', path: '/api/demo/orders',
    status: 201, statusText: 'Created',
    lines: [
      '{',
      '  "message": "Order created successfully",',
      '  "data": {',
      '    "id": "ord_xK92p",',
      '    "product": "Mechanical Keyboard",',
      '    "quantity": 2,',
      '    "status": "pending",',
      '    "price": 4299',
      '  }',
      '}',
    ],
  },
  {
    method: 'DELETE', label: 'Delete user', path: '/api/demo/users/:id',
    status: 200, statusText: 'OK',
    lines: [
      '{',
      '  "message": "User deleted successfully",',
      '  "deleted": "usr_03"',
      '}',
    ],
  },
]

const METHOD_C = { GET: '#22C55E', POST: '#60A5FA', DELETE: '#EF4444', PUT: '#FBBF24' }

function colorLine(str) {
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(\b\d+\b)|([{}\[\],])/g
  const parts = []; let last = 0, m, key = 0
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) parts.push(<span key={key++} style={{ color: 'rgba(255,255,255,0.25)' }}>{str.slice(last, m.index)}</span>)
    if (m[2] !== undefined) {
      parts.push(<span key={key++} style={{ color: '#60A5FA' }}>{m[1]}</span>)
      parts.push(<span key={key++} style={{ color: 'rgba(255,255,255,0.25)' }}>{m[2]}</span>)
    } else if (m[1]) {
      parts.push(<span key={key++} style={{ color: '#22C55E' }}>{m[1]}</span>)
    } else if (m[3]) {
      parts.push(<span key={key++} style={{ color: '#FBBF24' }}>{m[3]}</span>)
    } else {
      parts.push(<span key={key++} style={{ color: 'rgba(255,255,255,0.2)' }}>{m[4]}</span>)
    }
    last = m.index + m[0].length
  }
  if (last < str.length) parts.push(<span key={key++} style={{ color: 'rgba(255,255,255,0.25)' }}>{str.slice(last)}</span>)
  return parts
}

function DemoModal({ onClose }) {
  const [active, setActive]           = useState(0)
  const [phase, setPhase]             = useState('idle')   // 'loading' | 'done'
  const [visibleLines, setVisibleLines] = useState(0)
  const sessionRef = useRef(0)

  const run = (idx) => {
    const session = ++sessionRef.current
    setActive(idx); setPhase('loading'); setVisibleLines(0)
    setTimeout(() => {
      if (sessionRef.current !== session) return
      setPhase('done')
      DEMO_ENDPOINTS[idx].lines.forEach((_, i) => {
        setTimeout(() => {
          if (sessionRef.current !== session) return
          setVisibleLines(i + 1)
        }, i * 80)
      })
    }, 500)
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    run(0)
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handler)
    }
  }, [])

  const ep = DEMO_ENDPOINTS[active]
  const mc = METHOD_C[ep.method]

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 660, background: '#1E293B', border: '1px solid #334155', borderRadius: 16, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.65)' }}>

        {/* Title bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem', background: '#272F42', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}/>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FBBF24', display: 'inline-block' }}/>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}/>
          </div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#94A3B8' }}>MockAPI — Live Demo</span>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', padding: 2, transition: 'color 150ms' }}
            onMouseEnter={e => e.currentTarget.style.color = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Endpoint tabs */}
        <div style={{ display: 'flex', gap: 6, padding: '0.75rem 1.25rem', borderBottom: '1px solid #334155', overflowX: 'auto', background: 'rgba(0,0,0,0.15)' }}>
          {DEMO_ENDPOINTS.map((d, i) => (
            <button key={i} onClick={() => run(i)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.3rem 0.8rem', borderRadius: 8, border: `1px solid ${active === i ? METHOD_C[d.method] + '55' : '#334155'}`, background: active === i ? METHOD_C[d.method] + '15' : 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms', flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: METHOD_C[d.method] }}>{d.method}</span>
              <span style={{ fontSize: 12, color: active === i ? '#F8FAFC' : '#94A3B8', fontFamily: "'DM Mono', monospace" }}>{d.label}</span>
            </button>
          ))}
        </div>

        {/* URL bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.65rem 1.25rem', borderBottom: '1px solid #334155', background: 'rgba(0,0,0,0.25)' }}>
          <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: mc, background: mc + '18', border: `1px solid ${mc}33`, padding: '0.15rem 0.45rem', borderRadius: 5 }}>{ep.method}</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,0.45)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>api.spacego.online{ep.path}</span>
          <span style={{ flexShrink: 0, fontSize: 11, fontFamily: "'DM Mono', monospace", padding: '0.15rem 0.5rem', borderRadius: 6, background: ep.status < 300 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: ep.status < 300 ? '#22C55E' : '#EF4444', border: `1px solid ${ep.status < 300 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}` }}>{ep.status} {ep.statusText}</span>
        </div>

        {/* Response body */}
        <div style={{ padding: '1.25rem', fontFamily: "'DM Mono', monospace", fontSize: 13, lineHeight: 1.9, minHeight: 180, background: 'rgba(0,0,0,0.35)', boxShadow: 'inset 0 0 60px rgba(34,197,94,0.03)' }}>
          {phase === 'loading' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94A3B8' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse 1s infinite' }}/>
              Sending request...
            </div>
          ) : (
            <>
              {ep.lines.slice(0, visibleLines).map((line, i) => (
                <div key={i} style={{ whiteSpace: 'pre' }}>{colorLine(line)}</div>
              ))}
              {phase === 'done' && visibleLines >= ep.lines.length && (
                <span style={{ display: 'inline-block', width: 8, height: '1em', background: '#22C55E', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite', borderRadius: 1 }}/>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem', borderTop: '1px solid #334155', background: '#272F42' }}>
          <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: "'DM Sans', sans-serif" }}>No auth · No setup · Free to start</span>
          <a href="/register" onClick={onClose} style={{ fontSize: 12, padding: '0.4rem 1rem', borderRadius: 8, background: '#22C55E', color: '#0F172A', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            Build yours free
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M1 8h14M9 3l6 5-6 5"/></svg>
          </a>
        </div>
      </div>
    </div>
  )
}

function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (bodyRef.current) setHeight(open ? bodyRef.current.scrollHeight : 0);
  }, [open]);
  return (
    <FadeIn delay={index * 80}>
      <div onClick={() => setOpen(o => !o)} style={{ background: open ? C.surface : "transparent", border: `1px solid ${open ? C.accent + "44" : C.border}`, borderRadius: 12, padding: "1.25rem 1.5rem", cursor: "pointer", transition: "background 200ms, border-color 200ms", userSelect: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.95rem", fontWeight: 600, color: C.fg }}>{q}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={open ? C.accent : C.muted} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, transition: "transform 250ms ease, stroke 200ms", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
        <div style={{ overflow: "hidden", height, transition: "height 280ms ease" }}>
          <div ref={bodyRef} style={{ paddingTop: "0.85rem", fontSize: "0.9rem", color: C.muted, lineHeight: 1.7 }}>{a}</div>
        </div>
      </div>
    </FadeIn>
  );
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [demoOpen, setDemoOpen]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      {demoOpen && <DemoModal onClose={() => setDemoOpen(false)} />}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${C.bg}; color: ${C.fg}; font-family: 'DM Sans', sans-serif; font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
        h1,h2,h3 { font-family: 'Space Grotesk', sans-serif; }
        a { text-decoration: none; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .btn-primary { background: ${C.accent}; color: #0F172A; padding: 0.75rem 1.75rem; border-radius: 10px; font-family: 'Space Grotesk', sans-serif; font-size: 0.95rem; font-weight: 600; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: background 200ms, transform 200ms, box-shadow 200ms; box-shadow: 0 0 20px rgba(34,197,94,0.2); }
        .btn-primary:hover { background: ${C.accentDim}; transform: translateY(-2px); box-shadow: 0 0 30px rgba(34,197,94,0.35); }
        .btn-secondary { background: transparent; color: ${C.fg}; padding: 0.75rem 1.75rem; border-radius: 10px; font-family: 'Space Grotesk', sans-serif; font-size: 0.95rem; font-weight: 500; border: 1px solid ${C.border}; display: inline-flex; align-items: center; gap: 8px; transition: border-color 200ms, background 200ms, transform 200ms; cursor: pointer; }
        .btn-secondary:hover { border-color: ${C.muted}; background: ${C.surface}; transform: translateY(-2px); }
        .feature-card { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 14px; padding: 1.75rem; transition: border-color 200ms, transform 200ms, box-shadow 200ms; position: relative; overflow: hidden; }
        .feature-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: transparent; transition: background 200ms; }
        .feature-card:hover { border-color: rgba(34,197,94,0.35); transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
        .feature-card:hover::before { background: ${C.accent}; }
        .nav-link { color: ${C.muted}; font-size: 0.9rem; font-weight: 500; transition: color 150ms; }
        .nav-link:hover { color: ${C.fg}; }
        @media (max-width: 768px) { .desktop-nav { display: none !important; } .hamburger { display: flex !important; } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0ms !important; animation: none !important; } }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(1.5rem, 5vw, 4rem)", height: 64, background: scrolled ? "rgba(15,23,42,0.92)" : "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${scrolled ? "rgba(51,65,85,0.8)" : "transparent"}`, transition: "background 300ms, border-color 300ms" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem", fontWeight: 700, color: C.fg }}>
          <div style={{ width: 30, height: 30, background: C.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#0F172A" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="14" height="10" rx="2"/><path d="M4 4V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1"/><path d="M6 9l2 2 2-2"/></svg>
          </div>
          MockAPI
        </a>

        <ul className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "2rem", listStyle: "none", margin: 0 }}>
          {["Features","How it works","FAQ"].map(l => (
            <li key={l}><a href={`#${l.toLowerCase().replace(/ /g,"-")}`} className="nav-link">{l}</a></li>
          ))}
          <li><a href="/login" className="nav-link">Sign in</a></li>
          <li><a href="/register" className="btn-primary" style={{ padding: "0.45rem 1.1rem", fontSize: "0.88rem" }}>Start Free</a></li>
        </ul>

        <button onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu" className="hamburger" style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: C.fg, padding: 4 }}>
          {menuOpen
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          }
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(15,23,42,0.97)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2rem", opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? "all" : "none", transition: "opacity 250ms ease" }}>
        {["Features","How it works","FAQ"].map((l, i) => (
          <a key={l} href={`#${l.toLowerCase().replace(/ /g,"-")}`} onClick={() => setMenuOpen(false)} style={{ color: C.fg, fontSize: "1.5rem", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, opacity: menuOpen ? 1 : 0, transform: menuOpen ? "translateY(0)" : "translateY(16px)", transition: `opacity 300ms ease ${i * 60 + 100}ms, transform 300ms ease ${i * 60 + 100}ms` }}>{l}</a>
        ))}
        <a href="/register" className="btn-primary" onClick={() => setMenuOpen(false)} style={{ marginTop: "1rem", fontSize: "1rem", padding: "0.85rem 2.5rem" }}>Start Free</a>
      </div>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8rem clamp(1.5rem, 5vw, 4rem) 4rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 70%)", pointerEvents: "none" }}/>
        <FadeIn><div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: C.accent, padding: "0.35rem 0.9rem", borderRadius: 100, fontSize: "0.8rem", fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.03em", marginBottom: "1.5rem" }}>
          <span style={{ width: 6, height: 6, background: C.accent, borderRadius: "50%", animation: "pulse 2s infinite" }}/>
          Now live — Mock any REST endpoint
        </div></FadeIn>
        <FadeIn delay={100}><h1 style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", maxWidth: 820, marginBottom: "1.25rem" }}>Fake APIs that feel <span style={{ color: C.accent, textShadow: "0 0 40px rgba(34,197,94,0.3)" }}>real enough</span> to ship against</h1></FadeIn>
        <FadeIn delay={180}><p style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", color: C.muted, maxWidth: 560, marginBottom: "2.5rem", lineHeight: 1.7 }}>Create mock REST endpoints in seconds. Seed realistic data, simulate errors, and test your frontend without waiting for the backend team.</p></FadeIn>
        <FadeIn delay={240}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "3.5rem" }}>
            <a href="/register" className="btn-primary"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 8h14M9 3l6 5-6 5"/></svg>Create your first mock</a>
            <button onClick={() => setDemoOpen(true)} className="btn-secondary" style={{ cursor: "pointer" }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="8" cy="8" r="7"/><path d="M6 5.5l5 2.5-5 2.5V5.5z"/></svg>See it in action</button>
          </div>
        </FadeIn>
        <FadeIn delay={320}>
          <div style={{ width: "100%", maxWidth: 720, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", textAlign: "left", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
            <div style={{ background: C.surface2, padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#EF4444" }}/><span style={{ width: 12, height: 12, borderRadius: "50%", background: "#FBBF24" }}/><span style={{ width: 12, height: 12, borderRadius: "50%", background: "#22C55E" }}/>
              <span style={{ marginLeft: "auto", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: C.muted, background: C.bg, padding: "0.25rem 0.75rem", borderRadius: 6, border: `1px solid ${C.border}` }}>mockapi.spacego.online/api/v1/users</span>
            </div>
            <div style={{ padding: "1.25rem 1.5rem", fontFamily: "'DM Mono', monospace", fontSize: "0.82rem", lineHeight: 1.8 }}>
              <div style={{ color: "#94A3B8" }}>// GET /api/v1/users — instant response</div>
              <div style={{ marginTop: "0.5rem" }}><span style={{ color: C.blue }}>"status"</span>: <span style={{ color: C.yellow }}>200</span>,</div>
              <div><span style={{ color: C.blue }}>"data"</span>: [</div>
              <div style={{ paddingLeft: "1.5rem" }}>{"{ "}<span style={{ color: C.blue }}>"id"</span>: <span style={{ color: C.accent }}>"usr_01"</span>, <span style={{ color: C.blue }}>"name"</span>: <span style={{ color: C.accent }}>"Priya Sharma"</span>, <span style={{ color: C.blue }}>"role"</span>: <span style={{ color: C.accent }}>"admin"</span>{" },"}</div>
              <div style={{ paddingLeft: "1.5rem" }}>{"{ "}<span style={{ color: C.blue }}>"id"</span>: <span style={{ color: C.accent }}>"usr_02"</span>, <span style={{ color: C.blue }}>"name"</span>: <span style={{ color: C.accent }}>"Arjun Dev"</span>, <span style={{ color: C.blue }}>"role"</span>: <span style={{ color: C.accent }}>"member"</span>{" }"}</div>
              <div>],</div>
              <div><span style={{ color: C.blue }}>"total"</span>: <span style={{ color: C.yellow }}>48</span>, <span style={{ color: C.blue }}>"page"</span>: <span style={{ color: C.yellow }}>1</span>, <span style={{ color: C.blue }}>"latency"</span>: <span style={{ color: C.accent }}>"12ms"</span></div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* STATS */}
      <div style={{ display: "flex", justifyContent: "center", gap: "clamp(1.5rem, 4vw, 4rem)", flexWrap: "wrap", padding: "2rem clamp(1.5rem, 5vw, 4rem)", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        {[["10k+","Endpoints created"],["<20ms","Avg response time"],["7","Faker data types"],["100%","Free to start"]].map(([n,l], i) => (
          <FadeIn key={l} delay={i * 80}><div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2rem", fontWeight: 700, color: C.accent }}>{n}</div><div style={{ fontSize: "0.85rem", color: C.muted, marginTop: 2 }}>{l}</div></div></FadeIn>
        ))}
      </div>

      {/* FEATURES */}
      <section id="features" style={{ padding: "5rem clamp(1.5rem, 5vw, 4rem)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeIn><div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Features</div></FadeIn>
          <FadeIn delay={80}><h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.75rem)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "1rem" }}>Everything you need to mock</h2></FadeIn>
          <FadeIn delay={140}><p style={{ color: C.muted, fontSize: "1.05rem", maxWidth: 540, lineHeight: 1.7 }}>No config files. No spinning up a server. Just a URL that responds exactly how you tell it to.</p></FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem", marginTop: "3rem" }}>
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 60}>
                <div className="feature-card">
                  <div style={{ width: 44, height: 44, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem", color: C.accent }}>{f.icon}</div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>{f.title}</h3>
                  <p style={{ fontSize: "0.9rem", color: C.muted, lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: "5rem clamp(1.5rem, 5vw, 4rem)", background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeIn><div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>How it works</div></FadeIn>
          <FadeIn delay={80}><h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.75rem)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "1rem" }}>From zero to API in 60 seconds</h2></FadeIn>
          <FadeIn delay={140}><p style={{ color: C.muted, fontSize: "1.05rem", maxWidth: 540, lineHeight: 1.7 }}>Three steps. No backend knowledge needed.</p></FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginTop: "3rem" }}>
            {STEPS.map((s, i) => (
              <FadeIn key={s.num} delay={i * 100}>
                <div style={{ padding: "2rem", borderRight: i < STEPS.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", fontWeight: 500, color: C.accent, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>{s.num}</div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>{s.title}</h3>
                  <p style={{ fontSize: "0.88rem", color: C.muted, lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: "5rem clamp(1.5rem, 5vw, 4rem)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <FadeIn><div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>FAQ</div></FadeIn>
          <FadeIn delay={80}><h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.75rem)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>Common questions</h2></FadeIn>
          <FadeIn delay={140}><p style={{ color: C.muted, fontSize: "1.05rem", lineHeight: 1.7, marginBottom: "2.5rem" }}>Everything you need to know about MockAPI.</p></FadeIn>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} index={i} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "6rem clamp(1.5rem, 5vw, 4rem)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 60% at 50% 100%, rgba(34,197,94,0.07) 0%, transparent 70%)", pointerEvents: "none" }}/>
        <FadeIn>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "4rem 2rem", maxWidth: 640, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "1rem" }}>Stop waiting for the backend.<br/>Start building now.</h2>
            <p style={{ color: C.muted, marginBottom: "2rem", fontSize: "1rem" }}>MockAPI is free to start. Create your first endpoint in under a minute.</p>
            <a href="/register" className="btn-primary" style={{ fontSize: "1rem", padding: "0.85rem 2rem" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 1v14M1 8h14"/></svg>
              Create free account
            </a>
            <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: C.muted }}>No credit card. No setup. Just a URL.</div>
          </div>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer style={{ position: "relative", borderTop: `1px solid ${C.border}`, padding: "2rem clamp(1.5rem, 5vw, 4rem)", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "1rem" }}>
        <div style={{ position: "absolute", top: -1, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.accent}55, transparent)` }} />
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.9rem", fontWeight: 600 }}>MockAPI</div>
        <ul style={{ display: "flex", gap: "1.5rem", listStyle: "none", justifyContent: "center" }}>
          {["Docs","GitHub","Status"].map(l => <li key={l}><a href="#" className="nav-link" style={{ fontSize: "0.85rem" }}>{l}</a></li>)}
        </ul>
        <div style={{ fontSize: "0.8rem", color: C.muted, textAlign: "right" }}>Built by RJ · spacego.online</div>
      </footer>
    </>
  );
}
