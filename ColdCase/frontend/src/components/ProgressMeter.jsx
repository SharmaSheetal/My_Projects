import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useProgress } from "../context/ProgressContext";

const SCORE_THEMES = {
    cold: {
        text: "#60a5fa", bar: "#3b82f6",
        border: "rgba(96,165,250,0.3)", glow: "rgba(59,130,246,0.2)",
        bg: "linear-gradient(160deg, #060d1c 0%, #04091a 100%)",
        label: "Cold Trail", icon: "❄",
        barGradient: "linear-gradient(90deg, #1d4ed8, #3b82f6, #93c5fd)",
    },
    warm: {
        text: "#f5c842", bar: "#f5c842",
        border: "rgba(245,200,66,0.3)", glow: "rgba(245,200,66,0.18)",
        bg: "linear-gradient(160deg, #130f02 0%, #0f0c02 100%)",
        label: "Something's Off", icon: "⚠",
        barGradient: "linear-gradient(90deg, #92620a, #f5c842, #fef08a)",
    },
    hot: {
        text: "#f87171", bar: "#ef4444",
        border: "rgba(248,113,113,0.35)", glow: "rgba(239,68,68,0.2)",
        bg: "linear-gradient(160deg, #130505 0%, #100404 100%)",
        label: "Truth Closing In", icon: "🔥",
        barGradient: "linear-gradient(90deg, #991b1b, #ef4444, #fca5a5)",
    },
    breakthrough: {
        text: "#c084fc", bar: "#a855f7",
        border: "rgba(192,132,252,0.4)", glow: "rgba(168,85,247,0.25)",
        bg: "linear-gradient(160deg, #0f0518 0%, #0c0414 100%)",
        label: "Breakthrough", icon: "✦",
        barGradient: "linear-gradient(90deg, #6b21a8, #a855f7, #e9d5ff)",
    },
};

function getTheme(score, label = "") {
    const l = label.toLowerCase();
    if (l.includes("breakthrough") || score >= 50) return SCORE_THEMES.breakthrough;
    if (l.includes("truth") || l.includes("closing") || score >= 35) return SCORE_THEMES.hot;
    if (l.includes("cold")) return SCORE_THEMES.cold;
    return SCORE_THEMES.warm;
}

// Random position anywhere mid-screen (avoids HUD and edges)
function getRandomPosition() {
    // Keep away from left HUD (248px), right edge, top/bottom
    const minLeft = 268, maxLeft = window.innerWidth - 420;
    const minTop = 80, maxTop = window.innerHeight - 260;
    return {
        left: Math.floor(Math.random() * (maxLeft - minLeft) + minLeft),
        top: Math.floor(Math.random() * (maxTop - minTop) + minTop),
    };
}

export default function ProgressMeter() {
    const { progressData, setProgressData } = useProgress();
    const timeoutRef = useRef(null);
    const progressRef = useRef(null);
    const [drainPct, setDrainPct] = useState(100);
    const [position, setPosition] = useState({ left: 500, top: 300 });
    const DURATION = 5000;

    useEffect(() => {
        if (!progressData) return;

        // Pick a fresh random position each time it triggers
        setPosition(getRandomPosition());
        setDrainPct(100);

        const start = Date.now();
        progressRef.current = setInterval(() => {
            const pct = Math.max(0, 100 - ((Date.now() - start) / DURATION) * 100);
            setDrainPct(pct);
            if (pct <= 0) clearInterval(progressRef.current);
        }, 40);

        timeoutRef.current = setTimeout(() => setProgressData(null), DURATION);

        return () => {
            clearTimeout(timeoutRef.current);
            clearInterval(progressRef.current);
        };
    }, [progressData, setProgressData]);

    const handleDismiss = () => {
        clearTimeout(timeoutRef.current);
        clearInterval(progressRef.current);
        setProgressData(null);
    };

    const score = Math.max(0, Math.min(progressData?.score ?? 0, 100));
    const label = progressData?.label || "Cold Trail";
    const flavor = progressData?.flavor_text || "";
    const theme = getTheme(score, label);

    return (
        <>
            <style>{`
                @keyframes pm-sweep {
                    0%   { left: -40%; opacity: 0.7; }
                    100% { left: 110%;  opacity: 0;   }
                }
                @keyframes pm-glow-pulse {
                    0%,100%{ opacity: 0.5; transform: scaleX(0.95); }
                    50%    { opacity: 1;   transform: scaleX(1);     }
                }
                @keyframes pm-bar-shine {
                    0%   { left: -30%; opacity: 0; }
                    15%  { opacity: 0.6; }
                    100% { left: 110%; opacity: 0; }
                }
                @keyframes pm-stamp-in {
                    0%   { transform: rotate(-18deg) scale(1.6); opacity: 0; }
                    70%  { transform: rotate(3deg)  scale(0.96); opacity: 1; }
                    100% { transform: rotate(-2deg) scale(1);    opacity: 1; }
                }
                .pm-card {
                    position: fixed;
                    z-index: 9200;
                    width: 380px;
                    border-radius: 3px;
                    overflow: hidden;
                    cursor: crosshair !important;
                    text-align: left;
                    border-width: 1px;
                    border-style: solid;
                }
                /* Scanlines */
                .pm-card::after {
                    content: '';
                    position: absolute; inset: 0; pointer-events: none; z-index: 20;
                    background: repeating-linear-gradient(
                        to bottom, transparent 0, transparent 2px,
                        rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 3px
                    );
                }
                /* Light sweep */
                .pm-sweep {
                    position: absolute; top: 0; bottom: 0; width: 40%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
                    animation: pm-sweep 2s ease-in-out infinite 0.3s;
                    pointer-events: none; z-index: 5;
                }
                /* Bar progress fill: shine */
                .pm-bar-wrap {
                    position: relative; overflow: hidden; border-radius: 2px;
                    height: 6px; background: rgba(0,0,0,0.4);
                }
                .pm-bar-fill {
                    height: 100%; border-radius: 2px; position: relative; overflow: hidden;
                    transition: width 1s cubic-bezier(0.22, 1, 0.36, 1);
                }
                .pm-bar-fill::after {
                    content: '';
                    position: absolute; top: 0; bottom: 0; width: 30%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
                    animation: pm-bar-shine 1.8s ease-in-out infinite 0.6s;
                }
                /* Big label */
                .pm-big-label {
                    font-family: 'Playfair Display', serif;
                    font-weight: 900; font-style: italic;
                    font-size: clamp(36px, 3.5vw, 52px); line-height: 1.05;
                    letter-spacing: -0.01em;
                }
                /* Score stamp */
                .pm-stamp {
                    position: absolute; top: 14px; right: 16px;
                    display: flex; flex-direction: column; align-items: center;
                    animation: pm-stamp-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both 0.12s;
                    pointer-events: none; z-index: 10;
                }
                /* Drain bar */
                .pm-drain-track { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: rgba(0,0,0,0.3); }
                .pm-drain-fill  { height: 100%; transition: width 0.04s linear; }
                /* Corner brackets */
                .pm-corner { position: absolute; width: 12px; height: 12px; pointer-events: none; z-index: 15; }
                .pm-corner-tl { top:0; left:0;  border-top-width:1px; border-left-width:1px;  border-style:solid; }
                .pm-corner-tr { top:0; right:0; border-top-width:1px; border-right-width:1px; border-style:solid; }
            `}</style>

            <AnimatePresence>
                {progressData && (
                    <motion.div
                        key={progressData.score + label}
                        className="pm-card"
                        style={{
                            left: position.left,
                            top: position.top,
                            background: theme.bg,
                            borderColor: theme.border,
                            boxShadow: `0 0 0 1px rgba(0,0,0,0.5), 0 12px 60px rgba(0,0,0,0.85), 0 0 60px ${theme.glow}`,
                        }}
                        initial={{ scale: 0.78, opacity: 0, y: 24 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.82, opacity: 0, y: -16 }}
                        transition={{ type: "spring", stiffness: 320, damping: 26 }}
                        onClick={handleDismiss}
                    >
                        <div className="pm-sweep" />

                        {/* Corner brackets */}
                        <div className="pm-corner pm-corner-tl" style={{ borderColor: theme.border }} />
                        <div className="pm-corner pm-corner-tr" style={{ borderColor: theme.border }} />

                        {/* Score stamp — top right */}
                        <div className="pm-stamp">
                            <div style={{
                                fontFamily: "'Courier Prime', monospace",
                                fontSize: "clamp(24px, 2.2vw, 36px)", fontWeight: 700,
                                color: theme.text,
                                textShadow: `0 0 20px ${theme.glow}`,
                                lineHeight: 1,
                            }}>
                                {score}
                            </div>
                            <div style={{
                                fontFamily: "'Courier Prime', monospace",
                                fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.22em",
                                color: `${theme.text}88`, textTransform: "uppercase",
                                marginTop: 2,
                            }}>pts</div>
                        </div>

                        {/* Body */}
                        <div style={{ padding: "18px 16px 14px", position: "relative", zIndex: 2 }}>
                            {/* Icon + case tag */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                <div style={{
                                    fontFamily: "'Special Elite', cursive",
                                    fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.3em",
                                    color: `${theme.text}66`,
                                    textTransform: "uppercase",
                                    border: `1px solid ${theme.border}`,
                                    padding: "2px 8px", borderRadius: 2,
                                }}>
                                    Case Progress
                                </div>
                            </div>

                            {/* Big status label */}
                            <div className="pm-big-label" style={{ color: theme.text, textShadow: `0 0 30px ${theme.glow}` }}>
                                {theme.icon} {label}
                            </div>

                            {/* Score bar */}
                            <div className="pm-bar-wrap" style={{ marginTop: 14 }}>
                                <motion.div
                                    className="pm-bar-fill"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${score}%` }}
                                    transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                                    style={{ background: theme.barGradient }}
                                />
                            </div>

                            {/* Flavor text */}
                            {flavor && (
                                <div style={{
                                    fontFamily: "'Courier Prime', monospace",
                                    fontSize: "clamp(12px, 1.1vw, 15px)", lineHeight: 1.65, fontStyle: "italic",
                                    color: `${theme.text}77`,
                                    marginTop: 12,
                                    borderLeft: `2px solid ${theme.border}`,
                                    paddingLeft: 10,
                                }}>
                                    {flavor}
                                </div>
                            )}

                            {/* Dismiss */}
                            <div style={{
                                marginTop: 12,
                                display: "flex", alignItems: "center",
                                justifyContent: "space-between",
                            }}>
                                <span style={{
                                    fontFamily: "'Courier Prime', monospace",
                                    fontSize: "clamp(10px, 0.9vw, 12px)", letterSpacing: "0.22em",
                                    textTransform: "uppercase", color: `${theme.text}44`,
                                }}>
                                    Click to dismiss
                                </span>
                                <span style={{
                                    fontFamily: "'Courier Prime', monospace",
                                    fontSize: "clamp(12px, 1.1vw, 15px)", color: `${theme.text}55`,
                                }}>
                                    {Math.ceil((drainPct / 100) * (DURATION / 1000))}s
                                </span>
                            </div>
                        </div>

                        {/* Drain bar */}
                        <div className="pm-drain-track">
                            <div
                                className="pm-drain-fill"
                                style={{ width: `${drainPct}%`, background: theme.barGradient }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}