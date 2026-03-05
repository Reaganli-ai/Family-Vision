import { useState, useRef } from "react";
import { Printer, Pencil, Check, X } from "lucide-react";

// ─── Data types ────────────────────────────────────────

export interface CompassData {
  familyCode: string;
  generatedDate: string;
  // S — 家底
  s_economic_desc: string;
  s_cultural_desc: string;
  s_social_desc: string;
  s_priority_capital: string;
  // N — 眼光
  n_key_trend: string;
  n_core_competency: string;
  n_inner_resonance: string;
  // W — 根基
  w_family_code: string;
  w_core_value: string;
  w_inherited_spirit: string;
  w_upgraded_expression: string;
  // E — 共识
  e_value_1: string;
  e_value_2: string;
  e_value_3: string;
  e_strategic_direction: string;
  // 战略推演
  x_opportunity: string;
  x_conflict: string;
  x_philosophy: string;
  // 愿景
  vision_statement: string;
  // 签署
  sign_father: string;
  sign_mother: string;
  sign_child: string;
  sign_date: string;
}

// ─── Default demo data ────────────────────────────────

const DEMO_DATA: CompassData = {
  familyCode: "LC",
  generatedDate: new Date().toLocaleDateString("zh-CN"),
  s_economic_desc: "稳健保障型，有房贷但理财意识强",
  s_cultural_desc: "探索对话型，双硕士、爱阅读、常讨论",
  s_social_desc: "亲友圈为主，社交圈相对内敛",
  s_priority_capital: "社会资本",
  n_key_trend: "AI 替代执行岗",
  n_core_competency: "创造力",
  n_inner_resonance: "对独立创造的看重",
  w_family_code: "宁折不弯的信义哲学",
  w_core_value: "诚信与承诺",
  w_inherited_spirit: "说到做到的执行力",
  w_upgraded_expression: "在热爱的领域坚持到极致",
  e_value_1: "好奇探索",
  e_value_2: "自主驱动",
  e_value_3: "批判思维",
  e_strategic_direction: "创造",
  x_opportunity: "文化资本（阅读讨论习惯）× 创造力（核心素养）",
  x_conflict: "「说到做到」的刚性执行 vs 创造力需要的试错空间 → 将「执行力」升级为「在确定方向后的深度投入」",
  x_philosophy: "选择「创造优先」意味着经济资本应更多投向创新体验（工作坊、项目制学习），而非单纯应试补习",
  vision_statement: "我们，LC 家庭，将运用文化资本的深厚积淀，秉承「在热爱的领域坚持到极致」的升级精神，在 AI 重塑职业版图的时代，坚定走创造优先的道路，全力将孩子培养成一个有独立审美、敢于定义问题、能用创造力改变周围世界的人。",
  sign_father: "",
  sign_mother: "",
  sign_child: "",
  sign_date: new Date().toLocaleDateString("zh-CN"),
};

// ─── Highlight fields ─────────────────────────────────

const HIGHLIGHT_FIELDS = new Set<keyof CompassData>([
  "s_priority_capital",
  "n_key_trend",
  "n_core_competency",
  "w_upgraded_expression",
  "e_value_1",
  "e_value_2",
  "e_value_3",
  "e_strategic_direction",
  "vision_statement",
]);

// ─── Inline editable field ────────────────────────────

function EditableField({
  value,
  fieldKey,
  placeholder,
  isHighlight,
  multiline,
  onChange,
}: {
  value: string;
  fieldKey: string;
  placeholder: string;
  isHighlight: boolean;
  multiline?: boolean;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const save = () => {
    onChange(draft);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const baseClass = isHighlight
    ? "font-bold text-highlight print:text-highlight-print"
    : "text-body";

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1 no-print">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            autoFocus
            className="border border-primary/30 rounded px-2 py-1 text-[13px] outline-none w-full resize-none focus:ring-1 focus:ring-primary/30"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="border border-primary/30 rounded px-2 py-0.5 text-[13px] outline-none focus:ring-1 focus:ring-primary/30"
            style={{ width: Math.max(120, draft.length * 14) }}
          />
        )}
        <button onClick={save} className="p-0.5 text-completed hover:opacity-80"><Check size={14} /></button>
        <button onClick={cancel} className="p-0.5 text-muted-foreground hover:opacity-80"><X size={14} /></button>
      </span>
    );
  }

  if (!value) {
    return (
      <span
        onClick={() => setEditing(true)}
        className="text-gray-300 border-b border-dashed border-gray-300 cursor-pointer hover:text-gray-400 transition-colors print:text-gray-400 print:border-gray-400"
      >
        {placeholder}
      </span>
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`${baseClass} cursor-pointer hover:bg-primary/5 rounded px-0.5 transition-colors print:cursor-default`}
      title="点击编辑"
    >
      {value}
      <Pencil size={10} className="inline ml-1 text-muted-foreground/40 no-print" />
    </span>
  );
}

// ─── Main component ───────────────────────────────────

const CompassReport = () => {
  const [data, setData] = useState<CompassData>(DEMO_DATA);

  const update = (key: keyof CompassData) => (value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const F = (key: keyof CompassData, placeholder: string, multiline?: boolean) => (
    <EditableField
      value={data[key]}
      fieldKey={key}
      placeholder={placeholder}
      isHighlight={HIGHLIGHT_FIELDS.has(key)}
      multiline={multiline}
      onChange={update(key)}
    />
  );

  const HL = (key: keyof CompassData, placeholder: string) => F(key, placeholder);

  return (
    <div className="compass-report bg-white min-h-screen">
      {/* Floating print button */}
      <div className="fixed top-6 right-6 z-50 no-print">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-completed text-white px-5 py-2.5 rounded-lg text-[13px] font-medium shadow-lg hover:opacity-90 transition-all"
        >
          <Printer size={16} />
          导出 PDF / 打印
        </button>
      </div>

      <div className="max-w-[700px] mx-auto px-6 py-10 print:px-0 print:py-0 print:max-w-none">

        {/* ═══════ P1: Cover ═══════ */}
        <div className="page-break text-center py-20 print:py-32">
          <p className="text-[12px] text-muted-foreground tracking-widest mb-4">彼灯家庭教育战略 CEO 项目</p>
          <h1 className="text-[28px] font-bold text-foreground tracking-wider mb-2">家庭战略定位罗盘</h1>
          <p className="text-[14px] text-muted-foreground mb-1">
            快照手册 & 定位罗盘
          </p>
          <div className="mt-8 text-[13px] text-muted-foreground space-y-1">
            <p>家庭代号：<span className="font-semibold text-foreground">{data.familyCode}</span></p>
            <p>生成日期：{data.generatedDate}</p>
          </div>
          <div className="mt-16 text-[10px] text-gray-300">
            <p>Copyright &copy; 2025 彼灯教育科技咨询有限公司. All rights reserved.</p>
          </div>
        </div>

        {/* ═══════ P2: PART 1 — 家底 + 眼光 ═══════ */}
        <div className="page-break">
          <SectionHeader part="PART 1" title="我们与世界的关系：家底与眼光" />

          {/* 家底快照 */}
          <SnapshotBox title="我们的家底快照" subtitle="第一部分：我们的家底 — 盘点家庭资源地图">
            <p className="snapshot-text">
              我们是一个在<b>经济</b>上偏向 {F("s_economic_desc", "____________")}，
              在<b>文化</b>上充满 {F("s_cultural_desc", "____________")}，
              在<b>社会</b>上连接着 {F("s_social_desc", "____________")} 的家庭。
            </p>
            <p className="snapshot-text mt-3">
              我们决心优先关注 {HL("s_priority_capital", "____________")} 资本。
            </p>
          </SnapshotBox>

          {/* 眼光快照 */}
          <SnapshotBox title="我们的眼光快照" subtitle="第二部分：我们的眼光 — 绘制未来的航海图">
            <p className="snapshot-text">
              我们看到的关键未来趋势是「{HL("n_key_trend", "________________")}」。
            </p>
            <p className="snapshot-text mt-2">
              我们初步关注的未来素养是「{HL("n_core_competency", "________________")}」，
            </p>
            <p className="snapshot-text">
              它隐约呼应了我们内心对「{F("n_inner_resonance", "________________")}」的看重。
            </p>
            <p className="text-[11px] text-muted-foreground italic mt-4">
              （此快照为初步判断，将在后续结合"根基"与"共识"后最终校准）
            </p>
          </SnapshotBox>

          <PageFooter text="以上为《我们与世界的关系》核心产出" />
        </div>

        {/* ═══════ P3: PART 2 — 根基 + 共识 ═══════ */}
        <div className="page-break">
          <SectionHeader part="PART 2" title="我们与自己的关系：根基与共识" />

          {/* 根基快照 */}
          <SnapshotBox title="我们的根基快照" subtitle="第三部分：我们的根基 — 连接家族的精神血脉">
            <p className="snapshot-text">
              我们家族的底层代码，可能是一种「{F("w_family_code", "_____________________")}」的生存哲学。
            </p>
            <p className="snapshot-text mt-2">
              它源于对「{F("w_core_value", "_____________________")}」的看重。
            </p>
            <p className="snapshot-text mt-2">
              我们决心，在继承其「{F("w_inherited_spirit", "_____________________")}」内核的同时，
            </p>
            <p className="snapshot-text">
              勇敢地将其表现形式升级为「{HL("w_upgraded_expression", "_____________________")}」，以托举孩子的未来。
            </p>
            <p className="text-[11px] text-muted-foreground italic mt-4">
              （看见，是选择的开始；选择，是创造的起点。）
            </p>
          </SnapshotBox>

          {/* 共识快照 */}
          <SnapshotBox title="我们的共识快照" subtitle="第四部分：我们的共识 — 家庭教育的战略价值观对齐">
            <p className="snapshot-text">
              我们从纷繁的价值观中，锚定了「{HL("e_value_1", "______________")}」、
              「{HL("e_value_2", "______________")}」与「{HL("e_value_3", "______________")}」
              作为家庭教育的三大战略基石。
            </p>
            <p className="snapshot-text mt-3">
              我们的战略罗盘指向：{HL("e_strategic_direction", "内核 / 创造 / 连接")}。
            </p>
            <p className="text-[11px] text-muted-foreground italic mt-4">
              （共识，是在看清彼此地图的不同后，依然共同选择前往的远方。）
            </p>
          </SnapshotBox>

          <PageFooter text="此页为《我们与自己的关系》核心产出" />
        </div>

        {/* ═══════ P4: 罗盘输入 — 四象限 ═══════ */}
        <div className="page-break">
          <SectionHeader part="FINAL" title="家庭定位罗盘" />
          <p className="text-[13px] text-muted-foreground mb-6">
            将我们对自身（家底、根基）、对未来（眼光）和对教育的信念（共识）进行战略整合。
          </p>

          <p className="text-[12px] font-semibold text-foreground mb-4">第一步：战略输入 — 导入四大快照</p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <QuadrantBox title="North 北：我们的眼光" subtitle="时代需求：产业结构、人才画像" color="sky">
              <QuadrantRow label="关键未来趋势" field={HL("n_key_trend", "______________________")} />
              <QuadrantRow label="我们押注的核心素养" field={HL("n_core_competency", "______________________")} />
            </QuadrantBox>
            <QuadrantBox title="East 东：我们的共识" subtitle="价值共识：价值观、教育理念" color="amber">
              <QuadrantRow label="三大价值基石" field={
                <span>
                  {HL("e_value_1", "____")}、{HL("e_value_2", "____")}、{HL("e_value_3", "____")}
                </span>
              } />
              <QuadrantRow label="首要战略方向" field={HL("e_strategic_direction", "内核/创造/连接")} />
            </QuadrantBox>
            <QuadrantBox title="West 西：我们的根基" subtitle="精神传承：祖辈家风、原生家庭" color="emerald">
              <QuadrantRow label="家族继承的核心代码" field={F("w_inherited_spirit", "___________________________")} />
              <QuadrantRow label="我们决心将其升级为" field={HL("w_upgraded_expression", "___________________________")} />
            </QuadrantBox>
            <QuadrantBox title="South 南：我们的家底" subtitle="家庭资本：经济、社会、文化" color="orange">
              <QuadrantRow label="最可倚仗的资本" field={F("s_cultural_desc", "___________________________")} />
              <QuadrantRow label="决心优先升级" field={HL("s_priority_capital", "___________________________")} />
            </QuadrantBox>
          </div>
        </div>

        {/* ═══════ P5: 战略推演 ═══════ */}
        <div className="page-break">
          <p className="text-[12px] font-semibold text-foreground mb-4">第二步：战略推演 — 发现"战略交点"</p>
          <p className="text-[12px] text-muted-foreground mb-6">这是最关键的一步。请夫妻共同探讨以下三个问题：</p>

          <PushQuestion
            number="①"
            title="机遇匹配题"
            question="我们的家庭资本（南）中哪项优势，最适合用来培养未来时代需求（北）中看重的核心素养？"
            example="我们家「多元拓展的社会资本」（南），最适合用来培养「跨文化协作能力」（北）。"
          >
            <p className="snapshot-text">我们的匹配是：{F("x_opportunity", "________________ 优势 × ________________ 素养", true)}</p>
          </PushQuestion>

          <PushQuestion
            number="②"
            title="矛盾化解题"
            question="我们的家族精神内核（西）中需要升级的部分，与未来时代需求（北）之间，是否存在紧张或矛盾？"
            example="家族「安全第一」的精神内核（西）与未来需要「冒险精神」的时代需求（北）存在矛盾。解法是：将「安全」重新定义为「在充分认知风险后的有准备探索」。"
          >
            <p className="snapshot-text">我们的矛盾与创造性解法：{F("x_conflict", "请描述你们的矛盾和解法……", true)}</p>
          </PushQuestion>

          <PushQuestion
            number="③"
            title="哲学锚定题"
            question="我们的价值观共识（东）中的战略方向，将如何决定我们利用家庭资本（南）和精神内核（西）的具体方式？"
            example="既然我们选择「创造优先」（东），那么在使用「稳健的经济资本」（南）时，就更倾向于将其作为「创新试错的风险投资基金」。"
          >
            <p className="snapshot-text">我们的哲学将具体化为：{F("x_philosophy", "请描述你们的哲学决策……", true)}</p>
          </PushQuestion>
        </div>

        {/* ═══════ P6: 愿景生成 ═══════ */}
        <div className="page-break">
          <p className="text-[12px] font-semibold text-foreground mb-2">第三步：愿景生成 — 一句话定义我们的教育</p>
          <p className="text-[12px] text-muted-foreground mb-6">整合以上所有思考，用一句话写下你们家庭的"教育战略宣言"。</p>

          <div className="border-2 border-primary/20 rounded-xl p-6 mb-6">
            <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
              模板：我们，【家庭代号】家庭，将运用【家庭优势资本 S】，秉承【升级后的家族精神 W】，
              在充满【未来关键趋势 N】的时代，坚定选择【价值观方向 E】的道路，
              全力将孩子培养成一个【结合核心素养与价值基石的、鲜活的人像描述】的人。
            </p>
            <div className="bg-primary/3 rounded-lg p-4">
              <p className="text-[12px] text-muted-foreground mb-2 font-medium">我们的教育愿景</p>
              <div className="text-[15px] leading-[2] font-bold text-highlight print:text-highlight-print">
                {F("vision_statement", "请在此处郑重书写你们独一无二的一句话愿景……", true)}
              </div>
            </div>
          </div>
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

            <p className="text-[13px] text-foreground mt-8">
              日期：{data.sign_date}
            </p>
          </div>

          <div className="text-center mt-12 text-[13px] text-muted-foreground">
            — END —
          </div>
          <p className="text-center text-[11px] text-gray-300 mt-2">
            彼灯家庭教育战略研究中心 | Bilden Education
          </p>
          <p className="text-center text-[10px] text-gray-300 mt-1">
            Copyright &copy; 2025 彼灯教育科技咨询有限公司. All rights reserved.
          </p>
        </div>
      </div>

      {/* ═══════ Print styles ═══════ */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .compass-report { background: white; }
          .page-break { page-break-before: always; }
          .page-break:first-child { page-break-before: auto; }
          @page { size: A4; margin: 20mm 15mm; }
          .snapshot-box { break-inside: avoid; }
          .push-question { break-inside: avoid; }
        }
        @media screen {
          .page-break { margin-bottom: 3rem; padding-top: 1.5rem; border-top: 1px dashed #e5e5e5; }
          .page-break:first-child { border-top: none; padding-top: 0; }
        }
        .text-highlight { color: #E8734A; }
        .print\\:text-highlight-print { color: #E8734A; }
        @media print { .print\\:text-highlight-print { color: #D4602E; } }
        .snapshot-text { font-size: 14px; line-height: 2; color: #2D2A26; }
      `}</style>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────

function SectionHeader({ part, title }: { part: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-[11px] font-bold text-primary tracking-widest mb-1">{part}</p>
      <h2 className="text-[18px] font-bold text-foreground">《{title}》</h2>
    </div>
  );
}

function SnapshotBox({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
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

function QuadrantBox({
  title,
  subtitle,
  color,
  children,
}: {
  title: string;
  subtitle: string;
  color: "sky" | "amber" | "emerald" | "orange";
  children: React.ReactNode;
}) {
  const bgMap = { sky: "bg-sky-50", amber: "bg-amber-50", emerald: "bg-emerald-50", orange: "bg-orange-50" };
  const headerMap = { sky: "bg-sky-100 text-sky-800", amber: "bg-amber-100 text-amber-800", emerald: "bg-emerald-100 text-emerald-800", orange: "bg-orange-100 text-orange-800" };
  return (
    <div className={`rounded-xl overflow-hidden ${bgMap[color]} print:border print:border-gray-200`}>
      <div className={`px-3 py-2 text-[11px] font-bold ${headerMap[color]}`}>
        {title}
        <span className="font-normal ml-2 opacity-70">{subtitle}</span>
      </div>
      <div className="px-3 py-3 space-y-2">{children}</div>
    </div>
  );
}

function QuadrantRow({ label, field }: { label: string; field: React.ReactNode }) {
  return (
    <div className="text-[12px]">
      <span className="text-muted-foreground">{label}：</span>
      {field}
    </div>
  );
}

function PushQuestion({
  number,
  title,
  question,
  example,
  children,
}: {
  number: string;
  title: string;
  question: string;
  example: string;
  children: React.ReactNode;
}) {
  return (
    <div className="push-question mb-6">
      <p className="text-[13px] font-semibold text-foreground mb-1">{number} {title}</p>
      <p className="text-[12px] text-muted-foreground mb-2">{question}</p>
      <p className="text-[11px] text-muted-foreground/60 italic mb-3">例：{example}</p>
      {children}
    </div>
  );
}

function PageFooter({ text }: { text: string }) {
  return (
    <p className="text-[10px] text-gray-300 text-center mt-8 pt-4 border-t border-gray-100">
      &copy; 彼灯教育 | {text}，请妥善保存。
    </p>
  );
}

export default CompassReport;
