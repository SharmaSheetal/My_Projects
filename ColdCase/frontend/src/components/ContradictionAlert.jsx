import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { contradictionSpark } from "../audio/sounds";

export default function ContradictionAlert({ contradictionEvent, onDismiss }) {
    const timeoutRef = useRef(null);
    const lastShownRef = useRef(null);
    const [progress, setProgress] = useState(100);
    const progressRef = useRef(null);
    const DURATION = 6000;

    useEffect(() => {
        if (!contradictionEvent) return;

        if (lastShownRef.current !== contradictionEvent.contradiction_id) {
            lastShownRef.current = contradictionEvent.contradiction_id;
            try { contradictionSpark.stop(); contradictionSpark.play(); } catch { }
        }

        setProgress(100);
        const start = Date.now();
        progressRef.current = setInterval(() => {
            const pct = Math.max(0, 100 - ((Date.now() - start) / DURATION) * 100);
            setProgress(pct);
            if (pct <= 0) clearInterval(progressRef.current);
        }, 40);

        timeoutRef.current = setTimeout(() => onDismiss?.(), DURATION);

        return () => {
            clearTimeout(timeoutRef.current);
            clearInterval(progressRef.current);
        };
    }, [contradictionEvent, onDismiss]);

    const handleDismiss = () => {
        clearTimeout(timeoutRef.current);
        clearInterval(progressRef.current);
        onDismiss?.();
    };

    const chars = contradictionEvent?.characters || [];

    return (
        <>
            <style>{`
                @keyframes c-alert-glitch {
                    0%,100%{ transform: translateX(0); }
                    20%{ transform: translateX(-2px); }
                    40%{ transform: translateX(2px); }
                    60%{ transform: translateX(-1px); }
                    80%{ transform: translateX(1px); }
                }
                @keyframes c-scan {
                    0%   { top: 0%; opacity: 0.6; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes c-flicker {
                    0%,100%{ opacity:1; } 8%{ opacity:0.4; } 10%{ opacity:1; } 55%{ opacity:1; } 57%{ opacity:0.55; } 59%{ opacity:1; }
                }
                @keyframes c-pulse-dot {
                    0%,100%{ transform:scale(1); box-shadow: 0 0 0 0 rgba(231,76,60,0.7); }
                    50%{ transform:scale(1.3); box-shadow: 0 0 0 6px rgba(231,76,60,0); }
                }
                @keyframes c-border-pulse {
                    0%,100%{ border-color: rgba(231,76,60,0.35); box-shadow: 0 0 0 0 rgba(231,76,60,0); }
                    50%{ border-color: rgba(231,76,60,0.65); box-shadow: 0 0 20px rgba(231,76,60,0.15); }
                }
                .c-alert-card {
                    position: relative;
                    background: linear-gradient(160deg, #100606 0%, #0d0404 55%, #0f0505 100%);
                    border: 1px solid rgba(231,76,60,0.35);
                    border-radius: 3px;
                    overflow: hidden;
                    cursor: crosshair !important;
                    text-align: left;
                    width: 400px;
                    animation: c-border-pulse 2.2s ease-in-out infinite;
                    box-shadow: 0 8px 48px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03);
                }
                /* CRT scanline sweep */
                .c-alert-card::before {
                    content: '';
                    position: absolute; left: 0; right: 0; height: 60px;
                    background: linear-gradient(to bottom, transparent, rgba(231,76,60,0.04), transparent);
                    animation: c-scan 2.8s linear infinite;
                    pointer-events: none; z-index: 10;
                }
                /* Scanlines texture */
                .c-alert-card::after {
                    content: '';
                    position: absolute; inset: 0; pointer-events: none; z-index: 9;
                    background: repeating-linear-gradient(
                        to bottom, transparent 0px, transparent 2px,
                        rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 3px
                    );
                }
                .c-header {
                    padding: 12px 14px 10px;
                    border-bottom: 1px solid rgba(231,76,60,0.15);
                    display: flex; align-items: center; gap: 10;
                    background: rgba(231,76,60,0.06);
                    position: relative; z-index: 2;
                }
                .c-claim-block {
                    padding: 10px 12px;
                    border: 1px solid rgba(231,76,60,0.12);
                    border-radius: 2px;
                    background: rgba(0,0,0,0.35);
                    position: relative;
                    flex: 1;
                }
                .c-claim-label {
                    font-family: 'Courier Prime', monospace;
                    font-size: clamp(12px, 1.1vw, 15px); letter-spacing: 0.28em;
                    text-transform: uppercase;
                    color: rgba(231,76,60,0.5);
                    margin-bottom: 6px;
                }
                .c-claim-text {
                    font-family: 'Courier Prime', monospace;
                    font-size: clamp(12px, 1.1vw, 15px); line-height: 1.65;
                    color: rgba(245,210,210,0.88);
                }
                .c-vs-divider {
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    gap: 3px; flex-shrink: 0; padding: 0 4px;
                }
                .c-progress-track {
                    position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
                    background: rgba(0,0,0,0.4);
                }
                .c-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, rgba(231,76,60,0.4), rgba(231,76,60,0.85));
                    transition: width 0.04s linear;
                }
                .c-corner {
                    position: absolute; width: 14px; height: 14px; pointer-events: none;
                }
                .c-corner-tl { top: 0; left: 0; border-top: 1px solid rgba(231,76,60,0.6); border-left: 1px solid rgba(231,76,60,0.6); }
                .c-corner-tr { top: 0; right: 0; border-top: 1px solid rgba(231,76,60,0.6); border-right: 1px solid rgba(231,76,60,0.6); }
                .c-corner-bl { bottom: 4px; left: 0; border-bottom: 1px solid rgba(231,76,60,0.6); border-left: 1px solid rgba(231,76,60,0.6); }
                .c-corner-br { bottom: 4px; right: 0; border-bottom: 1px solid rgba(231,76,60,0.6); border-right: 1px solid rgba(231,76,60,0.6); }
            `}</style>

            <AnimatePresence>
                {contradictionEvent && (
                    <motion.div
                        key={contradictionEvent.contradiction_id}
                        initial={{ x: 440, opacity: 0, rotateY: 8 }}
                        animate={{ x: 0, opacity: 1, rotateY: 0 }}
                        exit={{ x: 440, opacity: 0, rotateY: 8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        style={{ perspective: 800 }}
                    >
                        <button type="button" className="c-alert-card" onClick={handleDismiss}>
                            {/* Corner brackets */}
                            <div className="c-corner c-corner-tl" />
                            <div className="c-corner c-corner-tr" />
                            <div className="c-corner c-corner-bl" />
                            <div className="c-corner c-corner-br" />

                            {/* Header */}
                            <div className="c-header" style={{ gap: 10 }}>
                                {/* Pulse dot */}
                                <div style={{
                                    width: 10, height: 10, borderRadius: "50%",
                                    background: "#e74c3c", flexShrink: 0,
                                    animation: "c-pulse-dot 1.1s ease-in-out infinite",
                                }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontFamily: "'Special Elite', cursive",
                                        fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.3em",
                                        textTransform: "uppercase",
                                        color: "rgba(231,76,60,0.7)",
                                        animation: "c-flicker 4s ease-in-out infinite",
                                    }}>
                                        ⚡ Contradiction Detected
                                    </div>
                                    <div style={{
                                        fontFamily: "'Playfair Display', serif",
                                        fontSize: "clamp(15px, 1.3vw, 19px)", fontWeight: 900, fontStyle: "italic",
                                        color: "#e8d0d0", marginTop: 3, lineHeight: 1.1,
                                        animation: "c-alert-glitch 0.3s ease 0.1s",
                                    }}>
                                        {chars.join(" ↔ ")}
                                    </div>
                                </div>
                                {/* Case ID tag */}
                                <div style={{
                                    fontFamily: "'Courier Prime', monospace",
                                    fontSize: "clamp(12px, 1.1vw, 15px)", color: "rgba(231,76,60,0.4)",
                                    border: "1px solid rgba(231,76,60,0.2)",
                                    padding: "3px 7px", borderRadius: 2,
                                    letterSpacing: "0.15em", flexShrink: 0,
                                }}>
                                    CASE<br />#0001
                                </div>
                            </div>

                            {/* Claims */}
                            <div style={{
                                display: "flex", alignItems: "stretch", gap: 8,
                                padding: "10px 12px", position: "relative", zIndex: 2,
                            }}>
                                <div className="c-claim-block">
                                    <div className="c-claim-label">{chars[0] || "Claim A"}</div>
                                    <div className="c-claim-text">"{contradictionEvent.claim_a}"</div>
                                </div>

                                <div className="c-vs-divider">
                                    <div style={{ width: 1, flex: 1, background: "rgba(231,76,60,0.2)" }} />
                                    <div style={{
                                        fontFamily: "'Special Elite', cursive",
                                        fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.1em",
                                        color: "rgba(231,76,60,0.55)",
                                        background: "#100606",
                                        padding: "3px 4px", lineHeight: 1,
                                    }}>VS</div>
                                    <div style={{ width: 1, flex: 1, background: "rgba(231,76,60,0.2)" }} />
                                </div>

                                <div className="c-claim-block">
                                    <div className="c-claim-label">{chars[1] || "Claim B"}</div>
                                    <div className="c-claim-text">"{contradictionEvent.claim_b}"</div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{
                                padding: "0 12px 12px", display: "flex",
                                alignItems: "center", justifyContent: "space-between",
                                position: "relative", zIndex: 2,
                            }}>
                                <div style={{
                                    fontFamily: "'Courier Prime', monospace",
                                    fontSize: "clamp(10px, 0.9vw, 12px)", letterSpacing: "0.2em",
                                    textTransform: "uppercase", color: "rgba(231,76,60,0.38)",
                                }}>
                                    Click to dismiss
                                </div>
                                <div style={{
                                    fontFamily: "'Courier Prime', monospace",
                                    fontSize: "clamp(12px, 1.1vw, 15px)", color: "rgba(231,76,60,0.45)",
                                }}>
                                    {Math.ceil((progress / 100) * (DURATION / 1000))}s
                                </div>
                            </div>

                            {/* Drain bar */}
                            <div className="c-progress-track">
                                <div className="c-progress-fill" style={{ width: `${progress}%` }} />
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}