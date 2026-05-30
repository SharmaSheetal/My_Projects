/**
 * SessionContext.jsx
 * ──────────────────────────────────────────────────────────────
 * Provides:
 *   sessionId          – UUID from POST /session/start
 *   phase              – current game phase (1–4)
 *   setPhase
 *   unlockedEvidence   – array of unlocked evidence IDs
 *   setUnlockedEvidence
 *   questionedCharacters – array of character IDs interviewed
 *   setQuestionedCharacters
 *   hintsUsed          – total hints used this session
 *   setHintsUsed
 *   availableEndings   – endings unlocked by backend
 *   setAvailableEndings
 *   resetSession       – calls POST /reset/:id and starts fresh
 *   sessionError       – non-null if /session/start failed
 *
 * Usage: wrap <App /> (or router root) with <SessionProvider>
 *   import { SessionProvider } from "./context/SessionContext";
 *
 * Consumers: import { useSession } from "./context/SessionContext";
 */

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const API_BASE = "http://127.0.0.1:8000";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
    const [sessionId, setSessionId] = useState(null);
    const [sessionError, setSessionError] = useState(null);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [phase, setPhase] = useState(1);
    const [unlockedEvidence, setUnlockedEvidence] = useState([]);
    const [questionedCharacters, setQuestionedCharacters] = useState([]);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [availableEndings, setAvailableEndings] = useState([]);

    // ── Start session on mount ─────────────────────────────────
    const startNewSession = useCallback(async () => {
        setSessionLoading(true);
        setSessionError(null);
        try {
            const r = await fetch(`${API_BASE}/session/start`, { method: "POST" });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data = await r.json();
            setSessionId(data.session_id);
            // Reset all state for fresh game
            setPhase(1);
            setUnlockedEvidence([]);
            setQuestionedCharacters([]);
            setHintsUsed(0);
            setAvailableEndings([]);
        } catch (err) {
            console.error("[SessionContext] Failed to start session:", err);
            setSessionError(err.message || "Failed to connect to backend.");
        } finally {
            setSessionLoading(false);
        }
    }, []);

    useEffect(() => {
        startNewSession();
    }, [startNewSession]);

    // ── Reset session (dev button / game over) ─────────────────
    const resetSession = useCallback(async () => {
        if (sessionId) {
            try {
                await fetch(`${API_BASE}/reset/${sessionId}`, { method: "POST" });
            } catch { }
        }
        await startNewSession();
    }, [sessionId, startNewSession]);

    const value = {
        sessionId,
        setSessionId,   // exposed for backwards compatibility
        sessionLoading,
        sessionError,
        resetSession,

        phase,
        setPhase,

        unlockedEvidence,
        setUnlockedEvidence,

        questionedCharacters,
        setQuestionedCharacters,

        hintsUsed,
        setHintsUsed,

        availableEndings,
        setAvailableEndings,
    };

    return (
        <SessionContext.Provider value={value}>
            {/* Show a loading screen until session is ready */}
            {sessionLoading ? (
                <div style={{
                    position: "fixed", inset: 0,
                    background: "#080806",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 18, zIndex: 99999,
                }}>
                    <div style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "clamp(22px, 2vw, 32px)",
                        fontWeight: 900, fontStyle: "italic",
                        color: "#f5c842",
                        textShadow: "0 0 30px rgba(245,200,66,0.4)",
                        letterSpacing: "0.04em",
                    }}>
                        Opening Case File…
                    </div>
                    <div style={{
                        width: 180, height: 2,
                        background: "rgba(245,200,66,0.15)",
                        borderRadius: 2, overflow: "hidden",
                        position: "relative",
                    }}>
                        <div style={{
                            position: "absolute", inset: 0,
                            background: "#f5c842",
                            animation: "loading-bar 1.4s ease-in-out infinite",
                        }} />
                    </div>
                    {sessionError && (
                        <div style={{
                            fontFamily: "'Courier Prime', monospace",
                            fontSize: "clamp(13px, 1vw, 16px)",
                            color: "#e74c3c", marginTop: 8,
                            textAlign: "center", maxWidth: 360,
                        }}>
                            ⚠ {sessionError}
                            <br />
                            <button
                                onClick={startNewSession}
                                style={{
                                    marginTop: 12,
                                    fontFamily: "'Special Elite', cursive",
                                    fontSize: "clamp(13px, 1vw, 16px)",
                                    letterSpacing: "0.2em",
                                    color: "#f5c842",
                                    background: "transparent",
                                    border: "1px solid rgba(245,200,66,0.4)",
                                    padding: "8px 20px",
                                    cursor: "crosshair",
                                }}
                            >
                                RETRY
                            </button>
                        </div>
                    )}
                    <style>{`
                        @keyframes loading-bar {
                            0%   { transform: translateX(-100%); }
                            50%  { transform: translateX(0%); }
                            100% { transform: translateX(100%); }
                        }
                    `}</style>
                </div>
            ) : children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
    return ctx;
}