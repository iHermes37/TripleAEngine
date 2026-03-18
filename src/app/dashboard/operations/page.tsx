"use client";

import { useState } from "react";
import { globalStyles } from "@/components/ui/design-tokens";

interface OverviewData {
  total_views: number;
  total_likes: number;
  new_followers: number;
  avg_engagement_rate: string;
}

interface ReportSection {
  metric: string;
  heading: string;
  content: string;
}

interface OperationsReport {
  summary: string;
  sections: ReportSection[];
  recommendations: string[];
  generated_at: string;
}

interface OperationsResult {
  platform: string;
  period: string;
  overview: OverviewData;
  report: OperationsReport | string;
}

const PLATFORMS = [
  { code: "douyin", name: "抖音" },
  { code: "instagram", name: "Instagram" },
  { code: "youtube", name: "YouTube" },
  { code: "xiaohongshu", name: "小红书" },
  { code: "twitter", name: "Twitter / X" },
];

const METRICS_OPTIONS = [
  { key: "engagement", label: "互动分析" },
  { key: "follower_growth", label: "粉丝增长" },
  { key: "conversion", label: "转化漏斗" },
  { key: "content_performance", label: "内容表现" },
  { key: "best_post_time", label: "最佳发帖时间" },
];

function OverviewCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
        <div style={{ color: "var(--accent)", opacity: 0.6 }}>{icon}</div>
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--text)" }}>{value}</div>
    </div>
  );
}

export default function OperationsPage() {
  const [platform, setPlatform] = useState("douyin");
  const [accountId, setAccountId] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [metrics, setMetrics] = useState<string[]>(["engagement", "follower_growth"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OperationsResult | null>(null);
  const [error, setError] = useState("");

  function toggleMetric(key: string) {
    setMetrics(prev => prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]);
  }

  async function handleAnalyze() {
    setError(""); setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          account_id: accountId || "default",
          date_range: dateStart && dateEnd ? { start: dateStart, end: dateEnd } : undefined,
          metrics,
        }),
      });
      const data = await res.json();
      if (data.code === 200) setResult(data.data);
      else setError(data.message || "分析失败");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  const reportObj = result?.report && typeof result.report === "object" ? (result.report as OperationsReport) : null;
  const reportStr = result?.report && typeof result.report === "string" ? result.report as string : null;

  return (
    <>
      <style>{globalStyles}</style>
      <style>{`
        .page-header { background: var(--bg-card); border-bottom: 1px solid var(--border); padding: 28px 32px; }
        .page-content { padding: 28px 32px; display: grid; grid-template-columns: 300px 1fr; gap: 24px; }
        .metric-toggle {
          padding: 7px 14px; border-radius: var(--radius-md); font-size: 12px; cursor: pointer;
          border: 1px solid; transition: all 0.15s; font-family: var(--font-body);
        }
      `}</style>

      <div className="page-header">
        <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Smart Operations</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, color: "var(--text)" }}>智能运营</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>账号运营数据分析 · AI 策略建议 · 最优内容方向</p>
      </div>

      <div className="page-content">
        {/* Form */}
        <div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>分析参数</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>配置账号与分析维度</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="label">平台</label>
                <select className="input" value={platform} onChange={e => setPlatform(e.target.value)}>
                  {PLATFORMS.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">账号 ID（可选）</label>
                <input className="input" placeholder="account_001" value={accountId} onChange={e => setAccountId(e.target.value)} />
              </div>
              <div>
                <label className="label">时间范围（可选）</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input type="date" className="input" value={dateStart} onChange={e => setDateStart(e.target.value)} />
                  <input type="date" className="input" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">分析维度</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {METRICS_OPTIONS.map(m => (
                    <button
                      key={m.key}
                      className="metric-toggle"
                      onClick={() => toggleMetric(m.key)}
                      style={{
                        background: metrics.includes(m.key) ? "var(--accent-soft)" : "transparent",
                        color: metrics.includes(m.key) ? "var(--accent)" : "var(--text-muted)",
                        borderColor: metrics.includes(m.key) ? "var(--accent)" : "var(--border)",
                      }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              {error && <div style={{ background: "var(--danger-soft)", color: "var(--danger)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13 }}>{error}</div>}
              <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading} style={{ justifyContent: "center" }}>
                {loading ? <><span className="spinner" /> 分析中...</> : "生成运营报告"}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          {!result && !loading && (
            <div className="card" style={{ padding: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 14 }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              <div style={{ color: "var(--text-muted)", fontSize: 14 }}>选择平台后生成运营分析报告</div>
            </div>
          )}
          {loading && (
            <div className="card" style={{ padding: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
              <div className="spinner spinner-dark" style={{ width: 40, height: 40, borderWidth: 3 }} />
              <div style={{ color: "var(--text-muted)", fontSize: 14 }}>AI 正在分析运营数据...</div>
            </div>
          )}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Header info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span className="badge badge-accent" style={{ textTransform: "capitalize" }}>{result.platform}</span>
                  {result.period && <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 10 }}>{result.period}</span>}
                </div>
              </div>

              {/* Overview cards */}
              {result.overview && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                  <OverviewCard label="总曝光量" value={result.overview.total_views?.toLocaleString()} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>} />
                  <OverviewCard label="获赞总数" value={result.overview.total_likes?.toLocaleString()} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>} />
                  <OverviewCard label="新增粉丝" value={result.overview.new_followers?.toLocaleString()} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
                  <OverviewCard label="互动率" value={result.overview.avg_engagement_rate} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} />
                </div>
              )}

              {/* Report */}
              <div className="card" style={{ padding: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 16 }}>AI 运营报告</div>
                {reportObj ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ background: "var(--bg-soft)", borderRadius: "var(--radius-md)", padding: 16, fontSize: 14, lineHeight: 1.8, color: "var(--text-secondary)" }}>
                      {reportObj.summary}
                    </div>
                    {reportObj.sections?.map((s, i) => (
                      <div key={i}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>{s.heading}</div>
                        <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-secondary)" }}>{s.content}</div>
                      </div>
                    ))}
                    {reportObj.recommendations?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>优化建议</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {reportObj.recommendations.map((r, i) => (
                            <div key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--text-secondary)" }}>
                              <span style={{ color: "var(--accent)", fontWeight: 600, flexShrink: 0 }}>{i + 1}.</span>
                              <span>{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 14, lineHeight: 1.9, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{reportStr}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
