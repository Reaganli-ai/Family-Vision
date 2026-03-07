import { useNavigate } from "react-router-dom";
import { ArrowUp, Paperclip, Mic, Upload, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import logo from "@/assets/logo.png";

const Landing = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();

  return (
    <div className="min-h-screen bg-warm-gradient">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5">
        <img src={logo} alt="Bilden Edu" className="h-10 w-auto" />

        <div className="flex items-center gap-4">
          <button
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {lang === "zh" ? "EN" : "ZH"}
          </button>
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            {t("logIn")}
          </button>
          <button
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {t("joinWaitlist")}
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center px-6 pt-20 pb-12">
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-center leading-tight tracking-tight max-w-4xl">
          从迷茫到清晰
          <br />
          只需 30 分钟。
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground text-center max-w-xl">
          梳理家庭资源。对齐教育共识。生成战略罗盘。
        </p>
        <button
          onClick={() => navigate("/login")}
          className="mt-10 bg-primary text-primary-foreground px-10 py-4 rounded-full text-base font-medium hover:opacity-90 transition-opacity"
        >
          开始探索
        </button>

        {/* Chat Preview */}
        <div className="mt-20 w-full max-w-2xl">
          <div className="relative">
            <div className="absolute -left-4 -top-20 max-w-[200px] text-xs text-muted-foreground/60 leading-relaxed">
              上传家庭资料，AI 助手会帮你梳理资源、发现优势，让填写更轻松。
            </div>

            <div className="absolute -right-2 -top-10 bg-accent/60 backdrop-blur-sm rounded-2xl rounded-br-md px-4 py-2.5 text-sm text-muted-foreground max-w-[200px]">
              我准备好了
            </div>

            <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="向家庭愿景导师提问..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                  readOnly
                />
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                <div className="flex items-center gap-3">
                  <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                    <Paperclip size={18} />
                  </button>
                  <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                    <Mic size={18} />
                  </button>
                  <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                    <Upload size={18} />
                  </button>
                  <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                    <Search size={18} />
                  </button>
                </div>
                <button className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  <ArrowUp size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
