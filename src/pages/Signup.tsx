import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/logo.png";

const Signup = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(lang === "zh" ? "两次密码不一致" : "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError(lang === "zh" ? "密码至少需要 6 位" : "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, name);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      setSuccess(true);
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
      <header className="w-full px-6 md:px-12 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Bilden Edu" className="h-[66px] w-auto" />
        </Link>
        <button
          onClick={() => setLang(lang === "zh" ? "en" : "zh")}
          className="rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-gray-200 hover:bg-white/80 transition-colors"
        >
          <Globe className="w-4 h-4" />
          {lang === "zh" ? "EN" : "ZH"}
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6">
          {success ? (
            /* Success: email verification sent */
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {t("verifyEmailTitle")}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {t("verifyEmailDesc")}
              </p>
              <button
                onClick={() => navigate("/login")}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-xl px-6 py-3 text-sm font-medium"
              >
                {t("goLogin")}
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6 text-left">
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  {t("signupTitle")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("signupSubtitle")}
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Signup Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("name")}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("namePlaceholder")}
                    required
                    className="w-full px-3 py-3 rounded-xl border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  />
                </div>

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

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("confirmPassword")}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t("confirmPasswordPlaceholder")}
                      required
                      className="w-full px-3 py-3 rounded-xl border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (lang === "zh" ? "注册中..." : "Signing up...") : t("signupCta")}
                  {!loading && <span>→</span>}
                </button>
              </form>

              {/* Notice */}
              <p className="text-center text-xs text-muted-foreground mt-3">
                {t("signupAgree")}
              </p>

              {/* Login Link */}
              <div className="mt-5 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("hasAccount")}{" "}
                  <button
                    onClick={() => navigate("/login")}
                    className="text-foreground font-semibold hover:underline"
                  >
                    {t("goLogin")}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default Signup;
