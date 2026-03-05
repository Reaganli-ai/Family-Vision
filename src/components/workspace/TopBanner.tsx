import { MessageSquare, BarChart3, User } from "lucide-react";
import logo from "@/assets/logo.png";

const TopBanner = () => {
  return (
    <div className="flex items-center justify-between h-[56px] px-8 border-b border-border bg-background flex-shrink-0">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <img src={logo} alt="Bilden Edu" className="h-16 w-auto" />
      </div>
      {/* Center: pill tabs */}
      <div className="flex items-center border border-border rounded-full overflow-hidden">
        <button className="flex items-center gap-1.5 px-5 py-2 text-[13px] font-medium text-foreground bg-secondary">
          <MessageSquare size={14} />
          对话
        </button>
        <button
          className="flex items-center gap-1.5 px-5 py-2 text-[13px] text-muted-foreground cursor-default group relative"
          disabled
        >
          <BarChart3 size={14} />
          探索
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[11px] text-muted-foreground bg-background border border-border rounded px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            即将开放
          </span>
        </button>
      </div>
      {/* Right: avatar */}
      <div className="flex items-center">
        <div className="w-7 h-7 rounded-full bg-muted-foreground/40 flex items-center justify-center">
          <User size={13} className="text-background" />
        </div>
      </div>
    </div>
  );
};

export default TopBanner;
