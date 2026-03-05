import { Compass, Clock, User } from "lucide-react";
import logo from "@/assets/logo.png";

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

const WorkspaceSidebar = ({ collapsed }: Props) => {
  if (collapsed) return null;

  return (
    <aside className="w-[180px] flex-shrink-0 border-r border-border bg-background flex flex-col h-full">
      {/* Brand spacer */}
      <div className="h-5" />
      <div className="px-4">
        <div className="h-px bg-border" />
      </div>


      <div className="flex-1" />

      {/* Bottom actions */}
      <div className="px-4 pb-5">
        <div className="h-px bg-border mb-3" />
        <div className="space-y-0.5">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary text-[13px] transition-colors">
            <Compass size={15} />
            <span>罗盘预览</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default WorkspaceSidebar;
