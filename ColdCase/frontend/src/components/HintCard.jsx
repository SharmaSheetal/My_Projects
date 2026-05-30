import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useHint } from "../context/HintContext";

export default function HintCard() {
    const { hintData, setHintData } = useHint();
    const timeoutRef = useRef(null);
    const [progress, setProgress] = useState(100);
    const progressRef = useRef(null);
    const DURATION = 8000;

    useEffect(() => {
        if (!hintData?.hint_text) return;

        // Reset + start progress bar drain
        setProgress(100);
        const startTime = Date.now();

        progressRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
            setProgress(remaining);
            if (remaining <= 0) {
                clearInterval(progressRef.current);
            }
        }, 40);

        timeoutRef.current = setTimeout(() => {
            setHintData(null);
        }, DURATION);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (progressRef.current) clearInterval(progressRef.current);
        };
    }, [hintData, setHintData]);

    const handleDismiss = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (progressRef.current) clearInterval(progressRef.current);
        setHintData(null);
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Special+Elite&family=Courier+Prime:ital@0;1&display=swap');

                @keyframes hint-drop {
                    0%   { clip-path: inset(0 0 100% 0); opacity: 0; }
                    100% { clip-path: inset(0 0 0%   0); opacity: 1; }
                }
                @keyframes hint-retract {
                    0%   { clip-path: inset(0 0 0%   0); opacity: 1; }
                    100% { clip-path: inset(0 0 100% 0); opacity: 0; }
                }
                @keyframes tape-shimmer {
                    0%,100% { opacity: 0.7; }
                    50%     { opacity: 0.9; }
                }
                @keyframes pin-drop {
                    0%   { transform: translateY(-12px) scale(0.7); opacity: 0; }
                    60%  { transform: translateY(3px)  scale(1.1); opacity: 1; }
                    100% { transform: translateY(0)    scale(1);   opacity: 1; }
                }
                @keyframes paper-lines-fade {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                .hint-card-paper {
                    position: relative;
                    background: linear-gradient(160deg, #fdf6e3 0%, #f4e6c2 55%, #ede0b4 100%);
                    border-radius: 2px 2px 6px 6px;
                    overflow: hidden;
                    box-shadow:
                        0 2px 0 rgba(0,0,0,0.15),
                        0 8px 40px rgba(0,0,0,0.7),
                        0 24px 80px rgba(0,0,0,0.5),
                        inset 0 0 0 1px rgba(0,0,0,0.08);
                }
                .hint-paper-lines {
                    position: absolute; inset: 0; pointer-events: none;
                    background: repeating-linear-gradient(
                        transparent, transparent 22px,
                        rgba(120,80,30,0.08) 22px, rgba(120,80,30,0.08) 23px
                    );
                    animation: paper-lines-fade 0.4s ease forwards;
                }
                .hint-margin-line {
                    position: absolute; top: 0; bottom: 0; left: 28px;
                    width: 1px; background: rgba(192,57,43,0.22); pointer-events: none;
                }
                .hint-corner-fold {
                    position: absolute; bottom: 0; right: 0;
                    width: 22px; height: 22px;
                    background: linear-gradient(225deg, #d4b87a 50%, transparent 50%);
                    pointer-events: none;
                }
                .hint-tape {
                    position: absolute; top: -3px; left: 50%; transform: translateX(-50%);
                    width: 56px; height: 20px;
                    background: rgba(245,230,120,0.55);
                    border: 1px solid rgba(200,180,80,0.35);
                    animation: tape-shimmer 3s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 5;
                }
                .hint-tape::after {
                    content: '';
                    position: absolute; inset: 0;
                    background: repeating-linear-gradient(
                        45deg,
                        rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 2px,
                        transparent 2px, transparent 8px
                    );
                }
                /* Progress drain bar */
                .hint-progress-track {
                    position: absolute; bottom: 0; left: 0; right: 0;
                    height: 3px;
                    background: rgba(0,0,0,0.1);
                }
                .hint-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, rgba(192,57,43,0.7), rgba(245,200,66,0.8));
                    transition: width 0.04s linear;
                    border-radius: 0 2px 2px 0;
                }
            `}</style>

            <AnimatePresence>
                {hintData?.hint_text && (
                    <motion.div
                        key="hint-card"
                        initial={{ y: -220, opacity: 0, scaleX: 0.92 }}
                        animate={{ y: 0, opacity: 1, scaleX: 1 }}
                        exit={{ y: -220, opacity: 0, scaleX: 0.94 }}
                        transition={{
                            type: "spring",
                            stiffness: 280,
                            damping: 28,
                            mass: 0.9,
                        }}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 9500,
                            width: 340,
                            transformOrigin: "top center",
                        }}
                        onClick={handleDismiss}
                    >
                        {/* Tape strip at top */}
                        <div className="hint-tape" />

                        <div className="hint-card-paper" style={{ marginTop: 8 }}>
                            <div className="hint-paper-lines" />
                            <div className="hint-margin-line" />

                            {/* Header stamp */}
                            <div style={{
                                padding: "14px 18px 6px 40px",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                            }}>
                                <div style={{
                                    fontFamily: "'Courier Prime', monospace",
                                    fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.35em",
                                    textTransform: "uppercase", color: "rgba(120,70,20,0.65)",
                                }}>
                                    ◈ Detective's Hint
                                </div>
                                {/* Red stamp circle */}
                                <div style={{
                                    fontFamily: "'Special Elite', cursive",
                                    fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.2em",
                                    color: "rgba(192,57,43,0.6)",
                                    border: "1px solid rgba(192,57,43,0.4)",
                                    borderRadius: "50%",
                                    width: 36, height: 36,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    textAlign: "center", lineHeight: 1.2,
                                    transform: "rotate(-8deg)",
                                    textTransform: "uppercase",
                                    flexShrink: 0,
                                }}>
                                    OPEN<br />FILE
                                </div>
                            </div>

                            {/* Hint text — handwritten style */}
                            <div style={{
                                padding: "8px 18px 20px 40px",
                                position: "relative",
                            }}>
                                <div style={{
                                    fontFamily: "'Caveat', cursive",
                                    fontSize: "clamp(24px, 2.2vw, 36px)",
                                    fontWeight: 500,
                                    lineHeight: 1.5,
                                    color: "#2a1a06",
                                    letterSpacing: "0.01em",
                                }}>
                                    {hintData.hint_text}
                                </div>
                            </div>

                            {/* Dismiss row */}
                            <div style={{
                                padding: "0 18px 12px 40px",
                                display: "flex", alignItems: "center", gap: 8,
                            }}>
                                <div style={{
                                    fontFamily: "'Courier Prime', monospace",
                                    fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.2em",
                                    color: "rgba(120,70,20,0.5)",
                                    textTransform: "uppercase",
                                }}>
                                    Click to dismiss
                                </div>
                                <div style={{ flex: 1, height: 1, background: "rgba(120,70,20,0.15)" }} />
                                {/* Timer indicator */}
                                <div style={{
                                    fontFamily: "'Courier Prime', monospace",
                                    fontSize: "clamp(12px, 1.1vw, 15px)", color: "rgba(192,57,43,0.55)",
                                }}>
                                    {Math.ceil((progress / 100) * (DURATION / 1000))}s
                                </div>
                            </div>

                            {/* Progress drain bar */}
                            <div className="hint-progress-track">
                                <div className="hint-progress-fill" style={{ width: `${progress}%` }} />
                            </div>

                            {/* Corner fold */}
                            <div className="hint-corner-fold" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}