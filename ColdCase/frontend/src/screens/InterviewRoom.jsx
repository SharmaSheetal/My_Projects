import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

import { useSession } from "../context/SessionContext";
import { useProgress } from "../context/ProgressContext";
import { typewriterClick } from "../audio/sounds";
import HintButton from "../components/HintButton";
import HintCard from "../components/HintCard";
import ContradictionAlert from "../components/ContradictionAlert";
import { CHARACTER_DATA } from "../data/characters";
import DetectiveHUD from "../components/DetectiveHUD";
import detectiveMaleImg from "../assets/characters/user_male.webp";
import detectiveFemaleImg from "../assets/characters/user_female.webp";

const API_BASE = "http://127.0.0.1:8000";

const CHAR_META = {
    julian: { accent: "#e74c3c", trait: "VICTIM", bgR: "231,76,60" },
    victor: { accent: "#e67e22", trait: "SUSPECT", bgR: "230,126,34" },
    martha: { accent: "#9b59b6", trait: "SUSPECT", bgR: "155,89,182" },
    rose: { accent: "#1abc9c", trait: "WITNESS", bgR: "26,188,156" },
    hayes: { accent: "#3498db", trait: "ALLY", bgR: "52,152,219" },
    dr_collins: { accent: "#27ae60", trait: "WITNESS", bgR: "39,174,96" },
};

const FALLBACK_FACTS = {
    victor: [{ id: "f1", label: "Victor timeline", x: 60, y: 60 }, { id: "f2", label: "Backstage sighting", x: 260, y: 140 }, { id: "f3", label: "Drink access", x: 100, y: 240 }],
    martha: [{ id: "f1", label: "Lounge presence", x: 60, y: 60 }, { id: "f2", label: "Inhaler chain", x: 260, y: 140 }, { id: "f3", label: "Victor overlap", x: 100, y: 240 }],
    rose: [{ id: "f1", label: "VIP kit", x: 60, y: 60 }, { id: "f2", label: "Julian contact", x: 260, y: 140 }, { id: "f3", label: "Event access", x: 100, y: 240 }],
    hayes: [{ id: "f1", label: "Case summary", x: 60, y: 60 }, { id: "f2", label: "Room timeline", x: 260, y: 140 }, { id: "f3", label: "Witness map", x: 100, y: 240 }],
    julian: [{ id: "f1", label: "Demo pressure", x: 60, y: 60 }, { id: "f2", label: "Cold brew", x: 260, y: 140 }, { id: "f3", label: "Sticky note", x: 100, y: 240 }],
    dr_collins: [{ id: "f1", label: "Digitalis vial", x: 60, y: 60 }, { id: "f2", label: "Medical notes", x: 260, y: 140 }, { id: "f3", label: "Alibi gap", x: 100, y: 240 }],
};

function stressCol(s) { return s < 0.33 ? "#1abc9c" : s < 0.66 ? "#f5c842" : "#e74c3c"; }

function mkNodes(facts, acc) {
    return facts.map(f => ({
        id: f.id, position: { x: f.x, y: f.y }, data: { label: f.label },
        style: {
            border: `1px solid ${acc}44`, borderRadius: 8, padding: "8px 14px",
            background: "#100d18", color: "#e8dcc8", fontSize: 13,
            fontFamily: "'Courier Prime',monospace", boxShadow: "0 4px 16px rgba(0,0,0,.5)"
        },
    }));
}
function mkEdges(facts, acc) {
    return facts.slice(0, -1).map((f, i) => ({
        id: `e${i}`, source: f.id, target: facts[i + 1].id,
        style: { stroke: `${acc}44`, strokeWidth: 1.5 },
    }));
}

// ── Center divider — the "across the table" separator ──────────────────────
function CenterDivider({ acc, loading, stressLevel }) {
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick(v => v + 1), 1200);
        return () => clearInterval(id);
    }, []);
    const sc = stressCol(stressLevel);
    return (
        <div style={{
            position: "absolute", left: "50%", top: "10%", bottom: 0,
            transform: "translateX(-50%)",
            width: 1, pointerEvents: "none", zIndex: 3,
        }}>
            {/* Main divider line */}
            <div style={{
                width: 1, height: "100%",
                background: `linear-gradient(to bottom, transparent 0%, ${acc}55 20%, ${acc}33 70%, transparent 100%)`,
            }} />
            {/* Glowing node at top */}
            <div style={{
                position: "absolute", top: "8%", left: "50%", transform: "translateX(-50%)",
                width: 8, height: 8, borderRadius: "50%",
                background: sc, boxShadow: `0 0 12px ${sc}, 0 0 24px ${sc}66`,
                transition: "background 0.5s, box-shadow 0.5s",
            }} />
            {/* Stress badge */}
            <div style={{
                position: "absolute", top: "14%", left: "50%", transform: "translateX(-50%)",
                whiteSpace: "nowrap",
                fontFamily: "'Courier Prime',monospace", fontSize: 10,
                letterSpacing: "0.25em", textTransform: "uppercase",
                color: `${sc}cc`,
                background: "rgba(0,0,0,0.7)",
                border: `1px solid ${sc}44`,
                borderRadius: 2, padding: "3px 8px",
                transition: "color 0.5s, border-color 0.5s",
            }}>
                {loading ? "Processing..." : `Stress ${Math.round(stressLevel * 100)}%`}
            </div>
            {/* Ticking pulse rings */}
            {loading && (
                <motion.div
                    key={tick}
                    initial={{ scale: 0, opacity: 0.7 }}
                    animate={{ scale: 3.5, opacity: 0 }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    style={{
                        position: "absolute", top: "8%", left: "50%",
                        transform: "translateX(-50%)",
                        width: 8, height: 8, borderRadius: "50%",
                        border: `1px solid ${sc}`,
                    }}
                />
            )}
            {/* Midpoint cross */}
            <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                width: 14, height: 14,
            }}>
                <div style={{ position: "absolute", top: 6, left: 0, right: 0, height: 1, background: `${acc}55` }} />
                <div style={{ position: "absolute", left: 6, top: 0, bottom: 0, width: 1, background: `${acc}55` }} />
            </div>
        </div>
    );
}

export default function InterviewRoom() {
    const { characterId } = useParams();
    const navigate = useNavigate();
    const { sessionId, setUnlockedEvidence, setPhase } = useSession();
    const { setProgressData } = useProgress();

    const meta = CHARACTER_DATA[characterId] || { name: characterId || "Unknown", role: "Unknown Role", image: null };
    const cm = CHAR_META[characterId] || { accent: "#f5c842", trait: "UNKNOWN", bgR: "245,200,66" };
    const acc = cm.accent;

    const [gender, setGender] = useState(() => localStorage.getItem("detective_gender") || "male");
    useEffect(() => {
        const s = () => setGender(localStorage.getItem("detective_gender") || "male");
        window.addEventListener("storage", s);
        return () => window.removeEventListener("storage", s);
    }, []);
    const detImg = gender === "female" ? detectiveFemaleImg : detectiveMaleImg;

    const [stressLevel, setStressLevel] = useState(0.12);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [latestC, setLatestC] = useState(null);
    const [activeSp, setActiveSp] = useState(null);
    const [charBubble, setCharBubble] = useState("");
    const [playerBubble, setPlayerBubble] = useState("");
    const [showGraph, setShowGraph] = useState(false);
    const [blink, setBlink] = useState(true);
    const [hintActive, setHintActive] = useState(false);

    const logRef = useRef(null);
    const typingRef = useRef(null);
    const bblRef = useRef(null);

    useEffect(() => { const id = setInterval(() => setBlink(v => !v), 520); return () => clearInterval(id); }, []);

    useEffect(() => {
        const go = async () => {
            try {
                const r = await fetch(`${API_BASE}/facts/${characterId}`);
                const d = await r.json();
                const facts = Array.isArray(d) ? d : (d.facts || []);
                const safe = facts.length ? facts : (FALLBACK_FACTS[characterId] || []);
                setNodes(mkNodes(safe, acc)); setEdges(mkEdges(safe, acc));
            } catch {
                const fb = FALLBACK_FACTS[characterId] || [];
                setNodes(mkNodes(fb, acc)); setEdges(mkEdges(fb, acc));
            }
        };
        go();
        return () => { if (typingRef.current) clearInterval(typingRef.current); };
    }, [characterId, acc]);

    useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [messages]);

    const runTypewriter = (text, hintInj) => {
        if (typingRef.current) { clearInterval(typingRef.current); typingRef.current = null; }
        const id = `r-${Date.now()}`; let i = 0;
        setActiveSp("character"); setCharBubble(""); setHintActive(!!hintInj);
        setMessages(p => [...p, { id, sender: "character", text: "", fullText: text, hintInj, typing: true }]);
        typingRef.current = setInterval(() => {
            i++;
            if (i % 4 === 0) { try { typewriterClick.stop(); typewriterClick.play(); } catch { } }
            const part = text.slice(0, i);
            setCharBubble(part);
            if (bblRef.current) bblRef.current.scrollTop = bblRef.current.scrollHeight;
            setMessages(p => p.map(m => m.id === id ? { ...m, text: part } : m));
            if (i >= text.length) {
                clearInterval(typingRef.current); typingRef.current = null;
                try { typewriterClick.stop(); } catch { }
                setMessages(p => p.map(m => m.id === id ? { ...m, text, typing: false } : m));
                setCharBubble(text);
                setTimeout(() => setActiveSp(null), 2000);
            }
        }, 38);
    };

    const handleSend = async () => {
        const t = input.trim();
        if (!t || !sessionId || loading) return;
        setActiveSp("player"); setPlayerBubble(t);
        setMessages(p => [...p, { id: `p-${Date.now()}`, sender: "player", text: t }]);
        setInput(""); setLoading(true);
        setTimeout(() => setActiveSp(null), 900);
        try {
            const r = await fetch(`${API_BASE}/interview`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ character_id: characterId, player_message: t, session_id: sessionId }),
            });
            if (!r.ok) throw new Error();
            const d = await r.json();
            setLoading(false);
            setStressLevel(d.stress_level ?? 0);
            if (d.active_fact_ids?.length) {
                setNodes(prev => prev.map(n => ({
                    ...n, style: {
                        ...n.style,
                        background: d.active_fact_ids.includes(n.id) ? `${acc}22` : "#100d18",
                        borderColor: d.active_fact_ids.includes(n.id) ? acc : `${acc}44`,
                    }
                })));
            }
            runTypewriter(d.response_text || "", !!d.hint_injected);
            if (d.contradiction_event) setLatestC(d.contradiction_event);
            if (d.progress?.show) setProgressData(d.progress);
            if (sessionId) {
                fetch(`${API_BASE}/game-state/${sessionId}`)
                    .then(r => r.ok ? r.json() : null)
                    .then(gs => { if (!gs) return; if (gs.phase) setPhase(gs.phase); if (gs.unlocked_evidence) setUnlockedEvidence(gs.unlocked_evidence); })
                    .catch(() => { });
            }
        } catch {
            setLoading(false);
            runTypewriter("The character pauses, lips tight, eyes elsewhere.", false);
        }
    };

    const AUTO_QUESTIONS = {
        victor: ["hello", "where were you before 11", "where were you at 11?", "did you go to the lounge?", "what is synergy solutions?", "what do you know about hayes?", "why did you hate julian?", "who do you think is a suspect?", "why did you swap the drink?", "did you kill julian?", "i think you are overexplaining. i never said you killed him.", "where were you at 11?", "did you poison his drink?"],
        martha: ["hello", "where were you at 11?", "did you take pictures of the lounge?", "what did dr collins do?", "did you see victor?", "when was the last time you saw victor?", "did you poison the drink?", "who killed julian?", "did you see victor?"],
        hayes: ["hello", "where were you at 11?", "why were you in the server room?", "what were you doing at midnight?", "did victor steal your code?", "did you take the digitalis?", "did you kill julian?", "did you kill julian?"],
        dr_collins: ["hello", "where were you at 11?", "did you go to the lounge?", "why did you bring digitalis?", "what did you see at midnight?", "who killed julian?", "why did you bring digitalis?"],
        rose: ["hello", "what was in the vip kit?", "did you set up the lounge?", "who had access to the judges lounge?", "did you see dr collins?", "who killed julian?"],
    };

    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const autoPlayRef = useRef(false);

    const toggleAutoPlay = async () => {
        if (isAutoPlaying) { setIsAutoPlaying(false); autoPlayRef.current = false; return; }
        const questions = AUTO_QUESTIONS[characterId];
        if (!questions?.length) return;
        setIsAutoPlaying(true); autoPlayRef.current = true;
        for (const q of questions) {
            if (!autoPlayRef.current) break;
            setInput(q);
            await new Promise(r => setTimeout(r, 100));
            if (!sessionId) continue;
            setActiveSp("player"); setPlayerBubble(q);
            setMessages(prev => [...prev, { id: `player-${Date.now()}`, sender: "player", text: q }]);
            setInput(""); setLoading(true);
            setTimeout(() => setActiveSp(null), 700);
            try {
                const r = await fetch(`${API_BASE}/interview`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ character_id: characterId, player_message: q, session_id: sessionId }),
                });
                if (!r.ok) throw new Error();
                const d = await r.json();
                if (!autoPlayRef.current) { setLoading(false); return; }
                setLoading(false);
                setStressLevel(d.stress_level ?? 0);
                runTypewriter(d.response_text || "", !!d.hint_injected);
                if (d.contradiction_event) setLatestC(d.contradiction_event);
                if (d.progress?.show) setProgressData(d.progress);
                if (sessionId) {
                    fetch(`${API_BASE}/game-state/${sessionId}`)
                        .then(r => r.ok ? r.json() : null)
                        .then(gs => { if (!gs) return; if (gs.phase) setPhase(gs.phase); if (gs.unlocked_evidence) setUnlockedEvidence(gs.unlocked_evidence); })
                        .catch(() => { });
                }
                let isTyping = true;
                while (isTyping && autoPlayRef.current) {
                    await new Promise(r => setTimeout(r, 500));
                    setActiveSp(sp => { isTyping = sp === "character"; return sp; });
                }
                await new Promise(r => setTimeout(r, 3500));
            } catch {
                setLoading(false);
                runTypewriter("The character pauses, lips tight, eyes elsewhere.", false);
            }
        }
        setIsAutoPlaying(false); autoPlayRef.current = false;
    };

    const traitColor = {
        SUSPECT: "#e74c3c", VICTIM: "#e74c3c", WITNESS: "#3498db", ALLY: "#1abc9c", UNKNOWN: "#f5c842"
    }[cm.trait] || "#f5c842";

    return (
        <>
            <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Special+Elite&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
            *{cursor:crosshair!important;box-sizing:border-box}

            .ir-wrap{
                position:fixed;
                top:0;bottom:0;right:0;
                left:var(--hud-width,52px);
                display:grid;
                grid-template-rows:52px 1fr 240px;
                background:#08060f;
                font-family:'Courier Prime',monospace;
                color:#e8dcc8;
                overflow:hidden;
            }

            /* film grain */
            .ir-wrap::before{
                content:'';position:fixed;inset:0;z-index:9980;pointer-events:none;opacity:.035;
                background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
                background-size:180px;
            }
            /* vignette */
            .ir-wrap::after{
                content:'';position:fixed;inset:0;z-index:9979;pointer-events:none;
                background:radial-gradient(ellipse at 50% 35%,transparent 42%,rgba(0,0,0,.68) 100%);
            }

            /* ── TOP BAR ── */
            .ir-bar{
                grid-row:1;
                display:grid;
                grid-template-columns:1fr auto 1fr;
                align-items:center;
                padding:0 20px;
                background:rgba(5,3,12,0.96);
                border-bottom:1px solid rgba(255,255,255,.055);
                position:relative;z-index:40;
            }
            .ir-bar-left{ display:flex;align-items:center;gap:12px }
            .ir-bar-center{ text-align:center }
            .ir-bar-right{ display:flex;align-items:center;gap:12px;justify-content:flex-end }

            /* ── STAGE ── */
            .ir-stage{
                grid-row:2;
                position:relative;
                display:grid;
                grid-template-columns:1fr 1fr;
                align-items:flex-end;
                overflow:hidden;
            }

            /* character-side vs detective-side */
            .stage-char{
                display:flex;flex-direction:column;align-items:center;
                justify-content:flex-end;
                padding-bottom:0;
                position:relative;z-index:5;
            }
            .stage-det{
                display:flex;flex-direction:column;align-items:center;
                justify-content:flex-end;
                padding-bottom:0;
                position:relative;z-index:5;
            }

            /* portrait frame */
            .p-frame{
                width:clamp(170px,13vw,230px);
                height:clamp(270px,21vw,350px);
                border-radius:12px 12px 0 0;
                overflow:hidden;
                position:relative;
            }
            .p-frame img{width:100%;height:100%;object-fit:cover;object-position:center top;display:block}
            .p-fade{position:absolute;bottom:0;left:0;right:0;height:45%;
                background:linear-gradient(to top,rgba(8,6,15,1) 0%,rgba(8,6,15,.6) 55%,transparent 100%);
                pointer-events:none}
            .p-sheen{position:absolute;inset:0;
                background:linear-gradient(135deg,rgba(255,255,255,.055) 0%,transparent 40%);
                pointer-events:none}

            /* name plate */
            .p-name{
                width:clamp(170px,13vw,230px);
                text-align:center;
                padding:8px 12px 10px;
                background:rgba(0,0,0,.92);
                border-radius:0 0 10px 10px;
                font-family:'Special Elite',cursive;
                font-size:13px;letter-spacing:.08em;
            }

            /* speech bubbles */
            .bbl-char{
                width:clamp(220px,22vw,360px);
                max-height:clamp(100px,16vh,200px);
                margin-bottom:12px;
                display:flex;flex-direction:column;
            }
            .bbl-you{
                width:clamp(200px,20vw,330px);
                max-height:clamp(100px,16vh,200px);
                margin-bottom:12px;
                display:flex;flex-direction:column;
            }
            .bbl-inner{
                padding:12px 16px;
                border-radius:14px;
                font-family:'Courier Prime',monospace;
                font-size:13px;line-height:1.65;
                position:relative;
                backdrop-filter:blur(10px);
                overflow-y:auto;flex:1;
            }
            .bbl-inner::-webkit-scrollbar{width:2px}
            .bbl-inner::-webkit-scrollbar-thumb{background:rgba(245,200,66,.2);border-radius:2px}

            /* ── DIALOGUE PANEL ── */
            .ir-dlg{
                grid-row:3;
                display:flex;flex-direction:column;
                padding:10px 24px 12px;
                background:rgba(5,3,12,0.97);
                border-top:1px solid rgba(255,255,255,.055);
                overflow:hidden;position:relative;z-index:30;
            }
            .chat-log{
                flex:1;overflow-y:auto;
                display:flex;flex-direction:column;gap:7px;
                padding-right:4px;margin-bottom:9px;
            }
            .chat-log::-webkit-scrollbar{width:2px}
            .chat-log::-webkit-scrollbar-thumb{background:rgba(245,200,66,.15);border-radius:2px}

            .msg{
                max-width:58%;padding:8px 14px;
                border-radius:10px;
                font-size:13px;line-height:1.6;
                font-family:'Courier Prime',monospace;
            }

            /* Input row */
            .q-input{
                flex:1;
                background:rgba(255,255,255,.035);
                border:1px solid rgba(255,255,255,.08);
                border-radius:8px;
                padding:9px 14px;
                font-family:'Courier Prime',monospace;font-size:13px;
                color:#e8dcc8;
                outline:none;
                transition:border-color .2s,box-shadow .2s;
            }
            .q-input:focus{
                border-color:rgba(245,200,66,.35);
                box-shadow:0 0 0 2px rgba(245,200,66,.05);
            }
            .q-input::placeholder{color:rgba(196,184,154,.25)}
            .q-input:disabled{opacity:.4}

            .send-btn{
                background:rgba(245,200,66,.08);
                border:1px solid rgba(245,200,66,.28);
                border-radius:8px;
                padding:9px 22px;
                font-family:'Special Elite',cursive;font-size:13px;
                letter-spacing:.18em;color:#f5c842;
                cursor:crosshair!important;
                transition:all .18s;
                white-space:nowrap;text-transform:uppercase;
            }
            .send-btn:hover:not(:disabled){background:rgba(245,200,66,.16);box-shadow:0 0 14px rgba(245,200,66,.18)}
            .send-btn:disabled{opacity:.3;cursor:not-allowed!important}

            /* Pill buttons in topbar */
            .pill-btn{
                font-family:'Special Elite',cursive;
                font-size:11px;letter-spacing:.18em;
                text-transform:uppercase;
                color:rgba(196,184,154,.5);
                background:transparent;
                border:1px solid rgba(196,184,154,.14);
                border-radius:3px;padding:4px 11px;
                cursor:crosshair!important;transition:all .18s;
            }
            .pill-btn:hover{color:rgba(196,184,154,.9);border-color:rgba(196,184,154,.35)}

            .amber-btn{
                font-family:'Courier Prime',monospace;
                font-size:11px;letter-spacing:.2em;
                text-transform:uppercase;
                color:rgba(245,200,66,.42);
                background:transparent;
                border:1px solid rgba(245,200,66,.14);
                border-radius:3px;padding:4px 11px;
                cursor:crosshair!important;transition:all .18s;
            }
            .amber-btn:hover{color:rgba(245,200,66,.85);border-color:rgba(245,200,66,.33)}
            .amber-btn.active-stop{color:rgba(231,76,60,.8)!important;border-color:rgba(231,76,60,.28)!important}

            @keyframes dot-blink{0%,100%{opacity:1}50%{opacity:.12}}
            .dot{animation:dot-blink 1.1s ease-in-out infinite;display:inline-block;width:6px;height:6px;border-radius:50%}
            .dot:nth-child(2){animation-delay:.18s}.dot:nth-child(3){animation-delay:.36s}

            @keyframes float-char{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
            @keyframes float-you{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
            .anim-char{animation:float-char 4s ease-in-out infinite}
            .anim-you{animation:float-you 3.8s ease-in-out infinite .5s}

            @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}

            .ov-widgets{position:fixed;top:60px;right:20px;z-index:9900;display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none;transition:right .2s ease}
            .ov-widgets>*{pointer-events:auto}
            .ov-widgets.graph-open{right:340px}
            `}</style>

            <DetectiveHUD />

            <div className="ir-wrap">

                {/* ── TOP BAR ─────────────────────────────────────────────── */}
                <div className="ir-bar">
                    {/* Left */}
                    <div className="ir-bar-left">
                        <button className="pill-btn" onClick={() => navigate("/board")}>← Board</button>
                        <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 11, letterSpacing: ".3em", color: "rgba(245,200,66,.2)", textTransform: "uppercase" }}>CASE #0001</span>
                    </div>

                    {/* Center — name + trait */}
                    <div className="ir-bar-center">
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(17px,1.5vw,22px)", fontWeight: 900, fontStyle: "italic", color: acc, textShadow: `0 0 20px ${acc}55`, lineHeight: 1.15 }}>
                            {meta.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "center", marginTop: 2 }}>
                            <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: traitColor, border: `1px solid ${traitColor}44`, background: `${traitColor}0e`, padding: "2px 8px", borderRadius: 2 }}>
                                {cm.trait}
                            </span>
                            <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 11, color: "rgba(196,184,154,.35)" }}>{meta.role}</span>
                        </div>
                    </div>

                    {/* Right — stress bar + buttons */}
                    <div className="ir-bar-right">
                        {/* Stress meter */}
                        <div style={{ width: "clamp(90px,8vw,130px)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Courier Prime',monospace", fontSize: 10, letterSpacing: ".15em", color: "rgba(196,184,154,.35)", marginBottom: 3 }}>
                                <span>STRESS</span>
                                <span style={{ color: stressCol(stressLevel) }}>{Math.round(stressLevel * 100)}%</span>
                            </div>
                            <div style={{ height: 3, background: "rgba(255,255,255,.06)", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ width: `${Math.round(stressLevel * 100)}%`, height: "100%", borderRadius: 3, background: stressCol(stressLevel), boxShadow: `0 0 6px ${stressCol(stressLevel)}88`, transition: "width .6s,background .5s" }} />
                            </div>
                        </div>
                        <button className={`amber-btn${isAutoPlaying ? " active-stop" : ""}`} onClick={toggleAutoPlay}>
                            {isAutoPlaying ? "Stop" : "Auto-Play"}
                        </button>
                        <button className="amber-btn" onClick={() => setShowGraph(v => !v)}>
                            {showGraph ? "Facts ▾" : "Facts ▸"}
                        </button>
                    </div>
                </div>

                {/* ── STAGE ────────────────────────────────────────────────── */}
                <div className="ir-stage">

                    {/* Stage background — perspective floor + colored atmosphere */}
                    <div style={{
                        position: "absolute", inset: 0, zIndex: 0,
                        background: `
                            radial-gradient(ellipse 60% 55% at 25% 100%, rgba(${cm.bgR},.14) 0%, transparent 65%),
                            radial-gradient(ellipse 50% 45% at 75% 100%, rgba(245,200,66,.07) 0%, transparent 60%),
                            radial-gradient(ellipse 80% 40% at 50% 0%, rgba(${cm.bgR},.06) 0%, transparent 70%),
                            linear-gradient(180deg, #0c0917 0%, #08060f 100%)
                        `,
                    }} />

                    {/* Perspective floor grid */}
                    <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0, height: "38%",
                        backgroundImage: `
                            linear-gradient(rgba(${cm.bgR},.06) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(${cm.bgR},.04) 1px, transparent 1px)
                        `,
                        backgroundSize: "52px 32px",
                        transform: "perspective(300px) rotateX(58deg)",
                        transformOrigin: "bottom center",
                        opacity: .55, zIndex: 1, pointerEvents: "none",
                    }} />

                    {/* Overhead lamp beam — center */}
                    <div style={{
                        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                        width: "28%", height: "80%",
                        background: `radial-gradient(ellipse at top, ${acc}0c 0%, transparent 65%)`,
                        zIndex: 1, pointerEvents: "none",
                    }} />
                    {/* Vertical center beam line */}
                    <div style={{
                        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                        width: 1, height: "100%",
                        background: `linear-gradient(to bottom, ${acc}33 0%, ${acc}11 50%, transparent 100%)`,
                        zIndex: 1, pointerEvents: "none",
                    }} />

                    {/* Center divider with stress indicator */}
                    <CenterDivider acc={acc} loading={loading} stressLevel={stressLevel} />

                    {/* ── CHARACTER (left half) ── */}
                    <div className="stage-char">
                        {/* Speech bubble above portrait */}
                        <AnimatePresence>
                            {loading && !charBubble && (
                                <motion.div key="dots" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bbl-char">
                                    <div className="bbl-inner" style={{ background: "rgba(8,6,15,.9)", border: `1px solid ${acc}33`, borderRadius: "14px 14px 14px 4px" }}>
                                        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                                            {[0, 1, 2].map(i => <span key={i} className="dot" style={{ background: acc }} />)}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            {charBubble && (activeSp === "character" || activeSp === null) && (
                                <motion.div key="cbbl" initial={{ opacity: 0, scale: .92, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .94 }} className="bbl-char">
                                    <div ref={bblRef} className="bbl-inner" style={{ background: "rgba(8,6,15,.94)", border: `1px solid ${acc}33`, borderRadius: "14px 14px 14px 4px", boxShadow: `0 8px 32px rgba(0,0,0,.7)` }}>
                                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${acc},transparent)`, borderRadius: "14px 14px 0 0" }} />
                                        <div style={{ color: "#e8dcc8", fontFamily: "'Courier Prime',monospace", fontSize: 13, lineHeight: 1.65 }}>
                                            {charBubble}{activeSp === "character" && <span style={{ opacity: blink ? 1 : 0, color: acc }}>|</span>}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Portrait */}
                        <motion.div className="anim-char" style={{ position: "relative" }}
                            initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 180, damping: 22, delay: .08 }}>
                            {/* Ground glow */}
                            <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", width: "140%", height: 100, background: `radial-gradient(ellipse,${acc}28 0%,transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
                            <div className="p-frame" style={{ border: `2px solid ${acc}55`, boxShadow: `0 0 0 1px rgba(0,0,0,.5), 0 0 32px ${acc}22, inset 0 0 20px rgba(0,0,0,.45)`, position: "relative", zIndex: 1 }}>
                                {meta.image
                                    ? <img src={meta.image} alt={meta.name} />
                                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, background: `radial-gradient(circle at 45% 30%,${acc}33,${acc}06)` }}>
                                        {cm.trait === "VICTIM" ? "🎓" : cm.trait === "SUSPECT" ? "🕴" : "👁"}
                                    </div>
                                }
                                <div className="p-fade" /><div className="p-sheen" />
                            </div>
                            <div className="p-name" style={{ color: acc, border: `1px solid ${acc}33`, borderTop: "none" }}>{meta.name}</div>
                        </motion.div>
                    </div>

                    {/* ── DETECTIVE (right half) ── */}
                    <div className="stage-det">
                        {/* Speech bubble */}
                        <AnimatePresence>
                            {activeSp === "player" && playerBubble && (
                                <motion.div key="pbbl" initial={{ opacity: 0, scale: .92, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .94 }} className="bbl-you">
                                    <div className="bbl-inner" style={{ background: "rgba(8,6,15,.94)", border: "1px solid rgba(245,200,66,.3)", borderRadius: "14px 14px 4px 14px", boxShadow: "0 8px 32px rgba(0,0,0,.7)" }}>
                                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,rgba(245,200,66,.5))", borderRadius: "14px 14px 0 0" }} />
                                        <div style={{ color: "#f5c842", fontFamily: "'Courier Prime',monospace", fontSize: 13, lineHeight: 1.65 }}>{playerBubble}</div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Detective portrait */}
                        <motion.div className="anim-you" style={{ position: "relative" }}
                            initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 180, damping: 22, delay: .15 }}>
                            <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", width: "125%", height: 90, background: "radial-gradient(ellipse,rgba(245,200,66,.16) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
                            <div className="p-frame" style={{ border: "2px solid rgba(245,200,66,.38)", boxShadow: "0 0 0 1px rgba(0,0,0,.5), 0 0 26px rgba(245,200,66,.14), inset 0 0 20px rgba(0,0,0,.45)", position: "relative", zIndex: 1 }}>
                                <img src={detImg} alt="You" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
                                <div className="p-fade" /><div className="p-sheen" />
                            </div>
                            <div className="p-name" style={{ color: "rgba(245,200,66,.78)", border: "1px solid rgba(245,200,66,.22)", borderTop: "none" }}>You</div>
                        </motion.div>
                    </div>

                    {/* ── FACT GRAPH overlay ── */}
                    <AnimatePresence>
                        {showGraph && (
                            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
                                transition={{ duration: .18, ease: "easeInOut" }}
                                style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "clamp(250px,26vw,320px)", background: "rgba(7,5,14,.97)", borderLeft: "1px solid rgba(255,255,255,.06)", zIndex: 20, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                <div style={{ padding: "10px 14px 7px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 10, letterSpacing: ".3em", color: "rgba(245,200,66,.25)", textTransform: "uppercase" }}>// Fact Graph</span>
                                    <button onClick={() => setShowGraph(false)} style={{ background: "transparent", border: "none", color: "rgba(196,184,154,.3)", fontSize: 15, cursor: "crosshair", padding: "0 3px", lineHeight: 1 }}>✕</button>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} panOnDrag zoomOnScroll>
                                        <Background gap={16} size={.5} color={`${acc}18`} /><Controls />
                                    </ReactFlow>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── DIALOGUE PANEL ─────────────────────────────────────── */}
                <div className="ir-dlg">
                    {/* Panel header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7, flexShrink: 0 }}>
                        <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 10, letterSpacing: ".3em", color: "rgba(245,200,66,.2)", textTransform: "uppercase" }}>// Interrogation Log</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {loading && (
                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 11, color: `${acc}bb` }}>Processing</span>
                                    {[0, 1, 2].map(i => <span key={i} className="dot" style={{ background: acc, width: 4, height: 4 }} />)}
                                </div>
                            )}
                            {hintActive && (
                                <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 10, color: "rgba(245,200,66,.5)", letterSpacing: ".14em", border: "1px solid rgba(245,200,66,.18)", padding: "2px 8px", borderRadius: 2 }}>
                                    Hint Active
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Message log */}
                    <div ref={logRef} className="chat-log">
                        {messages.length === 0 && (
                            <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: 12, color: "rgba(196,184,154,.22)", fontStyle: "italic" }}>
                                Approach the suspect. Ask your first question.
                            </div>
                        )}
                        {messages.map(msg => {
                            const isP = msg.sender === "player";
                            return (
                                <div key={msg.id} style={{ display: "flex", gap: 7, alignItems: "flex-start", justifyContent: isP ? "flex-end" : "flex-start" }}>
                                    {!isP && (
                                        <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: `1px solid ${acc}44`, overflow: "hidden", background: "#0c0a14", marginTop: 2 }}>
                                            {meta.image && <img src={meta.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                        </div>
                                    )}
                                    <div className="msg" style={{
                                        background: isP ? "rgba(245,200,66,.06)" : "rgba(16,10,24,.92)",
                                        border: isP ? "1px solid rgba(245,200,66,.18)" : `1px solid ${acc}1e`,
                                        borderRadius: isP ? "10px 10px 3px 10px" : "10px 10px 10px 3px",
                                        color: msg.hintInj ? "rgba(245,200,66,.82)" : isP ? "#f5c842" : "#e8dcc8",
                                        fontStyle: msg.hintInj ? "italic" : "normal",
                                    }}>
                                        {msg.text}{msg.typing && <span style={{ opacity: blink ? 1 : 0, color: acc }}>|</span>}
                                    </div>
                                    {isP && (
                                        <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: "1px solid rgba(245,200,66,.25)", overflow: "hidden", background: "#0c0a14", marginTop: 2 }}>
                                            <img src={detImg} alt="You" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Input row */}
                    <div style={{ display: "flex", gap: 9, flexShrink: 0 }}>
                        <input className="q-input" type="text" value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
                            placeholder={`Ask ${meta.name.split(" ")[0]} about the timeline, alibi, evidence…`}
                            disabled={loading} />
                        <button className="send-btn" onClick={handleSend} disabled={!sessionId || loading}>
                            {loading ? "…" : "Ask ▶"}
                        </button>
                    </div>
                </div>
            </div>

            <div className={`ov-widgets${showGraph ? " graph-open" : ""}`}>
                <HintButton />
                <HintCard />
                <ContradictionAlert contradictionEvent={latestC} onDismiss={() => setLatestC(null)} />
            </div>
        </>
    );
}