"use client";

import { useState, useEffect, useRef } from "react";

const NAV_LINKS = ["解决方案", "案例研究", "定价", "关于我们"];

const SERVICES = [
  {
    id: "01",
    title: "市场调研",
    subtitle: "Market Intelligence",
    desc: "实时追踪全球贸易脉搏，精准识别目标市场机遇，以数据驱动决策，让每一步扩张都有据可依。",
    tags: ["竞品监控", "需求预测", "市场图谱"],
    accent: "#C8A96E",
  },
  {
    id: "02",
    title: "内容营销",
    subtitle: "Content Marketing",
    desc: "AI 辅助生成多语言营销内容，精准触达海外买家，构建品牌国际影响力，转化流量为实际商机。",
    tags: ["多语言内容", "SEO 优化", "品牌建设"],
    accent: "#6E9EC8",
  },
  {
    id: "03",
    title: "智能运营",
    subtitle: "Smart Operations",
    desc: "全流程自动化工作流，从询盘到成单到履约，AI 实时介入关键节点，大幅降低人力成本与沟通摩擦。",
    tags: ["询盘自动化", "订单追踪", "智能提醒"],
    accent: "#7EC8A9",
  },
  {
    id: "04",
    title: "数据分析",
    subtitle: "Data Analytics",
    desc: "汇聚多维度贸易数据，构建企业专属洞察看板，用可视化报告替代繁琐表格，让管理层即时掌握业务全局。",
    tags: ["实时看板", "风险预警", "绩效报告"],
    accent: "#C87E9E",
  },
];

const STATS = [
  { value: "5,200+", label: "全球客户" },
  { value: "150+", label: "覆盖国家" },
  { value: "38%", label: "平均效率提升" },
  { value: "98%", label: "续约率" },
];

const CASES = [
  {
    industry: "纺织制造",
    company: "江苏汇达纺织",
    result: "12个月内成功打入德国、法国市场，询盘量增长 340%",
    metric: "+340%",
    metricLabel: "询盘增长",
  },
  {
    industry: "消费电子",
    company: "深圳晟联科技",
    result: "内容营销体系重建后，独立站自然流量提升至行业前 5%",
    metric: "Top 5%",
    metricLabel: "行业排名",
  },
  {
    industry: "跨境电商",
    company: "广州寻迹贸易",
    result: "智能运营系统上线 60 天后，运营人力成本降低 42%",
    metric: "-42%",
    metricLabel: "成本下降",
  },
];

export default function Home() {
  const [activeService, setActiveService] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [counted, setCounted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setCounted(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{
        fontFamily: "'Noto Serif SC', 'Georgia', serif",
        background: "#0C0E13",
        color: "#E8E4DC",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&family=Instrument+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --gold: #C8A96E;
          --gold-dim: rgba(200,169,110,0.15);
          --surface: #141720;
          --surface2: #1A1E28;
          --border: rgba(232,228,220,0.08);
          --text-muted: rgba(232,228,220,0.45);
        }

        html { scroll-behavior: smooth; }

        .nav-link {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 13px;
          letter-spacing: 0.08em;
          color: rgba(232,228,220,0.6);
          text-decoration: none;
          transition: color 0.25s;
          text-transform: uppercase;
        }
        .nav-link:hover { color: #E8E4DC; }

        .btn-primary {
          font-family: 'Instrument Sans', sans-serif;
          background: var(--gold);
          color: #0C0E13;
          border: none;
          padding: 12px 28px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
        }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }

        .btn-ghost {
          font-family: 'Instrument Sans', sans-serif;
          background: transparent;
          color: rgba(232,228,220,0.75);
          border: 1px solid rgba(232,228,220,0.2);
          padding: 12px 28px;
          font-size: 13px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .btn-ghost:hover { border-color: rgba(232,228,220,0.6); color: #E8E4DC; }

        .service-tab {
          padding: 20px 0;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: border-color 0.3s;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .service-tab.active { border-bottom-color: var(--gold); }

        .tag {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 5px 12px;
          border: 1px solid var(--border);
          color: var(--text-muted);
          border-radius: 2px;
        }

        .case-card {
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 36px;
          transition: border-color 0.3s, transform 0.3s;
        }
        .case-card:hover { border-color: rgba(200,169,110,0.3); transform: translateY(-4px); }

        .grid-line {
          position: absolute;
          background: var(--border);
        }

        .hero-label {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--gold);
        }

        .divider-line {
          width: 40px;
          height: 1px;
          background: var(--gold);
          display: inline-block;
          vertical-align: middle;
          margin-right: 12px;
        }

        .section-num {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 0.15em;
          color: var(--text-muted);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.8s ease forwards; }
        .delay-1 { animation-delay: 0.15s; opacity: 0; }
        .delay-2 { animation-delay: 0.3s; opacity: 0; }
        .delay-3 { animation-delay: 0.45s; opacity: 0; }
        .delay-4 { animation-delay: 0.6s; opacity: 0; }

        @keyframes lineGrow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .line-grow { animation: lineGrow 1.2s ease forwards; transform-origin: left; }

        input[type="email"] {
          font-family: 'Instrument Sans', sans-serif;
          background: rgba(232,228,220,0.06);
          border: 1px solid var(--border);
          color: #E8E4DC;
          padding: 14px 20px;
          font-size: 14px;
          outline: none;
          width: 100%;
          transition: border-color 0.2s;
        }
        input[type="email"]::placeholder { color: var(--text-muted); }
        input[type="email"]:focus { border-color: rgba(200,169,110,0.5); }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
          background: scrolled ? "rgba(12,14,19,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          transition: "all 0.4s",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 40px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                border: "1px solid var(--gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{ width: 12, height: 12, background: "var(--gold)" }}
              />
            </div>
            <span
              style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#E8E4DC",
              }}
            >
              GlobalTrade<span style={{ color: "var(--gold)" }}>AI</span>
            </span>
          </div>

          <div style={{ display: "flex", gap: 36, alignItems: "center" }}>
            {NAV_LINKS.map((l) => (
              <a key={l} href="#" className="nav-link">
                {l}
              </a>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button className="btn-ghost" style={{ padding: "9px 20px" }}>
              登录
            </button>
            <button className="btn-primary" style={{ padding: "9px 20px" }}>
              免费试用
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        style={{
          minHeight: "100vh",
          position: "relative",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {/* Background grid lines */}
        <div
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {[20, 40, 60, 80].map((pct) => (
            <div
              key={pct}
              className="grid-line"
              style={{
                left: `${pct}%`,
                top: 0,
                bottom: 0,
                width: 1,
                opacity: 0.4,
              }}
            />
          ))}
        </div>

        {/* Gold accent circle */}
        <div
          style={{
            position: "absolute",
            right: "-10%",
            top: "10%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            border: "1px solid rgba(200,169,110,0.12)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "-5%",
            top: "15%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            border: "1px solid rgba(200,169,110,0.08)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 40px",
            paddingTop: 120,
            width: "100%",
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <div
              className="fade-up hero-label"
              style={{ marginBottom: 28, display: "flex", alignItems: "center" }}
            >
              <span className="divider-line line-grow" />
              智能外贸增长平台 · 面向出海企业
            </div>

            <h1
              className="fade-up delay-1"
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(48px, 6vw, 80px)",
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                marginBottom: 32,
                color: "#F0EDE6",
              }}
            >
              让每一笔
              <br />
              <em style={{ color: "var(--gold)", fontStyle: "italic" }}>
                海外业务
              </em>
              <br />
              都有迹可循
            </h1>

            <p
              className="fade-up delay-2"
              style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: 17,
                lineHeight: 1.75,
                color: "rgba(232,228,220,0.6)",
                maxWidth: 480,
                marginBottom: 48,
                fontWeight: 300,
              }}
            >
              市场调研 · 内容营销 · 智能运营 · 数据分析
              <br />
              四大模块协同驱动，帮助中国企业系统化拓展全球市场。
            </p>

            <div
              className="fade-up delay-3"
              style={{ display: "flex", gap: 16, flexWrap: "wrap" }}
            >
              <button className="btn-primary">预约演示</button>
              <button className="btn-ghost">查看案例研究</button>
            </div>

            <div
              className="fade-up delay-4"
              style={{
                marginTop: 72,
                display: "flex",
                gap: 48,
                paddingTop: 40,
                borderTop: "1px solid var(--border)",
              }}
            >
              {[
                { v: "7天", l: "免费试用" },
                { v: "无需", l: "信用卡绑定" },
                { v: "随时", l: "取消订阅" },
              ].map((item) => (
                <div key={item.l}>
                  <div
                    style={{
                      fontFamily: "'Instrument Sans', sans-serif",
                      fontSize: 20,
                      fontWeight: 500,
                      color: "var(--gold)",
                    }}
                  >
                    {item.v}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Instrument Sans', sans-serif",
                      fontSize: 12,
                      letterSpacing: "0.08em",
                      color: "var(--text-muted)",
                      marginTop: 4,
                      textTransform: "uppercase",
                    }}
                  >
                    {item.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating metric card */}
        <div
          style={{
            position: "absolute",
            right: "8%",
            bottom: "18%",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            padding: "28px 36px",
            width: 240,
          }}
        >
          <div
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 52,
              color: "var(--gold)",
              lineHeight: 1,
            }}
          >
            38%
          </div>
          <div
            style={{
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: 8,
              letterSpacing: "0.06em",
              lineHeight: 1.6,
            }}
          >
            客户平均
            <br />
            业务效率提升
          </div>
          <div
            style={{
              marginTop: 20,
              height: 2,
              background: `linear-gradient(90deg, var(--gold) 38%, var(--border) 38%)`,
            }}
          />
        </div>
      </section>

      {/* ── STATS ── */}
      <div
        ref={statsRef}
        style={{
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 40px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
          }}
        >
          {STATS.map((s, i) => (
            <div
              key={i}
              style={{
                padding: "48px 0",
                borderRight: i < 3 ? "1px solid var(--border)" : "none",
                paddingLeft: i > 0 ? 48 : 0,
                paddingRight: i < 3 ? 48 : 0,
              }}
            >
              <div
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 44,
                  color: counted ? "#F0EDE6" : "var(--text-muted)",
                  transition: "color 0.8s ease",
                  transitionDelay: `${i * 0.1}s`,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginTop: 8,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SERVICES ── */}
      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "120px 40px",
        }}
      >
        <div style={{ marginBottom: 64 }}>
          <span className="section-num">— 01</span>
          <h2
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 400,
              color: "#F0EDE6",
              marginTop: 16,
              lineHeight: 1.2,
            }}
          >
            四大核心能力
            <br />
            <em style={{ color: "var(--gold)", fontStyle: "italic" }}>
              系统化驱动出海增长
            </em>
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.4fr",
            gap: 80,
            alignItems: "start",
          }}
        >
          {/* Tabs */}
          <div>
            {SERVICES.map((s, i) => (
              <div
                key={i}
                className={`service-tab ${activeService === i ? "active" : ""}`}
                onClick={() => setActiveService(i)}
                style={{
                  borderBottomColor:
                    activeService === i ? s.accent : "var(--border)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: 11,
                    letterSpacing: "0.15em",
                    color: activeService === i ? s.accent : "var(--text-muted)",
                    minWidth: 28,
                    transition: "color 0.3s",
                  }}
                >
                  {s.id}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: activeService === i ? 500 : 400,
                      color:
                        activeService === i ? "#F0EDE6" : "rgba(232,228,220,0.5)",
                      transition: "color 0.3s",
                      marginBottom: 2,
                    }}
                  >
                    {s.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Instrument Sans', sans-serif",
                      fontSize: 11,
                      letterSpacing: "0.1em",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    {s.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              padding: "48px",
              position: "sticky",
              top: 100,
            }}
          >
            <div
              style={{
                width: 48,
                height: 3,
                background: SERVICES[activeService].accent,
                marginBottom: 32,
                transition: "background 0.4s",
              }}
            />
            <div
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 38,
                color: "#F0EDE6",
                marginBottom: 8,
                lineHeight: 1.1,
              }}
            >
              {SERVICES[activeService].title}
            </div>
            <div
              style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: 12,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: SERVICES[activeService].accent,
                marginBottom: 28,
              }}
            >
              {SERVICES[activeService].subtitle}
            </div>
            <p
              style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: 15,
                lineHeight: 1.85,
                color: "rgba(232,228,220,0.65)",
                marginBottom: 36,
              }}
            >
              {SERVICES[activeService].desc}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {SERVICES[activeService].tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
            <button
              className="btn-primary"
              style={{
                marginTop: 40,
                background: SERVICES[activeService].accent,
                width: "100%",
              }}
            >
              深入了解
            </button>
          </div>
        </div>
      </section>

      {/* ── CASE STUDIES ── */}
      <section style={{ background: "var(--surface)", padding: "120px 0" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 40px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 64,
            }}
          >
            <div>
              <span className="section-num">— 02</span>
              <h2
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: "clamp(32px, 4vw, 52px)",
                  fontWeight: 400,
                  color: "#F0EDE6",
                  marginTop: 16,
                  lineHeight: 1.2,
                }}
              >
                客户案例
                <br />
                <em style={{ color: "var(--gold)", fontStyle: "italic" }}>
                  真实数字，真实成长
                </em>
              </h2>
            </div>
            <button
              className="btn-ghost"
              style={{ flexShrink: 0, marginBottom: 8 }}
            >
              查看全部案例
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
            }}
          >
            {CASES.map((c, i) => (
              <div key={i} className="case-card">
                <div
                  style={{
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: 11,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--gold)",
                    marginBottom: 24,
                  }}
                >
                  {c.industry}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 52,
                    color: "#F0EDE6",
                    lineHeight: 1,
                    marginBottom: 4,
                  }}
                >
                  {c.metric}
                </div>
                <div
                  style={{
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: 28,
                  }}
                >
                  {c.metricLabel}
                </div>
                <div
                  style={{
                    width: "100%",
                    height: 1,
                    background: "var(--border)",
                    marginBottom: 28,
                  }}
                />
                <div
                  style={{
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: 14,
                    lineHeight: 1.75,
                    color: "rgba(232,228,220,0.6)",
                    marginBottom: 24,
                  }}
                >
                  {c.result}
                </div>
                <div
                  style={{
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "rgba(232,228,220,0.85)",
                  }}
                >
                  {c.company}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "120px 40px",
        }}
      >
        <div style={{ marginBottom: 80 }}>
          <span className="section-num">— 03</span>
          <h2
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 400,
              color: "#F0EDE6",
              marginTop: 16,
              lineHeight: 1.2,
            }}
          >
            从数据到增长
            <br />
            <em style={{ color: "var(--gold)", fontStyle: "italic" }}>
              三步建立出海体系
            </em>
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 0,
          }}
        >
          {[
            {
              step: "Step 01",
              title: "洞察市场",
              desc: "接入全球贸易数据库，AI 自动识别目标市场空白与潜力客户群体，形成定制化市场报告。",
            },
            {
              step: "Step 02",
              title: "触达客户",
              desc: "生成多语言内容矩阵，配合精准营销工具主动触达目标买家，建立品牌认知与信任。",
            },
            {
              step: "Step 03",
              title: "运营沉淀",
              desc: "自动化处理询盘到成单全流程，数据看板实时呈现业务健康度，持续优化增长策略。",
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: "48px",
                borderLeft: "1px solid var(--border)",
                borderTop: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
                borderRight: i === 2 ? "1px solid var(--border)" : "none",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 48,
                  right: 48,
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: 64,
                  fontWeight: 700,
                  color: "rgba(200,169,110,0.06)",
                  lineHeight: 1,
                }}
              >
                0{i + 1}
              </div>
              <div
                style={{
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: 11,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  marginBottom: 20,
                }}
              >
                {item.step}
              </div>
              <div
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 28,
                  color: "#F0EDE6",
                  marginBottom: 20,
                  lineHeight: 1.2,
                }}
              >
                {item.title}
              </div>
              <p
                style={{
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: 14,
                  lineHeight: 1.85,
                  color: "rgba(232,228,220,0.55)",
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "120px 40px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 80,
            alignItems: "center",
          }}
        >
          <div>
            <span className="hero-label">开始免费体验</span>
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(36px, 4vw, 56px)",
                fontWeight: 400,
                color: "#F0EDE6",
                marginTop: 20,
                lineHeight: 1.2,
              }}
            >
              准备好系统化
              <br />
              <em style={{ color: "var(--gold)", fontStyle: "italic" }}>
                拓展全球市场了吗？
              </em>
            </h2>
            <p
              style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: 15,
                lineHeight: 1.8,
                color: "rgba(232,228,220,0.55)",
                marginTop: 24,
              }}
            >
              7天全功能免费试用，专属顾问一对一陪跑，
              <br />
              帮您在最短时间内建立出海业务增长体系。
            </p>
          </div>

          <div>
            <div style={{ marginBottom: 16 }}>
              <input type="email" placeholder="输入您的企业邮箱" />
            </div>
            <button className="btn-primary" style={{ width: "100%", padding: "14px" }}>
              立即开始免费试用 →
            </button>
            <p
              style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: 12,
                color: "var(--text-muted)",
                marginTop: 16,
                letterSpacing: "0.04em",
              }}
            >
              无需信用卡 · 7天免费 · 随时取消 · 专属顾问支持
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          background: "#0C0E13",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "64px 40px 40px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: 48,
              marginBottom: 64,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    border: "1px solid var(--gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ width: 10, height: 10, background: "var(--gold)" }} />
                </div>
                <span
                  style={{
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  GlobalTrade<span style={{ color: "var(--gold)" }}>AI</span>
                </span>
              </div>
              <p
                style={{
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: 13,
                  lineHeight: 1.75,
                  color: "var(--text-muted)",
                  maxWidth: 260,
                }}
              >
                以 AI 驱动的外贸增长平台，助力中国企业系统化走向全球市场。
              </p>
            </div>

            {[
              {
                title: "解决方案",
                links: ["市场调研", "内容营销", "智能运营", "数据分析"],
              },
              {
                title: "支持",
                links: ["帮助中心", "API 文档", "联系我们", "常见问题"],
              },
              {
                title: "公司",
                links: ["关于我们", "团队介绍", "加入我们", "隐私政策"],
              },
            ].map((col) => (
              <div key={col.title}>
                <div
                  style={{
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: 11,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(232,228,220,0.4)",
                    marginBottom: 20,
                  }}
                >
                  {col.title}
                </div>
                <ul style={{ listStyle: "none" }}>
                  {col.links.map((l) => (
                    <li key={l} style={{ marginBottom: 12 }}>
                      <a
                        href="#"
                        style={{
                          fontFamily: "'Instrument Sans', sans-serif",
                          fontSize: 13,
                          color: "rgba(232,228,220,0.55)",
                          textDecoration: "none",
                          transition: "color 0.2s",
                        }}
                        onMouseOver={(e) =>
                          ((e.target as HTMLAnchorElement).style.color = "#E8E4DC")
                        }
                        onMouseOut={(e) =>
                          ((e.target as HTMLAnchorElement).style.color =
                            "rgba(232,228,220,0.55)")
                        }
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 28,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: 12,
                color: "var(--text-muted)",
                letterSpacing: "0.04em",
              }}
            >
              © 2024 GlobalTradeAI. 保留所有权利。
            </span>
            <span
              style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: 12,
                color: "var(--text-muted)",
                letterSpacing: "0.04em",
              }}
            >
              沪ICP备XXXXXXXX号
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}