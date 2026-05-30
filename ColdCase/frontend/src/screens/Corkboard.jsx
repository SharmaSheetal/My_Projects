import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import ContradictionAlert from "../components/ContradictionAlert";
import ProgressMeter from "../components/ProgressMeter";
import { useProgress } from "../context/ProgressContext";
import HintButton from "../components/HintButton";
import HintCard from "../components/HintCard";
import { CHARACTER_DATA } from "../data/characters";
import DetectiveHUD from "../components/DetectiveHUD";

const API_BASE = "http://127.0.0.1:8000";
const HUD_W = "var(--hud-width, 64px)";
const CARD_W = 148;
const CARD_H = 210;

const CHARS = {
    julian: { x: 620, y: 28, name: "Julian Byte", role: "Star Judge", accent: "#e74c3c", shadow: "#ff000055", trait: "VICTIM", suspicion: 0 },
    victor: { x: 190, y: 190, name: "Victor Vale", role: "Founder", accent: "#e67e22", shadow: "#ff880055", trait: "SUSPECT", suspicion: 72 },
    martha: { x: 1040, y: 190, name: "Martha Keen", role: "Ops Lead", accent: "#9b59b6", shadow: "#aa00ff55", trait: "SUSPECT", suspicion: 58 },
    rose: { x: 350, y: 530, name: "Rose Voss", role: "VIP Coordinator", accent: "#1abc9c", shadow: "#00ffaa44", trait: "WITNESS", suspicion: 34 },
    hayes: { x: 980, y: 560, name: "Det. Hayes", role: "Investigator", accent: "#3498db", shadow: "#0088ff44", trait: "ALLY", suspicion: 12 },
    dr_collins: { x: 645, y: 650, name: "Dr. Collins", role: "Medical Staff", accent: "#2ecc71", shadow: "#00ff0044", trait: "WITNESS", suspicion: 20 },
};

const RELATIONSHIPS = [
    { id: "victor-julian", from: "victor", to: "julian", label: "gave drink" },
    { id: "martha-julian", from: "martha", to: "julian", label: "inhaler" },
    { id: "rose-julian", from: "rose", to: "julian", label: "VIP kit" },
    { id: "victor-martha", from: "victor", to: "martha", label: "lounge access" },
    { id: "hayes-julian", from: "hayes", to: "julian", label: "investigates" },
    { id: "hayes-victor", from: "hayes", to: "victor", label: "investigates" },
    { id: "hayes-martha", from: "hayes", to: "martha", label: "investigates" },
    { id: "hayes-rose", from: "hayes", to: "rose", label: "investigates" },
];

const TRAIT_COLORS = { VICTIM: "#e74c3c", SUSPECT: "#e67e22", WITNESS: "#f5c842", ALLY: "#3498db" };

// Characters that cannot be interrogated — victim is dead
const NON_INTERROG = new Set(["julian"]);
const LOCK_REASON = { julian: "Deceased — cannot be questioned" };

function cardCenter(key) {
    const c = CHARS[key];
    return { x: c.x + CARD_W / 2, y: c.y + CARD_H / 2 };
}
function curveOffset(from, to, i) {
    const dx = to.x - from.x, dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const perp = { x: -dy / len, y: dx / len };
    const mag = (i % 3 - 1) * 26;
    return { mx: (from.x + to.x) / 2 + perp.x * mag, my: (from.y + to.y) / 2 + perp.y * mag };
}

// ── 3D Tilt Card ──────────────────────────────────────────────────────────────
function Card3D({ id, onOpenInterview, isContradicted, isQuestioned }) {
    const ref = useRef(null);
    const char = CHARS[id];
    const characterData = CHARACTER_DATA?.[id];
    const isLocked = NON_INTERROG.has(id);
    const [hovered, setHovered] = useState(false);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [shine, setShine] = useState({ x: 50, y: 50 });

    const handleMouseMove = (e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const cx = (e.clientX - rect.left) / rect.width;
        const cy = (e.clientY - rect.top) / rect.height;
        setTilt({ x: (cy - 0.5) * 28, y: (cx - 0.5) * -28 });
        setShine({ x: cx * 100, y: cy * 100 });
    };
    const handleMouseLeave = () => {
        setHovered(false);
        setTilt({ x: 0, y: 0 });
        setShine({ x: 50, y: 50 });
    };

    const baseRot = (id.charCodeAt(0) % 7) - 3;

    return (
        <div style={{ position: "absolute", left: char.x, top: char.y, width: CARD_W, height: CARD_H, perspective: "700px", zIndex: hovered ? 20 : 3 }}>
            <motion.button
                ref={ref}
                onClick={() => !isLocked && onOpenInterview(id)}
                onMouseMove={isLocked ? undefined : handleMouseMove}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={handleMouseLeave}
                animate={{
                    rotateX: (!isLocked && hovered) ? tilt.x : 0,
                    rotateY: (!isLocked && hovered) ? tilt.y : 0,
                    rotateZ: hovered ? 0 : baseRot,
                    scale: (!isLocked && hovered) ? 1.12 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{ width: "100%", height: "100%", transformStyle: "preserve-3d", cursor: isLocked ? "not-allowed" : "crosshair", background: "transparent", border: "none", padding: 0, outline: "none", position: "relative" }}
            >
                <div style={{
                    position: "absolute", inset: 0, borderRadius: 9,
                    background: "linear-gradient(160deg,#fef9ee 0%,#f0dfc0 55%,#e4cfaa 100%)",
                    border: isContradicted ? "1.5px solid rgba(255,50,50,0.8)" : `1.5px solid rgba(255,255,255,0.15)`,
                    boxShadow: isContradicted
                        ? `0 0 0 2px #ff3333, 0 20px 50px rgba(255,0,0,0.3), 0 0 80px rgba(255,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.6)`
                        : hovered
                            ? `0 30px 60px rgba(0,0,0,0.7), 0 0 0 1px ${char.accent}55, 0 0 30px ${char.shadow}, inset 0 1px 0 rgba(255,255,255,0.6)`
                            : `0 8px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.45)`,
                    transition: "box-shadow 0.25s, border-color 0.25s",
                }}>
                    <div style={{
                        position: "absolute", inset: 0, borderRadius: 9, overflow: "hidden"
                    }}>
                        {/* Paper lines */}
                        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "repeating-linear-gradient(transparent,transparent 20px,rgba(100,60,20,0.07) 20px,rgba(100,60,20,0.07) 21px)" }} />
                        <div style={{ position: "absolute", left: 40, top: 0, bottom: 0, width: 1, background: "rgba(192,57,43,0.18)", pointerEvents: "none" }} />
                        {/* Shine */}
                        <div style={{ position: "absolute", inset: 0, borderRadius: 9, pointerEvents: "none", background: `radial-gradient(circle at ${shine.x}% ${shine.y}%,rgba(255,255,255,0.28) 0%,rgba(255,255,255,0.05) 40%,transparent 65%)`, opacity: hovered ? 1 : 0, transition: "opacity 0.2s", zIndex: 10 }} />
                        {/* Accent strip */}
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: `linear-gradient(90deg,${char.accent},${char.accent}88)`, zIndex: 2 }} />
                        {/* Pushpin */}
                        <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", zIndex: 20, filter: `drop-shadow(0 3px 5px rgba(0,0,0,0.7)) drop-shadow(0 0 8px ${char.accent}88)` }}>
                            <svg width="22" height="28" viewBox="0 0 22 28">
                                <defs><radialGradient id={`pin-${id}`} cx="38%" cy="32%"><stop offset="0%" stopColor="rgba(255,255,255,0.7)" /><stop offset="100%" stopColor={char.accent} /></radialGradient></defs>
                                <circle cx="11" cy="10" r="9" fill={`url(#pin-${id})`} />
                                <circle cx="8" cy="7" r="3" fill="rgba(255,255,255,0.35)" />
                                <rect x="9.5" y="18" width="3" height="10" rx="1.5" fill="#777" />
                                <ellipse cx="11" cy="10" rx="9" ry="9" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
                            </svg>
                        </div>
                        {/* Content */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px 25px", gap: 16, height: "100%", position: "relative", zIndex: 3 }}>
                            {/* Avatar orb */}
                            <div style={{ position: "relative", width: 118, height: 153 }}>
                                <motion.div
                                    animate={isContradicted ? { scale: [1, 1.5, 1], opacity: [0.9, 0, 0.9] } : hovered ? { scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] } : { scale: 1, opacity: 0 }}
                                    transition={{ duration: isContradicted ? 0.9 : 2, repeat: Infinity }}
                                    style={{ position: "absolute", inset: -8, borderRadius: "50%", border: `2px solid ${isContradicted ? "#ff3333" : char.accent}`, pointerEvents: "none" }}
                                />
                                <motion.div
                                    animate={hovered ? { scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] } : {}}
                                    transition={{ duration: 2.2, repeat: Infinity, delay: 0.3 }}
                                    style={{ position: "absolute", inset: -14, borderRadius: "50%", border: `1px solid ${char.accent}44`, pointerEvents: "none" }}
                                />
                                <div style={{ width: 118, height: 153, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${char.accent}`, boxShadow: `0 0 0 3px rgba(0,0,0,0.5),0 0 20px ${char.shadow},inset 0 -8px 20px rgba(0,0,0,0.6),inset 0 4px 10px rgba(255,255,255,0.15)`, background: "#111", position: "relative" }}>
                                    {characterData?.image
                                        ? <img src={characterData.image} alt={char.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                        : <div style={{ width: "100%", height: "100%", background: `radial-gradient(circle at 40% 35%,${char.accent}cc,${char.accent}22)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>🕵️</div>
                                    }
                                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", pointerEvents: "none", background: "linear-gradient(135deg,rgba(255,255,255,0.25) 0%,transparent 45%,rgba(0,0,0,0.3) 100%)" }} />
                                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(to top,rgba(0,0,0,0.5),transparent)", borderRadius: "0 0 50% 50%", pointerEvents: "none" }} />
                                </div>
                                <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", width: 93, height: 20, background: "radial-gradient(ellipse,rgba(0,0,0,0.4) 0%,transparent 70%)", pointerEvents: "none" }} />
                            </div>
                            {/* Trait */}
                            <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.2em", color: TRAIT_COLORS[char.trait] || "#f5c842", border: `1px solid ${TRAIT_COLORS[char.trait] || "#f5c842"}55`, padding: "5px 16px", borderRadius: 2, background: `${TRAIT_COLORS[char.trait] || "#f5c842"}11`, textTransform: "uppercase" }}>
                                {char.trait}
                            </div>
                            {/* Name */}
                            <div style={{ textAlign: "center", lineHeight: 1.2 }}>
                                <div style={{ fontFamily: "'Special Elite',cursive", fontSize: "clamp(12px, 1.1vw, 15px)", fontWeight: 700, color: "#1a0e04", letterSpacing: "0.06em", textTransform: "uppercase" }}>{char.name}</div>
                                <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: "clamp(12px, 1.1vw, 15px)", color: "#7a5c3a", marginTop: 2 }}>{char.role}</div>
                            </div>
                            {/* Suspicion bar */}
                            {char.suspicion > 0 && (
                                <div style={{ width: "100%", paddingTop: 2 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Courier Prime',monospace", fontSize: "clamp(12px, 1.1vw, 15px)", color: "rgba(120,80,30,0.6)", letterSpacing: "0.1em", marginBottom: 3 }}>
                                        <span>SUSPICION</span><span style={{ color: char.accent }}>{char.suspicion}%</span>
                                    </div>
                                    <div style={{ height: 6, background: "rgba(0,0,0,0.15)", borderRadius: 2, overflow: "hidden" }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${char.suspicion}%` }} transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                                            style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg,${char.accent}88,${char.accent})`, boxShadow: `0 0 6px ${char.accent}88` }} />
                                    </div>
                                </div>
                            )}
                            {/* Hover CTA — hidden on locked cards */}
                            {!isLocked && (
                                <motion.div animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 4 }} transition={{ duration: 0.15 }}
                                    style={{ fontFamily: "'Courier Prime',monospace", fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.18em", color: char.accent, textTransform: "uppercase", borderTop: `1px solid ${char.accent}33`, paddingTop: 5, width: "100%", textAlign: "center", marginTop: "auto" }}>
                                    ▶ Interrogate
                                </motion.div>
                            )}
                            {isContradicted && <div style={{ position: "absolute", top: 20, right: 16, width: 14, height: 19, borderRadius: "50%", background: "#ff3333", boxShadow: "0 0 8px rgba(255,50,50,0.9)", animation: "c-pulse 0.9s ease-in-out infinite" }} />}
                            {isQuestioned && !isContradicted && <div style={{ position: "absolute", top: 20, right: 16, width: 19, height: 19, borderRadius: "50%", background: "#1abc9c", boxShadow: "0 0 8px rgba(26,188,156,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: "clamp(12px, 1.1vw, 15px)", color: "#fff", fontWeight: 700 }}>✓</div>}

                            {/* ── LOCKED overlay (victim / detective) ── */}
                            {isLocked && (
                                <>
                                    {/* Dark desaturated wash */}
                                    <div style={{ position: "absolute", inset: 0, borderRadius: 9, background: "rgba(0,0,0,0.42)", backdropFilter: "grayscale(0.7)", zIndex: 12, pointerEvents: "none" }} />
                                    {/* Lock icon centred */}
                                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 13, pointerEvents: "none", paddingBottom: 20 }}>
                                        <div style={{ fontSize: "clamp(24px, 2.2vw, 36px)", opacity: .55, filter: "drop-shadow(0 2px 6px rgba(0,0,0,.7))" }}>🔒</div>
                                    </div>
                                    {/* Name-tag ribbon at bottom */}
                                    <div style={{
                                        position: "absolute", bottom: 0, left: 0, right: 0,
                                        background: `linear-gradient(90deg,${char.accent}dd,${char.accent}99)`,
                                        padding: "6px 10px 8px",
                                        borderRadius: "0 0 8px 8px",
                                        zIndex: 14, pointerEvents: "none",
                                        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                                    }}>
                                        <span style={{ fontFamily: "'Special Elite',cursive", fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: ".22em", color: "rgba(0,0,0,.75)", textTransform: "uppercase", fontWeight: 700 }}>
                                            {char.trait === "VICTIM" ? "✝ Victim" : "🔍 Detective"}
                                        </span>
                                        <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: "clamp(12px, 1.1vw, 15px)", color: "rgba(0,0,0,.55)", letterSpacing: ".08em", textAlign: "center", lineHeight: 1.3 }}>
                                            {LOCK_REASON[id]}
                                        </span>
                                    </div>
                                </>
                            )}
                            <div style={{ position: "absolute", bottom: -8, right: -4, width: 36, height: 42, background: "linear-gradient(225deg,#c8b07a 50%,transparent 50%)", borderRadius: "0 0 16px 0", pointerEvents: "none", zIndex: isLocked ? 15 : 1 }} />
                        </div>
                        {/* End overflow container */}
                    </div> {/* This is the missing closing div for the card's main outer container */}

                    {/* Highly visible hover name tooltip */}
                    <AnimatePresence>
                        {hovered && (
                            <motion.div
                                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                style={{
                                    position: "absolute",
                                    bottom: -60,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    background: "rgba(10,8,14,0.95)",
                                    backdropFilter: "blur(8px)",
                                    border: `1.5px solid ${char.accent}`,
                                    boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${char.shadow}`,
                                    borderRadius: 8,
                                    padding: "8px 24px",
                                    whiteSpace: "nowrap",
                                    zIndex: 100,
                                    pointerEvents: "none", // Let mouse events pass to card
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 2
                                }}
                            >
                                <span style={{ fontFamily: "'Special Elite',cursive", fontSize: "clamp(18px, 1.8vw, 24px)", color: "#ffffff", letterSpacing: "0.08em", textTransform: "uppercase" }}>{char.name}</span>
                                <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: "clamp(12px, 1.1vw, 15px)", color: char.accent, letterSpacing: "0.1em" }}>{char.role}</span>
                                {/* Pointer arrow */}
                                <div style={{ position: "absolute", top: -7, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 12, height: 12, background: "rgba(10,8,14,0.95)", borderTop: `1.5px solid ${char.accent}`, borderLeft: `1.5px solid ${char.accent}` }} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.button>
        </div>
    );
}

// ── Scrolling police tape ─────────────────────────────────────────────────────
function TapeBanner() {
    const [off, setOff] = useState(0);
    useEffect(() => {
        let raf, o = 0;
        const tick = () => { o = (o + 0.5) % 300; setOff(o); raf = requestAnimationFrame(tick); };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);
    return (
        <div style={{ overflow: "hidden", height: 48, background: "#f5e642" }}>
            <div style={{ whiteSpace: "nowrap", height: "100%", display: "flex", alignItems: "center", fontFamily: "'Special Elite',cursive", fontSize: "clamp(12px, 1.1vw, 15px)", fontWeight: 700, letterSpacing: "0.22em", color: "#0a0a0a", boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.18)" }}>
                <span style={{ display: "inline-block", transform: `translateX(-${off}px)`, whiteSpace: "nowrap" }}>
                    {"POLICE LINE • DO NOT CROSS • ACTIVE INVESTIGATION • ".repeat(18)}
                </span>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Corkboard() {
    const boardRef = useRef(null);   // the .wood frame
    const wrapRef = useRef(null);   // the outer scroll wrapper
    const [boardScale, setBoardScale] = useState(1);

    // Board natural dimensions (fixed layout)
    const BOARD_NATURAL_W = 1420;
    const BOARD_NATURAL_H = 992 + 130 + 48 + 60; // cork(992) + header(~130) + tape(48) + padding(60)

    // Scale board to fill available viewport — uses ResizeObserver so it fires
    // after the DOM has fully painted, not before
    useEffect(() => {
        if (!wrapRef.current) return;
        const calc = () => {
            const w = wrapRef.current.clientWidth - 66;
            const h = wrapRef.current.clientHeight - 80; // leave room for lamp above board
            const scaleW = w / BOARD_NATURAL_W;
            const scaleH = h / BOARD_NATURAL_H;
            setBoardScale(Math.min(scaleW, scaleH, 0.98));
        };
        calc();
        const ro = new ResizeObserver(calc);
        ro.observe(wrapRef.current);
        return () => ro.disconnect();
    }, []);
    const navigate = useNavigate();
    const { sessionId } = useSession();
    const { setProgressData } = useProgress();

    const [activeContradictionIds, setActiveContradictionIds] = useState([]);
    const [latestContradiction, setLatestContradiction] = useState(null);
    const [contradictionCount, setContradictionCount] = useState(0);
    const [gameState, setGameState] = useState({ phase: 1, progress_score: 0 });

    const seenRef = useRef(new Set());
    const alertTO = useRef(null);

    const contradictedChars = useMemo(() => {
        const s = new Set();
        activeContradictionIds.forEach(id => { const [a, b] = id.split("-"); s.add(a); s.add(b); });
        return s;
    }, [activeContradictionIds]);

    const relsWithCoords = useMemo(() => RELATIONSHIPS.map((item, i) => {
        const from = cardCenter(item.from), to = cardCenter(item.to);
        const { mx, my } = curveOffset(from, to, i);
        return { ...item, x1: from.x, y1: from.y, x2: to.x, y2: to.y, mx, my };
    }), []);

    const progressLabel = useMemo(() => {
        const s = gameState.progress_score ?? 0;
        if (s < 10) return "Cold Trail";
        if (s < 20) return "Something's Off";
        if (s < 35) return "Threads Connecting";
        if (s < 50) return "Truth Closing In";
        return "Breakthrough";
    }, [gameState.progress_score]);

    useEffect(() => {
        if (!sessionId) return;
        fetch(`${API_BASE}/game-state/${sessionId}`).then(r => r.ok ? r.json() : null).then(d => d && setGameState(p => ({ ...p, ...d }))).catch(() => { });
    }, [sessionId]);

    useEffect(() => {
        if (!sessionId) return;
        const poll = async () => {
            try {
                const r = await fetch(`${API_BASE}/contradictions/${sessionId}`);
                if (!r.ok) return;
                const data = await r.json();
                const list = Array.isArray(data) ? data : data.contradictions || [];
                let newest = null; const nextActive = [];
                for (const item of list) {
                    if (!seenRef.current.has(item.contradiction_id)) { seenRef.current.add(item.contradiction_id); newest = item; setContradictionCount(c => c + 1); }
                    if (Array.isArray(item.characters) && item.characters.length >= 2) { const [a, b] = item.characters; nextActive.push(`${a}-${b}`, `${b}-${a}`); }
                }
                if (newest) {
                    setLatestContradiction(newest); setActiveContradictionIds(nextActive);
                    if (alertTO.current) clearTimeout(alertTO.current);
                    alertTO.current = setTimeout(() => setActiveContradictionIds([]), 3500);
                }
            } catch { }
        };
        poll(); const iv = setInterval(poll, 3000);
        return () => { clearInterval(iv); if (alertTO.current) clearTimeout(alertTO.current); };
    }, [sessionId]);

    const openInterview = id => navigate(`/interview/${id}`);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Special+Elite&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
                * { cursor: crosshair !important; }
                @keyframes c-pulse{0%,100%{box-shadow:0 0 6px rgba(255,50,50,0.8);transform:scale(1);}50%{box-shadow:0 0 16px rgba(255,50,50,1);transform:scale(1.35);}}
                @keyframes shimmer{0%,100%{opacity:0.6;}50%{opacity:0.9;}}
                @keyframes lamp-flicker{0%,90%,100%{opacity:1;}91%{opacity:0.5;}93%{opacity:0.9;}95%{opacity:0.4;}97%{opacity:1;}}
                .cork{background-color:#5c3a21;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0.5'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)' opacity='0.5'/%3E%3C/svg%3E"),repeating-linear-gradient(18deg,rgba(255,255,255,0.014) 0,rgba(255,255,255,0.014) 1px,transparent 1px,transparent 8px),repeating-linear-gradient(108deg,rgba(0,0,0,0.03) 0,rgba(0,0,0,0.03) 1px,transparent 1px,transparent 10px);background-size:80px 80px,10px 10px,14px 14px;position:relative;}
                .cork::before{content:'';position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 100px rgba(0,0,0,0.8),inset 0 0 30px rgba(0,0,0,0.5);}
                .cork::after{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:1300px;height:400px;pointer-events:none;background:radial-gradient(ellipse,rgba(245,200,66,0.12) 0%,transparent 68%);animation:lamp-flicker 9s ease-in-out infinite;}
                .wood{background:linear-gradient(180deg,#16100c 0%,#0a0705 100%);border-radius:12px;padding:3px;box-shadow:0 0 0 1px rgba(245,200,66,0.15),0 0 0 4px #0a0705,0 40px 100px rgba(0,0,0,0.95),inset 0 1px 1px rgba(255,255,255,0.05);position:relative;}
                .wood::before{content:'';position:absolute;inset:0;border-radius:12px;pointer-events:none;background:repeating-linear-gradient(91deg,transparent 0,transparent 7px,rgba(255,255,255,0.015) 7px,rgba(255,255,255,0.015) 8px);}
                .bolt{position:absolute;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#a09580,#362e22);box-shadow:0 2px 6px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.4);border:1px solid #111;z-index:5;}
                .debug-btn{font-family:'Courier Prime',monospace;font-size: clamp(12px, 1.1vw, 15px);letter-spacing:0.12em;color:rgba(220,200,160,0.38);background:transparent;border:1px solid rgba(220,200,160,0.1);padding:5px 10px;cursor:crosshair!important;transition:all 0.2s;}
                .debug-btn:hover{color:rgba(220,200,160,0.7);border-color:rgba(220,200,160,0.3);}
                .accuse-btn{font-family:'Special Elite',cursive;font-size: clamp(12px, 1.1vw, 15px);letter-spacing:0.25em;text-transform:uppercase;color:#ff9999;background:rgba(192,57,43,0.18);border:1px solid rgba(192,57,43,0.55);padding:10px 24px;cursor:crosshair!important;transition:all 0.2s;clip-path:polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px));}
                .accuse-btn:hover{background:rgba(192,57,43,0.38);color:#ffbbbb;box-shadow:0 0 22px rgba(192,57,43,0.35);}
                /* Overlay widgets top-right */
                .overlay-widgets{position:fixed;top:16px;right:20px;z-index:9000;display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none;}
                .overlay-widgets>*{pointer-events:auto;}
            `}</style>

            {/* Film grain */}
            <div style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none", opacity: 0.045, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "180px" }} />
            {/* Vignette */}
            <div style={{ position: "fixed", inset: 0, zIndex: 9997, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 50%,transparent 42%,rgba(0,0,0,0.75) 100%)" }} />

            {/* Shared HUD */}
            <DetectiveHUD />

            {/* Main content offset by HUD */}
            <div ref={wrapRef} style={{
                marginLeft: "var(--hud-width, 64px)",
                height: "100vh",
                background: "radial-gradient(ellipse at 55% 12%,rgba(90,45,10,0.4) 0%,#060402 65%)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "20px 33px",
                overflow: "hidden",
                gap: 0,
            }}>
                {/* Lamp */}
                <div style={{ width: 3, height: 121, background: "linear-gradient(to bottom,rgba(245,200,66,0.22),rgba(245,200,66,0.05))", zIndex: 2, position: "relative", marginBottom: -2 }} />
                <div style={{ width: 279, height: 45, background: "linear-gradient(180deg,#2c1c06,#1a0e04)", borderRadius: "0 0 60% 60%", border: "1px solid rgba(245,200,66,0.2)", zIndex: 2, position: "relative", boxShadow: "0 6px 40px rgba(245,200,66,0.18)", marginBottom: 2 }} />

                <div className="wood" style={{
                    width: "100%", maxWidth: 1420,
                    transformOrigin: "center center",
                    transform: `scale(${boardScale})`,
                    transition: "transform 0.3s ease",
                    flexShrink: 0,
                }}>
                    {[{ top: 14, left: 14 }, { top: 14, right: 11 }, { bottom: 14, left: 14 }, { bottom: 14, right: 11 }].map((s, i) => (
                        <div key={i} className="bolt" style={s} />
                    ))}

                    {/* Header */}
                    <div style={{ background: "linear-gradient(90deg,rgba(10,8,14,0.85),rgba(20,16,24,0.65) 50%,rgba(10,8,14,0.85))", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(245,200,66,0.2)", padding: "20px 45px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "9px 9px 0 0", position: "relative", zIndex: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(12px, 1.1vw, 15px)", fontWeight: 900, fontStyle: "italic", color: "#f5c842", textShadow: "0 0 20px rgba(245,200,66,0.5)" }}>Case #0001 — Investigation Board</div>
                            <span style={{ fontFamily: "'Special Elite',cursive", fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.2em", color: "rgba(245,200,66,0.8)", border: "1px solid rgba(245,200,66,0.3)", padding: "6px 20px", borderRadius: 4, textTransform: "uppercase", background: "rgba(245,200,66,0.05)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}>
                                Phase {gameState.phase || 1}
                            </span>
                            <span style={{ fontFamily: "'Special Elite',cursive", fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.15em", color: "rgba(245,200,66,0.45)", textTransform: "uppercase" }}>
                                {(gameState.questioned_characters || []).length}/5 interviewed
                            </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "'Special Elite',cursive", fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.15em", color: "#f5c842", textTransform: "uppercase", filter: "drop-shadow(0 0 10px rgba(245,200,66,0.2))" }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#e74c3c", boxShadow: "0 0 12px rgba(231,76,60,0.9)", animation: "c-pulse 2s ease-in-out infinite" }} />
                            {progressLabel}
                        </div>
                    </div>

                    <TapeBanner />

                    {/* Cork */}
                    <div className="cork" style={{ position: "relative", height: 992, overflow: "hidden" }}>
                        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2, overflow: "visible" }}>
                            <defs>
                                <filter id="red-glow">
                                    <feGaussianBlur stdDeviation="4" result="b" />
                                    <feFlood floodColor="#ff2020" floodOpacity="0.9" result="c" />
                                    <feComposite in="c" in2="b" operator="in" result="g" />
                                    <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
                                </filter>
                            </defs>
                            {relsWithCoords.map((line, i) => {
                                const isA = activeContradictionIds.includes(line.id);
                                if (isA) return (
                                    <g key={line.id}>
                                        <motion.path d={`M${line.x1} ${line.y1} Q${line.mx} ${line.my} ${line.x2} ${line.y2}`} fill="none" stroke="#ff2020" strokeWidth="3" strokeLinecap="round" filter="url(#red-glow)" animate={{ opacity: [0.7, 1, 0.7], strokeWidth: [3, 5, 3] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }} />
                                        <rect x={line.mx - 26} y={line.my - 10} width={52} height={16} rx={2} fill="rgba(180,20,20,0.8)" />
                                        <text x={line.mx} y={line.my + 3} textAnchor="middle" style={{ fontFamily: "'Courier Prime',monospace", fontSize: "clamp(12px, 1.1vw, 15px)", fill: "#ffaaaa", letterSpacing: "0.05em" }}>{line.label}</text>
                                    </g>
                                );
                                return (
                                    <g key={line.id}>
                                        <path d={`M${line.x1} ${line.y1} Q${line.mx} ${line.my} ${line.x2} ${line.y2}`} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2.5" strokeLinecap="round" transform="translate(1,2)" />
                                        <path d={`M${line.x1} ${line.y1} Q${line.mx} ${line.my} ${line.x2} ${line.y2}`} fill="none" stroke="#c8966a" strokeWidth="1.7" strokeLinecap="round" style={{ animation: `shimmer ${3 + i * 0.45}s ease-in-out infinite`, opacity: 0.7 }} />
                                        <rect x={line.mx - 25} y={line.my - 9} width={50} height={14} rx={2} fill="rgba(14,8,2,0.72)" stroke="rgba(200,150,90,0.18)" strokeWidth={0.5} />
                                        <text x={line.mx} y={line.my + 2} textAnchor="middle" style={{ fontFamily: "'Courier Prime',monospace", fontSize: "clamp(12px, 1.1vw, 15px)", fill: "rgba(205,175,125,0.75)", letterSpacing: "0.05em" }}>{line.label}</text>
                                    </g>
                                );
                            })}
                        </svg>

                        <div style={{ position: "absolute", inset: 0, zIndex: 3 }}>
                            {Object.keys(CHARS).map(id => (
                                <Card3D key={id} id={id} onOpenInterview={openInterview} isContradicted={contradictedChars.has(id)} isQuestioned={(gameState.questioned_characters || []).includes(id)} />
                            ))}
                        </div>

                        {!sessionId && (
                            <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", fontFamily: "'Courier Prime',monospace", fontSize: "clamp(12px, 1.1vw, 15px)", color: "#ff8888", background: "rgba(0,0,0,0.88)", border: "1px solid rgba(192,57,43,0.4)", padding: "25px 40px", letterSpacing: "0.08em", zIndex: 20 }}>
                                ⚠ No session found. Return to opening scene.
                            </div>
                        )}

                        <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>
                            <div style={{ pointerEvents: "auto" }}>
                                <ProgressMeter hasContradictionAlert={!!latestContradiction} />
                            </div>
                        </div>
                    </div>

                    {/* Action bar */}
                    <div style={{ background: "linear-gradient(90deg,rgba(10,8,14,0.85),rgba(20,16,24,0.65) 50%,rgba(10,8,14,0.85))", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(245,200,66,0.2)", padding: "16px 36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0 0 9px 9px", position: "relative", zIndex: 6 }}>
                        <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: "clamp(12px, 1.1vw, 15px)", color: "rgba(196,184,154,0.35)", letterSpacing: "0.3em", textTransform: "uppercase" }}>Hackathon PD — Det. File</span>
                    </div>
                </div>

                <div style={{ width: "75%", maxWidth: 950, height: 48, background: "radial-gradient(ellipse,rgba(0,0,0,0.65) 0%,transparent 72%)", marginTop: 0 }} />
            </div>

            {/* ── BOTTOM NAVIGATION BAR ── fixed, outside scaled board ── */}
            <div style={{
                position: "fixed", bottom: 0, left: "var(--hud-width,64px)", right: 0,
                height: 58, zIndex: 800,
                background: "linear-gradient(180deg,rgba(5,4,10,0) 0%,rgba(5,4,10,0.97) 30%)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 32px 0 28px",
                borderTop: "1px solid rgba(245,200,66,0.07)",
                pointerEvents: "none", // let the background be click-through
            }}>
                {/* Left: case label */}
                <span style={{
                    fontFamily: "'Courier Prime',monospace",
                    fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.28em",
                    color: "rgba(196,184,154,0.2)", textTransform: "uppercase",
                    pointerEvents: "none",
                }}>
                    Case #0001
                </span>

                {/* Centre: nav buttons */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    pointerEvents: "auto",
                }}>
                    {/* Evidence button — always available */}
                    <motion.button
                        whileHover={{ scale: 1.04, backgroundColor: "rgba(245,200,66,0.14)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate("/evidence")}
                        style={{
                            display: "flex", alignItems: "center", gap: 9,
                            background: "rgba(245,200,66,0.07)",
                            border: "1px solid rgba(245,200,66,0.28)",
                            borderRadius: 5, padding: "8px 20px",
                            fontFamily: "'Special Elite',cursive",
                            fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.22em",
                            textTransform: "uppercase", color: "rgba(245,200,66,0.75)",
                            cursor: "crosshair", transition: "background 0.15s",
                        }}
                    >
                        {/* evidence / folder icon */}
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                        Evidence Board
                    </motion.button>

                    {/* Divider pip */}
                    <div style={{ width: 1, height: 22, background: "rgba(245,200,66,0.12)" }} />

                    {/* Accusation button — conditional */}
                    <motion.button
                        whileHover={(gameState.available_endings?.length > 0 || gameState.phase >= 2)
                            ? { scale: 1.04, backgroundColor: "rgba(192,57,43,0.32)" }
                            : {}}
                        whileTap={(gameState.available_endings?.length > 0 || gameState.phase >= 2)
                            ? { scale: 0.97 } : {}}
                        onClick={() => {
                            if (gameState.available_endings?.length > 0 || gameState.phase >= 2)
                                navigate("/accuse");
                        }}
                        style={{
                            display: "flex", alignItems: "center", gap: 9,
                            background: (gameState.available_endings?.length > 0 || gameState.phase >= 2)
                                ? "rgba(192,57,43,0.2)"
                                : "rgba(255,255,255,0.03)",
                            border: (gameState.available_endings?.length > 0 || gameState.phase >= 2)
                                ? "1px solid rgba(192,57,43,0.55)"
                                : "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 5, padding: "8px 20px",
                            fontFamily: "'Special Elite',cursive",
                            fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: (gameState.available_endings?.length > 0 || gameState.phase >= 2)
                                ? "rgba(255,150,130,0.9)"
                                : "rgba(196,184,154,0.2)",
                            cursor: (gameState.available_endings?.length > 0 || gameState.phase >= 2)
                                ? "crosshair" : "not-allowed",
                            transition: "background 0.15s, color 0.15s",
                            position: "relative",
                        }}
                    >
                        {/* gavel / accusation icon */}
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 16l10-10M8 4l4 4-6 6-4-4 6-6zM14 10l2 2-6 6-2-2" />
                        </svg>
                        Make Accusation
                        {/* locked tooltip */}
                        {!(gameState.available_endings?.length > 0 || gameState.phase >= 2) && (
                            <span style={{
                                position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
                                transform: "translateX(-50%)", whiteSpace: "nowrap",
                                background: "rgba(10,8,16,0.96)", border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 4, padding: "4px 10px",
                                fontFamily: "'Courier Prime',monospace", fontSize: "clamp(12px, 1.1vw, 15px)",
                                color: "rgba(196,184,154,0.5)", letterSpacing: "0.08em",
                                opacity: 0, pointerEvents: "none",
                                transition: "opacity 0.15s",
                            }}
                                className="accuse-locked-tip"
                            >
                                Gather more evidence first
                            </span>
                        )}
                    </motion.button>
                </div>

                {/* Right: phase indicator */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 7,
                    pointerEvents: "none",
                }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#c0392b", boxShadow: "0 0 5px rgba(192,57,43,.8)", animation: "c-pulse 2s ease-in-out infinite" }} />
                    <span style={{ fontFamily: "'Special Elite',cursive", fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.22em", color: "rgba(245,200,66,0.35)", textTransform: "uppercase" }}>
                        Phase {gameState.phase || 1}
                    </span>
                </div>
            </div>

            {/* Tooltip hover CSS for locked accusation */}
            <style>{`
                .accuse-locked-tip { opacity: 0 !important; }
                button:hover .accuse-locked-tip { opacity: 1 !important; }
            `}</style>

            {/* Overlay widgets — top right, above HUD */}
            <div className="overlay-widgets">
                <HintButton />
                <HintCard />
                <ContradictionAlert contradictionEvent={latestContradiction} onDismiss={() => setLatestContradiction(null)} />
            </div>
        </>
    );
}