"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type EcommercePlatform = string;

interface ProductInfo {
    name: string;
    price: number;
    description: string;
    image: string;
    Sales: number;
}

interface CompetitorProductItem {
    platform: EcommercePlatform;
    product: ProductInfo;
    rank: number;
    trend: "up" | "down" | "stable";
    trendValue: string;
}

interface CompetitorStats {
    avg_price: number;
    max_sales: number;
    min_price: number;
    max_price: number;
}

interface CompetitorInsight {
    summary: string;
    price_analysis: string;
    recommendations: string[];
    generated_at: string;
}

interface CompetitorResponse {
    keyword: string;
    platforms_searched: EcommercePlatform[];
    total_results: number;
    results: CompetitorProductItem[];
    stats: CompetitorStats;
    insight?: CompetitorInsight;
}

interface VideoMetric {
    label: string;
    value: string | number;
    change?: string;
    positive?: boolean;
}

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    time: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_META: Record<string, { name: string; flag: string; currency: string }> = {
    amazon:  { name: "Amazon", flag: "🇺🇸", currency: "$" },
    taobao:  { name: "淘宝",   flag: "🛍",  currency: "¥" },
    jd:      { name: "京东",   flag: "🔴",  currency: "¥" },
    shopee:  { name: "Shopee", flag: "🟠",  currency: "$" },
    default: { name: "Amazon", flag: "🏪",  currency: "$" },
};

const VIDEO_METRICS: VideoMetric[] = [
    { label: "视频总播放量", value: "2,847,391", change: "+18.4%", positive: true },
    { label: "平均完播率",   value: "67.3%",     change: "+3.2%",  positive: true },
    { label: "视频转化率",   value: "4.8%",      change: "-0.6%",  positive: false },
    { label: "粉丝互动率",   value: "8.92%",     change: "+1.1%",  positive: true },
];

const INITIAL_CHAT: ChatMessage[] = [{
    role: "assistant",
    content: "你好！我是飞书智能助手 🤖 我可以帮你分析竞品数据、生成运营策略、解读市场趋势。请问有什么可以帮到你的？",
    time: "09:00",
}];

const QUICK_REPLIES: Record<string, string> = {
    "分析竞品定价策略": "根据市场数据，竞品定价通常分三个梯队：①入门 ¥299–499，②主流 ¥699–1299，③高端 ¥1599+。\n\n建议新品以主流价切入，首发阶段搭配 9 折优惠提升曝光，站稳后逐步恢复定价。",
    "如何提升转化率":   "根据数据分析，4 个策略可显著提升转化率：\n① 优化主图：加入使用场景，点击率 +23%\n② 完善评价：引导真实 UGC，转化 +15–30%\n③ 限时活动：倒计时优惠，即时决策 +40%+\n④ 详情结构：痛点→方案→背书→CTA 最优",
    "当前市场热门品类": "近 30 天热门品类 TOP 5：\n1. 主动降噪耳机（+35%）\n2. 智能手表（+28%）\n3. 便携投影仪（+19%）\n4. 无线充电器（+14%）\n5. 蓝牙音箱（+11%）",
};

// ─── Global CSS ───────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #f4f6fb; --bg-card: #ffffff; --bg-soft: #f1f5f9;
    --text: #0f172a; --text-2: #334155; --text-muted: #94a3b8;
    --accent: #4f46e5; --accent-soft: #eef2ff;
    --success: #16a34a; --success-soft: #dcfce7;
    --danger: #dc2626;  --danger-soft: #fee2e2;
    --warn: #d97706;    --warn-soft: #fef3c7;
    --border: #e2e8f0;
    --shadow-sm: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
    --r: 10px;
  }
  body { font-family: 'PingFang SC','Hiragino Sans GB','Microsoft YaHei',system-ui,sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; }
  .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r); box-shadow: var(--shadow-sm); }
  .input { width:100%; padding:9px 12px; border:1.5px solid var(--border); border-radius:var(--r); font-size:13px; color:var(--text); background:var(--bg-card); transition:border .15s; outline:none; font-family:inherit; }
  .input:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(79,70,229,.1); }
  .label { font-size:11.5px; font-weight:600; color:var(--text-muted); display:block; margin-bottom:6px; letter-spacing:.03em; text-transform:uppercase; }
  .btn { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:var(--r); font-size:13px; font-weight:600; cursor:pointer; border:none; transition:all .15s; font-family:inherit; }
  .btn:disabled { opacity:.5; cursor:not-allowed; }
  .btn-primary { background:var(--accent); color:#fff; }
  .btn-primary:hover:not(:disabled) { background:#4338ca; box-shadow:0 4px 12px rgba(79,70,229,.3); }
  .spinner { width:15px; height:15px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; flex-shrink:0; }
  .spinner-dark { border-color:rgba(79,70,229,.15); border-top-color:var(--accent); }
  .badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes bounce { 0%,100% { transform:translateY(0); opacity:.4; } 50% { transform:translateY(-5px); opacity:1; } }
  .fade-in { animation:fadeIn .3s ease both; }
  input[type=number]::-webkit-inner-spin-button { opacity:1; }
`;

// ─── Shared small components ──────────────────────────────────────────────────

function MetricCard({ m, delay = 0 }: { m: VideoMetric; delay?: number }) {
    return (
        <div className="card fade-in" style={{ padding: 20, animationDelay: `${delay}ms` }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 10 }}>{m.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{m.value}</div>
            {m.change && (
                <span className="badge" style={{ background: m.positive ? "var(--success-soft)" : "var(--danger-soft)", color: m.positive ? "var(--success)" : "var(--danger)" }}>
                    {m.positive ? "▲" : "▼"} {m.change}
                </span>
            )}
        </div>
    );
}

function TrendPill({ trend, value }: { trend: string; value: string }) {
    const map: Record<string, { bg: string; color: string; icon: string }> = {
        up:     { bg: "var(--success-soft)", color: "var(--success)",   icon: "↑" },
        down:   { bg: "var(--danger-soft)",  color: "var(--danger)",    icon: "↓" },
        stable: { bg: "var(--bg-soft)",      color: "var(--text-muted)", icon: "→" },
    };
    const c = map[trend] ?? map.stable;
    return <span style={{ background: c.bg, color: c.color, borderRadius: 20, padding: "2px 10px", fontSize: 11.5, fontWeight: 700 }}>{c.icon} {value}</span>;
}

function PlatformBadge({ platform }: { platform: string }) {
    const meta = PLATFORM_META[platform] ?? PLATFORM_META.default;
    return <span style={{ fontSize: 11.5, background: "var(--bg-soft)", borderRadius: 6, padding: "2px 8px", color: "var(--text-muted)", fontWeight: 500 }}>{meta.flag} {meta.name}</span>;
}

function CompetitorCard({ item, delay = 0 }: { item: CompetitorProductItem; delay?: number }) {
    const meta = PLATFORM_META[item.platform] ?? PLATFORM_META.default;
    return (
        <div className="card fade-in" style={{ padding: 18, display: "flex", gap: 14, animationDelay: `${delay}ms` }}>
            <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: "50%", background: item.rank <= 3 ? "var(--accent)" : "var(--bg-soft)", color: item.rank <= 3 ? "#fff" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
                {item.rank}
            </div>
            <img
                src={item.product.image || "https://placehold.co/64x64/eef2ff/4f46e5?text=P"}
                alt={item.product.name}
                style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }}
                onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/64x64/eef2ff/4f46e5?text=P"; }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {item.product.name}
                    </div>
                    <TrendPill trend={item.trend} value={item.trendValue} />
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {item.product.description}
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 800, fontSize: 17, color: "var(--accent)" }}>{meta.currency}{item.product.price.toLocaleString()}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>月销 <strong style={{ color: "var(--text-2)" }}>{item.product.Sales.toLocaleString()}</strong></span>
                    <PlatformBadge platform={item.platform} />
                </div>
            </div>
        </div>
    );
}

function TabBar({ active, onChange }: { active: string; onChange: (t: string) => void }) {
    const tabs = [
        { key: "video",      label: "视频数据分析", icon: "📊" },
        { key: "competitor", label: "竞品分析",     icon: "🔍" },
        { key: "feishu",     label: "飞书智能助手", icon: "🤖" },
    ];
    return (
        <div style={{ display: "flex", background: "var(--bg-card)", borderBottom: "1px solid var(--border)", padding: "0 32px" }}>
            {tabs.map(t => (
                <button key={t.key} onClick={() => onChange(t.key)} style={{
                    padding: "15px 18px", fontSize: 13.5, fontWeight: active === t.key ? 700 : 400,
                    color: active === t.key ? "var(--accent)" : "var(--text-muted)",
                    background: "none", border: "none",
                    borderBottom: active === t.key ? "2.5px solid var(--accent)" : "2.5px solid transparent",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
                    transition: "all 0.15s", marginBottom: -1,
                }}>
                    <span>{t.icon}</span>{t.label}
                </button>
            ))}
        </div>
    );
}

// ─── Tab: Video ───────────────────────────────────────────────────────────────

function VideoTab() {
    const [shown, setShown] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const bars = [
        { label: "Mon", v: 62 }, { label: "Tue", v: 75 }, { label: "Wed", v: 88 },
        { label: "Thu", v: 71 }, { label: "Fri", v: 84 }, { label: "Sat", v: 100 }, { label: "Sun", v: 68 },
    ];
    async function refresh() {
        setRefreshing(true);
        await new Promise(r => setTimeout(r, 1200));
        setShown(true);
        setRefreshing(false);
    }
    return (
        <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>视频数据总览</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>近 30 天 · 实时更新</div>
                </div>
                <button className="btn btn-primary" onClick={refresh} disabled={refreshing}>
                    {refreshing ? <><span className="spinner" />刷新中...</> : "🔄 刷新数据"}
                </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
                {VIDEO_METRICS.map((m, i) => <MetricCard key={i} m={m} delay={i * 60} />)}
            </div>
            <div className="card" style={{ padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 20 }}>本周每日播放量分布</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 110 }}>
                    {bars.map((d, i) => (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                            <div style={{ width: "100%", borderRadius: "4px 4px 0 0", height: `${d.v}%`, minHeight: 6, background: d.label === "Sat" ? "var(--accent)" : "var(--accent-soft)", border: d.label === "Sat" ? "none" : "1px solid #c7d2fe", transition: "height .5s ease" }} />
                            <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{d.label}</div>
                        </div>
                    ))}
                </div>
            </div>
            {shown && (
                <div className="card fade-in" style={{ padding: 20, borderLeft: "3px solid var(--accent)" }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10, color: "var(--text)" }}>📈 AI 数据洞察</div>
                    <ul style={{ paddingLeft: 18, fontSize: 13, color: "var(--text-2)", lineHeight: 2.1 }}>
                        <li>周六播放峰值显著，建议将新视频发布时间调整至 <strong>周五晚 20:00</strong></li>
                        <li>转化率下滑 0.6%，建议优化前 3 秒钩子与行动号召语</li>
                        <li>互动率高于行业均值 2.1×，适合推进付费会员转化漏斗</li>
                    </ul>
                </div>
            )}
        </div>
    );
}

// ─── Tab: Competitor ──────────────────────────────────────────────────────────

function CompetitorTab() {
    const [keyword, setKeyword] = useState("shoes");
    // ↓ 新增：采集页数，对应 AmazonClient.maxPages
    const [maxPages, setMaxPages] = useState(1);

    const [registeredPlatforms, setRegisteredPlatforms] = useState<EcommercePlatform[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<EcommercePlatform[]>([]);
    const [loadingPlatforms, setLoadingPlatforms] = useState(true);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<CompetitorResponse | null>(null);
    const [error, setError] = useState("");
    const [sortBy, setSortBy] = useState<"sales" | "price_asc" | "price_desc">("sales");
    const [filterPlatform, setFilterPlatform] = useState<string>("all");
    const [genInsight, setGenInsight] = useState(true);

    // GET /api/operations/competitor → EcommerceManager.getRegisteredPlatforms()
    useEffect(() => {
        async function loadPlatforms() {
            setLoadingPlatforms(true);
            try {
                const res = await fetch("/api/operations/competitor");
                const json = await res.json();
                if (json.code === 200) {
                    const platforms: EcommercePlatform[] = json.data.platforms;
                    setRegisteredPlatforms(platforms);
                    setSelectedPlatforms(platforms);
                }
            } catch {
                const fallback = ["amazon"];
                setRegisteredPlatforms(fallback);
                setSelectedPlatforms(fallback);
            } finally {
                setLoadingPlatforms(false);
            }
        }
        loadPlatforms();
    }, []);

    function togglePlatform(p: EcommercePlatform) {
        setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
    }

    // POST /api/operations/competitor → EcommerceManager.searchMultiplePlatformsList()
    async function handleSearch() {
        if (!keyword.trim() || selectedPlatforms.length === 0) return;
        setLoading(true);
        setError("");
        setData(null);
        setFilterPlatform("all");
        try {
            const res = await fetch("/api/operations/competitor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    keyword: keyword.trim(),
                    platforms: selectedPlatforms,
                    max_pages: maxPages,          // ← 透传采集页数
                    generate_insight: genInsight,
                }),
            });
            const json = await res.json();
            if (json.code === 200) {
                setData(json.data as CompetitorResponse);
            } else {
                setError(json.message || "搜索失败，请重试");
            }
        } catch {
            setError("网络错误，请稍后重试");
        } finally {
            setLoading(false);
        }
    }

    const filtered = (data?.results ?? []).filter(r => filterPlatform === "all" || r.platform === filterPlatform);
    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === "sales")      return b.product.Sales - a.product.Sales;
        if (sortBy === "price_asc")  return a.product.price - b.product.price;
        return b.product.price - a.product.price;
    });

    return (
        <div style={{ padding: "28px 32px", display: "grid", gridTemplateColumns: "290px 1fr", gap: 24, alignItems: "start" }}>

            {/* ── Left panel ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="card" style={{ padding: 22 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 2 }}>竞品搜索配置</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 18 }}>EcommerceManager · 多平台并行采集</div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Keyword */}
                        <div>
                            <label className="label">搜索关键词</label>
                            <input className="input" placeholder="e.g. shoes, 降噪耳机..." value={keyword}
                                onChange={e => setKeyword(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSearch()} />
                        </div>

                        {/* Max pages — 新增控件 */}
                        <div>
                            <label className="label">
                                采集页数
                                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--text-muted)" }}>
                                    每页约 48 条，最多 5 页
                                </span>
                            </label>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                {/* Quick select buttons */}
                                {[1, 2, 3, 5].map(n => (
                                    <button key={n} onClick={() => setMaxPages(n)} style={{
                                        flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 13, fontWeight: 600,
                                        border: `1.5px solid ${maxPages === n ? "var(--accent)" : "var(--border)"}`,
                                        background: maxPages === n ? "var(--accent-soft)" : "transparent",
                                        color: maxPages === n ? "var(--accent)" : "var(--text-muted)",
                                        cursor: "pointer", transition: "all .15s",
                                    }}>{n}</button>
                                ))}
                                {/* Custom input */}
                                <input
                                    type="number" min={1} max={5} className="input"
                                    value={maxPages}
                                    onChange={e => {
                                        const v = Math.min(5, Math.max(1, parseInt(e.target.value) || 1));
                                        setMaxPages(v);
                                    }}
                                    style={{ width: 60, textAlign: "center", flexShrink: 0 }}
                                />
                            </div>
                            <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)" }}>
                                预计采集约 <strong style={{ color: "var(--accent)" }}>{maxPages * 48}</strong> 条商品，耗时约 {maxPages * 30}s
                            </div>
                        </div>

                        {/* Platform checkboxes */}
                        <div>
                            <label className="label">
                                已注册平台
                                {loadingPlatforms && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--accent)" }}>加载中...</span>}
                            </label>
                            {registeredPlatforms.length === 0 && !loadingPlatforms ? (
                                <div style={{ fontSize: 12, color: "var(--danger)", padding: "10px 0" }}>
                                    未检测到已注册平台，请检查 EcommerceManager 初始化
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {registeredPlatforms.map(p => {
                                        const meta = PLATFORM_META[p] ?? PLATFORM_META.default;
                                        const selected = selectedPlatforms.includes(p);
                                        return (
                                            <label key={p} style={{
                                                display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                                                padding: "9px 12px", borderRadius: 8,
                                                border: `1.5px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                                                background: selected ? "var(--accent-soft)" : "transparent",
                                                transition: "all 0.15s",
                                            }}>
                                                <input type="checkbox" checked={selected} onChange={() => togglePlatform(p)} style={{ accentColor: "var(--accent)" }} />
                                                <span style={{ fontSize: 16 }}>{meta.flag}</span>
                                                <span style={{ fontSize: 13, fontWeight: 500, color: selected ? "var(--accent)" : "var(--text)" }}>{meta.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* LLM insight toggle */}
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--text-2)" }}>
                            <input type="checkbox" checked={genInsight} onChange={e => setGenInsight(e.target.checked)} style={{ accentColor: "var(--accent)", width: 15, height: 15 }} />
                            生成 AI 竞品洞察报告
                        </label>

                        {error && (
                            <div style={{ background: "var(--danger-soft)", color: "var(--danger)", borderRadius: 8, padding: "10px 13px", fontSize: 12.5 }}>{error}</div>
                        )}

                        <button className="btn btn-primary" onClick={handleSearch}
                            disabled={loading || !keyword.trim() || selectedPlatforms.length === 0 || loadingPlatforms}
                            style={{ justifyContent: "center" }}>
                            {loading
                                ? <><span className="spinner" />采集中（第 {maxPages} 页共 {maxPages} 页）...</>
                                : `🔍 开始竞品分析（${maxPages} 页 × ${selectedPlatforms.length} 平台）`
                            }
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {data && (
                    <div className="card fade-in" style={{ padding: 18 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 14 }}>📊 数据统计</div>
                        {[
                            { label: "竞品总数",  value: `${data.total_results} 款` },
                            { label: "均价",      value: `${data.stats.avg_price.toFixed(0)}` },
                            { label: "价格区间",  value: `${data.stats.min_price} – ${data.stats.max_price}` },
                            { label: "最高月销",  value: data.stats.max_sales.toLocaleString() },
                        ].map((s, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{s.value}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pricing tip */}
                {data && (
                    <div className="card fade-in" style={{ padding: 16, background: "var(--accent-soft)", border: "1.5px solid #c7d2fe" }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>💡 定价参考</div>
                        <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.8 }}>
                            建议定价区间：<strong>{Math.round(data.stats.avg_price * 0.85)} – {Math.round(data.stats.avg_price * 1.15)}</strong>
                            <br />（均价 ±15%，兼顾竞争力与利润）
                        </div>
                    </div>
                )}
            </div>

            {/* ── Right results area ── */}
            <div style={{ minWidth: 0 }}>
                {/* Empty */}
                {!data && !loading && (
                    <div className="card" style={{ padding: 64, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 420, gap: 14 }}>
                        <div style={{ fontSize: 52 }}>🔍</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>开始竞品分析</div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", maxWidth: 320, lineHeight: 1.8 }}>
                            输入关键词 · 选择平台 · 设定采集页数<br />
                            EcommerceManager 将并行拉取全部商品列表
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="card" style={{ padding: 64, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 420, gap: 20 }}>
                        <div className="spinner spinner-dark" style={{ width: 44, height: 44, borderWidth: 3 }} />
                        <div style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>
                            正在调用 EcommerceManager.searchMultiplePlatformsList
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            采集 {maxPages} 页 × {selectedPlatforms.length} 平台 · 预计约 {maxPages * 30}s
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                            {selectedPlatforms.map(p => {
                                const meta = PLATFORM_META[p] ?? PLATFORM_META.default;
                                return <span key={p} style={{ fontSize: 12, background: "var(--bg-soft)", borderRadius: 20, padding: "4px 12px", color: "var(--text-muted)" }}>{meta.flag} {meta.name}</span>;
                            })}
                        </div>
                    </div>
                )}

                {/* Results */}
                {data && !loading && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Header + filters */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                            <div style={{ fontSize: 14, color: "var(--text-2)" }}>
                                关键词 <strong style={{ color: "var(--text)" }}>「{data.keyword}」</strong> — 共找到 <strong style={{ color: "var(--accent)" }}>{data.total_results}</strong> 条竞品
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                {[{ code: "all", name: "全部" }, ...data.platforms_searched.map(p => ({ code: p, name: (PLATFORM_META[p] ?? PLATFORM_META.default).name }))].map(p => (
                                    <button key={p.code} onClick={() => setFilterPlatform(p.code)} className="btn" style={{
                                        padding: "5px 12px", fontSize: 11.5,
                                        background: filterPlatform === p.code ? "var(--accent-soft)" : "transparent",
                                        color: filterPlatform === p.code ? "var(--accent)" : "var(--text-muted)",
                                        border: `1.5px solid ${filterPlatform === p.code ? "var(--accent)" : "var(--border)"}`,
                                        borderRadius: 20,
                                    }}>{p.name}</button>
                                ))}
                                <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                                    style={{ padding: "5px 10px", fontSize: 11.5, border: "1.5px solid var(--border)", borderRadius: 20, background: "var(--bg-card)", color: "var(--text-muted)", cursor: "pointer", outline: "none" }}>
                                    <option value="sales">按销量</option>
                                    <option value="price_asc">价格↑</option>
                                    <option value="price_desc">价格↓</option>
                                </select>
                            </div>
                        </div>

                        {/* Cards */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {sorted.length === 0
                                ? <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>该平台暂无数据</div>
                                : sorted.map((item, i) => <CompetitorCard key={`${item.platform}-${item.product.name}-${i}`} item={item} delay={Math.min(i * 30, 300)} />)
                            }
                        </div>

                        {/* AI Insight */}
                        {data.insight && (
                            <div className="card fade-in" style={{ padding: 22, borderLeft: "3px solid var(--warn)" }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                                    🤖 AI 竞品洞察
                                    <span style={{ fontSize: 10.5, background: "var(--warn-soft)", color: "var(--warn)", borderRadius: 20, padding: "2px 10px", fontWeight: 600 }}>
                                        基于 {data.total_results} 条竞品数据
                                    </span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    <div style={{ background: "var(--bg-soft)", borderRadius: 8, padding: "13px 15px", fontSize: 13, lineHeight: 1.85, color: "var(--text-2)" }}>
                                        {data.insight.summary}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>价格策略</div>
                                        <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.8 }}>{data.insight.price_analysis}</div>
                                    </div>
                                    {data.insight.recommendations?.length > 0 && (
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".04em" }}>优化建议</div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                {data.insight.recommendations.map((r, i) => (
                                                    <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
                                                        <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0, minWidth: 18 }}>{i + 1}.</span>
                                                        <span>{r}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Tab: Feishu ──────────────────────────────────────────────────────────────

function FeishuTab() {
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const QUICK = Object.keys(QUICK_REPLIES);
    const now = () => new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

    async function send(content: string) {
        if (!content.trim() || loading) return;
        setMessages(prev => [...prev, { role: "user", content, time: now() }]);
        setInput("");
        setLoading(true);
        await new Promise(r => setTimeout(r, 1200 + Math.random() * 600));
        const reply = QUICK_REPLIES[content] ?? `我已收到「${content}」，正在基于最新竞品数据分析，建议同步查看竞品分析页面获取详细数据。`;
        setMessages(prev => [...prev, { role: "assistant", content: reply, time: now() }]);
        setLoading(false);
    }

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

    return (
        <div style={{ display: "grid", gridTemplateRows: "1fr auto", height: "calc(100vh - 185px)", minHeight: 480 }}>
            <div style={{ overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
                {messages.map((msg, i) => (
                    <div key={i} className="fade-in" style={{ display: "flex", gap: 11, justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end" }}>
                        {msg.role === "assistant" && <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🤖</div>}
                        <div style={{ maxWidth: "70%" }}>
                            <div style={{ background: msg.role === "user" ? "var(--accent)" : "var(--bg-card)", color: msg.role === "user" ? "#fff" : "var(--text-2)", borderRadius: msg.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px", padding: "11px 15px", fontSize: 13.5, lineHeight: 1.85, whiteSpace: "pre-wrap", border: msg.role === "assistant" ? "1px solid var(--border)" : "none", boxShadow: "var(--shadow-sm)" }}>
                                {msg.content}
                            </div>
                            <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 3, textAlign: msg.role === "user" ? "right" : "left" }}>{msg.time}</div>
                        </div>
                        {msg.role === "user" && <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--bg-soft)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>👤</div>}
                    </div>
                ))}
                {loading && (
                    <div style={{ display: "flex", gap: 11, alignItems: "flex-end" }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🤖</div>
                        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px 14px 14px 3px", padding: "13px 18px", display: "flex", gap: 5, boxShadow: "var(--shadow-sm)" }}>
                            {[0, 1, 2].map(n => <div key={n} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--text-muted)", animation: `bounce 1s ${n * 0.2}s infinite` }} />)}
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
            <div style={{ borderTop: "1px solid var(--border)", padding: "14px 32px 18px", background: "var(--bg-card)", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {QUICK.map(q => <button key={q} onClick={() => send(q)} disabled={loading} style={{ padding: "5px 13px", borderRadius: 20, fontSize: 12, border: "1px solid var(--border)", background: "var(--bg-soft)", color: "var(--text-muted)", cursor: "pointer" }}>{q}</button>)}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <input className="input" placeholder="向飞书助手提问..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send(input)} style={{ flex: 1 }} />
                    <button className="btn btn-primary" onClick={() => send(input)} disabled={loading || !input.trim()} style={{ flexShrink: 0 }}>发送 ↑</button>
                </div>
            </div>
        </div>
    );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function OperationsPage() {
    const [tab, setTab] = useState("competitor");
    return (
        <>
            <style>{GLOBAL_CSS}</style>
            <div style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", padding: "22px 32px" }}>
                <div style={{ fontSize: 10.5, color: "var(--accent)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 5 }}>Smart Operations</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", letterSpacing: "-.02em" }}>智能运营中心</h1>
                        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>视频数据分析 · 竞品监控（EcommerceManager）· AI 策略助手</p>
                    </div>
                    <span className="badge" style={{ background: "var(--success-soft)", color: "var(--success)" }}>● 实时同步</span>
                </div>
            </div>
            <TabBar active={tab} onChange={setTab} />
            {tab === "video"      && <VideoTab />}
            {tab === "competitor" && <CompetitorTab />}
            {tab === "feishu"     && <FeishuTab />}
        </>
    );
}