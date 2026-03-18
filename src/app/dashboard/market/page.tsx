"use client";

import { useState } from "react";
import { globalStyles } from "@/components/ui/design-tokens";

// ── Types ──────────────────────────────────────────────────────────────
interface ProfilePost {
  title: string;
  url: string;
  platform: string;
  comments: { created_at: string; content: string; likes: number; relevance_score: number }[];
}
interface Lead {
  lead_id: string;
  company: string;
  contact_name: string;
  phone_number: string;
  email: string;
  source_link: string;
}

// ── Sub-components ──────────────────────────────────────────────────────

function UserProfileTab() {
  const [platform, setPlatform] = useState("reddit");
  const [question, setQuestion] = useState("");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ posts: ProfilePost[]; report: string; total: number; download_token: string } | null>(null);
  const [error, setError] = useState("");

  const platforms = ["reddit", "zhihu", "twitter", "facebook", "youtube", "instagram"];

  async function handleSubmit() {
    if (!question.trim()) { setError("请输入分析问题"); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/insights/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, question, limit, filters: {} }),
      });
      const data = await res.json();
      if (data.code === 200) setResult(data.data);
      else setError(data.message || "请求失败");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!result?.download_token) return;
    window.open(`/api/insights/profile/download?token=${result.download_token}`, "_blank");
  }

  return (
    <div className="fade-in">
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24 }}>
        {/* Form */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div className="section-title" style={{ fontSize: 16 }}>用户画像分析</div>
            <div className="section-subtitle">抓取社交平台评论，AI 提炼用户洞察</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="label">数据平台</label>
              <select className="input" value={platform} onChange={e => setPlatform(e.target.value)}>
                {platforms.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">分析问题</label>
              <textarea
                className="input"
                rows={3}
                placeholder="例：用户对这类跑步鞋最常提到的痛点是什么？"
                value={question}
                onChange={e => setQuestion(e.target.value)}
              />
            </div>
            <div>
              <label className="label">抓取数量（帖子数）</label>
              <input
                type="number"
                className="input"
                min={1} max={50}
                value={limit}
                onChange={e => setLimit(Number(e.target.value))}
              />
            </div>
            {error && (
              <div style={{ background: "var(--danger-soft)", color: "var(--danger)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13 }}>
                {error}
              </div>
            )}
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ justifyContent: "center" }}>
              {loading ? <><span className="spinner" /> 分析中...</> : "开始分析"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div>
          {!result && !loading && (
            <div className="card" style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 12 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <div style={{ color: "var(--text-muted)", fontSize: 14 }}>填写左侧表单后开始分析</div>
            </div>
          )}
          {loading && (
            <div className="card" style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 16 }}>
              <div className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
              <div style={{ color: "var(--text-muted)", fontSize: 14 }}>正在抓取数据并分析中，请稍候...</div>
            </div>
          )}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Report */}
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>AI 分析报告</div>
                  <button className="btn btn-outline" onClick={handleDownload} style={{ fontSize: 12, padding: "6px 14px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    下载 CSV
                  </button>
                </div>
                <div style={{ background: "var(--bg-soft)", borderRadius: "var(--radius-md)", padding: 16, fontSize: 14, lineHeight: 1.8, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                  {result.report || "（报告生成中）"}
                </div>
              </div>

              {/* Posts */}
              <div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>共找到 {result.total} 条相关帖子</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {result.posts.map((post, i) => (
                    <div key={i} className="card" style={{ padding: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", flex: 1 }}>{post.title}</div>
                        <span className="badge badge-accent" style={{ marginLeft: 12, flexShrink: 0 }}>{post.platform}</span>
                      </div>
                      {post.comments?.slice(0, 2).map((c, j) => (
                        <div key={j} style={{ background: "var(--bg-soft)", borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 6, fontSize: 13, color: "var(--text-secondary)", borderLeft: "3px solid var(--border-strong)" }}>
                          <div style={{ marginBottom: 4 }}>{c.content}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", gap: 12 }}>
                            <span>👍 {c.likes}</span>
                            <span>相关度 {(c.relevance_score * 100).toFixed(0)}%</span>
                            <span>{c.created_at?.split("T")[0]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MarketAnalysisTab() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ report: string; references: string[]; generated_at: string } | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!question.trim()) { setError("请输入分析问题"); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/insights/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (data.code === 200) setResult(data.data);
      else setError(data.message || "请求失败");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-in">
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div className="section-title" style={{ fontSize: 16 }}>市场分析</div>
            <div className="section-subtitle">AI 深度研究市场规模与竞争格局</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="label">分析问题</label>
              <textarea
                className="input"
                rows={5}
                placeholder="例：当前AI写作工具的市场规模和竞争格局如何？主要玩家有哪些？"
                value={question}
                onChange={e => setQuestion(e.target.value)}
              />
            </div>
            <div style={{ background: "var(--bg-soft)", borderRadius: "var(--radius-md)", padding: 14, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
              💡 可询问市场规模、行业趋势、竞争对手、用户需求、地区分布等问题
            </div>
            {error && (
              <div style={{ background: "var(--danger-soft)", color: "var(--danger)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13 }}>{error}</div>
            )}
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ justifyContent: "center" }}>
              {loading ? <><span className="spinner" /> 研究中...</> : "生成市场报告"}
            </button>
          </div>
        </div>

        <div>
          {!result && !loading && (
            <div className="card" style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 12 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
              <div style={{ color: "var(--text-muted)", fontSize: 14 }}>输入问题后生成专业市场报告</div>
            </div>
          )}
          {loading && (
            <div className="card" style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 16 }}>
              <div className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
              <div style={{ color: "var(--text-muted)", fontSize: 14 }}>AI 正在深度研究，预计需要 30-60 秒...</div>
            </div>
          )}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>市场研究报告</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{result.generated_at?.split("T")[0]}</div>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.9, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                  {result.report}
                </div>
              </div>
              {result.references?.length > 0 && (
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 10 }}>参考来源</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {result.references.map((ref, i) => (
                      <div key={i} style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ color: "var(--accent)", flexShrink: 0 }}>[{i + 1}]</span>
                        <span>{ref}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AcquisitionTab() {
  const [product, setProduct] = useState("");
  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState("CN");
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ leads: Lead[]; total: number; download_token: string } | null>(null);
  const [error, setError] = useState("");

  const regions = [
    { code: "CN", name: "中国" },
    { code: "US", name: "美国" },
    { code: "EU", name: "欧洲" },
    { code: "SEA", name: "东南亚" },
    { code: "JP", name: "日本" },
    { code: "KR", name: "韩国" },
  ];

  async function handleSubmit() {
    if (!product.trim()) { setError("请输入产品名称"); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/insights/acquisition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, target_industry: industry, limit, region }),
      });
      const data = await res.json();
      if (data.code === 200) setResult(data.data);
      else setError(data.message || "请求失败");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-in">
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div className="section-title" style={{ fontSize: 16 }}>获客分析</div>
            <div className="section-subtitle">AI 挖掘潜在目标客户线索</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="label">产品名称</label>
              <input className="input" placeholder="例：工业缝纫机、AI翻译软件" value={product} onChange={e => setProduct(e.target.value)} />
            </div>
            <div>
              <label className="label">目标行业（可选）</label>
              <input className="input" placeholder="例：纺织制造、跨境电商" value={industry} onChange={e => setIndustry(e.target.value)} />
            </div>
            <div>
              <label className="label">目标地区</label>
              <select className="input" value={region} onChange={e => setRegion(e.target.value)}>
                {regions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">获取条数</label>
              <input type="number" className="input" min={5} max={100} value={limit} onChange={e => setLimit(Number(e.target.value))} />
            </div>
            {error && <div style={{ background: "var(--danger-soft)", color: "var(--danger)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13 }}>{error}</div>}
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ justifyContent: "center" }}>
              {loading ? <><span className="spinner" /> 挖掘中...</> : "开始获客分析"}
            </button>
          </div>
        </div>

        <div>
          {!result && !loading && (
            <div className="card" style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 12 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <div style={{ color: "var(--text-muted)", fontSize: 14 }}>填写产品信息后挖掘目标客户</div>
            </div>
          )}
          {loading && (
            <div className="card" style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 16 }}>
              <div className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
              <div style={{ color: "var(--text-muted)", fontSize: 14 }}>AI 正在挖掘潜在客户线索...</div>
            </div>
          )}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 14, color: "var(--text-muted)" }}>共找到 <strong style={{ color: "var(--text)" }}>{result.total}</strong> 条线索</div>
                <button className="btn btn-outline" style={{ fontSize: 12, padding: "6px 14px" }}
                  onClick={() => window.open(`/api/insights/acquisition/download?token=${result.download_token}`, "_blank")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  导出 CSV
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.leads.map((lead) => (
                  <div key={lead.lead_id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{lead.company}</div>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>联系人：{lead.contact_name}</div>
                      </div>
                      <a href={lead.source_link} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontSize: 12 }}>来源链接 →</a>
                    </div>
                    <div className="divider" style={{ margin: "12px 0" }} />
                    <div style={{ display: "flex", gap: 24, fontSize: 13, color: "var(--text-secondary)" }}>
                      <span>📞 {lead.phone_number}</span>
                      <span>✉️ {lead.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
const TABS = [
  { key: "profile", label: "用户画像分析" },
  { key: "market", label: "市场分析" },
  { key: "acquisition", label: "获客分析" },
];

export default function MarketPage() {
  const [tab, setTab] = useState("profile");

  return (
    <>
      <style>{globalStyles}</style>
      <style>{`
        .page-header {
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
          padding: 28px 32px 0;
        }
        .tab-nav { display: flex; gap: 4; margin-top: 20px; }
        .tab-btn {
          padding: 10px 20px;
          font-size: 13px; font-weight: 500;
          font-family: var(--font-body);
          background: transparent;
          border: none; border-bottom: 2px solid transparent;
          cursor: pointer;
          color: var(--text-muted);
          transition: all 0.18s;
          letter-spacing: 0.01em;
        }
        .tab-btn:hover { color: var(--text); }
        .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
        .page-content { padding: 28px 32px; }
      `}</style>

      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Market Intelligence</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, color: "var(--text)" }}>市场调研</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>多维度市场洞察：用户画像 · 趋势分析 · 潜客挖掘</p>
          </div>
        </div>
        <div className="tab-nav">
          {TABS.map(t => (
            <button key={t.key} className={`tab-btn${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {tab === "profile" && <UserProfileTab />}
        {tab === "market" && <MarketAnalysisTab />}
        {tab === "acquisition" && <AcquisitionTab />}
      </div>
    </>
  );
}
