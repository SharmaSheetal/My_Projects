import { motion } from "framer-motion";

function getStressMood(stressLevel) {
    if (stressLevel < 0.33) {
        return {
            glow: "shadow-[0_0_24px_rgba(101,163,13,0.18)]",
            ring: "border-lime-400/30",
            tint: "from-lime-400/8",
            brow: "rotate-0",
            mouth: "h-2",
        };
    }

    if (stressLevel < 0.66) {
        return {
            glow: "shadow-[0_0_24px_rgba(245,158,11,0.22)]",
            ring: "border-amber-400/35",
            tint: "from-amber-400/10",
            brow: "-rotate-2",
            mouth: "h-2.5",
        };
    }

    return {
        glow: "shadow-[0_0_28px_rgba(239,68,68,0.28)]",
        ring: "border-red-400/40",
        tint: "from-red-400/12",
        brow: "-rotate-6",
        mouth: "h-3",
    };
}

export default function AnimatedPortrait({
    name,
    image,
    border = "border-white/20",
    loading = false,
    speaking = false,
    stressLevel = 0,
}) {
    const mood = getStressMood(stressLevel);

    return (
        <motion.div
            animate={
                loading
                    ? {
                        y: [0, -2, 0],
                        scale: [1, 1.03, 1],
                        opacity: [0.9, 1, 0.9],
                    }
                    : {
                        y: [0, -1, 0],
                        scale: [1, 1.01, 1],
                    }
            }
            transition={{
                duration: loading ? 1.1 : 3.2,
                repeat: Infinity,
                ease: "easeInOut",
            }}
            className={`relative h-24 w-24 overflow-hidden rounded-2xl border bg-neutral-900 ${border} ${mood.glow}`}
        >
            <div className={`absolute inset-0 bg-gradient-to-b ${mood.tint} to-transparent`} />

            {image ? (
                <img
                    src={image}
                    alt={name}
                    className="h-full w-full object-cover"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl text-neutral-300">
                    ?
                </div>
            )}

            <div className={`pointer-events-none absolute inset-0 rounded-2xl border ${mood.ring}`} />

            <motion.div
                className="pointer-events-none absolute left-[24%] top-[30%] h-[10px] w-[10px] rounded-full bg-black/75"
                animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
                transition={{ duration: 4.6, repeat: Infinity, times: [0, 0.44, 0.48, 0.52, 1] }}
            />
            <motion.div
                className="pointer-events-none absolute right-[24%] top-[30%] h-[10px] w-[10px] rounded-full bg-black/75"
                animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
                transition={{ duration: 4.6, repeat: Infinity, times: [0, 0.44, 0.48, 0.52, 1] }}
            />

            <div
                className={`pointer-events-none absolute left-[18%] top-[24%] h-[3px] w-[18px] rounded-full bg-black/55 ${mood.brow}`}
            />
            <div
                className={`pointer-events-none absolute right-[18%] top-[24%] h-[3px] w-[18px] rounded-full bg-black/55 ${mood.brow}`}
            />

            <motion.div
                className={`pointer-events-none absolute left-1/2 top-[66%] w-[26px] -translate-x-1/2 rounded-full bg-black/70 ${mood.mouth}`}
                animate={
                    speaking
                        ? {
                            scaleX: [1, 0.82, 1.08, 0.9, 1],
                            scaleY: [1, 1.45, 0.85, 1.35, 1],
                        }
                        : {
                            scaleX: 1,
                            scaleY: 1,
                        }
                }
                transition={{
                    duration: 0.28,
                    repeat: speaking ? Infinity : 0,
                    ease: "easeInOut",
                }}
            />

            {loading ? (
                <motion.div
                    className="pointer-events-none absolute inset-0 rounded-2xl border border-amber-300/20"
                    animate={{ opacity: [0.15, 0.45, 0.15] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                />
            ) : null}
        </motion.div>
    );
}