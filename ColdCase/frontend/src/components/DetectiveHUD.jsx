/**
 * DetectiveHUD.jsx  — Slim Rail + Slide-out Drawer
 * ─────────────────────────────────────────────────
 * A 52px icon rail fixed on the left.
 * Clicking any icon opens a full-height drawer panel.
 * Pages should use:  margin-left: var(--hud-width, 52px)
 *
 * Panels:
 *   Identity   — avatar, name, gender toggle
 *   Stats      — phase, interviewed, contradictions, hints
 *   Progress   — score bar + detective thought
 *   Suspects   — suspicion bars per character
 *   Notes      — free-text notepad
 *   Dossier    — navigates to /dossier character briefing
 */

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "../context/SessionContext";
import { useProgress } from "../context/ProgressContext";

import detectiveMaleImg from "../assets/characters/user_male.webp";
import detectiveFemaleImg from "../assets/characters/user_female.webp";

const API_BASE = "http://127.0.0.1:8000";

const RAIL_W = 76;   // px — icon rail width (wider for label + icon)
const DRAWER_W = 300;  // px — slide-out panel width

// SVG icon components — all 20×20 viewBox, stroke-based, no emojis
const Icons = {
    identity: (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="7" r="3.5" />
            <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" />
        </svg>
    ),
    stats: (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="11" width="3.5" height="7" rx="1" />
            <rect x="8.25" y="6" width="3.5" height="12" rx="1" />
            <rect x="14.5" y="2" width="3.5" height="16" rx="1" />
        </svg>
    ),
    progress: (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2,14 7,8 11,11 18,4" />
            <polyline points="14,4 18,4 18,8" />
        </svg>
    ),
    suspects: (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="10" r="3" />
            <circle cx="10" cy="10" r="7.5" />
            <line x1="10" y1="2.5" x2="10" y2="4.5" />
            <line x1="10" y1="15.5" x2="10" y2="17.5" />
            <line x1="2.5" y1="10" x2="4.5" y2="10" />
            <line x1="15.5" y1="10" x2="17.5" y2="10" />
        </svg>
    ),
    notes: (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 2h9l4 4v13a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
            <polyline points="13,2 13,6 17,6" />
            <line x1="6" y1="9" x2="14" y2="9" />
            <line x1="6" y1="13" x2="11" y2="13" />
        </svg>
    ),
    dossier: (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="16" height="14" rx="1.5" />
            <circle cx="7.5" cy="8.5" r="2" />
            <path d="M3 17c0-2 2-3.5 4.5-3.5S12 15 12 17" />
            <line x1="14" y1="8" x2="17" y2="8" />
            <line x1="14" y1="11" x2="16" y2="11" />
        </svg>
    ),
};

const TABS = [
    { id: "identity", icon: Icons.identity, label: "ID" },
    { id: "stats", icon: Icons.stats, label: "Stats" },
    { id: "progress", icon: Icons.progress, label: "Progress" },
    { id: "suspects", icon: Icons.suspects, label: "Suspects" },
    { id: "notes", icon: Icons.notes, label: "Notes" },
    { id: "dossier", icon: Icons.dossier, label: "Dossier" },
];

const THOUGHTS = [
    "Someone is lying.",
    "Check the timeline again.",
    "The inhaler — why?",
    "Victor was nervous.",
    "Follow the cold brew.",
    "Rose knows more.",
    "Hayes is hiding something.",
    "Motive: trophy envy?",
    "Cross-reference alibis.",
    "The sticky note. Premeditated?",
    "Martha had access.",
    "Push harder.",
    "Who gains from Julian's collapse?",
    "Trace the VIP kit.",
    "Every alibi has a crack.",
    "The truth is in the details.",
];

const SUSPICION_BASE = {
    victor: { name: "Victor", accent: "#e67e22", suspicion: 72 },
    martha: { name: "Martha", accent: "#9b59b6", suspicion: 58 },
    rose: { name: "Rose", accent: "#1abc9c", suspicion: 34 },
    hayes: { name: "Hayes", accent: "#3498db", suspicion: 12 },
};

function scoreColor(s) { return s >= 35 ? "#e74c3c" : s >= 20 ? "#e67e22" : "#f5c842"; }
function scoreLabel(s) {
    if (s < 10) return "Cold Trail";
    if (s < 20) return "Something's Off";
    if (s < 35) return "Threads Connecting";
    if (s < 50) return "Truth Closing In";
    return "Breakthrough";
}

// ── Individual panel contents ──────────────────────────────────────────────────

function PanelIdentity({ gender, toggleGender, avatarSrc }) {
    return (
        <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Avatar */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{
                    width: 90, height: 120, borderRadius: 10, overflow: "hidden",
                    border: "2px solid rgba(245,200,66,0.45)",
                    boxShadow: "0 0 24px rgba(245,200,66,0.12),0 0 0 3px rgba(245,200,66,0.06)",
                    position: "relative", background: "#0a0810", flexShrink: 0,
                }}>
                    <img src={avatarSrc} alt="Detective" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", background: "linear-gradient(to top,rgba(7,5,10,.9),transparent)", pointerEvents: "none" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.7rem", fontWeight: 900, fontStyle: "italic", color: "#f5c842", textShadow: "0 0 14px rgba(245,200,66,.35)", lineHeight: 1 }}>You</div>
                    <div style={{ fontFamily: "'Special Elite',cursive", fontSize: "0.85rem", color: "rgba(196,184,154,.5)", marginTop: 4, letterSpacing: ".06em" }}>Lead Detective</div>
                    <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: "0.77rem", color: "rgba(196,184,154,.3)", marginTop: 2 }}>Case #0001</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#c0392b", boxShadow: "0 0 5px rgba(192,57,43,.9)", animation: "hpulse 1.8s ease-in-out infinite" }} />
                        <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: "0.69rem", color: "#c0392b", letterSpacing: ".18em", textTransform: "uppercase" }}>Live — On Case</span>
                    </div>
                </div>
            </div>

            {/* Gender toggle */}
            <div>
                <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: "0.62rem", letterSpacing: ".35em", textTransform: "uppercase", color: "rgba(245,200,66,.3)", marginBottom: 8 }}>// Detective Profile</div>
                <div style={{ display: "flex", gap: 8 }}>
                    {["male", "female"].map(g => (
                        <button key={g} onClick={toggleGender} style={{
                            flex: 1, padding: "7px 4px", borderRadius: 4,
                            fontFamily: "'Special Elite',cursive", fontSize: "0.77rem",
                            letterSpacing: ".15em", textTransform: "uppercase",
                            cursor: "crosshair", transition: "all .2s",
                            background: gender === g ? "rgba(245,200,66,.15)" : "rgba(255,255,255,.03)",
                            border: gender === g ? "1px solid rgba(245,200,66,.4)" : "1px solid rgba(255,255,255,.07)",
                            color: gender === g ? "#f5c842" : "rgba(196,184,154,.4)",
                            boxShadow: gender === g ? "0 0 10px rgba(245,200,66,.1)" : "none",
                        }}>
                            {g === "male" ? "♂ Male" : "♀ Female"}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function PanelStats({ gameState, contradictionCount }) {
    const rows = [
        { label: "Interviewed", val: `${(gameState.questioned_characters || []).length} / 4`, color: "#e67e22", sym: "◈" },
        { label: "Contradictions", val: `${contradictionCount}`, color: "#e74c3c", sym: "⚑" },
        { label: "Hints Used", val: `${gameState.hints_used ?? 0}`, color: "#9b59b6", sym: "◆" },
        { label: "Case Phase", val: `${gameState.phase || 1}`, color: "#3498db", sym: "▸" },
    ];
    return (
        <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: "0.62rem", letterSpacing: ".35em", textTransform: "uppercase", color: "rgba(245,200,66,.3)", marginBottom: 10 }}>// Case Stats</div>
            {rows.map(r => (
                <div key={r.label} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: 6,
                    background: "rgba(255,255,255,.03)",
                    border: "1px solid rgba(255,255,255,.06)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "0.85rem", color: r.color, lineHeight: 1, opacity: .8 }}>{r.sym}</span>
                        <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: "0.85rem", color: "rgba(196,184,154,.55)" }}>{r.label}</span>
                    </div>
                    <span style={{ fontFamily: "'Special Elite',cursive", fontSize: "1.15rem", color: r.color, letterSpacing: ".05em" }}>{r.val}</span>
                </div>
            ))}
        </div>
    );
}

function PanelProgress({ score, progressData, thoughtIdx, blinkOn }) {
    const label = progressData?.label || scoreLabel(score);
    const col = scoreColor(score);
    return (
        <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Score */}
            <div>
                <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: "0.62rem", letterSpacing: ".35em", textTransform: "uppercase", color: "rgba(245,200,66,.3)", marginBottom: 10 }}>// Investigation Progress</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Special Elite',cursive", fontSize: "1rem", letterSpacing: ".18em", color: col, textTransform: "uppercase" }}>{label}</span>
                    <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: "0.92rem", color: col }}>{score}pts</span>
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,.05)", borderRadius: 4, overflow: "hidden" }}>
                    <motion.div
                        animate={{ width: `${Math.min(score * 2, 100)}%` }}
                        transition={{ duration: .9, ease: "easeOut" }}
                        style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg,${col}66,${col})`, boxShadow: `0 0 10px ${col}55` }}
                    />
                </div>
                {progressData?.flavor_text && (
                    <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: "0.77rem", color: "rgba(196,184,154,.4)", marginTop: 7, fontStyle: "italic" }}>
                        {progressData.flavor_text}
                    </div>
                )}
            </div>

            {/* Detective thought */}
            <div style={{ borderLeft: "2px solid rgba(245,200,66,.2)", paddingLeft: 12 }}>
                <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: "0.62rem", letterSpacing: ".35em", textTransform: "uppercase", color: "rgba(245,200,66,.3)", marginBottom: 8 }}>// Detective's Thoughts</div>
                <AnimatePresence mode="wait">
                    <motion.div key={thoughtIdx}
                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
                        transition={{ duration: .3 }}
                        style={{ fontFamily: "'Special Elite',cursive", fontSize: "1rem", lineHeight: 1.6, color: "rgba(220,200,160,.85)", fontStyle: "italic" }}>
                        "{THOUGHTS[thoughtIdx]}"
                        <span style={{ opacity: blinkOn ? 1 : 0, color: "#f5c842", marginLeft: 1 }}>_</span>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

function PanelSuspects({ suspicions }) {
    const sorted = Object.entries(suspicions).sort(([, a], [, b]) => b.suspicion - a.suspicion);
    return (
        <div style={{ padding: "20px 18px" }}>
            <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: "0.62rem", letterSpacing: ".35em", textTransform: "uppercase", color: "rgba(245,200,66,.3)", marginBottom: 14 }}>// Suspicion Index</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {sorted.map(([id, c]) => (
                    <div key={id}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: "0.92rem", color: "rgba(196,184,154,.65)" }}>{c.name}</span>
                            <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: "0.92rem", color: c.accent, fontWeight: 700 }}>{c.suspicion}%</span>
                        </div>
                        <div style={{ height: 4, background: "rgba(255,255,255,.05)", borderRadius: 2, overflow: "hidden" }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${c.suspicion}%` }}
                                transition={{ delay: .3, duration: 1.1, ease: "easeOut" }}
                                style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg,${c.accent}55,${c.accent})` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PanelNotes({ notes, setNotes }) {
    return (
        <div style={{ padding: "20px 18px", height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: "0.62rem", letterSpacing: ".35em", textTransform: "uppercase", color: "rgba(245,200,66,.3)", marginBottom: 10 }}>// Detective Notes</div>
            <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Jot down observations, leads, suspicions…"
                style={{
                    flex: 1, resize: "none", outline: "none",
                    background: "rgba(245,230,180,.04)",
                    border: "1px solid rgba(245,200,66,.12)",
                    borderRadius: 6, padding: "10px 12px",
                    fontFamily: "'Courier Prime',monospace",
                    fontSize: "0.92rem", lineHeight: 1.75,
                    color: "rgba(220,200,160,.8)",
                    cursor: "text",
                    minHeight: 220,
                }}
            />
            <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: "0.69rem", color: "rgba(196,184,154,.2)", marginTop: 8, textAlign: "right" }}>
                {notes.length} chars
            </div>
        </div>
    );
}

// ── Main HUD component ─────────────────────────────────────────────────────────



export default function DetectiveHUD() {
    const navigate = useNavigate();
    const { sessionId } = useSession();
    const { progressData } = useProgress();

    const [gender, setGender] = useState(() => localStorage.getItem("detective_gender") || "male");
    const toggleGender = () => {
        const n = gender === "male" ? "female" : "male";
        setGender(n); localStorage.setItem("detective_gender", n);
    };
    const avatarSrc = gender === "female" ? detectiveFemaleImg : detectiveMaleImg;

    const [gameState, setGameState] = useState({ phase: 1, progress_score: 0 });
    const [contradictionCount, setCCount] = useState(0);
    const [suspicions, setSuspicions] = useState(SUSPICION_BASE);
    const [thoughtIdx, setThoughtIdx] = useState(0);
    const [blinkOn, setBlinkOn] = useState(true);
    const [notes, setNotes] = useState("");
    const [activeTab, setActiveTab] = useState(null); // null = drawer closed
    const seenRef = useRef(new Set());

    // Rotating thought + blink
    useEffect(() => {
        const t = setInterval(() => setThoughtIdx(i => (i + 1) % THOUGHTS.length), 3800);
        const b = setInterval(() => setBlinkOn(v => !v), 500);
        return () => { clearInterval(t); clearInterval(b); };
    }, []);

    // GET /game-state/:id  (poll every 5s)
    useEffect(() => {
        if (!sessionId) return;
        const poll = async () => {
            try {
                const r = await fetch(`${API_BASE}/game-state/${sessionId}`);
                if (r.ok) {
                    const d = await r.json();
                    setGameState(prev => ({ ...prev, ...d }));
                    // Bump suspicion for characters with contradictions
                    const contradicted = new Set((d.found_contradictions || []).flatMap(c => c.characters || []));
                    if (contradicted.size > 0) {
                        setSuspicions(prev => {
                            const n = { ...prev };
                            for (const k of Object.keys(n)) {
                                if (contradicted.has(k)) n[k] = { ...n[k], suspicion: Math.min(100, n[k].suspicion + 15) };
                            }
                            return n;
                        });
                    }
                }
            } catch { }
        };
        poll();
        const iv = setInterval(poll, 5000);
        return () => clearInterval(iv);
    }, [sessionId]);

    // GET /contradictions/:id  (poll every 4s)
    useEffect(() => {
        if (!sessionId) return;
        const poll = async () => {
            try {
                const r = await fetch(`${API_BASE}/contradictions/${sessionId}`);
                if (!r.ok) return;
                const data = await r.json();
                const list = Array.isArray(data) ? data : data.contradictions || [];
                for (const item of list) {
                    if (!seenRef.current.has(item.contradiction_id)) {
                        seenRef.current.add(item.contradiction_id);
                        setCCount(c => c + 1);
                    }
                }
            } catch { }
        };
        poll();
        const iv = setInterval(poll, 4000);
        return () => clearInterval(iv);
    }, [sessionId]);

    const score = progressData?.score ?? gameState.progress_score ?? 0;

    const handleTabClick = (id) => {
        if (id === "dossier") { navigate("/dossier"); return; }
        setActiveTab(prev => prev === id ? null : id);
    };

    // Close drawer on Escape
    useEffect(() => {
        const h = (e) => { if (e.key === "Escape") setActiveTab(null); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, []);

    return (
        <>
            <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Special+Elite&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');

            * { cursor: crosshair !important; box-sizing: border-box; }

            /* ── Icon Rail ── */
            .hud-rail {
                position: fixed;
                left: 0; top: 0; bottom: 0;
                width: ${RAIL_W}px;
                z-index: 900;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 12px 0 16px;
                gap: 2px;
                background: #07050a;
                border-right: 1px solid rgba(245,200,66,0.09);
                box-shadow: 3px 0 30px rgba(0,0,0,0.8);
            }
            /* scanlines on rail */
            .hud-rail::after {
                content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
                background:repeating-linear-gradient(to bottom,transparent 0px,transparent 3px,rgba(0,0,0,.08) 3px,rgba(0,0,0,.08) 4px);
            }

            /* ── Rail logo ── */
            .rail-logo {
                font-family: 'Playfair Display', serif;
                font-size: 1.15rem;
                font-weight: 900;
                font-style: italic;
                color: #f5c842;
                text-shadow: 0 0 12px rgba(245,200,66,.4);
                line-height: 1;
                margin-bottom: 6px;
                position: relative; z-index: 1;
            }

            /* ── Tab buttons — icon + label stacked ── */
            .rail-tab {
                position: relative; z-index: 1;
                width: 70px;
                padding: 7px 2px 6px;
                border-radius: 7px;
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                gap: 4px;
                border: none; outline: none;
                cursor: crosshair !important;
                transition: background .15s, box-shadow .15s;
                background: transparent;
                overflow: hidden;
            }
            .rail-tab:hover {
                background: rgba(245,200,66,.07);
            }
            .rail-tab.active {
                background: rgba(245,200,66,.13);
                box-shadow: 0 0 0 1px rgba(245,200,66,.22), inset 0 1px 0 rgba(245,200,66,.08);
            }
            .rail-tab svg {
                display: block;
                opacity: 0.42;
                transition: opacity .15s, color .15s;
            }
            .rail-tab:hover svg,
            .rail-tab.active svg {
                opacity: 0.9;
            }
            .rail-tab-label {
                font-family: 'Courier Prime', monospace;
                font-size: 0.52rem;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                color: rgba(196,184,154,0.35);
                transition: color .15s;
                line-height: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: clip;
                max-width: 64px;
            }
            .rail-tab:hover .rail-tab-label,
            .rail-tab.active .rail-tab-label {
                color: rgba(245,200,66,0.8);
            }
            .rail-tab.active svg {
                color: #f5c842;
            }
            .rail-tab-dot {
                width: 4px; height: 4px; border-radius: 50%;
                background: #e74c3c;
                box-shadow: 0 0 4px rgba(231,76,60,.8);
                animation: hpulse 1.8s ease-in-out infinite;
            }

            /* ── Slide-out Drawer ── */
            .hud-drawer {
                position: fixed;
                left: ${RAIL_W}px; top: 0; bottom: 0;
                width: ${DRAWER_W}px;
                z-index: 850;
                background: linear-gradient(180deg,#08060d 0%,#090711 100%);
                border-right: 1px solid rgba(245,200,66,.1);
                box-shadow: 6px 0 40px rgba(0,0,0,.85);
                display: flex; flex-direction: column;
                overflow: hidden;
            }
            /* scanlines on drawer */
            .hud-drawer::after {
                content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
                background:repeating-linear-gradient(to bottom,transparent 0px,transparent 3px,rgba(0,0,0,.07) 3px,rgba(0,0,0,.07) 4px);
            }

            .drawer-header {
                display: flex; align-items: center; justify-content: space-between;
                padding: 14px 18px 12px;
                border-bottom: 1px solid rgba(245,200,66,.08);
                flex-shrink: 0;
                position: relative; z-index: 1;
            }
            .drawer-title {
                font-family: 'Special Elite', cursive;
                font-size: 0.85rem; letter-spacing: .25em;
                text-transform: uppercase;
                color: rgba(245,200,66,.55);
            }
            .drawer-close {
                width: 26px; height: 26px;
                border-radius: 4px; border: 1px solid rgba(255,255,255,.1);
                background: transparent; color: rgba(196,184,154,.4);
                font-size: 1rem; cursor: crosshair !important;
                display: flex; align-items: center; justify-content: center;
                transition: all .15s;
            }
            .drawer-close:hover { background: rgba(255,255,255,.06); color: rgba(196,184,154,.8); }

            .drawer-body {
                flex: 1;
                overflow-y: auto;
                position: relative; z-index: 1;
            }
            .drawer-body::-webkit-scrollbar { width: 3px; }
            .drawer-body::-webkit-scrollbar-track { background: transparent; }
            .drawer-body::-webkit-scrollbar-thumb { background: rgba(245,200,66,.18); border-radius: 2px; }

            /* Backdrop when drawer is open */
            .hud-backdrop {
                position: fixed;
                inset: 0;
                left: ${RAIL_W + DRAWER_W}px;
                z-index: 840;
                background: transparent;
            }

            @keyframes hpulse {
                0%,100%{opacity:1;transform:scale(1)}
                50%{opacity:.5;transform:scale(.85)}
            }

            /* Score dot on rail when there's progress */
            .rail-score-dot {
                position: absolute;
                top: 6px; right: 6px;
                width: 6px; height: 6px;
                border-radius: 50%;
            }
        `}</style>

            {/* ══ ICON RAIL ══ */}
            <div className="hud-rail">
                {/* Logo */}
                <div className="rail-logo">PD</div>

                {/* Avatar thumbnail */}
                <div style={{
                    width: 34, height: 34, borderRadius: 6, overflow: "hidden",
                    border: "1px solid rgba(245,200,66,.3)",
                    background: "#0a0810", flexShrink: 0,
                    marginBottom: 8, position: "relative", zIndex: 1,
                }}>
                    <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
                </div>

                {/* Tab buttons */}
                {TABS.map(tab => (
                    <button key={tab.id}
                        className={`rail-tab${activeTab === tab.id ? " active" : ""}`}
                        onClick={() => handleTabClick(tab.id)}
                        title={tab.label}
                        style={{ color: activeTab === tab.id ? "#f5c842" : "rgba(196,184,154,0.6)" }}>
                        {tab.icon}
                        <span className="rail-tab-label">{tab.label}</span>
                        {tab.id === "stats" && contradictionCount > 0 && (
                            <div style={{ position: "absolute", top: 5, right: 5, width: 5, height: 5, borderRadius: "50%", background: "#e74c3c", boxShadow: "0 0 4px rgba(231,76,60,.9)", animation: "hpulse 1.8s ease-in-out infinite" }} />
                        )}
                    </button>
                ))}

                {/* Divider */}
                <div style={{ width: 28, height: 1, background: "rgba(245,200,66,.1)", margin: "8px 0", position: "relative", zIndex: 1 }} />

                {/* Live indicator at bottom */}
                <div style={{
                    position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    position: "relative", zIndex: 1, marginTop: "auto",
                }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#c0392b", boxShadow: "0 0 5px rgba(192,57,43,.9)", animation: "hpulse 1.8s ease-in-out infinite" }} />
                </div>
            </div>

            {/* ══ SLIDE-OUT DRAWER ══ */}
            <AnimatePresence>
                {activeTab && (
                    <>
                        {/* Invisible backdrop to close on outside click */}
                        <div className="hud-backdrop" onClick={() => setActiveTab(null)} />

                        <motion.div
                            className="hud-drawer"
                            initial={{ x: -DRAWER_W, opacity: .5 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -DRAWER_W, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 340, damping: 34 }}>

                            {/* Drawer header */}
                            <div className="drawer-header">
                                <span className="drawer-title">
                                    {TABS.find(t => t.id === activeTab)?.label}
                                </span>
                                <button className="drawer-close" onClick={() => setActiveTab(null)}>✕</button>
                            </div>

                            {/* Scrollable body */}
                            <div className="drawer-body">
                                <AnimatePresence mode="wait">
                                    <motion.div key={activeTab}
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        transition={{ duration: .18 }}>
                                        {activeTab === "identity" && <PanelIdentity gender={gender} toggleGender={toggleGender} avatarSrc={avatarSrc} />}
                                        {activeTab === "stats" && <PanelStats gameState={gameState} contradictionCount={contradictionCount} />}
                                        {activeTab === "progress" && <PanelProgress score={score} progressData={progressData} thoughtIdx={thoughtIdx} blinkOn={blinkOn} />}
                                        {activeTab === "suspects" && <PanelSuspects suspicions={suspicions} />}
                                        {activeTab === "notes" && <PanelNotes notes={notes} setNotes={setNotes} />}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}