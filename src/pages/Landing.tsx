import { useNavigate } from "react-router-dom";
import { Paperclip, Mic, Upload, Search, ArrowRight, LogIn, Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import logo from "@/assets/logo.png";
import { useEffect, useState, useCallback } from "react";

const QUESTIONS_ZH = [
  "我应该怎么为家庭制定一个战略？",
  "我应该如何跟孩子更好地沟通？",
  "我应该怎么跟我的伴侣沟通？",
  "孩子未来 3 到 5 年的规划应该怎么做？",
  "我该如何进行家里的「家族传承」和「精神考古」？",
  "我应该怎么去察觉孩子的一些天赋？",
  "如何平衡工作与家庭的时间分配？",
];

const QUESTIONS_EN = [
  "How should I create a strategy for my family?",
  "How can I communicate better with my child?",
  "How should I communicate with my partner?",
  "How to plan for my child's next 3-5 years?",
  "How do I explore our family legacy and values?",
  "How can I discover my child's talents?",
  "How to balance work and family time?",
];

const Landing = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();

  const QUESTIONS = lang === "zh" ? QUESTIONS_ZH : QUESTIONS_EN;

  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [startTyping, setStartTyping] = useState(false);

  const [displayText, setDisplayText] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // Staggered entrance animation
  useEffect(() => {
    const t1 = setTimeout(() => setShowTitle(true), 100);
    const t2 = setTimeout(() => setShowSubtitle(true), 400);
    const t3 = setTimeout(() => setShowButton(true), 700);
    const t4 = setTimeout(() => setShowChat(true), 1000);
    const t5 = setTimeout(() => setStartTyping(true), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, []);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((p) => !p), 530);
    return () => clearInterval(interval);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!startTyping) return;
    const currentQuestion = QUESTIONS[questionIndex % QUESTIONS.length];
    const typeSpeed = 80;
    const deleteSpeed = 40;
    const pauseBeforeDelete = 2000;
    const pauseBeforeNext = 500;

    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (displayText.length < currentQuestion.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentQuestion.slice(0, displayText.length + 1));
        }, typeSpeed);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), pauseBeforeDelete);
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, deleteSpeed);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(false);
          setQuestionIndex((prev) => (prev + 1) % QUESTIONS.length);
        }, pauseBeforeNext);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, questionIndex, startTyping, QUESTIONS]);

  // Reset typewriter when language changes
  useEffect(() => {
    setDisplayText("");
    setQuestionIndex(0);
    setIsDeleting(false);
  }, [lang]);

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Base background */}
      <div className="absolute inset-0 -z-20 bg-[#faf9f8]" />

      {/* Left warm gradient */}
      <div
        className="absolute -z-10 blur-3xl"
        style={{
          width: "60%", height: "80%", left: "-10%", top: "0%",
          background: "radial-gradient(ellipse at center, rgba(255,210,180,0.6) 0%, rgba(255,190,160,0.4) 30%, transparent 70%)",
        }}
      />
      {/* Right cool gradient */}
      <div
        className="absolute -z-10 blur-3xl"
        style={{
          width: "70%", height: "100%", right: "-20%", top: "20%",
          background: "radial-gradient(ellipse at center, rgba(200,225,255,0.7) 0%, rgba(180,210,250,0.5) 40%, transparent 70%)",
        }}
      />
      {/* Bottom center gradient */}
      <div
        className="absolute -z-10 blur-3xl"
        style={{
          width: "80%", height: "50%", left: "10%", bottom: "-10%",
          background: "radial-gradient(ellipse at center, rgba(210,230,255,0.5) 0%, transparent 60%)",
        }}
      />
      {/* Top warm accent */}
      <div
        className="absolute -z-10 blur-2xl"
        style={{
          width: "40%", height: "30%", left: "5%", top: "5%",
          background: "radial-gradient(ellipse at center, rgba(255,200,170,0.5) 0%, transparent 60%)",
        }}
      />

      {/* Header */}
      <header className="w-full px-6 md:px-12 py-6 flex items-center justify-between">
        <img src={logo} alt="Bilden Edu" style={{ height: "81.5px", width: "auto" }} />
        <nav className="flex items-center gap-3">
          <button
            className="text-sm font-medium text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            {t("joinWaitlist")}
          </button>
          <button
            onClick={() => navigate("/login")}
            className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-5 py-2 text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            {t("logIn")}
          </button>
          <button
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="rounded-full p-2 bg-white/60 backdrop-blur-sm border border-gray-200 hover:bg-white/80 transition-colors"
            title={lang === "zh" ? "Switch to English" : "切换到中文"}
          >
            <Globe className="w-4 h-4 text-muted-foreground" />
          </button>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-12">
        <h1
          className={`text-foreground tracking-tight transition-all duration-500 ease-out ${
            showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ lineHeight: 1.15, maxWidth: "880px" }}
        >
          <span className="block" style={{ fontSize: "clamp(32px, 5vw, 54px)", fontWeight: 600 }}>
            {t("heroLine1")}
          </span>
          <span
            className="block"
            style={{ fontSize: "clamp(28px, 4.5vw, 48px)", fontWeight: 500, opacity: 0.88, marginTop: "4px" }}
          >
            {t("heroLine2")}
          </span>
        </h1>
        <p
          className={`mt-6 max-w-2xl transition-all duration-500 ease-out ${
            showSubtitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ fontSize: "18px", fontWeight: 450, lineHeight: 1.6, color: "rgb(82,82,91)" }}
        >
          {t("heroDesc")}
        </p>
        <button
          onClick={() => navigate("/login")}
          className={`mt-7 bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 py-3 text-base font-medium transition-all duration-500 ease-out ${
            showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {t("heroStart")}
        </button>
      </section>

      {/* Chat Preview */}
      <div className="w-full max-w-4xl mx-auto px-6 mt-4">
        <div
          onClick={() => navigate("/login")}
          className={`relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50 overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:shadow-xl hover:scale-[1.01] ${
            showChat ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Input area */}
          <div className="p-4 min-h-[60px]">
            <div className="w-full text-foreground/70 text-base flex items-center">
              <span>{displayText}</span>
              <span
                className={`inline-block w-[2px] h-5 bg-foreground/70 ml-[1px] ${
                  showCursor ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 flex items-center justify-center text-muted-foreground">
                <Paperclip className="w-5 h-5" />
              </span>
              <span className="w-9 h-9 flex items-center justify-center text-muted-foreground">
                <Mic className="w-5 h-5" />
              </span>
              <span className="w-9 h-9 flex items-center justify-center text-muted-foreground">
                <Upload className="w-5 h-5" />
              </span>
              <span className="w-9 h-9 flex items-center justify-center text-muted-foreground">
                <Search className="w-5 h-5" />
              </span>
            </div>
            <span className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background">
              <ArrowRight className="w-5 h-5" />
            </span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Landing;
