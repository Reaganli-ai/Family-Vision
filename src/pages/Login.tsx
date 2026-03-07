import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import AmbientStage from "@/components/login/AmbientStage";
import logo from "@/assets/logo.png";

type AuthMode = "phone" | "email";

const Login = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();
  const [mode, setMode] = useState<AuthMode>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const sendCode = () => {
    if (!phone.trim() || countdown > 0) return;
    setCodeSent(true);
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/workspace");
  };

  /* Input on white card: light gray bg, subtle border, warm focus glow */
  const inputCls =
    "w-full bg-[#F7F7F8] rounded-2xl border border-[#EBEBEB] px-4 py-3.5 text-[14px] outline-none transition-all placeholder:text-[#c0c4cc] focus:border-[#ddd] focus:bg-[#F2F2F3] focus:shadow-[0_0_0_4px_rgba(232,115,74,0.05)]";

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">

      {/* ---- Ambient background (gradient stays everywhere) ---- */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FDF8F4] via-[#F3F0FA] to-[#EDF4FB]" />

      {/* Cool blobs */}
      <div className="absolute top-[-12%] left-[-8%] w-[800px] h-[800px] rounded-full bg-[#E8DFF0] opacity-50 blur-[180px]" />
      <div className="absolute top-[5%] right-[-10%] w-[900px] h-[900px] rounded-full bg-[#D4E9DF] opacity-40 blur-[200px]" />
      <div className="absolute bottom-[0%] right-[5%] w-[500px] h-[500px] rounded-full bg-[#D9E8F8] opacity-25 blur-[140px]" />
      {/* Warm blobs — ambient glow */}
      <div className="absolute bottom-[-18%] left-[15%] w-[800px] h-[800px] rounded-full bg-[#F2C9A0] opacity-[0.18] blur-[200px]" />
      <div className="absolute top-[25%] right-[15%] w-[600px] h-[600px] rounded-full bg-[#EDAB8A] opacity-[0.10] blur-[180px]" />

      {/* Full-screen grain overlay (4%) */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
      />


{/* ═══ Subtle page-level nav (top-right only, no logo here) ═══ */}
      <div className="relative z-20 flex items-center justify-end px-8 lg:px-12 py-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="text-[12px] font-medium text-[#999] hover:text-[#666] transition-colors"
          >
            {lang === "zh" ? "EN" : "ZH"}
          </button>
          <button className="text-[12px] font-medium text-[#888] hover:text-[#555] transition-colors hidden sm:block">
            {t("joinWaitlist")}
          </button>
        </div>
      </div>

      {/* ═══ Main content ═══ */}
      <div className="relative z-10 flex flex-1 w-full">

        {/* -- Left column: Solid white card (~48%) -- */}
        <div className="w-full lg:w-[48%] flex flex-col items-center justify-center px-6 lg:px-16 py-6">
          <div className="w-full max-w-[440px]">

            {/* Solid white card — paper feel, no glass */}
            <div className="bg-white rounded-[32px] shadow-[0_4px_60px_-12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] pt-10 pb-10 px-10 lg:px-12">

              {/* Logo inside card — 1.8x enlarged, with breathing room */}
              <div className="mb-10">
                <img src={logo} alt="Bilden Edu" className="h-[100px] lg:h-[122px] w-auto" />
              </div>

              <h1 className="text-[26px] font-bold text-[#111] tracking-tight leading-tight">
                {t("loginTitle")}
              </h1>
              <p className="text-[14px] text-[#999] mt-2 mb-7">
                {t("loginSubtitle")}
              </p>

              {/* Mode tabs */}
              <div className="flex bg-[#F5F5F5] rounded-2xl p-1 mb-7">
                <button
                  onClick={() => setMode("phone")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                    mode === "phone"
                      ? "bg-white text-[#111] shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                      : "text-[#aaa] hover:text-[#777]"
                  }`}
                >
                  <Phone size={13} />
                  {t("phone")}
                </button>
                <button
                  onClick={() => setMode("email")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                    mode === "email"
                      ? "bg-white text-[#111] shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                      : "text-[#aaa] hover:text-[#777]"
                  }`}
                >
                  <Mail size={13} />
                  {t("email")}
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "phone" ? (
                  <>
                    <div>
                      <label className="text-[11.5px] font-medium text-[#888] mb-2 block tracking-wide uppercase">
                        {t("phone")}
                      </label>
                      <div className={`flex items-center ${inputCls} !p-0 overflow-hidden`}>
                        <span className="pl-4 pr-3 text-[13px] text-[#bbb] border-r border-[#E5E5E5] py-3.5 flex-shrink-0">+86</span>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={t("phonePlaceholder")}
                          maxLength={11}
                          className="flex-1 bg-transparent px-3 py-3.5 text-[14px] outline-none placeholder:text-[#c0c4cc]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11.5px] font-medium text-[#888] mb-2 block tracking-wide uppercase">
                        {t("code")}
                      </label>
                      <div className="flex gap-2.5">
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder={t("codePlaceholder")}
                          maxLength={6}
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onClick={sendCode}
                          disabled={!phone.trim() || countdown > 0}
                          className="px-5 py-3.5 rounded-2xl text-[12.5px] font-medium whitespace-nowrap transition-all bg-[#F5F5F5] border border-[#EBEBEB] text-[#555] hover:bg-[#EEE] disabled:opacity-35 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          {countdown > 0
                            ? `${countdown}s`
                            : codeSent
                            ? t("resend")
                            : t("getCode")}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-[11.5px] font-medium text-[#888] mb-2 block tracking-wide uppercase">
                        {t("email")}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[11.5px] font-medium text-[#888] mb-2 block tracking-wide uppercase">
                        {t("password")}
                      </label>
                      <div className="relative">
                        <input
                          type={showPw ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t("passwordPlaceholder")}
                          className={`${inputCls} pr-11`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c0c4cc] hover:text-[#999] transition-colors"
                        >
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Primary CTA */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#111] text-white rounded-2xl py-3.5 text-[14px] font-semibold tracking-wide hover:bg-[#222] active:scale-[0.99] transition-all mt-3 shadow-[0_2px_12px_rgba(0,0,0,0.10)]"
                  style={{ backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)" }}
                >
                  {t("loginCta")}
                  <ArrowRight size={15} strokeWidth={2.5} />
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-7">
                <div className="flex-1 h-px bg-[#EBEBEB]" />
                <span className="text-[11px] text-[#ccc] tracking-wider">{t("or")}</span>
                <div className="flex-1 h-px bg-[#EBEBEB]" />
              </div>

              {/* WeChat SSO */}
              <button className="w-full flex items-center justify-center gap-2.5 bg-[#F7F7F8] border border-[#EBEBEB] rounded-2xl py-3.5 text-[13px] font-medium text-[#555] hover:bg-[#F0F0F0] transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#07C160">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.32.32 0 00.186-.059l1.876-1.103a.784.784 0 01.625-.08c1.026.282 2.127.436 3.263.436h.004c-.016-.155-.025-.312-.025-.47 0-3.81 3.574-6.902 7.985-6.902.27 0 .535.014.797.038C16.97 4.966 13.147 2.188 8.691 2.188zm-2.41 4.202a1.12 1.12 0 110 2.24 1.12 1.12 0 010-2.24zm4.83 0a1.12 1.12 0 110 2.24 1.12 1.12 0 010-2.24zM15.98 9.556c-3.846 0-6.967 2.695-6.967 6.02 0 3.326 3.12 6.021 6.967 6.021.696 0 1.37-.088 2.013-.252a.65.65 0 01.503.063l1.503.884a.263.263 0 00.148.05.237.237 0 00.235-.237c0-.058-.023-.116-.038-.172l-.312-1.187a.481.481 0 01.17-.533C21.94 19.147 22.95 17.46 22.95 15.576c0-3.325-3.123-6.02-6.97-6.02zm-2.478 3.372a.923.923 0 110 1.846.923.923 0 010-1.846zm4.955 0a.923.923 0 110 1.846.923.923 0 010-1.846z"/>
                </svg>
                {t("wechatLogin")}
              </button>

              {/* Sign up link */}
              <p className="text-center text-[12.5px] text-[#bbb] mt-7">
                {t("noAccount")}
                <button className="text-[#111] font-semibold hover:underline ml-1">
                  {t("signUp")}
                </button>
              </p>
            </div>

            {/* Legal — below card */}
            <p className="text-[10px] text-[#c0c4cc] text-center mt-6 leading-relaxed">
              {t("agreePre")}
              <button className="underline decoration-[#d4d4d4] hover:text-[#999] mx-0.5">
                {t("terms")}
              </button>
              {t("and")}
              <button className="underline decoration-[#d4d4d4] hover:text-[#999] mx-0.5">
                {t("privacy")}
              </button>
            </p>
          </div>
        </div>

        {/* -- Right column: Ambient rotating stage (~52%) -- */}
        <div className="hidden lg:flex flex-1 relative">
          <AmbientStage />
        </div>
      </div>
    </div>
  );
};

export default Login;
