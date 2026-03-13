import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "zh" | "en";

/* ── All UI copy in one place ── */
const copy = {
  // Top bar
  joinWaitlist: { zh: "加入等候名单", en: "Join Waitlist" },
  logIn: { zh: "登录", en: "Log in" },

  // Landing hero
  heroLine1: { zh: "为你家定个性化战略", en: "A Personalized Strategy for Your Family" },
  heroLine2: { zh: "用战略咨询的方法做一遍家庭教育。", en: "Apply strategic consulting methods to family education." },
  heroDesc: { zh: "30天共创：对齐目标与路径，建立执行机制，交付一份家庭教育战略白皮书。", en: "30-day co-creation: align goals and paths, build execution systems, deliver a family education strategy white paper." },
  heroStart: { zh: "现在开始", en: "Get Started" },

  // Login card
  loginTitle: { zh: "登录", en: "Welcome Back" },
  loginSubtitle: { zh: "输入信息以开始使用", en: "Sign in to continue your journey" },
  phone: { zh: "手机号", en: "Phone" },
  email: { zh: "邮箱", en: "Email" },
  password: { zh: "密码", en: "Password" },
  code: { zh: "验证码", en: "Code" },
  phonePlaceholder: { zh: "请输入手机号", en: "Enter phone number" },
  codePlaceholder: { zh: "6 位验证码", en: "6-digit code" },
  passwordPlaceholder: { zh: "请输入密码", en: "Enter your password" },
  getCode: { zh: "获取验证码", en: "Get code" },
  resend: { zh: "重新发送", en: "Resend" },
  loginCta: { zh: "登录", en: "Sign In" },
  loginNotice: { zh: "目前暂时只支持邮箱登录", en: "Currently only email login is supported" },
  or: { zh: "或", en: "or" },
  wechatLogin: { zh: "微信登录", en: "WeChat Login" },
  wechatUnavailable: { zh: "该功能还在开放当中", en: "This feature is coming soon" },
  noAccount: { zh: "还没有账号？", en: "Don't have an account?" },
  signUp: { zh: "立即注册", en: "Sign up" },
  agreePre: { zh: "登录即表示同意", en: "By logging in you agree to our" },
  terms: { zh: "用户协议", en: "Terms" },
  and: { zh: "和", en: "and" },
  privacy: { zh: "隐私政策", en: "Privacy" },

  // Signup
  signupTitle: { zh: "注册", en: "Create Account" },
  signupSubtitle: { zh: "创建账号以开始使用", en: "Sign up to get started" },
  name: { zh: "姓名", en: "Name" },
  namePlaceholder: { zh: "请输入姓名", en: "Enter your name" },
  confirmPassword: { zh: "确认密码", en: "Confirm Password" },
  confirmPasswordPlaceholder: { zh: "请再次输入密码", en: "Confirm your password" },
  signupCta: { zh: "注册", en: "Sign Up" },
  signupAgree: { zh: "注册即表示您同意我们的服务条款和隐私政策", en: "By signing up, you agree to our Terms and Privacy Policy" },
  hasAccount: { zh: "已有账号？", en: "Already have an account?" },
  goLogin: { zh: "立即登录", en: "Sign in" },

  // Email verification
  verifyEmailTitle: { zh: "请查收验证邮件", en: "Check Your Email" },
  verifyEmailDesc: { zh: "我们已向您的邮箱发送了一封验证邮件，请点击邮件中的链接完成注册。", en: "We've sent a verification link to your email. Please click the link to complete your registration." },

  // Right side — compass
  compassN: { zh: "N - 眼光", en: "N - Vision" },
  compassS: { zh: "S - 家底", en: "S - Capital" },
  compassW: { zh: "W - 根基", en: "W - Values" },
  compassE: { zh: "E - 共识", en: "E - Align" },

  // Right side — pyramid tiers (3 levels)
  pyramidT1: { zh: "愿景", en: "Vision" },
  pyramidT2: { zh: "方向校准", en: "Alignment" },
  pyramidT3: { zh: "具体执行事项", en: "Execution" },

  // Right side — vision mode bubbles
  vBubble1: { zh: "30 分钟，找到你们家的教育北极星。", en: "30 min to find your family's education north star." },
  vBubble2: { zh: "每个家庭都值得一份属于自己的教育战略。", en: "Every family deserves its own education strategy." },
  vBubble3: { zh: "从模糊的期待，到清晰的方向。", en: "From vague hopes to a clear direction." },

  // Right side — pyramid mode bubbles
  pBubble1: { zh: "愿景引领方向，策略落地执行。", en: "Vision leads. Strategy executes." },
  pBubble2: { zh: "三层结构，让教育决策不再拍脑袋。", en: "Three tiers. No more guesswork in education." },
  pBubble3: { zh: '从"想要什么"到"怎么做到"。', en: "From 'what we want' to 'how we get there'." },
} as const;

export type CopyKey = keyof typeof copy;

/* ── Context ── */
interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: CopyKey) => string;
}

const Ctx = createContext<I18nCtx>({
  lang: "zh",
  setLang: () => {},
  t: (key) => copy[key].zh,
});

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>("zh");
  const t = (key: CopyKey) => copy[key][lang];
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
};

export const useI18n = () => useContext(Ctx);
