import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Phone, Mail, Globe, Home } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/logo.png";

type LoginMethod = "phone" | "email";

const Login = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();
  const { signIn } = useAuth();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showWechatToast, setShowWechatToast] = useState(false);
  const [showPhoneToast, setShowPhoneToast] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleWechatClick = () => {
    setShowWechatToast(true);
    setTimeout(() => setShowWechatToast(false), 3000);
  };

  const handlePhoneClick = () => {
    setLoginMethod("email");
    setShowPhoneToast(true);
    setTimeout(() => setShowPhoneToast(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      navigate("/workspace");
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-20 bg-[#faf9f8]" />
      <div
        className="absolute -z-10 blur-3xl"
        style={{
          width: "60%", height: "80%", left: "-10%", top: "0%",
          background: "radial-gradient(ellipse at center, rgba(255,210,180,0.6) 0%, rgba(255,190,160,0.4) 30%, transparent 70%)",
        }}
      />
      <div
        className="absolute -z-10 blur-3xl"
        style={{
          width: "70%", height: "100%", right: "-20%", top: "20%",
          background: "radial-gradient(ellipse at center, rgba(200,225,255,0.7) 0%, rgba(180,210,250,0.5) 40%, transparent 70%)",
        }}
      />
      <div
        className="absolute -z-10 blur-3xl"
        style={{
          width: "80%", height: "50%", left: "10%", bottom: "-10%",
          background: "radial-gradient(ellipse at center, rgba(210,230,255,0.5) 0%, transparent 60%)",
        }}
      />

      {/* Header */}
      <header className="w-full px-6 md:px-12 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Bilden Edu" style={{ height: "81.5px", width: "auto" }} />
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="rounded-full p-2 text-sm font-medium bg-white/60 backdrop-blur-sm border border-gray-200 hover:bg-white/80 transition-colors"
          >
            <Home className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-gray-200 hover:bg-white/80 transition-colors"
          >
            <Globe className="w-4 h-4" />
            {lang === "zh" ? "EN" : "ZH"}
          </button>
        </div>
      </header>

      {/* WeChat toast */}
      {showWechatToast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {t("wechatUnavailable")}
        </div>
      )}
      {showPhoneToast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-lg shadow-lg z-50 text-sm">
          {lang === "zh" ? "暂时只支持邮箱登录，手机号功能还在开发中" : "Email login only for now. Phone login is under development."}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6">
          {/* Header */}
          <div className="mb-6 text-left">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {t("loginTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("loginSubtitle")}
            </p>
          </div>

          {/* Login Method Tabs */}
          <div className="flex mb-5 border border-border rounded-full p-1 bg-muted/30">
            <button
              type="button"
              onClick={handlePhoneClick}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition-all ${
                loginMethod === "phone"
                  ? "bg-white border-2 border-blue-500 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Phone size={14} />
              {t("phone")}
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod("email")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition-all ${
                loginMethod === "email"
                  ? "bg-white border-2 border-blue-500 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail size={14} />
              {t("email")}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {loginMethod === "email" ? (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t("email")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-3 py-3 rounded-xl border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t("phone")}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("phonePlaceholder")}
                  className="w-full px-3 py-3 rounded-xl border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t("password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  required
                  className="w-full px-3 py-3 rounded-xl border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (lang === "zh" ? "登录中..." : "Signing in...") : t("loginCta")}
              {!loading && <span>→</span>}
            </button>
          </form>

          {/* Notice */}
          <p className="text-center text-xs text-muted-foreground mt-3">
            {t("loginNotice")}
          </p>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="px-3 text-xs text-muted-foreground">{t("or")}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* WeChat Login */}
          <button
            type="button"
            onClick={handleWechatClick}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#07C160">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088v-.035h-.407zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
            </svg>
            <span className="text-foreground text-sm font-medium">
              {t("wechatLogin")}
            </span>
          </button>

          {/* Sign Up Link */}
          <div className="mt-5 text-center">
            <p className="text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-foreground font-semibold hover:underline"
              >
                {t("signUp")}
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
