/**
 * CharacterDossier.jsx
 * ────────────────────────────────────────────────────────────────
 * Cinematic dossier slideshow shown after OpeningScene, before /board.
 * Each slide: full-bleed character portrait + torn-paper evidence card.
 *
 * Route:  /dossier
 * Flow:   OpeningScene → /dossier → /board
 *
 * Add to your router:
 *   <Route path="/dossier" element={<CharacterDossier />} />
 *
 * From OpeningScene, navigate to /dossier instead of /board after session start.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CHARACTER_DATA } from "../data/characters";

// ── Character dossier content ────────────────────────────────────────────────
const DOSSIER = [
    {
        id: "julian",
        name: "Julian Byte",
        role: "Star Judge — Hackathon Circuit",
        trait: "VICTIM",
        traitColor: "#e74c3c",
        accent: "#e74c3c",
        bgGrad: "radial-gradient(ellipse at 30% 40%, rgba(192,57,43,0.22) 0%, transparent 65%)",
        age: "34",
        status: "DECEASED — 2:07 AM",
        quote: "\"This demo will either make history or end someone's career.\"",
        bio: "Serial hackathon judge and tech-circuit celebrity. Known for brutal public takedowns of weak demos. Julian had more enemies than admirers — and most of them were in the room that night.",
        known_for: "Savage judging, cold brew addiction, the infamous 2022 MIT teardown",
        last_seen: "Judges' lounge, 1:58 AM. Alone.",
        threat_level: "—",
        file_no: "VIC-001",
    },
    {
        id: "victor",
        name: "Victor Vale",
        role: "Founder — CascadeAI",
        trait: "SUSPECT",
        traitColor: "#e67e22",
        accent: "#e67e22",
        bgGrad: "radial-gradient(ellipse at 70% 35%, rgba(230,126,34,0.2) 0%, transparent 65%)",
        age: "41",
        status: "PRESENT — Unaccounted 1:45–2:10 AM",
        quote: "\"I didn't go near the lounge after six. I was on stage the whole time.\"",
        bio: "Founder of CascadeAI, the event's lead sponsor. His demo was competing for the same prize Julian was judging. Charming in public. Reportedly furious in private after Julian trashed his last product.",
        known_for: "CascadeAI Series B, a grudge two years in the making",
        last_seen: "Sponsor booth, then — gap in record.",
        threat_level: "HIGH",
        file_no: "SUS-001",
    },
    {
        id: "martha",
        name: "Martha Keen",
        role: "Operations Lead — Event Staff",
        trait: "SUSPECT",
        traitColor: "#9b59b6",
        accent: "#9b59b6",
        bgGrad: "radial-gradient(ellipse at 25% 55%, rgba(155,89,182,0.2) 0%, transparent 65%)",
        age: "38",
        status: "PRESENT — Conflicting alibi",
        quote: "\"I prepped the lounge at 10 PM and didn't touch anything after that. Ask anyone.\"",
        bio: "Fifteen-year events veteran. She controls every room, every schedule, every key. Access to the lounge was through her — and she knew Julian's schedule down to the minute.",
        known_for: "Flawless logistics, an obsessive control streak, something personal with Julian",
        last_seen: "Backstage corridor, 1:52 AM. Disputed.",
        threat_level: "MEDIUM-HIGH",
        file_no: "SUS-002",
    },
    {
        id: "rose",
        name: "Rose Voss",
        role: "VIP Coordinator",
        trait: "WITNESS",
        traitColor: "#1abc9c",
        accent: "#1abc9c",
        bgGrad: "radial-gradient(ellipse at 65% 60%, rgba(26,188,156,0.18) 0%, transparent 65%)",
        age: "27",
        status: "PRESENT — Partial alibi",
        quote: "\"I put together the VIP welcome kit myself. Everything in it was standard issue.\"",
        bio: "First big gig in events. Rose was responsible for Julian's VIP kit — the sealed bag found beside the body. Eager to please, possibly covering for someone. Or herself.",
        known_for: "Meticulous kit curation, proximity to every key player that night",
        last_seen: "VIP corridor, 2:01 AM.",
        threat_level: "LOW-MEDIUM",
        file_no: "WIT-001",
    },
    {
        id: "dr_collins",
        name: "Dr. Arthur Collins",
        role: "Guest Judge — Medical & Ethics Board",
        trait: "WITNESS",
        traitColor: "#27ae60",
        accent: "#27ae60",
        bgGrad: "radial-gradient(ellipse at 40% 45%, rgba(39,174,96,0.18) 0%, transparent 65%)",
        age: "58",
        status: "PRESENT — Alibi partially verified",
        quote: "“I had hoped tonight would end with bad demos rather than a corpse.”",
        bio: "Retired cardiologist turned ethics consultant. Brought in as a specialist judge for the biotech track. Carries prescription digitalis for a heart condition — a vial that went missing at 11:30 PM. Calm under pressure. Possibly too calm.",
        known_for: "Medical expertise, meticulous habits, knowing exactly what killed Julian",
        last_seen: "Judges' lounge earlier, then judging hall. Vial unaccounted for.",
        threat_level: "UNKNOWN",
        file_no: "WIT-002",
    },
    {
        id: "hayes",
        name: "Det. Hayes",
        role: "Lead Investigator — On-site",
        trait: "ALLY",
        traitColor: "#3498db",
        accent: "#3498db",
        bgGrad: "radial-gradient(ellipse at 50% 30%, rgba(52,152,219,0.18) 0%, transparent 65%)",
        age: "49",
        status: "AUTHORISED — Your point of contact",
        quote: "\"I've seen a hundred of these scenes. Something here doesn't add up. I need your eyes.\"",
        bio: "Twenty-two years on the force. Hayes secured the scene and immediately flagged inconsistencies in the official account. He's the one who brought you in — and he's the one keeping the politics at bay while you work.",
        known_for: "Crime scene integrity, cutting through corporate obstruction",
        last_seen: "On scene from 2:14 AM.",
        threat_level: "NONE",
        file_no: "ALY-001",
    },
];

// ── Slide layout ─────────────────────────────────────────────────────────────

function DossierSlide({ data, direction }) {
    const charMeta = CHARACTER_DATA?.[data.id];

    const variants = {
        enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
    };

    return (
        <motion.div
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            style={{
                position: "absolute", inset: 0,
                display: "flex",
                background: "#08060e",
            }}
        >
            {/* ── Left: portrait ── */}
            <div style={{
                flex: "0 0 42%",
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Gradient background */}
                <div style={{ position: "absolute", inset: 0, background: data.bgGrad, zIndex: 0 }} />

                {/* Film-grain texture */}
                <div style={{
                    position: "absolute", inset: 0, zIndex: 1, opacity: 0.045, pointerEvents: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundSize: "160px",
                }} />

                {/* Portrait image or placeholder */}
                {charMeta?.image ? (
                    <motion.img
                        src={charMeta.image}
                        alt={data.name}
                        initial={{ scale: 1.08, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                        style={{
                            position: "absolute", inset: 0,
                            width: "100%", height: "100%",
                            objectFit: "cover", objectPosition: "center top",
                            display: "block", zIndex: 2,
                        }}
                    />
                ) : (
                    <div style={{
                        position: "absolute", inset: 0, zIndex: 2,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: `radial-gradient(circle at 40% 35%, ${data.accent}33, ${data.accent}08)`,
                        fontSize: "clamp(48px, 4.5vw, 72px)", opacity: 0.35,
                    }}>
                        {data.trait === "VICTIM" ? "🎓" : data.trait === "ALLY" ? "🔍" : "🕴"}
                    </div>
                )}

                {/* Bottom vignette */}
                <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", zIndex: 3,
                    background: "linear-gradient(to top, #08060e 0%, rgba(8,6,14,0.6) 50%, transparent 100%)",
                    pointerEvents: "none",
                }} />

                {/* Right edge fade into content panel */}
                <div style={{
                    position: "absolute", top: 0, right: 0, bottom: 0, width: 120, zIndex: 4,
                    background: "linear-gradient(to right, transparent, #08060e)",
                    pointerEvents: "none",
                }} />

                {/* File number stamp */}
                <div style={{
                    position: "absolute", top: 28, left: 28, zIndex: 10,
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.38em",
                    color: `${data.accent}88`,
                    textTransform: "uppercase",
                    border: `1px solid ${data.accent}33`,
                    padding: "4px 10px",
                    borderRadius: 2,
                    background: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(4px)",
                }}>
                    FILE #{data.file_no}
                </div>

                {/* Bottom-left: name on portrait */}
                <motion.div
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                    style={{
                        position: "absolute", bottom: 28, left: 28, right: 20, zIndex: 10,
                    }}
                >
                    <div style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "clamp(36px, 3.5vw, 52px)",
                        fontWeight: 900, fontStyle: "italic",
                        color: data.accent,
                        textShadow: `0 0 30px ${data.accent}55`,
                        lineHeight: 1.05,
                    }}>
                        {data.name}
                    </div>
                    <div style={{
                        fontFamily: "'Special Elite', cursive",
                        fontSize: "clamp(12px, 1.1vw, 15px)",
                        letterSpacing: "0.12em",
                        color: "rgba(196,184,154,0.55)",
                        marginTop: 5,
                        textTransform: "uppercase",
                    }}>
                        {data.role}
                    </div>
                </motion.div>
            </div>

            {/* ── Right: dossier card ── */}
            <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "40px 52px 40px 36px",
                overflowY: "auto",
                position: "relative",
            }}>

                {/* Trait stamp */}
                <motion.div
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 18,
                        alignSelf: "flex-start",
                    }}
                >
                    <div style={{
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: "clamp(12px, 1.1vw, 15px)",
                        letterSpacing: "0.4em",
                        textTransform: "uppercase",
                        color: data.traitColor,
                        border: `1.5px solid ${data.traitColor}55`,
                        padding: "5px 14px",
                        borderRadius: 2,
                        background: `${data.traitColor}12`,
                        boxShadow: `0 0 14px ${data.traitColor}22`,
                    }}>
                        {data.trait}
                    </div>
                    <div style={{
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: "clamp(12px, 1.1vw, 15px)",
                        letterSpacing: "0.2em",
                        color: "rgba(196,184,154,0.3)",
                        textTransform: "uppercase",
                    }}>
                        {data.status}
                    </div>
                </motion.div>

                {/* Divider */}
                <motion.div
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    style={{
                        height: 1,
                        background: `linear-gradient(90deg, ${data.accent}55, transparent)`,
                        marginBottom: 22,
                    }}
                />

                {/* Quote */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.45 }}
                    style={{
                        fontFamily: "'Special Elite', cursive",
                        fontSize: "clamp(18px, 1.6vw, 24px)",
                        lineHeight: 1.6,
                        color: "rgba(220,200,160,0.82)",
                        fontStyle: "italic",
                        borderLeft: `3px solid ${data.accent}55`,
                        paddingLeft: 16,
                        marginBottom: 28,
                    }}
                >
                    {data.quote}
                </motion.div>

                {/* Bio */}
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.45 }}
                    style={{
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: "clamp(15px, 1.3vw, 19px)",
                        lineHeight: 1.8,
                        color: "rgba(196,184,154,0.7)",
                        marginBottom: 28,
                    }}
                >
                    {data.bio}
                </motion.p>

                {/* Detail rows */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    style={{
                        display: "flex", flexDirection: "column", gap: 10,
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        paddingTop: 20,
                    }}
                >
                    {[
                        { label: "Known For", val: data.known_for },
                        { label: "Last Seen", val: data.last_seen },
                        { label: "Threat", val: data.threat_level },
                    ].map(row => (
                        <div key={row.label} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                            <span style={{
                                fontFamily: "'Courier Prime', monospace",
                                fontSize: "clamp(12px, 1.1vw, 15px)",
                                letterSpacing: "0.32em",
                                textTransform: "uppercase",
                                color: `${data.accent}88`,
                                flexShrink: 0,
                                width: 80,
                                paddingTop: 1,
                            }}>
                                {row.label}
                            </span>
                            <span style={{
                                fontFamily: "'Courier Prime', monospace",
                                fontSize: "clamp(12px, 1.1vw, 15px)",
                                color: "rgba(196,184,154,0.6)",
                                lineHeight: 1.5,
                            }}>
                                {row.val}
                            </span>
                        </div>
                    ))}
                </motion.div>

                {/* Redacted decoration */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{
                        marginTop: 24,
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: "clamp(12px, 1.1vw, 15px)",
                        letterSpacing: "0.22em",
                        color: "rgba(196,184,154,0.18)",
                        textTransform: "uppercase",
                    }}
                >
                    ████ CLASSIFIED — CASE #0001 — HACKATHON P.D. ████
                </motion.div>
            </div>
        </motion.div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CharacterDossier() {
    const navigate = useNavigate();
    const [idx, setIdx] = useState(0);
    const [direction, setDir] = useState(1);
    const [exiting, setExiting] = useState(false);

    const total = DOSSIER.length;

    const goTo = useCallback((next) => {
        if (next < 0 || next >= total) return;
        setDir(next > idx ? 1 : -1);
        setIdx(next);
    }, [idx, total]);

    const handlePrev = () => goTo(idx - 1);
    const handleNext = () => {
        if (idx < total - 1) goTo(idx + 1);
        else handleFinish();
    };

    const handleFinish = () => {
        setExiting(true);
        setTimeout(() => navigate("/board"), 500);
    };

    // Keyboard navigation
    useEffect(() => {
        const h = (e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") handleNext();
            else if (e.key === "ArrowLeft" || e.key === "ArrowUp") handlePrev();
            else if (e.key === "Escape") handleFinish();
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [idx]);

    const current = DOSSIER[idx];
    const isLast = idx === total - 1;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: exiting ? 0 : 1 }}
            transition={{ duration: 0.45 }}
            style={{
                position: "fixed", inset: 0,
                background: "#08060e",
                overflow: "hidden",
                fontFamily: "'Courier Prime', monospace",
            }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Special+Elite&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
                * { cursor: crosshair !important; box-sizing: border-box; }

                /* Scanlines */
                .dos-scanlines::after {
                    content: '';
                    position: fixed; inset: 0; pointer-events: none; z-index: 9999;
                    background: repeating-linear-gradient(
                        to bottom,
                        transparent 0px, transparent 3px,
                        rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px
                    );
                }
                /* Vignette */
                .dos-scanlines::before {
                    content: '';
                    position: fixed; inset: 0; pointer-events: none; z-index: 9998;
                    background: radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.65) 100%);
                }

                .nav-btn {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 5px;
                    color: rgba(196,184,154,0.6);
                    font-family: 'Special Elite', cursive;
                    font-size: clamp(12px, 1.1vw, 15px);
                    letter-spacing: 0.22em;
                    text-transform: uppercase;
                    padding: 9px 22px;
                    cursor: crosshair !important;
                    transition: all 0.18s;
                }
                .nav-btn:hover:not(:disabled) {
                    background: rgba(255,255,255,0.09);
                    color: rgba(196,184,154,0.95);
                    border-color: rgba(255,255,255,0.22);
                }
                .nav-btn:disabled { opacity: 0.22; }

                .next-btn {
                    font-family: 'Special Elite', cursive;
                    font-size: clamp(12px, 1.1vw, 15px);
                    letter-spacing: 0.22em;
                    text-transform: uppercase;
                    padding: 9px 26px;
                    border-radius: 5px;
                    cursor: crosshair !important;
                    transition: all 0.18s;
                }

                .dot-btn {
                    width: 8px; height: 8px;
                    border-radius: 50%;
                    border: none; padding: 0;
                    cursor: crosshair !important;
                    transition: all 0.2s;
                }
            `}</style>

            <div className="dos-scanlines" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9997 }} />

            {/* Slide area */}
            <div style={{ position: "absolute", inset: 0, bottom: 72 }}>
                <AnimatePresence custom={direction} mode="wait">
                    <DossierSlide
                        key={current.id}
                        data={current}
                        direction={direction}
                    />
                </AnimatePresence>
            </div>

            {/* ── Bottom bar ── */}
            <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 72,
                background: "rgba(5,4,10,0.97)",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 36px",
                zIndex: 100,
            }}>
                {/* Skip */}
                <button className="nav-btn" onClick={handleFinish}>
                    Skip Briefing ✕
                </button>

                {/* Dot indicators */}
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {DOSSIER.map((d, i) => (
                        <button
                            key={d.id}
                            className="dot-btn"
                            onClick={() => goTo(i)}
                            style={{
                                background: i === idx
                                    ? current.accent
                                    : "rgba(255,255,255,0.15)",
                                boxShadow: i === idx
                                    ? `0 0 8px ${current.accent}88`
                                    : "none",
                                transform: i === idx ? "scale(1.35)" : "scale(1)",
                            }}
                        />
                    ))}
                </div>

                {/* Prev / Next */}
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button
                        className="nav-btn"
                        onClick={handlePrev}
                        disabled={idx === 0}
                    >
                        ← Prev
                    </button>
                    <motion.button
                        className="next-btn"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleNext}
                        style={{
                            background: isLast
                                ? `linear-gradient(90deg, ${current.accent}cc, ${current.accent}88)`
                                : "rgba(245,200,66,0.1)",
                            border: isLast
                                ? `1px solid ${current.accent}`
                                : "1px solid rgba(245,200,66,0.3)",
                            color: isLast ? "#000" : "#f5c842",
                            boxShadow: isLast ? `0 0 20px ${current.accent}44` : "none",
                            fontWeight: isLast ? 700 : 400,
                        }}
                    >
                        {isLast ? "Begin Investigation →" : "Next →"}
                    </motion.button>
                </div>
            </div>

            {/* Slide counter */}
            <div style={{
                position: "absolute",
                bottom: 82,
                left: "50%",
                transform: "translateX(-50%)",
                fontFamily: "'Courier Prime', monospace",
                fontSize: "clamp(12px, 1.1vw, 15px)",
                letterSpacing: "0.35em",
                color: "rgba(196,184,154,0.25)",
                textTransform: "uppercase",
                zIndex: 101,
                pointerEvents: "none",
            }}>
                {idx + 1} / {total}
            </div>
        </motion.div>
    );
}