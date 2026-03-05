import { useState } from "react";

interface CapitalRow {
  label: string;
  subtitle: string;
  level: string;
  keyword: string;
}

interface Props {
  onConfirm: (data: CapitalRow[]) => void;
  disabled?: boolean;
}

const LEVELS = ["L1", "L2", "L3"];
const LEVEL_LABELS: Record<string, string> = {
  L1: "基础保障型",
  L2: "规划充裕型",
  L3: "战略自由型",
};

const PLACEHOLDERS = [
  "关键词（如：稳健理财、有房贷）",
  "关键词（如：爱阅读、常讨论）",
  "关键词（如：人脉广、圈子窄）",
];

const INITIAL_ROWS: CapitalRow[] = [
  { label: "经济资本", subtitle: "燃料与安全垫", level: "", keyword: "" },
  { label: "文化资本", subtitle: "氛围与知识库", level: "", keyword: "" },
  { label: "社会资本", subtitle: "网络与连接器", level: "", keyword: "" },
];

const CapitalMatrixCard = ({ onConfirm, disabled = false }: Props) => {
  const [rows, setRows] = useState<CapitalRow[]>(INITIAL_ROWS);
  const [confirmed, setConfirmed] = useState(false);

  const updateRow = (index: number, field: "level" | "keyword", value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const allLevelsSelected = rows.every((r) => r.level !== "");

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm(rows);
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-2">资本矩阵 · 已完成</p>
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-2 text-[13px]">
              <span className="font-medium w-16">{r.label}</span>
              <span className="text-primary font-medium">{r.level}</span>
              {r.keyword && <span className="text-muted-foreground">· {r.keyword}</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-4">
      <p className="text-[13px] font-medium text-foreground">请为你们的家庭做一个资本共识定位：</p>

      {rows.map((row, i) => (
        <div key={row.label} className="space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-[14px] font-medium">{row.label}</span>
            <span className="text-[11px] text-muted-foreground">"{row.subtitle}"</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => updateRow(i, "level", lvl)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    row.level === lvl
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {lvl}
                  <span className="ml-1 text-[10px] opacity-70">{LEVEL_LABELS[lvl]}</span>
                </button>
              ))}
            </div>
            <input
              type="text"
              value={row.keyword}
              onChange={(e) => updateRow(i, "keyword", e.target.value)}
              placeholder={PLACEHOLDERS[i]}
              className="flex-1 bg-secondary/40 rounded-lg px-3 py-1.5 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
      ))}

      <div className="flex justify-end pt-1">
        <button
          onClick={handleConfirm}
          disabled={!allLevelsSelected}
          className="px-5 py-2 rounded-lg text-[13px] font-medium transition-all bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          确认 →
        </button>
      </div>
    </div>
  );
};

export default CapitalMatrixCard;
