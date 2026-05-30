import { useEffect, useState } from "react";
import { useHint } from "../context/HintContext";
import { useSession } from "../context/SessionContext";

const API_BASE = "http://127.0.0.1:8000";

export default function HintButton() {
    const { sessionId } = useSession();
    const { setHintData, cooldownRemaining, setCooldownRemaining } = useHint();
    const [cooldownTotal, setCooldownTotal] = useState(0);
    const [pressed, setPressed] = useState(false);

    useEffect(() => {
        if (cooldownRemaining <= 0) return;
        const interval = setInterval(() => {
            setCooldownRemaining((prev) => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [cooldownRemaining, setCooldownRemaining]);

    const handleHintClick = async () => {
        if (!sessionId || cooldownRemaining > 0) return;
        setPressed(true);
        setTimeout(() => setPressed(false), 200);
        try {
            const response = await fetch(`${API_BASE}/hint`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId }),
            });
            if (!response.ok) throw new Error("Failed to fetch hint");
            const data = await response.json();
            if (data.cooldown_remaining > 0) {
                setCooldownRemaining(data.cooldown_remaining);
                setCooldownTotal(data.cooldown_remaining);
            } else {
                setCooldownRemaining(0);
            }
            if (data.hint_text) setHintData(data);
        } catch { }
    };

    const onCooldown = cooldownRemaining > 0;
    const pct = onCooldown && cooldownTotal > 0 ? (cooldownRemaining / cooldownTotal) * 100 : 0;
    const deg = pct * 3.6;

    return (
        <>
            <style>{`
                @keyframes hint-idle-pulse {
                    0%,100% { box-shadow: 0 0 0 0 rgba(245,200,66,0); }
                    50%     { box-shadow: 0 0 0 6px rgba(245,200,66,0.12); }
                }
                @keyframes hint-press {
                    0%   { transform: scale(1); }
                    40%  { transform: scale(0.91); }
                    100% { transform: scale(1); }
                }
                @keyframes hint-spin-in {
                    from { transform: rotate(-90deg) scale(0.8); opacity: 0; }
                    to   { transform: rotate(0deg)   scale(1);   opacity: 1; }
                }
                .hint-btn-wrap {
                    position: relative;
                    width: 52px; height: 52px;
                    cursor: crosshair !important;
                }
                .hint-ring {
                    position: absolute; inset: -4px;
                    border-radius: 50%;
                    pointer-events: none;
                }
                .hint-core {
                    width: 52px; height: 52px;
                    border-radius: 4px;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    gap: 2px;
                    position: relative;
                    overflow: hidden;
                    cursor: crosshair !important;
                    transition: filter 0.2s, opacity 0.2s;
                    border: none; outline: none; padding: 0;
                }
                .hint-core:not(:disabled) {
                    animation: hint-idle-pulse 3s ease-in-out infinite;
                }
                .hint-core:disabled {
                    opacity: 0.65;
                    cursor: not-allowed !important;
                    animation: none;
                }
                .hint-pressed {
                    animation: hint-press 0.2s ease forwards !important;
                }
            `}</style>

            <div className="hint-btn-wrap">
                {/* Conic cooldown ring */}
                {onCooldown && (
                    <div
                        className="hint-ring"
                        style={{
                            background: `conic-gradient(
                                rgba(245,200,66,0.9) 0deg,
                                rgba(245,200,66,0.9) ${deg}deg,
                                rgba(255,255,255,0.08) ${deg}deg,
                                rgba(255,255,255,0.08) 360deg
                            )`,
                        }}
                    />
                )}
                {/* Inner ring track (always visible, subtle) */}
                <div className="hint-ring" style={{
                    background: onCooldown ? "transparent" : "rgba(245,200,66,0.1)",
                    border: "1px solid rgba(245,200,66,0.2)",
                    borderRadius: "50%",
                }} />

                <button
                    onClick={handleHintClick}
                    disabled={!sessionId}
                    className={`hint-core${pressed ? " hint-pressed" : ""}`}
                    title="Request detective hint"
                    style={{
                        background: onCooldown
                            ? "linear-gradient(160deg, #1a1408, #120f06)"
                            : "linear-gradient(160deg, #2a1e06, #1a1204)",
                        boxShadow: onCooldown
                            ? "inset 0 1px 0 rgba(245,200,66,0.1), 0 4px 16px rgba(0,0,0,0.6)"
                            : "inset 0 1px 0 rgba(245,200,66,0.2), 0 0 0 1px rgba(245,200,66,0.25), 0 4px 20px rgba(0,0,0,0.7), 0 0 16px rgba(245,200,66,0.08)",
                    }}
                >
                    {/* Corner fold */}
                    <div style={{
                        position: "absolute", top: 0, right: 0,
                        width: 12, height: 12,
                        background: `linear-gradient(225deg, rgba(245,200,66,${onCooldown ? "0.2" : "0.5"}) 50%, transparent 50%)`,
                        pointerEvents: "none",
                    }} />

                    {/* Magnifier icon */}
                    <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                        <circle cx="8.5" cy="8.5" r="5.5" fill="none"
                            stroke={onCooldown ? "rgba(245,200,66,0.35)" : "rgba(245,200,66,0.85)"}
                            strokeWidth="1.8" />
                        <circle cx="8.5" cy="8.5" r="3"
                            fill={onCooldown ? "rgba(245,200,66,0.05)" : "rgba(245,200,66,0.08)"} />
                        <line x1="13" y1="13" x2="17" y2="17"
                            stroke={onCooldown ? "rgba(245,200,66,0.35)" : "rgba(245,200,66,0.85)"}
                            strokeWidth="2" strokeLinecap="round" />
                        {/* Lens glint */}
                        {!onCooldown && (
                            <circle cx="6.5" cy="6.5" r="1.2" fill="rgba(255,255,255,0.25)" />
                        )}
                    </svg>

                    {/* Label */}
                    <span style={{
                        fontFamily: "'Special Elite', cursive",
                        fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: onCooldown ? "rgba(245,200,66,0.35)" : "rgba(245,200,66,0.8)",
                        lineHeight: 1,
                    }}>
                        {onCooldown ? `${cooldownRemaining}s` : "Hint"}
                    </span>
                </button>

                {/* Cooldown number overlay */}
                {onCooldown && (
                    <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        pointerEvents: "none",
                    }}>
                        <div style={{
                            fontFamily: "'Courier Prime', monospace",
                            fontSize: "clamp(15px, 1.3vw, 19px)", fontWeight: 700,
                            color: "rgba(245,200,66,0.75)",
                            textShadow: "0 0 8px rgba(245,200,66,0.4)",
                            background: "rgba(0,0,0,0.55)",
                            borderRadius: "50%",
                            width: 28, height: 28,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            {cooldownRemaining}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}