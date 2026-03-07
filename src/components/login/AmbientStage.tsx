import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n, type CopyKey } from "@/lib/i18n";

/* ── Timing config ── */
const CYCLE_MS = 8000;             // switch every 8s
const FADE_DURATION = 0.8;         // crossfade seconds
const BUBBLE_STAGGER = 0.4;        // stagger between bubbles

/* ── Bubble positions (percentage-based, fixed per slot) ── */
interface BubbleSlot {
  top?: string; bottom?: string; left?: string; right?: string;
  maxW: string;
  floatY: number;   // ±px amplitude
  floatS: number;   // float period seconds
}

const SLOTS: BubbleSlot[] = [
  { top: "12%",  right: "6%",  maxW: "200px", floatY: 10, floatS: 7  },
  { bottom: "28%", left: "4%",  maxW: "210px", floatY: 8,  floatS: 9  },
  { top: "42%",  left: "8%",   maxW: "190px", floatY: 6,  floatS: 11 },
  { bottom: "10%", right: "8%", maxW: "185px", floatY: 7,  floatS: 8  },
];

/* ── Mode definitions ── */
type Mode = "vision" | "pyramid";

const VISION_BUBBLES: CopyKey[] = ["vBubble1", "vBubble2", "vBubble3"];
const PYRAMID_BUBBLES: CopyKey[] = ["pBubble1", "pBubble2", "pBubble3"];

/* ── Reduced motion check ── */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/* ── Floating bubble ── */
function FloatingBubble({
  copyKey, slot, delay, reduced,
}: {
  copyKey: CopyKey; slot: BubbleSlot; delay: number; reduced: boolean;
}) {
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: reduced ? 0.15 : FADE_DURATION, delay: reduced ? 0 : delay, ease: "easeOut" }}
      className="absolute bg-white/30 backdrop-blur-2xl rounded-2xl border border-white/50 px-5 py-3.5 shadow-[0_4px_30px_rgba(0,0,0,0.03),0_0_1px_rgba(255,255,255,0.5)_inset]"
      style={{
        top: slot.top, bottom: slot.bottom,
        left: slot.left, right: slot.right,
        maxWidth: slot.maxW,
      }}
    >
      {/* Inner float animation — CSS only for performance */}
      <motion.p
        className="text-[11px] text-[#999] leading-relaxed font-medium"
        animate={reduced ? {} : { y: [0, -slot.floatY, 0] }}
        transition={reduced ? {} : {
          duration: slot.floatS,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {t(copyKey)}
      </motion.p>
    </motion.div>
  );
}

/* ── Vision mode: compass-like icon with label ── */
function VisionVisual({ reduced }: { reduced: boolean }) {
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: reduced ? 0.15 : FADE_DURATION, ease: "easeOut" }}
      className="relative w-[260px] h-[260px]"
    >
      {/* Glow */}
      <div className="absolute inset-[-50px] rounded-full bg-[#F0C8A0] opacity-[0.06] blur-[60px]" />
      <div className="absolute inset-[-35px] rounded-full bg-white/20 blur-[45px]" />

      {/* Rings */}
      <div className="absolute inset-0 rounded-full border border-black/[0.07] shadow-[0_0_50px_rgba(255,255,255,0.35),0_0_1px_rgba(0,0,0,0.05)_inset]" />
      <div className="absolute inset-5 rounded-full border border-black/[0.05]" />
      <div className="absolute inset-10 rounded-full border border-black/[0.03]" />

      {/* Tick marks */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <div
          key={deg}
          className="absolute top-1/2 left-1/2 w-px h-[8px] bg-black/[0.08] origin-[0_0]"
          style={{ transform: `rotate(${deg}deg) translateY(-125px)` }}
        />
      ))}

      {/* Cardinal labels */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#111]/30 tracking-[0.18em]">
        {t("compassN")}
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#111]/30 tracking-[0.18em]">
        {t("compassS")}
      </div>
      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#111]/30 tracking-[0.18em]">
        {t("compassW")}
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#111]/30 tracking-[0.18em]">
        {t("compassE")}
      </div>

      {/* Cross + diagonals */}
      <div className="absolute top-1/2 left-8 right-8 h-px bg-black/[0.06]" />
      <div className="absolute left-1/2 top-8 bottom-8 w-px bg-black/[0.06]" />
      <div className="absolute top-1/2 left-1/2 w-[140px] h-px bg-black/[0.03] origin-center rotate-45 -translate-x-1/2" />
      <div className="absolute top-1/2 left-1/2 w-[140px] h-px bg-black/[0.03] origin-center -rotate-45 -translate-x-1/2" />

      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-black/[0.10] shadow-[0_0_14px_rgba(0,0,0,0.06)]" />
    </motion.div>
  );
}

/* ── Pyramid mode: 3-tier line pyramid ── */
function PyramidVisual({ reduced }: { reduced: boolean }) {
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: reduced ? 0.15 : FADE_DURATION, ease: "easeOut" }}
      className="relative w-[260px] h-[240px]"
    >
      <div className="absolute inset-[-25px] rounded-full bg-white/10 blur-[45px]" />

      <svg viewBox="0 0 260 240" className="w-full h-full" fill="none">
        <polygon points="130,12 12,228 248,228" stroke="rgba(0,0,0,0.07)" strokeWidth="1.2" fill="none" />
        <line x1="62" y1="92" x2="198" y2="92" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
        <line x1="40" y1="158" x2="220" y2="158" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
        <polygon points="130,50 60,195 200,195" stroke="rgba(0,0,0,0.025)" strokeWidth="0.8" fill="none" />
      </svg>

      {/* Tier labels */}
      <div className="absolute top-[14%] left-1/2 -translate-x-1/2 text-center">
        <p className="text-[9px] font-bold text-[#111]/30 tracking-[0.18em] whitespace-nowrap">{t("pyramidT1")}</p>
      </div>
      <div className="absolute top-[43%] left-1/2 -translate-x-1/2 text-center">
        <p className="text-[9px] font-bold text-[#111]/25 tracking-[0.15em] whitespace-nowrap">{t("pyramidT2")}</p>
      </div>
      <div className="absolute top-[70%] left-1/2 -translate-x-1/2 text-center">
        <p className="text-[9px] font-bold text-[#111]/20 tracking-[0.15em] whitespace-nowrap">{t("pyramidT3")}</p>
      </div>
    </motion.div>
  );
}

/* ── Main ambient stage ── */
export default function AmbientStage() {
  const [mode, setMode] = useState<Mode>("vision");
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => {
      setMode((prev) => (prev === "vision" ? "pyramid" : "vision"));
    }, CYCLE_MS);
    return () => clearInterval(timer);
  }, [reduced]);

  const bubbleKeys = mode === "vision" ? VISION_BUBBLES : PYRAMID_BUBBLES;

  return (
    <div className="absolute inset-0">
      {/* Warm ambient glows */}
      <div className="absolute top-[15%] left-[25%] w-[450px] h-[450px] rounded-full bg-[#F0A868] opacity-[0.07] blur-[140px]" />
      <div className="absolute bottom-[20%] right-[25%] w-[300px] h-[300px] rounded-full bg-[#E8A07A] opacity-[0.06] blur-[120px]" />

      {/* Central visual — crossfades between vision/pyramid */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {mode === "vision" ? (
            <VisionVisual key="vision" reduced={reduced} />
          ) : (
            <PyramidVisual key="pyramid" reduced={reduced} />
          )}
        </AnimatePresence>
      </div>

      {/* Bubbles — staggered entrance, float while visible */}
      <AnimatePresence mode="wait">
        <motion.div key={mode} className="absolute inset-0">
          {bubbleKeys.map((key, i) => (
            <FloatingBubble
              key={`${mode}-${key}`}
              copyKey={key}
              slot={SLOTS[i]}
              delay={i * BUBBLE_STAGGER}
              reduced={reduced}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Copyright — always visible, gentle drift */}
      <motion.div
        className="absolute bottom-[3%] right-[10%] bg-white/25 backdrop-blur-2xl rounded-xl border border-white/40 px-4 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
        animate={reduced ? {} : { y: [0, -5, 0] }}
        transition={reduced ? {} : { duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        <p className="text-[10px] text-[#bbb] font-medium">&copy; 2025 Bilden Education</p>
      </motion.div>

      {/* Mode indicator dots */}
      <div className="absolute bottom-[3%] left-1/2 -translate-x-1/2 flex gap-2">
        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${mode === "vision" ? "bg-black/20 scale-100" : "bg-black/[0.07] scale-75"}`} />
        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${mode === "pyramid" ? "bg-black/20 scale-100" : "bg-black/[0.07] scale-75"}`} />
      </div>
    </div>
  );
}
