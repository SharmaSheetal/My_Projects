import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import evidenceData from "../../../data/evidence/evidence.json";
import { useSession } from "../context/SessionContext";
import { useProgress } from "../context/ProgressContext";
import HintButton from "../components/HintButton";
import HintCard from "../components/HintCard";
import ContradictionAlert from "../components/ContradictionAlert";
import ProgressMeter from "../components/ProgressMeter";
import DetectiveHUD from "../components/DetectiveHUD";

const API_BASE = "http://127.0.0.1:8000";

const evidenceItems = Array.isArray(evidenceData)
    ? evidenceData
    : evidenceData.evidence || [];

// Evidence type → SVG icon + color — no image/emoji dependencies
const EVIDENCE_META = {
    drink: { label: "Beverage", accent: "#e67e22", symbol: "B" },
    document: { label: "Document", accent: "#3498db", symbol: "D" },
    medical: { label: "Medical", accent: "#e74c3c", symbol: "M" },
    digital: { label: "Digital", accent: "#1abc9c", symbol: "G" },
    physical: { label: "Physical", accent: "#9b59b6", symbol: "P" },
    note: { label: "Note", accent: "#f5c842", symbol: "N" },
    default: { label: "Evidence", accent: "#f5c842", symbol: "E" },
};

function getEvidenceMeta(item) {
    const id = (item.id || item.type || "").toLowerCase();
    if (id.includes("drink") || id.includes("brew") || id.includes("coffee") || id.includes("energy")) return EVIDENCE_META.drink;
    if (id.includes("note") || id.includes("sticky") || id.includes("text")) return EVIDENCE_META.note;
    if (id.includes("inhaler") || id.includes("medic") || id.includes("digitalis") || id.includes("collins")) return EVIDENCE_META.medical;
    if (id.includes("camera") || id.includes("log") || id.includes("digital") || id.includes("reel")) return EVIDENCE_META.digital;
    if (id.includes("doc") || id.includes("file") || id.includes("report") || id.includes("sheet") || id.includes("score")) return EVIDENCE_META.document;
    if (id.includes("keycap") || id.includes("trophy") || id.includes("kit") || id.includes("inhaler")) return EVIDENCE_META.physical;
    // also check item.type field if available
    const t = (item.type || "").toLowerCase();
    if (EVIDENCE_META[t]) return EVIDENCE_META[t];
    return EVIDENCE_META.default;
}

// Pure SVG type icon — never shows images
function TypeIcon({ symbol, accent, size = 48 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
            <rect x="1" y="1" width="46" height="46" rx="6"
                fill={`${accent}12`} stroke={`${accent}40`} strokeWidth="1.5" />
            <rect x="4" y="4" width="40" height="40" rx="4"
                fill="none" stroke={`${accent}20`} strokeWidth="0.8" strokeDasharray="3,2" />
            <text x="24" y="32" textAnchor="middle"
                style={{ fontFamily: "'Special Elite',cursive", fontSize: 20, fontWeight: 700, fill: accent }}>
                {symbol}
            </text>
        </svg>
    );
}

function SpinnerSVG({ color = "#1abc9c" }) {
    return (
        <svg width="11" height="11" viewBox="0 0 12 12" style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}>
            <circle cx="6" cy="6" r="4.5" fill="none" stroke={`${color}33`} strokeWidth="1.5" />
            <path d="M6 1.5 A4.5 4.5 0 0 1 10.5 6" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

// ── Single evidence card ──────────────────────────────────────────────────────
function EvidenceCard({ item, unlocked, submitting, submitted, flashed, onSubmit }) {
    const meta = getEvidenceMeta(item);
    const accent = unlocked ? meta.accent : "rgba(255,255,255,0.12)";
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: "relative",
                borderRadius: 3,
                overflow: "hidden",
                border: flashed
                    ? "1px solid rgba(26,188,156,0.55)"
                    : `1px solid ${unlocked ? `${accent}30` : "rgba(255,255,255,0.06)"}`,
                background: unlocked
                    ? `linear-gradient(160deg, #0f0c09 0%, #0b0906 100%)`
                    : "linear-gradient(160deg, #0a0a0a 0%, #080808 100%)",
                boxShadow: hovered && unlocked
                    ? `0 6px 32px rgba(0,0,0,0.7), 0 0 0 1px ${accent}1a, 0 0 20px ${accent}0c`
                    : "0 3px 16px rgba(0,0,0,0.5)",
                transition: "box-shadow 0.22s, border-color 0.22s",
            }}
        >
            {/* Horizontal paper lines */}
            <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "repeating-linear-gradient(transparent,transparent 23px,rgba(255,255,255,0.013) 23px,rgba(255,255,255,0.013) 24px)",
            }} />
            {/* Left accent strip */}
            <div style={{
                position: "absolute", top: 0, bottom: 0, left: 0, width: 3,
                background: `linear-gradient(to bottom, ${accent}99, ${accent}22)`,
                opacity: unlocked ? 1 : 0.2,
            }} />
            {/* Top accent line */}
            <div style={{
                position: "absolute", top: 0, left: 3, right: 0, height: 1,
                background: `linear-gradient(90deg, ${accent}55, transparent 60%)`,
                opacity: unlocked ? 1 : 0.15,
            }} />
            {/* Corner fold */}
            <div style={{
                position: "absolute", top: 0, right: 0, width: 22, height: 28,
                background: `linear-gradient(225deg, ${unlocked ? accent : "rgba(255,255,255,0.08)"}22 50%, transparent 50%)`,
                pointerEvents: "none",
            }} />

            {/* Locked overlay */}
            <AnimatePresence>
                {!unlocked && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: "absolute", inset: 0, zIndex: 10,
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            background: "rgba(0,0,0,0.52)", backdropFilter: "blur(2px)",
                            borderRadius: 3, gap: 8,
                        }}
                    >
                        {/* Lock SVG — no emoji */}
                        <svg width="32" height="32" viewBox="0 0 32 32" style={{ opacity: 0.45 }}>
                            <rect x="7" y="14" width="18" height="13" rx="2" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" />
                            <path d="M10 14v-4a6 6 0 0 1 12 0v4" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" />
                            <circle cx="16" cy="20" r="2" fill="rgba(255,255,255,0.5)" />
                            <line x1="16" y1="22" x2="16" y2="24" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <div style={{
                            fontFamily: "'Special Elite',cursive",
                            fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase",
                            color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                            padding: "4px 14px", borderRadius: 2,
                        }}>
                            Classified
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ opacity: unlocked ? 1 : 0.3, padding: "18px 18px 16px 22px", position: "relative", zIndex: 1 }}>

                {/* ── Header row: icon | meta | badge ── */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    {/* Type icon */}
                    <TypeIcon symbol={meta.symbol} accent={accent} size={44} />

                    {/* Meta — label + ID, grows to fill */}
                    <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                        <div style={{
                            fontFamily: "'Courier Prime',monospace",
                            fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase",
                            color: `${accent}77`, marginBottom: 2,
                        }}>
                            {meta.label}
                        </div>
                        <div style={{
                            fontFamily: "'Courier Prime',monospace",
                            fontSize: 10, color: "rgba(196,184,154,0.28)",
                            letterSpacing: "0.1em",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                            #{(item.id || "").toUpperCase().slice(0, 16)}
                        </div>
                    </div>

                    {/* Submitted / Filed badge — right-aligned, never clips */}
                    {(submitted || flashed) && (
                        <div style={{
                            flexShrink: 0,
                            fontFamily: "'Courier Prime',monospace",
                            fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase",
                            color: "#1abc9c",
                            border: "1px solid rgba(26,188,156,0.35)",
                            background: "rgba(26,188,156,0.07)",
                            padding: "3px 8px", borderRadius: 2,
                            marginTop: 2,
                        }}>
                            Filed
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div style={{
                    height: 1,
                    background: `linear-gradient(90deg, ${accent}22, rgba(255,255,255,0.04) 55%, transparent)`,
                    marginBottom: 10,
                }} />

                {/* Evidence name */}
                <div style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "clamp(14px,1.2vw,18px)", fontWeight: 900, fontStyle: "italic",
                    color: unlocked ? (flashed ? "#1abc9c" : "#e8dcc8") : "rgba(255,255,255,0.2)",
                    lineHeight: 1.25, marginBottom: 7,
                }}>
                    {item.display_name || item.name}
                </div>

                {/* Description — compact */}
                <div style={{
                    fontFamily: "'Courier Prime',monospace",
                    fontSize: "clamp(11px,0.88vw,13px)", lineHeight: 1.65,
                    color: unlocked ? "rgba(196,184,154,0.68)" : "rgba(255,255,255,0.14)",
                    minHeight: 56,
                }}>
                    {item.description}
                </div>

                {/* Submit button */}
                {unlocked && (
                    <div style={{ marginTop: 12 }}>
                        <button
                            onClick={() => onSubmit(item.id)}
                            disabled={submitting || submitted}
                            style={{
                                fontFamily: "'Special Elite',cursive",
                                fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase",
                                color: (submitting || submitted) ? "rgba(26,188,156,0.4)" : "#1abc9c",
                                background: (submitting || submitted) ? "rgba(26,188,156,0.04)" : "rgba(26,188,156,0.07)",
                                border: `1px solid ${(submitting || submitted) ? "rgba(26,188,156,0.14)" : "rgba(26,188,156,0.3)"}`,
                                borderRadius: 2, padding: "8px 18px",
                                cursor: (submitting || submitted) ? "not-allowed" : "crosshair",
                                display: "inline-flex", alignItems: "center", gap: 8,
                                transition: "all 0.18s", width: "100%", justifyContent: "center",
                            }}
                            onMouseEnter={e => { if (!submitting && !submitted) e.currentTarget.style.background = "rgba(26,188,156,0.14)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = (submitting || submitted) ? "rgba(26,188,156,0.04)" : "rgba(26,188,156,0.07)"; }}
                        >
                            {submitting
                                ? <><SpinnerSVG /> Submitting…</>
                                : submitted
                                    ? <>Filed</>
                                    : <>Submit Evidence</>
                            }
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ── Scrolling tape banner ─────────────────────────────────────────────────────
function TapeBanner() {
    const [off, setOff] = useState(0);
    useEffect(() => {
        let raf, o = 0;
        const tick = () => { o = (o + 0.4) % 300; setOff(o); raf = requestAnimationFrame(tick); };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);
    return (
        <div style={{ overflow: "hidden", height: 36, background: "#f5e642", flexShrink: 0 }}>
            <div style={{
                whiteSpace: "nowrap", height: "100%",
                display: "flex", alignItems: "center",
                fontFamily: "'Special Elite',cursive",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", color: "#0a0a0a",
            }}>
                <span style={{ display: "inline-block", transform: `translateX(-${off}px)` }}>
                    {"EVIDENCE LOG • CASE #0001 • CLASSIFIED FILES • SUBMIT TO ADVANCE • ".repeat(18)}
                </span>
            </div>
        </div>
    );
}

// ── Phase badge ───────────────────────────────────────────────────────────────
function PhaseBadge({ phase }) {
    const colors = ["#3498db", "#f5c842", "#e67e22", "#e74c3c", "#9b59b6"];
    const c = colors[(phase - 1) % colors.length];
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: "'Courier Prime',monospace",
            fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase",
            color: c, border: `1px solid ${c}33`,
            background: `${c}0d`,
            padding: "7px 16px", borderRadius: 2,
        }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: c, boxShadow: `0 0 5px ${c}` }} />
            Phase {phase}
        </div>
    );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ total, unlocked }) {
    const pct = total > 0 ? (unlocked / total) * 100 : 0;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
                fontFamily: "'Courier Prime',monospace",
                fontSize: 11, letterSpacing: "0.2em",
                color: "rgba(196,184,154,0.38)", textTransform: "uppercase",
            }}>
                {unlocked}/{total} Unlocked
            </div>
            <div style={{ width: 120, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <motion.div
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg,#f5c84266,#f5c842)" }}
                />
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function EvidenceBoard() {
    const { sessionId, unlockedEvidence, setUnlockedEvidence, phase, setPhase,
        setQuestionedCharacters, setHintsUsed, setAvailableEndings } = useSession();
    const { setProgressData } = useProgress();

    const [submittingId, setSubmittingId] = useState(null);
    const [submittedMap, setSubmittedMap] = useState({});
    const [flashMap, setFlashMap] = useState({});
    const [latestContradiction, setLatestContradiction] = useState(null);
    const [error, setError] = useState("");
    const [filterUnlocked, setFilterUnlocked] = useState(false);

    const seenRef = useRef(new Set());
    const unlockedSet = useMemo(() => new Set(unlockedEvidence), [unlockedEvidence]);

    const displayedItems = filterUnlocked
        ? evidenceItems.filter(i => unlockedSet.has(i.id))
        : evidenceItems;

    useEffect(() => {
        if (!sessionId) return;
        const fetchGameState = async () => {
            try {
                const r = await fetch(`${API_BASE}/game-state/${sessionId}`);
                if (!r.ok) throw new Error("Failed to load game state");
                const d = await r.json();
                setUnlockedEvidence(d.unlocked_evidence || []);
                setPhase(d.phase || 1);
                if (d.questioned_characters) setQuestionedCharacters(d.questioned_characters);
                if (d.hints_used != null) setHintsUsed(d.hints_used);
                if (d.available_endings) setAvailableEndings(d.available_endings);
                (d.found_contradictions || []).forEach(item => {
                    if (item?.contradiction_id) seenRef.current.add(item.contradiction_id);
                });
            } catch (err) {
                setError(err.message || "Could not load evidence state.");
            }
        };
        fetchGameState();
    }, [sessionId, setPhase, setUnlockedEvidence, setQuestionedCharacters, setHintsUsed, setAvailableEndings]);

    const handleSubmitEvidence = async (evidenceId) => {
        if (!sessionId) return;
        setSubmittingId(evidenceId);
        setError("");
        try {
            const r = await fetch(`${API_BASE}/submit-evidence`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ evidence_id: evidenceId, session_id: sessionId }),
            });
            if (!r.ok) throw new Error("Failed to submit evidence");
            const d = await r.json();
            setUnlockedEvidence(d.unlocked_evidence || []);
            setPhase(d.phase || 1);
            if (d.questioned_characters) setQuestionedCharacters(d.questioned_characters);
            if (d.hints_used != null) setHintsUsed(d.hints_used);
            if (d.available_endings) setAvailableEndings(d.available_endings);
            setSubmittedMap(p => ({ ...p, [evidenceId]: true }));
            setFlashMap(p => ({ ...p, [evidenceId]: true }));
            setTimeout(() => setFlashMap(p => ({ ...p, [evidenceId]: false })), 900);
            let newest = null;
            (d.found_contradictions || []).forEach(item => {
                if (item?.contradiction_id && !seenRef.current.has(item.contradiction_id)) {
                    seenRef.current.add(item.contradiction_id);
                    newest = item;
                }
            });
            if (newest) setLatestContradiction(newest);
            if (d.progress?.show) setProgressData(d.progress);
        } catch (err) {
            setError(err.message || "Could not submit evidence.");
        } finally {
            setSubmittingId(null);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Special+Elite&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
                * { cursor: crosshair !important; }
                @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
                @keyframes lamp-flicker { 0%,90%,100%{opacity:1} 91%{opacity:0.5} 93%{opacity:0.9} 95%{opacity:0.4} 97%{opacity:1} }
                .eb-filter-btn {
                    font-family:'Special Elite',cursive;
                    font-size:11px;letter-spacing:0.2em;text-transform:uppercase;
                    padding:5px 13px;border-radius:2px;border:1px solid transparent;
                    transition:all 0.16s;cursor:crosshair!important;
                }
                .eb-filter-active  { color:#f5c842;background:rgba(245,200,66,0.09);border-color:rgba(245,200,66,0.32); }
                .eb-filter-inactive{ color:rgba(196,184,154,0.36);background:transparent;border-color:rgba(255,255,255,0.07); }
                .eb-filter-inactive:hover{ color:rgba(196,184,154,0.65);border-color:rgba(255,255,255,0.18); }
                .overlay-widgets{ position:fixed;top:16px;right:20px;z-index:9000;display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none; }
                .overlay-widgets>*{ pointer-events:auto; }
            `}</style>

            {/* Film grain */}
            <div style={{
                position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none", opacity: 0.038,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: "180px"
            }} />
            {/* Vignette */}
            <div style={{
                position: "fixed", inset: 0, zIndex: 9997, pointerEvents: "none",
                background: "radial-gradient(ellipse at 50% 18%,transparent 48%,rgba(0,0,0,0.62) 100%)"
            }} />

            <DetectiveHUD />

            <div style={{
                minHeight: "100vh",
                background: "linear-gradient(180deg,#0a0806 0%,#070605 100%)",
                marginLeft: "var(--hud-width,52px)",
                fontFamily: "'Courier Prime',monospace",
                color: "#e8dcc8",
                position: "relative",
            }}>

                {/* ── LAMP ── */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 14, position: "relative", zIndex: 2 }}>
                    <div style={{ width: 2, height: 70, background: "linear-gradient(to bottom,rgba(245,200,66,0.2),rgba(245,200,66,0.04))" }} />
                    <div style={{ width: 160, height: 28, background: "linear-gradient(180deg,#2c1c06,#1a0e04)", borderRadius: "0 0 50% 50%", border: "1px solid rgba(245,200,66,0.18)", boxShadow: "0 4px 28px rgba(245,200,66,0.14)", animation: "lamp-flicker 9s ease-in-out infinite" }} />
                </div>

                {/* ── HEADER ── */}
                <div style={{
                    position: "relative", zIndex: 3,
                    padding: "20px 52px 18px",
                    borderBottom: "1px solid rgba(245,200,66,0.07)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "linear-gradient(180deg,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.12) 100%)",
                }}>
                    <div>
                        <div style={{ fontFamily: "'Special Elite',cursive", fontSize: 10, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(245,200,66,0.42)", marginBottom: 4 }}>
                            ◈ Hackathon P.D. — Case Files
                        </div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(26px,2.8vw,40px)", fontWeight: 900, fontStyle: "italic", color: "#f5c842", textShadow: "0 0 28px rgba(245,200,66,0.28)", lineHeight: 1.05 }}>
                            Evidence Board
                        </div>
                        <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: 12, color: "rgba(196,184,154,0.4)", marginTop: 3, letterSpacing: "0.04em" }}>
                            Review case files and submit evidence to advance the investigation.
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <StatsBar total={evidenceItems.length} unlocked={unlockedSet.size} />
                        {sessionId && <PhaseBadge phase={phase} />}
                    </div>
                </div>

                <TapeBanner />

                {/* ── BODY ── */}
                <div style={{ padding: "28px 52px 80px", position: "relative", zIndex: 2 }}>

                    {/* Filter bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                        <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 10, letterSpacing: "0.2em", color: "rgba(196,184,154,0.28)", textTransform: "uppercase", marginRight: 4 }}>
                            Filter:
                        </span>
                        <button className={`eb-filter-btn ${!filterUnlocked ? "eb-filter-active" : "eb-filter-inactive"}`} onClick={() => setFilterUnlocked(false)}>
                            All ({evidenceItems.length})
                        </button>
                        <button className={`eb-filter-btn ${filterUnlocked ? "eb-filter-active" : "eb-filter-inactive"}`} onClick={() => setFilterUnlocked(true)}>
                            Unlocked ({unlockedSet.size})
                        </button>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                style={{ marginBottom: 14, padding: "12px 20px", borderRadius: 3, border: "1px solid rgba(231,76,60,0.3)", background: "rgba(231,76,60,0.06)", fontFamily: "'Courier Prime',monospace", fontSize: 12, color: "rgba(231,76,60,0.85)" }}>
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* No session */}
                    {!sessionId && (
                        <div style={{ padding: "60px 40px", textAlign: "center", border: "1px solid rgba(245,200,66,0.09)", background: "rgba(0,0,0,0.4)", borderRadius: 3, fontFamily: "'Courier Prime',monospace", fontSize: 13, color: "rgba(196,184,154,0.4)" }}>
                            No active session. Return to the opening scene to begin the investigation.
                        </div>
                    )}

                    {/* ── Card grid ── */}
                    <motion.div layout style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                        gap: 20,
                    }}>
                        <AnimatePresence>
                            {displayedItems.map((item, i) => (
                                <motion.div key={item.id} layout
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.035, type: "spring", stiffness: 260, damping: 26 }}>
                                    <EvidenceCard
                                        item={item}
                                        unlocked={unlockedSet.has(item.id)}
                                        submitting={submittingId === item.id}
                                        submitted={!!submittedMap[item.id]}
                                        flashed={!!flashMap[item.id]}
                                        onSubmit={handleSubmitEvidence}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {/* Empty filter state */}
                    {filterUnlocked && unlockedSet.size === 0 && (
                        <div style={{ padding: "80px 40px", textAlign: "center", fontFamily: "'Special Elite',cursive", fontSize: "clamp(16px,1.4vw,22px)", color: "rgba(196,184,154,0.28)", letterSpacing: "0.06em" }}>
                            No evidence unlocked yet. Interview suspects to uncover leads.
                        </div>
                    )}
                </div>
            </div>

            <div className="overlay-widgets">
                <HintButton />
                <HintCard />
                <ContradictionAlert contradictionEvent={latestContradiction} onDismiss={() => setLatestContradiction(null)} />
            </div>
            <ProgressMeter />
        </>
    );
}