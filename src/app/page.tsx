"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const SERVICES = [
  {
    id: "01", title: "市场调研", subtitle: "Market Intelligence",
    href: "/dashboard/market",
    desc: "实时抓取全球社交平台声量，AI 自动提炼用户痛点与市场机遇，以数据驱动每一步出海决策。",
    tags: ["用户画像分析", "竞品监控", "获客线索挖掘"],
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
    color: "#1A4FBF", colorSoft: "#EEF3FF",
  },
  {
    id: "02", title: "内容营销", subtitle: "Content Marketing",
    href: "/dashboard/marketing",
    desc: "一键生成产品营销视频，多平台同步发布，AI 多语言内容矩阵精准触达全球目标买家。",
    tags: ["AI 视频生成", "多平台发布", "多语言内容"],
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
    color: "#0D7A5F", colorSoft: "#E8F7F3",
  },
  {
    id: "03", title: "智能运营", subtitle: "Smart Operations",
    href: "/dashboard/operations",
    desc: "账号运营数据全面分析，AI 实时给出策略建议，从互动率到最优发帖时间一目了然。",
    tags: ["运营数据分析", "策略建议", "最佳发帖时间"],
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
    color: "#7C3AED", colorSoft: "#F3EEFF",
  },
  {
    id: "04", title: "数据分析", subtitle: "Data Analytics",
    href: "/dashboard/analytics",
    desc: "汇聚全链路业务数据，可视化看板实时呈现业务健康度，让管理层即时掌握全局。",
    tags: ["实时看板", "内容效果排行", "线索地区分布"],
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    color: "#B45309", colorSoft: "#FEF3C7",
  },
];

const STATS = [
  { value: "5,200+", label: "全球客户" },
  { value: "150+", label: "覆盖国家" },
  { value: "38%", label: "平均效率提升" },
  { value: "98%", label: "续约率" },
];

const CASES = [
  { industry: "纺织制造", company: "江苏汇达纺织", result: "12个月内成功打入德国、法国市场，询盘量增长 340%", metric: "+340%", metricLabel: "询盘增长", color: "#1A4FBF" },
  { industry: "消费电子", company: "深圳晟联科技", result: "内容营销体系重建后，独立站自然流量提升至行业前 5%", metric: "Top 5%", metricLabel: "行业排名", color: "#0D7A5F" },
  { industry: "跨境电商", company: "广州寻迹贸易", result: "智能运营系统上线 60 天后，运营人力成本降低 42%", metric: "-42%", metricLabel: "成本下降", color: "#7C3AED" },
];

const PRICING = [
  { name: "入门版", price: "¥ 999", period: "/月", desc: "适合刚开始出海的中小企业", features: ["市场调研（3次/月）", "AI视频生成（5条/月）", "内容发布（2个平台）", "数据看板基础版", "邮件支持"], cta: "免费试用 7 天", highlight: false },
  { name: "专业版", price: "¥ 3,999", period: "/月", desc: "适合有一定出海基础的成长企业", features: ["市场调研（无限次）", "AI视频生成（50条/月）", "多平台同步发布", "获客线索挖掘（100条/月）", "智能运营全功能", "专属客户经理"], cta: "立即开始", highlight: true },
  { name: "企业版", price: "联系我们", period: "", desc: "适合大规模出海的头部企业", features: ["全功能无限使用", "私有化部署可选", "API 开放接入", "定制化模型训练", "7×24 专属技术支持", "战略顾问团队"], cta: "预约演示", highlight: false },
];

const TEAM = [
  { name: "陈晓明", role: "CEO & 联合创始人", desc: "前阿里巴巴国际站产品负责人，10年跨境电商经验" },
  { name: "李雅婷", role: "CTO & 联合创始人", desc: "前字节跳动AI算法专家，主导多个大模型商业化项目" },
  { name: "王国强", role: "VP of Growth", desc: "曾帮助50+出口企业建立海外营销体系，覆盖30个国家" },
];

export default function Home() {
  const [activeService, setActiveService] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const ServiceIcon = ({ html }: { html: string }) => (
    <span dangerouslySetInnerHTML={{ __html: html }} />
  );

  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: "#FFFFFF", color: "#0F1A2E", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        :root {
          --accent: #1A4FBF; --accent-hover: #1540A0; --accent-soft: #EEF3FF;
          --text: #0F1A2E; --text-sec: #4A5568; --text-muted: #8896A8;
          --border: #E5E9EF; --border-strong: #CBD2DC;
          --bg-soft: #F8F9FB; --bg-muted: #F2F4F7;
          --font-display: 'Playfair Display', Georgia, serif;
          --font-body: 'DM Sans', sans-serif;
          --shadow-sm: 0 1px 3px rgba(15,26,46,0.06); --shadow-md: 0 4px 16px rgba(15,26,46,0.08); --shadow-lg: 0 12px 40px rgba(15,26,46,0.12);
        }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #f8f9fb; } ::-webkit-scrollbar-thumb { background: #CBD2DC; border-radius: 3px; }
        a { text-decoration: none; }
        .nav-link { font-size: 13px; font-weight: 500; color: var(--text-sec); text-decoration: none; transition: color 0.2s; padding: 6px 0; position: relative; font-family: var(--font-body); }
        .nav-link::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1.5px; background: var(--accent); transform: scaleX(0); transform-origin: left; transition: transform 0.25s ease; }
        .nav-link:hover { color: var(--accent); } .nav-link:hover::after { transform: scaleX(1); }
        .btn-primary { font-family: var(--font-body); background: var(--accent); color: #fff; border: 1px solid var(--accent); padding: 11px 24px; font-size: 13px; font-weight: 500; border-radius: 8px; cursor: pointer; transition: all 0.18s; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; }
        .btn-primary:hover { background: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,79,191,0.25); }
        .btn-outline { font-family: var(--font-body); background: transparent; color: var(--text); border: 1px solid var(--border-strong); padding: 11px 24px; font-size: 13px; font-weight: 500; border-radius: 8px; cursor: pointer; transition: all 0.18s; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; }
        .btn-outline:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
        .btn-ghost { font-family: var(--font-body); background: transparent; color: var(--text-sec); border: none; padding: 9px 18px; font-size: 13px; font-weight: 500; border-radius: 8px; cursor: pointer; transition: all 0.18s; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
        .btn-ghost:hover { background: var(--bg-muted); color: var(--text); }
        .service-card { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 28px; cursor: pointer; transition: all 0.22s; position: relative; overflow: hidden; display: block; }
        .service-card:hover, .service-card.active { box-shadow: var(--shadow-lg); transform: translateY(-4px); border-color: transparent; }
        .service-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 14px 14px 0 0; opacity: 0; transition: opacity 0.22s; }
        .service-card:hover .service-bar, .service-card.active .service-bar { opacity: 1; }
        .case-card { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 28px; transition: all 0.22s; }
        .case-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); border-color: transparent; }
        .pricing-card { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 32px; transition: all 0.22s; position: relative; }
        .pricing-card.highlight { border-color: var(--accent); box-shadow: 0 0 0 4px rgba(26,79,191,0.08); }
        .pricing-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-3px); }
        .section-label { font-family: var(--font-body); font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .section-label::before { content: ''; display: block; width: 24px; height: 2px; background: var(--accent); border-radius: 2px; }
        .section-title { font-family: var(--font-display); font-size: clamp(28px, 4vw, 46px); font-weight: 600; line-height: 1.15; color: var(--text); letter-spacing: -0.02em; }
        .tag-chip { display: inline-flex; align-items: center; font-family: var(--font-body); font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 20px; background: var(--bg-muted); color: var(--text-sec); }
        .feature-check { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--text-sec); line-height: 1.5; margin-bottom: 10px; }
        .feature-check::before { content: ''; width: 16px; height: 16px; border-radius: 50%; background: var(--accent-soft) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%231A4FBF' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E") no-repeat center/10px; flex-shrink: 0; margin-top: 2px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.7s ease forwards; opacity: 0; }
        .d1{animation-delay:.08s} .d2{animation-delay:.18s} .d3{animation-delay:.28s} .d4{animation-delay:.38s} .d5{animation-delay:.5s}
        @keyframes countUp { from { opacity: 0; } to { opacity: 1; } }
        .stat-animate { animation: countUp 0.5s ease forwards; }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${scrolled ? "#E5E9EF" : "rgba(229,233,239,0.5)"}`, transition: "all 0.3s", boxShadow: scrolled ? "0 1px 12px rgba(15,26,46,0.06)" : "none" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#1A4FBF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "#0F1A2E", letterSpacing: "-0.01em" }}>TripleA<span style={{ color: "#1A4FBF" }}>Engine</span></span>
          </Link>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {["解决方案", "案例研究", "定价", "关于我们"].map(l => (
              <a key={l} href={`#${l}`} className="nav-link" onClick={e => { e.preventDefault(); document.getElementById(l)?.scrollIntoView({ behavior: "smooth" }); }}>{l}</a>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link href="/dashboard" className="btn-ghost">登录</Link>
            <Link href="/dashboard" className="btn-primary" style={{ padding: "8px 20px", fontSize: 13 }}>
              免费试用
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", background: "#FFFFFF", paddingTop: 62, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#E5E9EF 1px, transparent 1px), linear-gradient(90deg, #E5E9EF 1px, transparent 1px)", backgroundSize: "64px 64px", opacity: 0.35 }} />
          <div style={{ position: "absolute", right: "5%", top: "10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(26,79,191,0.06) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", right: "25%", bottom: "5%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(13,122,95,0.05) 0%, transparent 70%)" }} />
        </div>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px", width: "100%", display: "grid", gridTemplateColumns: "1fr 440px", gap: 72, alignItems: "center", position: "relative" }}>
          <div>
            <div className="fade-up d1" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#EEF3FF", border: "1px solid rgba(26,79,191,0.15)", borderRadius: 20, padding: "5px 14px", marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1A4FBF", display: "block" }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: "#1A4FBF", letterSpacing: "0.04em" }}>智能外贸增长平台 · 面向出海企业</span>
            </div>
            <h1 className="fade-up d2" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px, 5.5vw, 64px)", fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.025em", marginBottom: 24, color: "#0F1A2E" }}>
              让每一笔<br /><span style={{ color: "#1A4FBF", fontStyle: "italic" }}>海外业务</span><br />都有迹可循
            </h1>
            <p className="fade-up d3" style={{ fontSize: 16, lineHeight: 1.8, color: "#4A5568", maxWidth: 460, marginBottom: 40, fontWeight: 300 }}>
              市场调研 · 内容营销 · 智能运营 · 数据分析，四大模块协同驱动，帮助中国企业系统化拓展全球市场。
            </p>
            <div className="fade-up d4" style={{ display: "flex", gap: 12, marginBottom: 48 }}>
              <Link href="/dashboard" className="btn-primary" style={{ padding: "13px 28px", fontSize: 14 }}>
                进入控制台
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <a href="#解决方案" className="btn-outline" style={{ padding: "13px 28px", fontSize: 14 }} onClick={e => { e.preventDefault(); document.getElementById("解决方案")?.scrollIntoView({ behavior: "smooth" }); }}>了解功能</a>
            </div>
            <div className="fade-up d5" style={{ display: "flex", gap: 28, paddingTop: 28, borderTop: "1px solid #E5E9EF" }}>
              {["7天全功能免费", "无需信用卡", "专属顾问支持"].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#4A5568" }}>
                  <span style={{ color: "#1A4FBF", fontWeight: 700 }}>✓</span>{t}
                </div>
              ))}
            </div>
          </div>
          {/* Dashboard preview card */}
          <div className="fade-up d3" style={{ position: "relative" }}>
            <div style={{ background: "#fff", border: "1px solid #E5E9EF", borderRadius: 16, boxShadow: "0 12px 40px rgba(15,26,46,0.12)", overflow: "hidden" }}>
              <div style={{ background: "#F8F9FB", borderBottom: "1px solid #E5E9EF", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                {["#FC5F57","#FDBC2C","#28C840"].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                <div style={{ flex: 1, background: "#E5E9EF", borderRadius: 4, height: 18, marginLeft: 8, display: "flex", alignItems: "center", paddingLeft: 10 }}>
                  <span style={{ fontSize: 10, color: "#8896A8" }}>tripleaengine.ai/dashboard</span>
                </div>
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  {[{l:"本月线索",v:"1,248",up:true},{l:"内容曝光",v:"328K",up:true},{l:"互动率",v:"6.7%",up:true},{l:"转化数",v:"186",up:false}].map((s,i) => (
                    <div key={i} style={{ background: "#F8F9FB", borderRadius: 10, padding: "13px 14px" }}>
                      <div style={{ fontSize: 10, color: "#8896A8", marginBottom: 3 }}>{s.l}</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "#0F1A2E" }}>{s.v}</div>
                      <div style={{ fontSize: 10, color: s.up ? "#0D7A5F" : "#C0392B", marginTop: 1 }}>{s.up ? "↑" : "↓"} 较上月</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#F8F9FB", borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 10, color: "#8896A8", marginBottom: 8 }}>内容曝光趋势（近12周）</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 44 }}>
                    {[28,42,36,58,50,72,65,80,68,88,74,95].map((h,i) => (
                      <div key={i} style={{ flex: 1, background: i===11 ? "#1A4FBF" : "#EEF3FF", borderRadius: "3px 3px 0 0", height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ position: "absolute", bottom: -14, left: -14, background: "#fff", border: "1px solid #E5E9EF", borderRadius: 12, padding: "10px 16px", boxShadow: "0 4px 16px rgba(15,26,46,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, background: "#EEF3FF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A4FBF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F1A2E" }}>效率提升 38%</div>
                <div style={{ fontSize: 10, color: "#8896A8" }}>客户平均数据</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div ref={statsRef} style={{ background: "#F8F9FB", borderTop: "1px solid #E5E9EF", borderBottom: "1px solid #E5E9EF" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ padding: "36px 0", borderRight: i < 3 ? "1px solid #E5E9EF" : "none", paddingLeft: i > 0 ? 36 : 0, paddingRight: i < 3 ? 36 : 0 }}>
              <div className={statsVisible ? "stat-animate" : ""} style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 600, color: statsVisible ? "#0F1A2E" : "#CBD2DC", transition: "color 0.8s ease", transitionDelay: `${i * 0.12}s` }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#8896A8", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SOLUTIONS */}
      <section id="解决方案" style={{ padding: "88px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="section-label" style={{ justifyContent: "center" }}>解决方案</div>
          <h2 className="section-title">四大核心能力<br /><span style={{ color: "#1A4FBF", fontStyle: "italic" }}>系统化驱动出海增长</span></h2>
          <p style={{ fontSize: 15, color: "#8896A8", marginTop: 14, maxWidth: 480, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>每个模块独立强大，协同使用效果倍增。点击卡片直接进入对应功能。</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18, marginBottom: 36 }}>
          {SERVICES.map((s, i) => (
            <Link key={i} href={s.href} className={`service-card${activeService === i ? " active" : ""}`} onMouseEnter={() => setActiveService(i)}>
              <div className="service-bar" style={{ background: s.color }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: s.colorSoft, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, flexShrink: 0 }}>
                    <ServiceIcon html={s.icon} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "#0F1A2E", lineHeight: 1.2 }}>{s.title}</div>
                    <div style={{ fontSize: 10, color: "#8896A8", letterSpacing: "0.07em", textTransform: "uppercase", marginTop: 2 }}>{s.subtitle}</div>
                  </div>
                </div>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "#F2F4F7" }}>{s.id}</span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.75, color: "#4A5568", marginBottom: 16 }}>{s.desc}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {s.tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 500, color: s.color }}>
                进入功能 <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: "center" }}>
          <Link href="/dashboard" className="btn-primary" style={{ padding: "13px 32px", fontSize: 14 }}>
            进入控制台，立即体验全部功能
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>

      {/* CASE STUDIES */}
      <section id="案例研究" style={{ padding: "88px 32px", background: "#F8F9FB", borderTop: "1px solid #E5E9EF" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48 }}>
            <div><div className="section-label">案例研究</div><h2 className="section-title">真实数字<br /><span style={{ color: "#1A4FBF", fontStyle: "italic" }}>真实成长</span></h2></div>
            <a href="#" className="btn-outline" style={{ flexShrink: 0 }}>查看全部案例</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {CASES.map((c, i) => (
              <div key={i} className="case-card">
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: c.color, marginBottom: 18 }}>{c.industry}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 46, fontWeight: 700, color: "#0F1A2E", lineHeight: 1, marginBottom: 3 }}>{c.metric}</div>
                <div style={{ fontSize: 11, color: "#8896A8", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 20 }}>{c.metricLabel}</div>
                <div style={{ height: 1, background: "#E5E9EF", marginBottom: 18 }} />
                <p style={{ fontSize: 13.5, lineHeight: 1.75, color: "#4A5568", marginBottom: 14 }}>{c.result}</p>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F1A2E" }}>{c.company}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section style={{ padding: "88px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="section-label" style={{ justifyContent: "center" }}>工作流程</div>
          <h2 className="section-title">从数据到增长<br /><span style={{ color: "#1A4FBF", fontStyle: "italic" }}>三步建立出海体系</span></h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[
            { step: "01", title: "洞察市场", desc: "接入全球社交平台，AI 识别目标市场空白与潜力客户，形成定制化市场报告。", href: "/dashboard/market" },
            { step: "02", title: "触达客户", desc: "生成多语言内容矩阵，AI 视频一键生成，精准营销工具主动触达目标买家。", href: "/dashboard/marketing" },
            { step: "03", title: "运营沉淀", desc: "自动化分析运营数据，数据看板实时呈现业务健康度，持续优化增长策略。", href: "/dashboard/analytics" },
          ].map((item, i) => (
            <Link key={i} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{ background: "#fff", border: "1px solid #E5E9EF", borderRadius: 14, padding: "28px", position: "relative", overflow: "hidden", transition: "all 0.22s", cursor: "pointer" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(15,26,46,0.12)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.borderColor = "transparent"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.borderColor = "#E5E9EF"; }}>
                <div style={{ position: "absolute", top: 16, right: 20, fontFamily: "var(--font-display)", fontSize: 68, fontWeight: 700, color: "rgba(26,79,191,0.04)", lineHeight: 1, userSelect: "none" }}>{item.step}</div>
                <div style={{ width: 36, height: 36, background: "#1A4FBF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "#fff" }}>{item.step}</span>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 600, color: "#0F1A2E", marginBottom: 10 }}>{item.title}</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.75, color: "#4A5568", marginBottom: 16 }}>{item.desc}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 500, color: "#1A4FBF" }}>
                  进入功能 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="定价" style={{ padding: "88px 32px", background: "#F8F9FB", borderTop: "1px solid #E5E9EF" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="section-label" style={{ justifyContent: "center" }}>定价方案</div>
            <h2 className="section-title">透明定价<br /><span style={{ color: "#1A4FBF", fontStyle: "italic" }}>按需选择</span></h2>
            <p style={{ fontSize: 14, color: "#8896A8", marginTop: 14 }}>所有方案均提供 7 天全功能免费试用，无需信用卡。</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "start" }}>
            {PRICING.map((p, i) => (
              <div key={i} className={`pricing-card${p.highlight ? " highlight" : ""}`}>
                {p.highlight && <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#1A4FBF", color: "#fff", fontSize: 10, fontWeight: 600, padding: "3px 14px", borderRadius: 20, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>最受欢迎</div>}
                <div style={{ fontSize: 11, fontWeight: 600, color: "#8896A8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, color: "#0F1A2E" }}>{p.price}</span>
                  <span style={{ fontSize: 13, color: "#8896A8" }}>{p.period}</span>
                </div>
                <p style={{ fontSize: 13, color: "#8896A8", marginBottom: 20, lineHeight: 1.5 }}>{p.desc}</p>
                <div style={{ height: 1, background: "#E5E9EF", marginBottom: 20 }} />
                <div style={{ marginBottom: 24 }}>{p.features.map((f, j) => <div key={j} className="feature-check">{f}</div>)}</div>
                <Link href="/dashboard" className={p.highlight ? "btn-primary" : "btn-outline"} style={{ width: "100%", justifyContent: "center", padding: "11px", fontSize: 13 }}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="关于我们" style={{ padding: "88px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center", marginBottom: 64 }}>
          <div>
            <div className="section-label">关于我们</div>
            <h2 className="section-title" style={{ marginBottom: 18 }}>为中国企业<br /><span style={{ color: "#1A4FBF", fontStyle: "italic" }}>打造的出海引擎</span></h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.85, color: "#4A5568", marginBottom: 16 }}>TripleA Engine 成立于 2023 年，由前阿里巴巴、字节跳动核心团队创建。我们深信，每一家优秀的中国企业都值得拥有系统化的全球化工具。</p>
            <p style={{ fontSize: 14.5, lineHeight: 1.85, color: "#4A5568", marginBottom: 28 }}>我们将 AI 大模型与真实外贸业务深度结合，覆盖出海全链路：从市场洞察、内容生产，到运营提效、数据决策。</p>
            <div style={{ display: "flex", gap: 24 }}>
              {[{v:"2023",l:"成立年份"},{v:"15人",l:"核心团队"},{v:"上海",l:"总部所在"}].map((item,i) => (
                <div key={i}><div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "#0F1A2E" }}>{item.v}</div><div style={{ fontSize: 11, color: "#8896A8", marginTop: 2 }}>{item.l}</div></div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { icon: "🎯", title: "使命", desc: "让每一家出海企业都能用上顶级 AI 工具，与全球市场平等竞争。" },
              { icon: "🔭", title: "愿景", desc: "成为中国企业走向世界最重要的基础设施之一。" },
              { icon: "⚡", title: "产品理念", desc: "深度理解外贸业务，而不只是通用 AI 的简单封装。" },
              { icon: "🤝", title: "服务承诺", desc: "7天免费、专属顾问，真正帮你跑通第一个出海项目。" },
            ].map((item,i) => (
              <div key={i} style={{ background: "#F8F9FB", border: "1px solid #E5E9EF", borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F1A2E", marginBottom: 5 }}>{item.title}</div>
                <div style={{ fontSize: 12.5, color: "#4A5568", lineHeight: 1.65 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#8896A8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>核心团队</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {TEAM.map((member, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #E5E9EF", borderRadius: 14, padding: 24, transition: "all 0.22s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(15,26,46,0.08)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: ["#EEF3FF","#E8F7F3","#F3EEFF"][i], display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 17, fontWeight: 700, color: ["#1A4FBF","#0D7A5F","#7C3AED"][i], fontFamily: "var(--font-display)" }}>{member.name.charAt(0)}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0F1A2E", marginBottom: 2 }}>{member.name}</div>
                <div style={{ fontSize: 11, color: "#1A4FBF", fontWeight: 500, marginBottom: 8 }}>{member.role}</div>
                <div style={{ fontSize: 13, color: "#4A5568", lineHeight: 1.65 }}>{member.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#1A4FBF", padding: "72px 32px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 14 }}>开始免费体验</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 600, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 18 }}>
            准备好系统化拓展<br /><span style={{ fontStyle: "italic", opacity: 0.8 }}>全球市场了吗？</span>
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", marginBottom: 36, lineHeight: 1.7 }}>7天全功能免费试用，专属顾问一对一陪跑，帮您快速建立出海业务增长体系。</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", maxWidth: 420, flex: 1 }}>
              <input type="email" placeholder="输入您的企业邮箱" style={{ borderRadius: "8px 0 0 8px", border: "none", flex: 1, fontSize: 14 }} />
              <Link href="/dashboard" style={{ background: "#fff", color: "#1A4FBF", border: "none", padding: "11px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: "0 8px 8px 0", textDecoration: "none", display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>立即开始 →</Link>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em" }}>无需信用卡 · 7天免费 · 随时取消 · 专属顾问支持</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0F1A2E", color: "#fff", padding: "52px 32px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, background: "#1A4FBF", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
                </div>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600 }}>TripleA<span style={{ color: "#6B8EE0" }}>Engine</span></span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.75, color: "rgba(255,255,255,0.35)", maxWidth: 220 }}>以 AI 驱动的外贸增长平台，助力中国企业系统化走向全球市场。</p>
            </div>
            {[
              { title: "解决方案", links: [{ l: "市场调研", h: "/dashboard/market" }, { l: "内容营销", h: "/dashboard/marketing" }, { l: "智能运营", h: "/dashboard/operations" }, { l: "数据分析", h: "/dashboard/analytics" }] },
              { title: "支持", links: [{ l: "帮助中心", h: "#" }, { l: "API 文档", h: "#" }, { l: "联系我们", h: "#" }, { l: "常见问题", h: "#" }] },
              { title: "公司", links: [{ l: "关于我们", h: "#关于我们" }, { l: "加入我们", h: "#" }, { l: "定价方案", h: "#定价" }, { l: "隐私政策", h: "#" }] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 14 }}>{col.title}</div>
                <ul style={{ listStyle: "none" }}>
                  {col.links.map(link => (
                    <li key={link.l} style={{ marginBottom: 10 }}>
                      <Link href={link.h} style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>{link.l}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>© 2024 TripleA Engine. 保留所有权利。</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>沪ICP备XXXXXXXX号</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
