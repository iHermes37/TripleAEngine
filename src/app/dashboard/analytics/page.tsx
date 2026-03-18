"use client";

import { useState } from "react";
import { globalStyles } from "@/components/ui/design-tokens";

// Mock analytics data
const MOCK_STATS = [
  { label: "本月新增线索", value: "1,248", change: "+18%", up: true },
  { label: "内容总曝光量", value: "328.4K", change: "+23%", up: true },
  { label: "平均互动率", value: "6.7%", change: "+1.2%", up: true },
  { label: "转化线索数", value: "186", change: "-3%", up: false },
];

const MOCK_PLATFORM_DATA = [
  { platform: "Reddit", posts: 42, comments: 1240, avgRelevance: 0.87, color: "#FF4500" },
  { platform: "YouTube", posts: 18, comments: 3560, avgRelevance: 0.79, color: "#FF0000" },
  { platform: "Instagram", posts: 35, comments: 2100, avgRelevance: 0.72, color: "#E1306C" },
  { platform: "Twitter", posts: 67, comments: 890, avgRelevance: 0.65, color: "#1DA1F2" },
];

const MOCK_CONTENT_PERF = [
  { title: "中国制造业出海趋势分析 2024", views: 12500, clicks: 2300, cvr: "6.8%", trend: "↑" },
  { title: "如何选择目标市场——东南亚篇", views: 8900, clicks: 1450, cvr: "5.1%", trend: "↑" },
  { title: "工业设备出海最佳实践", views: 7200, clicks: 980, cvr: "3.8%", trend: "→" },
  { title: "跨境电商选品策略 2024", views: 5600, clicks: 720, cvr: "3.2%", trend: "↓" },
  { title: "德国市场进入路径分析", views: 4100, clicks: 560, cvr: "2.9%", trend: "↑" },
];

const MOCK_LEADS_BY_REGION = [
  { region: "东南亚", count: 412, pct: 33 },
  { region: "欧洲", count: 298, pct: 24 },
  { region: "北美", count: 256, pct: 20 },
  { region: "日本/韩国", count: 187, pct: 15 },
  { region: "中东", count: 95, pct: 8 },
];

function StatCard({ label, value, change, up }: { label: string; value: string; change: string; up: boolean }) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600, color: "var(--text)", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 500, marginTop: 8, color: up ? "var(--success)" : "var(--danger)" }}>
        {change} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>较上月</span>
      </div>
    </div>
  );
}

function BarChart({ data, maxVal, colorKey }: { data: { label: string; value: number; color?: string }[]; maxVal: number; colorKey?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", minWidth: 80, textAlign: "right" }}>{d.label}</div>
          <div style={{ flex: 1, height: 10, background: "var(--bg-muted)", borderRadius: 5, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${(d.value / maxVal) * 100}%`,
              background: d.color || "var(--accent)",
              borderRadius: 5,
              transition: "width 0.8s ease",
            }} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", minWidth: 50 }}>{d.value}</div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");

  return (
    <>
      <style>{globalStyles}</style>
      <style>{`
        .page-header { background: var(--bg-card); border-bottom: 1px solid var(--border); padding: 28px 32px; }
        .page-content { padding: 28px 32px; display: flex; flex-direction: column; gap: 24px; }
      `}</style>

      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Data Analytics</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, color: "var(--text)" }}>数据分析</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>全局业务数据总览 · 内容效果 · 线索分布</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["7d", "30d", "90d"].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="btn"
                style={{
                  background: period === p ? "var(--accent-soft)" : "transparent",
                  color: period === p ? "var(--accent)" : "var(--text-muted)",
                  borderColor: period === p ? "var(--accent)" : "var(--border)",
                  padding: "7px 16px", fontSize: 13,
                }}>
                {p === "7d" ? "近 7 天" : p === "30d" ? "近 30 天" : "近 3 月"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {MOCK_STATS.map((s, i) => <StatCard key={i} {...s} />)}
        </div>

        {/* Platform + Content grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 24 }}>
          {/* Platform performance */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>平台数据采集分布</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 24 }}>各平台帖子量与评论量概览</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {MOCK_PLATFORM_DATA.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "var(--bg-soft)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{p.platform}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{p.posts} 帖子 · {p.comments} 评论</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{(p.avgRelevance * 100).toFixed(0)}%</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>相关度</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Performance table */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>内容表现排行</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>按曝光量排序的内容表现</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["内容标题", "曝光", "点击", "转化率", "趋势"].map(h => (
                    <th key={h} style={{ textAlign: h === "内容标题" ? "left" : "right", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: 12, borderBottom: "1px solid var(--border)", fontFamily: "var(--font-body)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_CONTENT_PERF.map((row, i) => (
                  <tr key={i}>
                    <td style={{ padding: "12px 0 12px 0", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text)", maxWidth: 200 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.title}</div>
                    </td>
                    <td style={{ textAlign: "right", padding: "12px 0", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-secondary)" }}>{row.views.toLocaleString()}</td>
                    <td style={{ textAlign: "right", padding: "12px 0", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-secondary)" }}>{row.clicks.toLocaleString()}</td>
                    <td style={{ textAlign: "right", padding: "12px 0", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 500, color: "var(--accent)" }}>{row.cvr}</td>
                    <td style={{ textAlign: "right", padding: "12px 0", borderBottom: "1px solid var(--border)", fontSize: 16, color: row.trend === "↑" ? "var(--success)" : row.trend === "↓" ? "var(--danger)" : "var(--text-muted)" }}>{row.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leads by region */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>线索地区分布</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 24 }}>潜在客户来源地区占比</div>
            <BarChart
              data={MOCK_LEADS_BY_REGION.map(r => ({ label: r.region, value: r.count, color: "var(--accent)" }))}
              maxVal={500}
            />
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>运营健康评分</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 24 }}>各项运营指标综合评估</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {[
                { label: "内容质量指数", score: 82, color: "var(--success)" },
                { label: "互动活跃度", score: 74, color: "var(--accent)" },
                { label: "品牌曝光度", score: 68, color: "var(--gold)" },
                { label: "线索转化质量", score: 56, color: "var(--warning)" },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.score}</span>
                  </div>
                  <div style={{ height: 8, background: "var(--bg-muted)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${item.score}%`, background: item.color, borderRadius: 4, transition: "width 0.8s ease" }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, padding: "14px 16px", background: "var(--accent-soft)", borderRadius: "var(--radius-md)", borderLeft: "3px solid var(--accent)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", marginBottom: 4 }}>综合评分：70 / 100</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>整体运营状况良好，建议重点提升线索转化质量与品牌曝光度，可优先加大东南亚内容投放。</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
