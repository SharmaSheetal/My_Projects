import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";

const API_BASE = "http://127.0.0.1:8000";

// Typewriter hook
function useTypewriter(text, speed = 45, startDelay = 0) {
    const [displayed, setDisplayed] = useState("");
    const [done, setDone] = useState(false);
    useEffect(() => {
        setDisplayed("");
        setDone(false);
        let timeout;
        timeout = setTimeout(() => {
            let i = 0;
            const interval = setInterval(() => {
                setDisplayed(text.slice(0, i + 1));
                i++;
                if (i >= text.length) {
                    clearInterval(interval);
                    setDone(true);
                }
            }, speed);
            return () => clearInterval(interval);
        }, startDelay);
        return () => clearTimeout(timeout);
    }, [text, speed, startDelay]);
    return { displayed, done };
}

export default function OpeningScene() {
    const navigate = useNavigate();
    const { setSessionId } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [phase, setPhase] = useState(0); // 0=time, 1=scene, 2=body, 3=cta
    const [flickerOn, setFlickerOn] = useState(true);
    const [tapeOffset, setTapeOffset] = useState(0);
    const [buttonHovered, setButtonHovered] = useState(false);
    const [stamped, setStamped] = useState(false);

    // Magnifier state
    const [magPos, setMagPos] = useState({ x: 0, y: 0 });
    const [magVisible, setMagVisible] = useState(false);
    const sceneRef = useRef(null);
    const LENS_SIZE = 160;
    const ZOOM = 2.4;

    const handleSceneMouseMove = useCallback((e) => {
        const rect = sceneRef.current?.getBoundingClientRect();
        if (!rect) return;
        setMagPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }, []);

    const handleSceneMouseEnter = () => setMagVisible(true);
    const handleSceneMouseLeave = () => setMagVisible(false);

    // Flicker effect
    useEffect(() => {
        const flicker = () => {
            setFlickerOn(v => !v);
            setTimeout(() => setFlickerOn(true), 80 + Math.random() * 120);
        };
        const id = setInterval(flicker, 3000 + Math.random() * 4000);
        return () => clearInterval(id);
    }, []);

    // Police tape scroll
    useEffect(() => {
        let frame;
        let offset = 0;
        const animate = () => {
            offset = (offset + 0.4) % 320;
            setTapeOffset(offset);
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, []);

    // Phase reveal timing
    useEffect(() => {
        const t1 = setTimeout(() => setPhase(1), 400);
        const t2 = setTimeout(() => setPhase(2), 1800);
        const t3 = setTimeout(() => setPhase(3), 3400);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    const timeType = useTypewriter("2:07 AM", 80, 500);
    const subtitleType = useTypewriter("Demo night. The room is still. The story is not.", 38, 1200);

    const handleBeginInvestigation = async () => {
        setStamped(true);
        setTimeout(async () => {
            setLoading(true);
            setError("");
            try {
                const response = await fetch(`${API_BASE}/session/start`, { method: "POST" });
                if (!response.ok) throw new Error("Failed to initialize session");
                const data = await response.json();
                if (!data.session_id) throw new Error("No session_id returned from backend");
                setSessionId(data.session_id);
                navigate("/dossier");
            } catch (err) {
                setError(err.message || "Something went wrong while starting the case.");
                setStamped(false);
            } finally {
                setLoading(false);
            }
        }, 600);
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Special+Elite&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');

                * { cursor: crosshair !important; }
                .magnifier-zone, .magnifier-zone * { cursor: none !important; }

                .noir-root {
                    min-height: 100vh;
                    background: #080806;
                    font-family: 'Courier Prime', monospace;
                    color: #e8dcc8;
                    position: relative;
                    overflow: hidden;
                }

                /* Grain overlay */
                .noise::before {
                    content: '';
                    position: fixed;
                    inset: 0;
                    z-index: 100;
                    pointer-events: none;
                    opacity: 0.055;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
                    background-size: 180px;
                }

                /* Scanlines */
                .scanlines::after {
                    content: '';
                    position: fixed;
                    inset: 0;
                    z-index: 99;
                    pointer-events: none;
                    background: repeating-linear-gradient(
                        to bottom,
                        transparent 0px,
                        transparent 3px,
                        rgba(0,0,0,0.13) 3px,
                        rgba(0,0,0,0.13) 4px
                    );
                }

                .vignette {
                    position: fixed;
                    inset: 0;
                    z-index: 98;
                    pointer-events: none;
                    background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%);
                }

                /* Time display */
                .time-display {
                    font-family: 'Playfair Display', serif;
                    font-size: clamp(6rem, 15vw, 12rem);
                    font-weight: 900;
                    line-height: 0.9;
                    color: #f5c842;
                    text-shadow:
                        0 0 40px rgba(245,200,66,0.4),
                        0 0 80px rgba(245,200,66,0.15),
                        3px 3px 0 rgba(0,0,0,0.8);
                    letter-spacing: -0.02em;
                    transition: opacity 0.1s;
                }

                .time-flicker {
                    opacity: 0.6;
                    text-shadow: 0 0 8px rgba(245,200,66,0.8);
                }

                /* Police tape */
                .tape-wrap {
                    overflow: hidden;
                    height: 36px;
                    position: relative;
                }
                .tape-inner {
                    white-space: nowrap;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    background: #f5e642;
                    color: #0a0a0a;
                    font-family: 'Special Elite', cursive;
                    font-size: clamp(12px, 1.1vw, 15px);
                    font-weight: 700;
                    letter-spacing: 0.22em;
                    transform-origin: center;
                    transform: rotate(-1.2deg) scaleY(1.05);
                    box-shadow: 0 2px 12px rgba(0,0,0,0.6), inset 0 -2px 0 rgba(0,0,0,0.2);
                    position: relative;
                }

                /* Crime scene card */
                .scene-card {
                    background: #0e0d0b;
                    border: 1px solid rgba(245,200,66,0.18);
                    border-radius: 4px;
                    box-shadow:
                        0 0 0 1px rgba(255,255,255,0.04),
                        0 20px 60px rgba(0,0,0,0.8),
                        inset 0 1px 0 rgba(255,255,255,0.06);
                    position: relative;
                    overflow: hidden;
                }

                /* Evidence items */
                .evidence-item {
                    transition: transform 0.3s ease, filter 0.3s ease;
                }
                .evidence-item:hover {
                    transform: scale(1.05) rotate(-1deg) !important;
                    filter: brightness(1.2);
                    z-index: 10;
                }

                /* Chalk outline glow */
                .chalk-body {
                    position: absolute;
                    bottom: 16px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 80px;
                    height: 130px;
                    border: 2px dashed rgba(255,255,255,0.25);
                    border-radius: 40px 40px 30px 30px;
                    box-shadow: 0 0 12px rgba(255,255,255,0.08);
                    opacity: 0.7;
                }
                .chalk-head {
                    position: absolute;
                    top: -28px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 40px;
                    height: 40px;
                    border: 2px dashed rgba(255,255,255,0.25);
                    border-radius: 50%;
                }

                /* Sticky note */
                .sticky-note {
                    background: linear-gradient(135deg, #f5e84a 0%, #e8d832 100%);
                    box-shadow:
                        3px 3px 0 rgba(0,0,0,0.3),
                        6px 6px 20px rgba(0,0,0,0.4),
                        inset 0 0 30px rgba(0,0,0,0.08);
                    transform: rotate(-6deg);
                    font-family: 'Special Elite', cursive;
                    color: #1a1a0a;
                    padding: 12px 10px;
                    width: 110px;
                    font-size: clamp(12px, 1.1vw, 15px);
                    line-height: 1.5;
                    position: relative;
                }
                .sticky-note::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 50%;
                    transform: translateX(-50%);
                    width: 30px;
                    height: 6px;
                    background: rgba(0,0,0,0.15);
                    border-radius: 0 0 3px 3px;
                }
                .sticky-note::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: repeating-linear-gradient(
                        transparent, transparent 19px, rgba(0,0,0,0.08) 19px, rgba(0,0,0,0.08) 20px
                    );
                    border-radius: inherit;
                }

                /* Trophy */
                .trophy-glow {
                    filter: drop-shadow(0 0 8px rgba(245,200,66,0.5));
                    animation: trophy-pulse 3s ease-in-out infinite;
                }
                @keyframes trophy-pulse {
                    0%, 100% { filter: drop-shadow(0 0 8px rgba(245,200,66,0.5)); }
                    50% { filter: drop-shadow(0 0 16px rgba(245,200,66,0.8)); }
                }

                /* Reveal animations */
                .reveal {
                    opacity: 0;
                    transform: translateY(12px);
                    animation: revealIn 0.7s ease forwards;
                }
                @keyframes revealIn {
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Narrative text */
                .narrative-text {
                    font-family: 'Courier Prime', monospace;
                    font-size: clamp(15px, 1.3vw, 19px);
                    line-height: 1.85;
                    color: #c4b89a;
                    border-left: 2px solid rgba(245,200,66,0.3);
                    padding-left: 14px;
                }

                /* CTA Button */
                .cta-btn {
                    font-family: 'Special Elite', cursive;
                    font-size: clamp(15px, 1.3vw, 19px);
                    letter-spacing: 0.28em;
                    text-transform: uppercase;
                    color: #0a0a08;
                    background: #f5c842;
                    border: none;
                    padding: 16px 32px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.2s ease;
                    box-shadow: 4px 4px 0 rgba(0,0,0,0.6), 0 0 0 1px rgba(245,200,66,0.3);
                    clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
                }
                .cta-btn:hover:not(:disabled) {
                    background: #fff0a0;
                    box-shadow: 6px 6px 0 rgba(0,0,0,0.8), 0 0 24px rgba(245,200,66,0.4);
                    transform: translate(-1px, -1px);
                }
                .cta-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed !important;
                }
                .cta-btn::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
                    pointer-events: none;
                }

                /* Stamp effect */
                .stamp-overlay {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 50;
                    pointer-events: none;
                    animation: stampIn 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
                }
                @keyframes stampIn {
                    0% { opacity: 0; transform: scale(2.5) rotate(-15deg); }
                    60% { opacity: 1; transform: scale(0.95) rotate(-8deg); }
                    100% { opacity: 1; transform: scale(1) rotate(-8deg); }
                }
                .stamp-text {
                    font-family: 'Playfair Display', serif;
                    font-size: clamp(36px, 3.5vw, 52px);
                    font-weight: 900;
                    font-style: italic;
                    color: transparent;
                    border: 6px solid rgba(180,30,30,0.85);
                    border-radius: 4px;
                    padding: 8px 20px;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    box-shadow: inset 0 0 20px rgba(180,30,30,0.2), 0 0 20px rgba(180,30,30,0.3);
                    -webkit-text-stroke: 3px rgba(180,30,30,0.85);
                    opacity: 0.85;
                }

                /* Section label */
                .case-label {
                    font-family: 'Special Elite', cursive;
                    font-size: clamp(12px, 1.1vw, 15px);
                    letter-spacing: 0.35em;
                    text-transform: uppercase;
                    color: rgba(245,200,66,0.6);
                    margin-bottom: 6px;
                }

                /* Divider */
                .divider {
                    border: none;
                    border-top: 1px solid rgba(245,200,66,0.12);
                    margin: 16px 0;
                }

                .fade-phase {
                    transition: opacity 0.6s ease, transform 0.6s ease;
                }

                /* Red string decoration */
                .red-dot {
                    width: 8px; height: 8px;
                    border-radius: 50%;
                    background: #c0392b;
                    box-shadow: 0 0 6px rgba(192,57,43,0.7);
                    display: inline-block;
                    margin-right: 8px;
                    vertical-align: middle;
                }

                /* Fingerprint watermark */
                .fp-mark {
                    position: absolute;
                    bottom: 20px;
                    right: 24px;
                    font-size: clamp(48px, 4.5vw, 72px);
                    opacity: 0.04;
                    pointer-events: none;
                    transform: rotate(15deg);
                    user-select: none;
                }

                /* Magnifier */
                .magnifier-zone {
                    cursor: none !important;
                }
                .magnifier-lens {
                    position: absolute;
                    pointer-events: none;
                    z-index: 200;
                    border-radius: 50%;
                    overflow: hidden;
                    /* Glass border with brass handle effect */
                    box-shadow:
                        0 0 0 3px rgba(210,175,90,0.9),
                        0 0 0 5px rgba(140,110,50,0.6),
                        0 0 0 7px rgba(210,175,90,0.3),
                        0 8px 32px rgba(0,0,0,0.8),
                        inset 0 0 0 2px rgba(255,255,255,0.15);
                }
                /* Glass sheen overlay */
                .magnifier-lens::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    background: radial-gradient(
                        circle at 35% 30%,
                        rgba(255,255,255,0.18) 0%,
                        rgba(255,255,255,0.04) 30%,
                        transparent 60%
                    );
                    z-index: 10;
                    pointer-events: none;
                }
                /* Chromatic aberration fringe */
                .magnifier-lens::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    box-shadow: inset 0 0 12px rgba(180,40,40,0.15), inset 0 0 6px rgba(40,100,180,0.1);
                    z-index: 11;
                    pointer-events: none;
                }
                .magnifier-handle {
                    position: absolute;
                    width: 10px;
                    border-radius: 5px;
                    background: linear-gradient(180deg, #c8a840 0%, #8a6820 40%, #5a4010 100%);
                    box-shadow: 2px 2px 6px rgba(0,0,0,0.7), inset 1px 0 2px rgba(255,220,100,0.3);
                    transform-origin: top center;
                    transform: rotate(38deg);
                }
                .magnifier-tooltip {
                    position: absolute;
                    bottom: -28px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-family: 'Special Elite', cursive;
                    font-size: clamp(12px, 1.1vw, 15px);
                    letter-spacing: 0.2em;
                    color: rgba(245,200,66,0.6);
                    white-space: nowrap;
                    pointer-events: none;
                    text-transform: uppercase;
                }
            `}</style>

            <div className="noir-root noise scanlines">
                <div className="vignette" />

                {/* Ambient background light pool */}
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse 60% 40% at 30% 50%, rgba(245,200,66,0.04) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 70% 30%, rgba(180,30,30,0.03) 0%, transparent 60%)'
                }} />

                <main style={{ position: 'relative', zIndex: 10, maxWidth: 1080, margin: '0 auto', padding: '40px 24px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

                    {/* Header */}
                    <div style={{ marginBottom: 32, opacity: phase >= 0 ? 1 : 0, transition: 'opacity 0.8s ease' }}>
                        <div className="case-label">
                            <span className="red-dot" />
                            Judges' Lounge — Active Crime Scene
                        </div>

                        <div className={`time-display ${!flickerOn ? 'time-flicker' : ''}`}>
                            {timeType.displayed}
                            <span style={{ opacity: Math.random() > 0.5 ? 1 : 0.7 }}>_</span>
                        </div>

                        <div style={{
                            fontFamily: "'Courier Prime', monospace",
                            fontSize: "clamp(15px, 1.3vw, 19px)",
                            color: 'rgba(196,184,154,0.7)',
                            marginTop: 8,
                            letterSpacing: '0.08em',
                            minHeight: 20,
                            opacity: phase >= 1 ? 1 : 0,
                            transition: 'opacity 0.6s ease 0.3s'
                        }}>
                            {subtitleType.displayed}
                        </div>
                    </div>

                    {/* Main card */}
                    <div className="scene-card" style={{
                        opacity: phase >= 1 ? 1 : 0,
                        transform: phase >= 1 ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s',
                        position: 'relative'
                    }}>
                        {/* Police tape */}
                        <div className="tape-wrap" style={{ marginBottom: 0 }}>
                            <div className="tape-inner">
                                <span style={{
                                    display: 'inline-block',
                                    transform: `translateX(-${tapeOffset}px)`,
                                    whiteSpace: 'nowrap'
                                }}>
                                    {'POLICE LINE • DO NOT CROSS • '.repeat(20)}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, minHeight: 440 }}>

                            {/* LEFT: Crime scene visual */}
                            <div
                                ref={sceneRef}
                                className="magnifier-zone"
                                onMouseMove={handleSceneMouseMove}
                                onMouseEnter={handleSceneMouseEnter}
                                onMouseLeave={handleSceneMouseLeave}
                                style={{
                                    borderRight: '1px solid rgba(245,200,66,0.1)',
                                    padding: '32px 28px',
                                    position: 'relative',
                                    background: 'linear-gradient(160deg, #0d0c0a 0%, #080807 100%)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}>

                                {/* MAGNIFIER LENS */}
                                {magVisible && (() => {
                                    const half = LENS_SIZE / 2;
                                    // bg offset so the zoomed content lines up with cursor
                                    const bgX = -(magPos.x * ZOOM - half);
                                    const bgY = -(magPos.y * ZOOM - half);
                                    const handleLen = 72;
                                    return (
                                        <div style={{
                                            position: 'absolute',
                                            left: magPos.x - half,
                                            top: magPos.y - half,
                                            width: LENS_SIZE,
                                            height: LENS_SIZE,
                                            zIndex: 200,
                                            pointerEvents: 'none',
                                        }}>
                                            {/* The lens itself — zoomed snapshot via scaled background */}
                                            <div
                                                className="magnifier-lens"
                                                style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                                                    // The actual magnification is done via a nested content clone using CSS scale trick
                                                    background: '#0d0c0a',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {/* Zoomed content layer */}
                                                <div style={{
                                                    position: 'absolute',
                                                    // Scale the panel from cursor origin
                                                    transformOrigin: '0 0',
                                                    transform: `scale(${ZOOM})`,
                                                    left: bgX / ZOOM,
                                                    top: bgY / ZOOM,
                                                    width: sceneRef.current ? sceneRef.current.offsetWidth : 500,
                                                    height: sceneRef.current ? sceneRef.current.offsetHeight : 500,
                                                    // Mirror the panel background
                                                    background: 'linear-gradient(160deg, #0d0c0a 0%, #080807 100%)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                    padding: '32px 28px',
                                                }}>
                                                    {/* Overhead light */}
                                                    <div style={{
                                                        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                                                        width: 200, height: 180,
                                                        background: `radial-gradient(ellipse, rgba(245,200,66,${flickerOn ? '0.06' : '0.02'}) 0%, transparent 70%)`,
                                                        pointerEvents: 'none'
                                                    }} />
                                                    <div style={{ fontFamily: "'Special Elite', cursive", fontSize: "clamp(12px, 1.1vw, 15px)", letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,200,66,0.6)', marginBottom: 6 }}>Evidence — Exhibit A</div>
                                                    {/* Evidence row */}
                                                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 24, flexWrap: 'wrap', flex: 1, padding: '16px 8px 0' }}>
                                                        {/* Cold brew */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transform: 'rotate(3deg)' }}>
                                                            <div style={{ width: 40, height: 72, position: 'relative', background: 'linear-gradient(180deg,#2a1e0e,#1a1208)', borderRadius: '6px 6px 4px 4px', border: '1px solid rgba(245,200,66,0.2)', boxShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>
                                                                <div style={{ position: 'absolute', top: -20, left: 12, width: 4, height: 36, background: '#c0392b', borderRadius: 2, opacity: 0.8 }} />
                                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'rgba(80,40,0,0.7)', borderRadius: '0 0 4px 4px' }} />
                                                            </div>
                                                            <span style={{ fontFamily: "'Special Elite', cursive", fontSize: "clamp(12px, 1.1vw, 15px)", color: 'rgba(196,184,154,0.5)', textAlign: 'center' }}>Cold Brew<br /><span style={{ color: '#c0392b' }}>half-finished</span></span>
                                                        </div>
                                                        {/* Chalk outline */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxWidth: 120 }}>
                                                            <div style={{ position: 'relative', width: 80, height: 120 }}>
                                                                <svg viewBox="0 0 80 130" style={{ width: '100%', height: '100%' }}>
                                                                    <ellipse cx="40" cy="16" rx="18" ry="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3,2" />
                                                                    <path d="M 22 30 Q 16 55 18 82 Q 24 92 40 94 Q 56 92 62 82 Q 64 55 58 30 Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3,2" />
                                                                    <path d="M 22 42 Q 6 55 10 72" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3,2" />
                                                                    <path d="M 58 42 Q 74 55 70 72" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3,2" />
                                                                    <path d="M 30 92 Q 24 110 26 128" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3,2" />
                                                                    <path d="M 50 92 Q 56 110 54 128" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3,2" />
                                                                </svg>
                                                            </div>
                                                            <div style={{ fontFamily: "'Special Elite', cursive", fontSize: "clamp(12px, 1.1vw, 15px)", color: 'rgba(255,255,255,0.25)', textAlign: 'center', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Prof. Julian Byte</div>
                                                        </div>
                                                        {/* Trophy */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transform: 'rotate(-2deg)', filter: 'drop-shadow(0 0 8px rgba(245,200,66,0.5))' }}>
                                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(245,200,66,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                                                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                                                <path d="M4 22h16" />
                                                                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                                                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                                                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                                                            </svg>
                                                            <span style={{ fontFamily: "'Special Elite', cursive", fontSize: "clamp(12px, 1.1vw, 15px)", color: 'rgba(245,200,66,0.5)', textAlign: 'center', maxWidth: 80 }}>Most Disruptive<br />Hack</span>
                                                        </div>
                                                        {/* Sticky note */}
                                                        <div style={{ background: 'linear-gradient(135deg,#f5e84a,#e8d832)', boxShadow: '3px 3px 0 rgba(0,0,0,0.3)', transform: 'rotate(-6deg)', fontFamily: "'Special Elite', cursive", color: '#1a1a0a', padding: '12px 10px', width: 110, fontSize: "clamp(12px, 1.1vw, 15px)", lineHeight: 1.5, position: 'relative' }}>
                                                            THIS DEMO<br />WILL KILL
                                                            <div style={{ marginTop: 8, fontSize: "clamp(12px, 1.1vw, 15px)", color: 'rgba(0,0,0,0.45)', fontStyle: 'italic' }}>— anonymous</div>
                                                        </div>
                                                    </div>
                                                    {/* Evidence tags */}
                                                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                                        {['#A1', '#A2', '#A3', '#A4'].map(t => (
                                                            <span key={t} style={{ fontFamily: "'Courier Prime', monospace", fontSize: "clamp(12px, 1.1vw, 15px)", color: 'rgba(245,200,66,0.4)', border: '1px solid rgba(245,200,66,0.15)', padding: '2px 6px', borderRadius: 2 }}>{t}</span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Tinted glass overlay for warmth */}
                                                <div style={{
                                                    position: 'absolute', inset: 0, borderRadius: '50%',
                                                    background: 'rgba(245,200,66,0.04)',
                                                    mixBlendMode: 'screen', pointerEvents: 'none'
                                                }} />
                                                {/* Edge darkening */}
                                                <div style={{
                                                    position: 'absolute', inset: 0, borderRadius: '50%',
                                                    background: 'radial-gradient(circle, transparent 55%, rgba(0,0,0,0.55) 100%)',
                                                    pointerEvents: 'none', zIndex: 9
                                                }} />
                                            </div>

                                            {/* Handle */}
                                            <div className="magnifier-handle" style={{
                                                position: 'absolute',
                                                left: '50%',
                                                top: LENS_SIZE - 8,
                                                marginLeft: -5,
                                                height: handleLen,
                                            }} />

                                            {/* Tooltip hint - only shows briefly */}
                                            <div className="magnifier-tooltip">Inspect Evidence</div>
                                        </div>
                                    );
                                })()}
                                {/* Overhead light effect */}
                                <div style={{
                                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                                    width: 2, height: '100%',
                                    background: `linear-gradient(to bottom, rgba(245,200,66,${flickerOn ? '0.15' : '0.05'}), transparent 60%)`,
                                    pointerEvents: 'none', transition: 'background 0.08s'
                                }} />
                                <div style={{
                                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                                    width: 200, height: 180,
                                    background: `radial-gradient(ellipse, rgba(245,200,66,${flickerOn ? '0.06' : '0.02'}) 0%, transparent 70%)`,
                                    pointerEvents: 'none', transition: 'background 0.08s'
                                }} />

                                <div className="case-label" style={{ position: 'relative', zIndex: 2 }}>Evidence — Exhibit A</div>

                                {/* Evidence items */}
                                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 32, flexWrap: 'wrap', flex: 1, padding: '16px 12px 0', position: 'relative', zIndex: 2 }}>
                                    {/* Cold brew */}
                                    <div className="evidence-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transform: 'rotate(3deg)' }}>
                                        <div style={{
                                            width: 40, height: 72, position: 'relative',
                                            background: 'linear-gradient(180deg, #2a1e0e 0%, #1a1208 100%)',
                                            borderRadius: '6px 6px 4px 4px',
                                            border: '1px solid rgba(245,200,66,0.2)',
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.4)'
                                        }}>
                                            {/* Straw */}
                                            <div style={{
                                                position: 'absolute', top: -20, left: 12,
                                                width: 4, height: 36, background: '#c0392b',
                                                borderRadius: 2, opacity: 0.8
                                            }} />
                                            {/* Liquid level */}
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
                                                background: 'rgba(80,40,0,0.7)', borderRadius: '0 0 4px 4px'
                                            }} />
                                            {/* Condensation dots */}
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} style={{
                                                    position: 'absolute',
                                                    top: `${20 + i * 10}%`,
                                                    left: `${15 + (i % 2) * 40}%`,
                                                    width: 3, height: 3,
                                                    borderRadius: '50%',
                                                    background: 'rgba(255,255,255,0.12)'
                                                }} />
                                            ))}
                                        </div>
                                        <span style={{ fontFamily: "'Special Elite', cursive", fontSize: "clamp(12px, 1.1vw, 15px)", color: 'rgba(196,184,154,0.5)', textAlign: 'center' }}>Cold Brew<br /><span style={{ color: '#c0392b' }}>half-finished</span></span>
                                    </div>

                                    {/* Chalk outline */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxWidth: 120, position: 'relative' }}>
                                        {/* Chalk body silhouette */}
                                        <div style={{ position: 'relative', width: 80, height: 120 }}>
                                            <svg viewBox="0 0 80 130" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                                                {/* Head */}
                                                <ellipse cx="40" cy="16" rx="18" ry="16"
                                                    fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3,2" />
                                                {/* Body */}
                                                <path d="M 22 30 Q 16 55 18 82 Q 24 92 40 94 Q 56 92 62 82 Q 64 55 58 30 Z"
                                                    fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3,2" />
                                                {/* Left arm */}
                                                <path d="M 22 42 Q 6 55 10 72"
                                                    fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3,2" />
                                                {/* Right arm */}
                                                <path d="M 58 42 Q 74 55 70 72"
                                                    fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3,2" />
                                                {/* Left leg */}
                                                <path d="M 30 92 Q 24 110 26 128"
                                                    fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3,2" />
                                                {/* Right leg */}
                                                <path d="M 50 92 Q 56 110 54 128"
                                                    fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3,2" />
                                                {/* Glow */}
                                                <ellipse cx="40" cy="16" rx="18" ry="16"
                                                    fill="rgba(255,255,255,0.02)" stroke="none" />
                                            </svg>
                                        </div>
                                        <div style={{
                                            fontFamily: "'Special Elite', cursive", fontSize: "clamp(12px, 1.1vw, 15px)",
                                            color: 'rgba(255,255,255,0.25)', textAlign: 'center',
                                            letterSpacing: '0.15em', textTransform: 'uppercase'
                                        }}>Prof. Julian Byte</div>
                                    </div>

                                    {/* Trophy */}
                                    <div className="evidence-item trophy-glow" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transform: 'rotate(-2deg)' }}>
                                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(245,200,66,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 12px rgba(245,200,66,0.4))' }}>
                                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                            <path d="M4 22h16" />
                                            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                                        </svg>
                                        <span style={{ fontFamily: "'Special Elite', cursive", fontSize: "clamp(12px, 1.1vw, 15px)", color: 'rgba(245,200,66,0.5)', textAlign: 'center', maxWidth: 80 }}>Most Disruptive<br />Hack</span>
                                    </div>

                                    {/* Sticky note */}
                                    <div className="evidence-item sticky-note">
                                        THIS DEMO<br />WILL KILL
                                        <div style={{
                                            marginTop: 8, fontSize: "clamp(12px, 1.1vw, 15px)",
                                            color: 'rgba(0,0,0,0.45)',
                                            fontStyle: 'italic'
                                        }}>— anonymous</div>
                                    </div>
                                </div>

                                {/* Evidence tags */}
                                <div style={{ display: 'flex', gap: 8, marginTop: 16, position: 'relative', zIndex: 2 }}>
                                    {['#A1', '#A2', '#A3', '#A4'].map((tag, i) => (
                                        <span key={tag} style={{
                                            fontFamily: "'Courier Prime', monospace",
                                            fontSize: "clamp(12px, 1.1vw, 15px)", color: 'rgba(245,200,66,0.4)',
                                            border: '1px solid rgba(245,200,66,0.15)',
                                            padding: '2px 6px', borderRadius: 2
                                        }}>{tag}</span>
                                    ))}
                                </div>

                                <div className="fp-mark">🔍</div>
                            </div>

                            {/* RIGHT: Narrative + CTA */}
                            <div style={{
                                padding: '32px 28px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                position: 'relative',
                                opacity: phase >= 2 ? 1 : 0,
                                transform: phase >= 2 ? 'translateX(0)' : 'translateX(16px)',
                                transition: 'opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s'
                            }}>
                                <div>
                                    <div className="case-label">Case File #0001 — Open</div>
                                    <h2 style={{
                                        fontFamily: "'Playfair Display', serif",
                                        fontSize: "clamp(24px, 2.2vw, 36px)",
                                        fontWeight: 700,
                                        fontStyle: 'italic',
                                        color: '#f5c842',
                                        lineHeight: 1.2,
                                        marginBottom: 20,
                                        textShadow: '0 0 20px rgba(245,200,66,0.2)'
                                    }}>
                                        The Case of the<br />Dead Demo Judge
                                    </h2>

                                    <hr className="divider" />

                                    <div className="narrative-text">
                                        <p style={{ marginBottom: 14 }}>
                                            At <strong style={{ color: '#f5c842' }}>2:07 AM</strong>, during demo night, the star judge{' '}
                                            <strong style={{ color: '#c8e88a' }}>Professor Julian Byte</strong>{' '}
                                            is found collapsed in the judges' lounge — beside a half-finished cold brew, a trophy labeled{' '}
                                            <em style={{ color: '#f5c842' }}>"Most Disruptive Hack"</em>, and a sticky note that reads:
                                        </p>
                                        <blockquote style={{
                                            fontFamily: "'Special Elite', cursive",
                                            fontSize: "clamp(15px, 1.3vw, 19px)",
                                            color: '#f5e642',
                                            padding: '10px 14px',
                                            background: 'rgba(245,230,66,0.05)',
                                            border: '1px solid rgba(245,230,66,0.15)',
                                            borderLeft: '3px solid rgba(245,230,66,0.5)',
                                            marginBottom: 14,
                                            letterSpacing: '0.04em'
                                        }}>
                                            "THIS DEMO WILL KILL."
                                        </blockquote>
                                        <p style={{ marginBottom: 14 }}>
                                            At first, everyone assumes it is murder.
                                        </p>
                                        <p>
                                            Interrogate the suspects. Untangle their lies. Inspect the evidence. Determine what <em>really</em> happened before dawn.
                                        </p>
                                    </div>
                                </div>

                                <hr className="divider" />

                                {/* CTA */}
                                <div style={{
                                    opacity: phase >= 3 ? 1 : 0,
                                    transform: phase >= 3 ? 'translateY(0)' : 'translateY(10px)',
                                    transition: 'opacity 0.6s ease, transform 0.6s ease',
                                    position: 'relative'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                        <div style={{
                                            width: 6, height: 6, borderRadius: '50%',
                                            background: '#c0392b',
                                            boxShadow: '0 0 6px rgba(192,57,43,0.9)',
                                            animation: 'trophy-pulse 1.5s ease-in-out infinite'
                                        }} />
                                        <span style={{
                                            fontFamily: "'Courier Prime', monospace",
                                            fontSize: "clamp(12px, 1.1vw, 15px)",
                                            color: 'rgba(196,184,154,0.5)',
                                            letterSpacing: '0.15em',
                                            textTransform: 'uppercase'
                                        }}>Case status: Unsolved</span>
                                    </div>

                                    <button
                                        className="cta-btn"
                                        onClick={handleBeginInvestigation}
                                        disabled={loading}
                                        onMouseEnter={() => setButtonHovered(true)}
                                        onMouseLeave={() => setButtonHovered(false)}
                                    >
                                        {loading ? "Initializing Case File..." : "▶ Begin Investigation"}
                                    </button>

                                    {error && (
                                        <p style={{
                                            marginTop: 10,
                                            fontFamily: "'Courier Prime', monospace",
                                            fontSize: "clamp(12px, 1.1vw, 15px)",
                                            color: '#c0392b',
                                            letterSpacing: '0.05em'
                                        }}>⚠ {error}</p>
                                    )}
                                </div>

                                {/* Bottom file info */}
                                <div style={{
                                    marginTop: 20,
                                    paddingTop: 12,
                                    borderTop: '1px solid rgba(245,200,66,0.08)',
                                    display: 'flex', justifyContent: 'space-between',
                                    fontFamily: "'Courier Prime', monospace",
                                    fontSize: "clamp(12px, 1.1vw, 15px)", color: 'rgba(196,184,154,0.3)',
                                    letterSpacing: '0.1em'
                                }}>
                                    <span>DET. FILE // HACKATHON PD</span>
                                    <span>CLASSIFIED</span>
                                </div>
                            </div>
                        </div>

                        {/* Stamp overlay */}
                        {stamped && (
                            <div className="stamp-overlay">
                                <div className="stamp-text">CASE OPENED</div>
                            </div>
                        )}
                    </div>

                    {/* Bottom footer hint */}
                    <div style={{
                        marginTop: 20,
                        textAlign: 'center',
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: "clamp(12px, 1.1vw, 15px)",
                        color: 'rgba(196,184,154,0.2)',
                        letterSpacing: '0.2em',
                        opacity: phase >= 3 ? 1 : 0,
                        transition: 'opacity 0.6s ease 1s'
                    }}>
                        THE TRUTH IS IN THE DETAILS
                    </div>
                </main>
            </div>
        </>
    );
}