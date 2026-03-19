import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Download, Pencil, Check, X, ArrowLeft, AlertTriangle, Sparkles, RefreshCw } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { loadCompassData, saveCompassData } from "@/lib/data-client";
import type { CompassDataSchema, TrackedField } from "@/lib/compass-schema";
import { val } from "@/lib/compass-schema";
import type { ReportResponse, Fact, Insight, Draft, DraftOption, ValidationWarning } from "@/lib/report-types";

// ─── Flat view data (derived from structured compass data) ───

export interface CompassViewData {
  familyCode: string;
  generatedDate: string;
  s_economic_level: string;
  s_cultural_level: string;
  s_social_level: string;
  s_priority_capital: string;
  n_key_trend: string;
  n_core_competency: string;
  w_story: string;
  w_core_spirit: string;
  w_spirit_from: string;
  w_spirit_to: string;
  e_gift_to_child: string;
  e_fear_child_lacks: string;
  e_value_1: string;
  e_value_2: string;
  e_value_3: string;
  e_deferred: string;
  e_strategic_direction: string;
  // W new fields
  w_tradeoff_summary: string;
  w_flipside_tags: string;
  w_upgrade_keep: string;
  w_upgrade_reduce: string;
  // E new fields
  e_direction_reason: string;
  e_self_core: string;
  e_partner_core: string;
  e_partner_skipped: boolean;
  vision_statement: string;
  sign_father: string;
  sign_mother: string;
  sign_child: string;
  sign_date: string;
}

const NOT_MENTIONED = "（未在对话中提及）";

function toViewData(cd: CompassDataSchema): CompassViewData {
  const matrix = cd.S?.capitalMatrix?.value;
  const getLevel = (label: string) => {
    const row = matrix?.find((r) => r.label === label);
    return row ? `${row.level}${row.keyword ? `（${row.keyword}）` : ""}` : NOT_MENTIONED;
  };
  const coreValues = cd.E?.coreValues?.value || [];
  const deferredValues = cd.E?.deferredValues?.value || [];

  return {
    familyCode: (cd.familyCode?.value as string) || "",
    generatedDate: new Date().toLocaleDateString("zh-CN"),
    s_economic_level: getLevel("经济资本"),
    s_cultural_level: getLevel("文化资本"),
    s_social_level: getLevel("社会资本"),
    s_priority_capital: (cd.S?.priorityUpgrade?.value as string) || NOT_MENTIONED,
    n_key_trend: (cd.N?.trendsRanked?.value as string[])?.join("、") || NOT_MENTIONED,
    n_core_competency: (cd.N?.coreAbility?.value as string) || NOT_MENTIONED,
    w_story: (cd.W?.story?.value as string) || NOT_MENTIONED,
    w_core_spirit: (cd.W?.coreCode?.value as { name: string; definition: string })?.name || NOT_MENTIONED,
    w_spirit_from: (cd.W?.upgradeFrom?.value as string) || NOT_MENTIONED,
    w_spirit_to: (cd.W?.upgradeTo?.value as string) || NOT_MENTIONED,
    e_gift_to_child: cd.E?.anchors?.value?.gift_to_child || NOT_MENTIONED,
    e_fear_child_lacks: cd.E?.anchors?.value?.fear_child_lacks || NOT_MENTIONED,
    e_value_1: coreValues[0] || NOT_MENTIONED,
    e_value_2: coreValues[1] || NOT_MENTIONED,
    e_value_3: coreValues[2] || NOT_MENTIONED,
    e_deferred: deferredValues.join("、") || NOT_MENTIONED,
    e_strategic_direction: (cd.E?.direction?.value as string) || NOT_MENTIONED,
    w_tradeoff_summary: (cd.W?.tradeoffChoices?.value as { labelA: string; labelB: string; choice: "A" | "B" }[])
      ?.map(t => `在「${t.labelA} vs ${t.labelB}」上更偏向${t.choice === "A" ? t.labelA : t.labelB}`)
      .join("；") || "",
    w_flipside_tags: (cd.W?.flipsideTags?.value as string[])?.join("、") || "",
    w_upgrade_keep: (cd.W?.upgradeKeep?.value as string) || "",
    w_upgrade_reduce: (cd.W?.upgradeReduce?.value as string) || "",
    e_direction_reason: (cd.E?.directionReason?.value as string) || "",
    e_self_core: (cd.E?.selfCore?.value as string[])?.join("、") || "",
    e_partner_core: (cd.E?.partnerCore?.value as string[])?.join("、") || "",
    e_partner_skipped: cd.E?.partnerSkipped?.value !== false,
    vision_statement: "",
    sign_father: "",
    sign_mother: "",
    sign_child: "",
    sign_date: new Date().toLocaleDateString("zh-CN"),
  };
}

const EMPTY_VIEW: CompassViewData = toViewData({});

const HIGHLIGHT_FIELDS = new Set<keyof CompassViewData>([
  "s_priority_capital", "n_key_trend", "n_core_competency", "w_spirit_to",
  "e_value_1", "e_value_2", "e_value_3", "e_strategic_direction", "vision_statement",
]);

// ─── Inline editable field ────────────────────────────

function EditableField({
  value, fieldKey, placeholder, isHighlight, multiline, onChange,
}: {
  value: string; fieldKey: string; placeholder: string;
  isHighlight: boolean; multiline?: boolean; onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => { onChange(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  const baseClass = isHighlight ? "font-bold text-highlight print:text-highlight-print" : "text-body";

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1 no-print">
        {multiline ? (
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} autoFocus
            className="border border-primary/30 rounded px-2 py-1 text-[13px] outline-none w-full resize-none focus:ring-1 focus:ring-primary/30" />
        ) : (
          <input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="border border-primary/30 rounded px-2 py-0.5 text-[13px] outline-none focus:ring-1 focus:ring-primary/30"
            style={{ width: Math.max(120, draft.length * 14) }} />
        )}
        <button onClick={save} className="p-0.5 text-completed hover:opacity-80"><Check size={14} /></button>
        <button onClick={cancel} className="p-0.5 text-muted-foreground hover:opacity-80"><X size={14} /></button>
      </span>
    );
  }

  if (!value) {
    return (
      <span onClick={() => setEditing(true)}
        className="text-gray-300 border-b border-dashed border-gray-300 cursor-pointer hover:text-gray-400 transition-colors print:text-gray-400 print:border-gray-400">
        {placeholder}
      </span>
    );
  }

  return (
    <span onClick={() => setEditing(true)}
      className={`${baseClass} cursor-pointer hover:bg-primary/5 rounded px-0.5 transition-colors print:cursor-default`} title="点击编辑">
      {value}
      <Pencil size={10} className="inline ml-1 text-muted-foreground/40 no-print" />
    </span>
  );
}

// ─── Main component ───────────────────────────────────

const CompassReport = () => {
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get("cid");
  const [data, setData] = useState<CompassViewData>(EMPTY_VIEW);
  const [loading, setLoading] = useState(true);
  const [compassData, setCompassData] = useState<CompassDataSchema | null>(null);

  // Report Agent state
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Draft edits (persisted)
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});

  // Load compass data + saved draft edits from DB
  useEffect(() => {
    if (!conversationId) { setLoading(false); return; }
    (async () => {
      try {
        const cd = await loadCompassData(conversationId);
        if (cd) {
          const typed = cd as CompassDataSchema;
          setCompassData(typed);
          setData(toViewData(typed));
          // Restore saved report
          if ((typed as Record<string, unknown>).report) {
            setReport((typed as Record<string, unknown>).report as ReportResponse);
          }
          // Restore saved draft edits
          if ((typed as Record<string, unknown>).draftEdits) {
            setDraftEdits((typed as Record<string, unknown>).draftEdits as Record<string, string>);
          }
        }
      } catch (err) {
        console.error("Failed to load compass data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [conversationId]);

  // Persist draft edits to DB (debounced)
  useEffect(() => {
    if (!conversationId || Object.keys(draftEdits).length === 0) return;
    const timer = setTimeout(async () => {
      try {
        const cd = await loadCompassData(conversationId);
        if (cd) {
          await saveCompassData(conversationId, { ...cd, draftEdits });
        }
      } catch (err) {
        console.error("Failed to save draft edits:", err);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [draftEdits, conversationId]);

  // Generate report via Report Agent
  const generateReport = useCallback(async () => {
    if (!compassData) return;
    setReportLoading(true);
    setReportError(null);
    try {
      const baseUrl = import.meta.env.DEV ? "http://localhost:3001" : "";
      const res = await fetch(`${baseUrl}/api/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compassData }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data: ReportResponse = await res.json();
      setReport(data);

      // Persist report to DB
      if (conversationId) {
        try {
          const cd = await loadCompassData(conversationId);
          if (cd) {
            await saveCompassData(conversationId, { ...cd, report: data });
          }
        } catch (saveErr) {
          console.error("Failed to save report to DB:", saveErr);
        }
      }

      // If vision draft exists, pre-fill the vision statement with first option
      if (!draftEdits.vision_statement) {
        const visionDraft = data.drafts.find((d) => d.id === "vision_statement");
        if (visionDraft?.options?.[0]) {
          setDraftEdits((prev) => ({ ...prev, vision_statement: visionDraft.options[0].content }));
        }
      }
    } catch (err) {
      console.error("Report generation failed:", err);
      setReportError(err instanceof Error ? err.message : "报告生成失败");
    } finally {
      setReportLoading(false);
    }
  }, [compassData, draftEdits.vision_statement]);

  const update = (key: keyof CompassViewData) => (value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const F = (key: keyof CompassViewData, placeholder: string, multiline?: boolean) => (
    <EditableField value={data[key]} fieldKey={key} placeholder={placeholder}
      isHighlight={HIGHLIGHT_FIELDS.has(key)} multiline={multiline} onChange={update(key)} />
  );

  const navigate = useNavigate();
  const HL = (key: keyof CompassViewData, placeholder: string) => F(key, placeholder);

  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = useCallback(async () => {
    if (!reportRef.current || exporting) return;
    setExporting(true);
    try {
      // Hide draft options and edit controls during PDF capture
      reportRef.current.classList.add("pdf-exporting");
      // Small delay for DOM to update
      await new Promise((r) => setTimeout(r, 50));

      const sections = reportRef.current.querySelectorAll<HTMLElement>(".page-break");
      if (sections.length === 0) return;
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const margin = 15;
      const contentWidth = imgWidth - margin * 2;

      for (let i = 0; i < sections.length; i++) {
        const canvas = await html2canvas(sections[i], {
          scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false, windowWidth: 700,
        });
        const imgHeight = (canvas.height * contentWidth) / canvas.width;
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, contentWidth, imgHeight);
      }
      const today = new Date().toISOString().slice(0, 10);
      pdf.save(`${today}-${data.familyCode || "Family"}-家庭战略罗盘.pdf`);
    } catch (err) {
      reportRef.current?.classList.remove("pdf-exporting");
      console.error("PDF export failed:", err);
      alert("导出失败，请重试");
    } finally {
      reportRef.current?.classList.remove("pdf-exporting");
      setExporting(false);
    }
  }, [data.familyCode, exporting]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground text-[14px]">
        加载中...
      </div>
    );
  }

  return (
    <div className="compass-report bg-white min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-50 no-print bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[700px] mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/workspace")}
            className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={15} /> 返回对话
          </button>
          <div className="flex items-center gap-2">
            <button onClick={generateReport} disabled={reportLoading || !compassData}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
              {reportLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {reportLoading ? "生成中..." : report ? "重新生成" : "生成完整报告"}
            </button>
            <button onClick={handleExportPDF} disabled={exporting}
              className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
              <Download size={14} /> {exporting ? "导出中..." : "导出 PDF"}
            </button>
          </div>
        </div>
      </div>

      <div ref={reportRef} className="max-w-[700px] mx-auto px-6 py-10 bg-white">

        {/* ═══════ P1: Cover ═══════ */}
        <div className="page-break text-center py-20 print:py-32">
          <p className="text-[12px] text-muted-foreground tracking-widest mb-4">彼灯家庭教育战略 CEO 项目</p>
          <h1 className="text-[28px] font-bold text-foreground tracking-wider mb-2">家庭战略定位罗盘</h1>
          <p className="text-[14px] text-muted-foreground mb-1">快照手册 & 定位罗盘</p>
          <div className="mt-8 text-[13px] text-muted-foreground space-y-1">
            <p>家庭代号：<span className="font-semibold text-foreground">{data.familyCode}</span></p>
            <p>生成日期：{data.generatedDate}</p>
          </div>
          <div className="mt-12 text-[10px] text-gray-400 max-w-xs mx-auto leading-relaxed">
            <p>本报告基于用户在卡片中的选择和填写内容生成。</p>
            <p>事实层内容直接引用用户原始数据，未填写字段显示"未在对话中提及"。</p>
            <p>解读层和建议层由 AI 基于事实推理生成，已标注来源和置信度。</p>
          </div>
          <div className="mt-6 text-[10px] text-gray-300">
            <p>Copyright &copy; 2025 彼灯教育科技咨询有限公司. All rights reserved.</p>
          </div>
        </div>

        {/* ═══════ P2: PART 1 — Facts: 家底 + 眼光 ═══════ */}
        <div className="page-break">
          <SectionHeader part="PART 1" title="我们与世界的关系：家底与眼光" />
          <LayerBadge layer="facts" />

          <SnapshotBox title="我们的家底快照" subtitle="第一部分：我们的家底 — 盘点家庭资源地图">
            <p className="snapshot-text"><b>经济资本</b>：{F("s_economic_level", "____________")}</p>
            <p className="snapshot-text"><b>文化资本</b>：{F("s_cultural_level", "____________")}</p>
            <p className="snapshot-text"><b>社会资本</b>：{F("s_social_level", "____________")}</p>
            <p className="snapshot-text mt-3">我们决心优先升级：{HL("s_priority_capital", "____________")}</p>
          </SnapshotBox>

          <SnapshotBox title="我们的眼光快照" subtitle="第二部分：我们的眼光 — 绘制未来的航海图">
            <p className="snapshot-text">我们看到的关键未来趋势是「{HL("n_key_trend", "________________")}」。</p>
            <p className="snapshot-text mt-2">我们押注的核心素养是「{HL("n_core_competency", "________________")}」。</p>
          </SnapshotBox>

          <PageFooter text="以上为《我们与世界的关系》核心产出" />
        </div>

        {/* ═══════ P3: PART 2 — Facts: 根基 + 共识 ═══════ */}
        <div className="page-break">
          <SectionHeader part="PART 2" title="我们与自己的关系：根基与共识" />
          <LayerBadge layer="facts" />

          <SnapshotBox title="我们的根基快照" subtitle="第三部分：我们的根基 — 连接家族的精神血脉">
            <p className="snapshot-text">家族故事：{F("w_story", "_____________________")}</p>
            <p className="snapshot-text mt-2">核心精神：{F("w_core_spirit", "_____________________")}</p>
            {data.w_tradeoff_summary && (
              <p className="snapshot-text mt-2">取舍倾向：{data.w_tradeoff_summary}</p>
            )}
            <p className="snapshot-text mt-2">
              升级路径：保留「{data.w_upgrade_keep || F("w_spirit_from", "__________")}」内核，
              {data.w_upgrade_reduce ? `减少「${data.w_upgrade_reduce}」，` : ""}
              从「{F("w_spirit_from", "__________")}」升级为「{HL("w_spirit_to", "__________")}」
            </p>
            {data.w_flipside_tags && (
              <p className="snapshot-text mt-2">家风副作用觉察：{data.w_flipside_tags}</p>
            )}
          </SnapshotBox>

          <SnapshotBox title="我们的共识快照" subtitle="第四部分：我们的共识 — 家庭教育的战略价值观对齐">
            <p className="snapshot-text">
              直觉锚点：最希望孩子拥有「{F("e_gift_to_child", "______________")}」，
              最怕孩子缺少「{F("e_fear_child_lacks", "______________")}」。
            </p>
            {!data.e_partner_skipped && data.e_self_core && (
              <>
                <p className="snapshot-text mt-2">我更看重：{data.e_self_core}</p>
                <p className="snapshot-text mt-1">伴侣更看重：{data.e_partner_core || NOT_MENTIONED}</p>
                <p className="snapshot-text mt-1">
                  最终共识聚焦：「{HL("e_value_1", "______________")}」、
                  「{HL("e_value_2", "______________")}」、「{HL("e_value_3", "______________")}」
                </p>
              </>
            )}
            {(data.e_partner_skipped || !data.e_self_core) && (
              <p className="snapshot-text mt-2">
                核心价值观：「{HL("e_value_1", "______________")}」、
                「{HL("e_value_2", "______________")}」、「{HL("e_value_3", "______________")}」
              </p>
            )}
            <p className="snapshot-text mt-1">战略暂缓：{F("e_deferred", "______________")}</p>
            <p className="snapshot-text mt-3">
              战略方向：{HL("e_strategic_direction", "内核 / 创造 / 连接")}
              {data.e_direction_reason ? `（${data.e_direction_reason}）` : ""}
            </p>
          </SnapshotBox>

          <PageFooter text="此页为《我们与自己的关系》核心产出" />
        </div>

        {/* ═══════ P4: 四象限罗盘 ═══════ */}
        <div className="page-break">
          <SectionHeader part="FINAL" title="家庭定位罗盘" />
          <p className="text-[13px] text-muted-foreground mb-6">
            将我们对自身（家底、根基）、对未来（眼光）和对教育的信念（共识）进行战略整合。
          </p>

          <p className="text-[12px] font-semibold text-foreground mb-4">第一步：战略输入 — 导入四大快照</p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <QuadrantBox title="North 北：我们的眼光" subtitle="时代需求" color="sky">
              <QuadrantRow label="关键趋势" field={HL("n_key_trend", "______")} />
              <QuadrantRow label="核心素养" field={HL("n_core_competency", "______")} />
            </QuadrantBox>
            <QuadrantBox title="East 东：我们的共识" subtitle="价值共识" color="amber">
              <QuadrantRow label="价值基石" field={<span>{HL("e_value_1", "__")}、{HL("e_value_2", "__")}、{HL("e_value_3", "__")}</span>} />
              <QuadrantRow label="战略方向" field={HL("e_strategic_direction", "内核/创造/连接")} />
            </QuadrantBox>
            <QuadrantBox title="West 西：我们的根基" subtitle="精神传承" color="emerald">
              <QuadrantRow label="核心精神" field={F("w_core_spirit", "______")} />
              <QuadrantRow label="升级方向" field={HL("w_spirit_to", "______")} />
            </QuadrantBox>
            <QuadrantBox title="South 南：我们的家底" subtitle="家庭资本" color="orange">
              <QuadrantRow label="经济/文化/社会" field={<span>{F("s_economic_level", "__")} / {F("s_cultural_level", "__")} / {F("s_social_level", "__")}</span>} />
              <QuadrantRow label="优先升级" field={HL("s_priority_capital", "______")} />
            </QuadrantBox>
          </div>
        </div>

        {/* ═══════ P5: 战略推演 (Insights layer) ═══════ */}
        <div className="page-break">
          <p className="text-[12px] font-semibold text-foreground mb-2">第二步：战略推演 — 发现"战略交点"</p>
          <LayerBadge layer="insights" />

          {!report && !reportLoading && (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <Sparkles size={24} className="mx-auto text-gray-300 mb-3" />
              <p className="text-[13px] text-muted-foreground mb-3">
                点击上方「生成完整报告」，AI 将基于你的四模块数据推理战略交点
              </p>
              <button onClick={generateReport} disabled={reportLoading || !compassData}
                className="text-[13px] text-blue-600 hover:text-blue-700 font-medium">
                立即生成 →
              </button>
            </div>
          )}

          {reportLoading && (
            <div className="text-center py-12">
              <RefreshCw size={20} className="mx-auto text-blue-500 animate-spin mb-3" />
              <p className="text-[13px] text-muted-foreground">AI 正在分析你的四模块数据…</p>
            </div>
          )}

          {reportError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
              <p className="text-[13px] text-red-600">{reportError}</p>
            </div>
          )}

          {report && (
            <div className="space-y-4 mt-4">
              {report.insights.map((insight, idx) => (
                <div key={insight.id}>
                  {idx < 3 && (
                    <p className="text-[11px] font-semibold text-blue-600 mb-1">
                      {["① 机遇匹配题（S×N）：哪项优势最适合培养哪项素养？",
                        "② 矛盾化解题（W×N）：精神内核与未来需求的紧张如何化解？",
                        "③ 哲学锚定题（E×S×W）：价值观如何决定资本运用方式？"][idx]}
                    </p>
                  )}
                  <InsightCard insight={insight} />
                </div>
              ))}
            </div>
          )}

          {/* Validation warnings */}
          {report && report.warnings.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-[12px] font-semibold text-amber-700 mb-2 flex items-center gap-1">
                <AlertTriangle size={13} /> 校验提示（{report.warnings.length}）
              </p>
              {report.warnings.map((w, i) => (
                <p key={i} className="text-[11px] text-amber-600 ml-4">• {w.detail}</p>
              ))}
            </div>
          )}
        </div>

        {/* ═══════ P6: 建议草案 (Drafts layer) ═══════ */}
        <div className="page-break">
          <p className="text-[12px] font-semibold text-foreground mb-2">第三步：愿景与行动 — 可编辑草案</p>
          <LayerBadge layer="drafts" />

          {report ? (
            <div className="space-y-6 mt-4">
              {report.drafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  editedValue={draftEdits[draft.id]}
                  onEdit={(value) => setDraftEdits((prev) => ({ ...prev, [draft.id]: value }))}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[13px] text-muted-foreground">
              请先生成报告以查看建议草案
            </div>
          )}
        </div>

        {/* ═══════ P7: 战略承诺 ═══════ */}
        <div className="page-break">
          <div className="border border-border rounded-xl p-8 mt-4">
            <h2 className="text-[18px] font-bold text-center text-foreground mb-8">家庭教育战略承诺书</h2>
            <p className="text-[13px] leading-[2] text-foreground">
              我们，{F("sign_father", "______（父亲姓名）")} 与 {F("sign_mother", "______（母亲姓名）")}，
            </p>
            <p className="text-[13px] leading-[2] text-foreground">
              作为 {F("sign_child", "______（孩子姓名）")} 家庭的教育合伙人，在此郑重承诺：
            </p>

            {/* Use the edited vision or first draft option */}
            {(draftEdits.vision_statement || data.vision_statement) && (
              <div className="bg-primary/5 rounded-lg p-4 my-4">
                <p className="text-[11px] text-muted-foreground mb-1">我们的教育愿景</p>
                <p className="text-[15px] leading-[2] font-bold text-highlight">
                  {draftEdits.vision_statement || data.vision_statement}
                </p>
              </div>
            )}

            <p className="text-[13px] leading-[2] text-foreground mt-4">
              我们将以《家庭战略定位罗盘》为最高指引，在未来一年及更长的旅程中：
            </p>
            <ol className="text-[13px] leading-[2.2] text-foreground mt-2 ml-4 list-decimal space-y-1">
              <li><b>保持战略清醒</b>：以愿景为尺，衡量重大选择，抵抗短期焦虑。</li>
              <li><b>高效配置资源</b>：将家庭资源优先投向与罗盘一致的领域。</li>
              <li><b>践行协同协作</b>：尊重彼此角色，在分歧时回到本罗盘寻求共识。</li>
              <li><b>定期复盘迭代</b>：每年今日，重温并修订此罗盘，使之与家庭成长共进化。</li>
            </ol>

            <div className="mt-10 flex justify-between text-[13px] text-foreground">
              <div>
                <p className="mb-6">教育合伙人签署：</p>
                <p className="border-b border-foreground/30 w-40 pb-1 mb-1">{data.sign_father || ""}</p>
                <p className="text-[11px] text-muted-foreground">（父）</p>
              </div>
              <div className="text-right">
                <p className="mb-6">&nbsp;</p>
                <p className="border-b border-foreground/30 w-40 pb-1 mb-1 text-right">{data.sign_mother || ""}</p>
                <p className="text-[11px] text-muted-foreground text-right">（母）</p>
              </div>
            </div>
            <p className="text-[13px] text-foreground mt-8">日期：{data.sign_date}</p>
          </div>

          <div className="text-center mt-12 text-[13px] text-muted-foreground">— END —</div>
          <p className="text-center text-[11px] text-gray-300 mt-2">彼灯家庭教育战略研究中心 | Bilden Education</p>
          <p className="text-center text-[10px] text-gray-300 mt-1">Copyright &copy; 2025 彼灯教育科技咨询有限公司. All rights reserved.</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .compass-report { background: white !important; color: #2D2A26 !important; }
          .compass-report * { color: inherit !important; }
          .compass-report .text-muted-foreground, .compass-report .text-gray-300, .compass-report .text-gray-400 { color: #737373 !important; }
          .compass-report .text-highlight { color: #D4602E !important; }
          .compass-report .text-completed { color: #187A4B !important; }
          .snapshot-text, .snapshot-text * { color: #2D2A26 !important; }
          .snapshot-text .text-highlight, .snapshot-text .font-bold { color: #D4602E !important; }
          .page-break { page-break-before: always; }
          .page-break:first-child { page-break-before: auto; }
          @page { size: A4; margin: 20mm 15mm; }
          .snapshot-box { break-inside: avoid; }
        }
        @media screen {
          .page-break { margin-bottom: 3rem; padding-top: 1.5rem; border-top: 1px dashed #e5e5e5; }
          .page-break:first-child { border-top: none; padding-top: 0; }
        }
        .text-highlight { color: #E8734A; }
        .snapshot-text { font-size: 14px; line-height: 2; color: #2D2A26; }
        /* Hide draft options & edit controls during PDF export */
        .pdf-exporting .draft-options,
        .pdf-exporting .draft-edit-controls,
        .pdf-exporting .no-print { display: none !important; }
        .pdf-exporting .draft-final-only { display: block !important; }
      `}</style>
    </div>
  );
};

// ─── Layer badge ─────────────────────────────────────

function LayerBadge({ layer }: { layer: "facts" | "insights" | "drafts" }) {
  const config = {
    facts: { label: "事实层", color: "bg-gray-100 text-gray-600", desc: "直接引用用户数据，零推测" },
    insights: { label: "解读层", color: "bg-blue-50 text-blue-600", desc: "基于事实的可追溯推理" },
    drafts: { label: "建议草案", color: "bg-amber-50 text-amber-600", desc: "AI 生成，可编辑，非最终答案" },
  };
  const c = config[layer];
  return (
    <div className={`inline-flex items-center gap-2 text-[10px] font-medium px-2.5 py-1 rounded-full mb-4 ${c.color}`}>
      <span>{c.label}</span>
      <span className="opacity-60">— {c.desc}</span>
    </div>
  );
}

// ─── Insight card ────────────────────────────────────

function InsightCard({ insight }: { insight: Insight }) {
  const confidenceMap = { high: "高", medium: "中", low: "低" };
  const confidenceColor = { high: "text-emerald-600", medium: "text-amber-600", low: "text-red-500" };

  return (
    <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[13px] font-semibold text-foreground">{insight.title}</p>
        <span className={`text-[10px] font-medium ${confidenceColor[insight.confidence]}`}>
          置信度：{confidenceMap[insight.confidence]}
        </span>
      </div>
      <p className="text-[13px] text-foreground/80 leading-relaxed italic">{insight.content}</p>
      {insight.based_on.length > 0 && (
        <p className="text-[10px] text-blue-400 mt-2">
          引用：{insight.based_on.join(", ")}
        </p>
      )}
    </div>
  );
}

// ─── Draft card (editable) ───────────────────────────

function DraftCard({
  draft, editedValue, onEdit,
}: {
  draft: Draft; editedValue?: string; onEdit: (v: string) => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(editedValue || draft.options[0]?.content || "");

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
    setEditText(draft.options[idx]?.content || "");
    onEdit(draft.options[idx]?.content || "");
  };

  const handleSaveEdit = () => {
    onEdit(editText);
    setIsEditing(false);
  };

  const finalContent = editedValue || draft.options[selectedIdx]?.content || "（请选择一个版本）";

  return (
    <div className="border-2 border-amber-200 bg-amber-50/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full draft-edit-controls">可编辑草案</span>
        <p className="text-[13px] font-semibold text-foreground">{draft.title}</p>
      </div>
      <p className="text-[12px] text-muted-foreground mb-3 draft-edit-controls">{draft.description}</p>

      {/* Option selector — hidden in PDF */}
      <div className="space-y-2 mb-3 draft-options">
        {draft.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            className={`w-full text-left p-3 rounded-lg border transition-all text-[12px] leading-relaxed ${
              selectedIdx === idx
                ? "border-amber-400 bg-amber-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span className="font-medium text-foreground">{opt.label}</span>
            <p className="text-foreground/70 mt-1">{opt.content}</p>
          </button>
        ))}
      </div>

      {/* Edit area — hidden in PDF */}
      <div className="border-t border-amber-200 pt-3 draft-edit-controls">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-medium text-foreground">你的最终版本</p>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)}
              className="text-[11px] text-amber-600 hover:text-amber-700 flex items-center gap-1">
              <Pencil size={11} /> 编辑
            </button>
          )}
        </div>
        {isEditing ? (
          <div>
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={4}
              className="w-full text-[13px] leading-relaxed border border-amber-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-amber-400 resize-none" />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setIsEditing(false)} className="text-[12px] text-muted-foreground px-3 py-1">取消</button>
              <button onClick={handleSaveEdit}
                className="text-[12px] bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600">保存</button>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-foreground leading-relaxed bg-white rounded-lg p-3 border border-gray-100">
            {finalContent}
          </p>
        )}
      </div>

      {/* PDF-only: clean final version (hidden on screen, shown during export) */}
      <div className="draft-final-only hidden">
        <p className="text-[13px] text-foreground leading-relaxed">
          {finalContent}
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────

function SectionHeader({ part, title }: { part: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-[11px] font-bold text-primary tracking-widest mb-1">{part}</p>
      <h2 className="text-[18px] font-bold text-foreground">《{title}》</h2>
    </div>
  );
}

function SnapshotBox({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="snapshot-box mb-8">
      <p className="text-[12px] text-muted-foreground mb-1">{subtitle}</p>
      <div className="border border-border rounded-xl p-5">
        <p className="text-[13px] font-semibold text-completed mb-3">【{title}】</p>
        {children}
      </div>
    </div>
  );
}

function QuadrantBox({ title, subtitle, color, children }: {
  title: string; subtitle: string; color: "sky" | "amber" | "emerald" | "orange"; children: React.ReactNode;
}) {
  const bgMap = { sky: "bg-sky-50", amber: "bg-amber-50", emerald: "bg-emerald-50", orange: "bg-orange-50" };
  const headerMap = { sky: "bg-sky-100 text-sky-800", amber: "bg-amber-100 text-amber-800", emerald: "bg-emerald-100 text-emerald-800", orange: "bg-orange-100 text-orange-800" };
  return (
    <div className={`rounded-xl overflow-hidden ${bgMap[color]} print:border print:border-gray-200`}>
      <div className={`px-3 py-2 text-[11px] font-bold ${headerMap[color]}`}>
        {title} <span className="font-normal ml-2 opacity-70">{subtitle}</span>
      </div>
      <div className="px-3 py-3 space-y-2">{children}</div>
    </div>
  );
}

function QuadrantRow({ label, field }: { label: string; field: React.ReactNode }) {
  return <div className="text-[12px]"><span className="text-muted-foreground">{label}：</span>{field}</div>;
}

function PageFooter({ text }: { text: string }) {
  return (
    <p className="text-[10px] text-gray-300 text-center mt-8 pt-4 border-t border-gray-100">
      &copy; 彼灯教育 | {text}，请妥善保存。
    </p>
  );
}

export default CompassReport;
