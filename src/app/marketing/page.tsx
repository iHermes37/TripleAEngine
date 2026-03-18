// app/marketing/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

// 内容营销数据类型
interface ContentItem {
  id: string;
  title: string;
  type: 'article' | 'video' | 'social' | 'email';
  language: string;
  status: 'draft' | 'generating' | 'published';
  createdAt: string;
  performance?: {
    views: number;
    clicks: number;
    conversions: number;
  };
}

// 视频生成请求参数
interface VideoGenerationRequest {
  imageUrl: string[];
  prompt: string;
  duration?: number;
  resolution?: string;
}

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<'content' | 'video' | 'analytics'>('content');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [prompt, setPrompt] = useState('');
  const [contentList, setContentList] = useState<ContentItem[]>([
    {
      id: '1',
      title: '中国制造业出海趋势分析2024',
      type: 'article',
      language: '英文',
      status: 'published',
      createdAt: '2024-01-15',
      performance: { views: 12500, clicks: 2300, conversions: 156 }
    },
    {
      id: '2',
      title: '如何选择目标市场',
      type: 'video',
      language: '西班牙语',
      status: 'generating',
      createdAt: '2024-01-18'
    },
    {
      id: '3',
      title: '产品展示系列 - 工业设备',
      type: 'social',
      language: '多语言',
      status: 'draft',
      createdAt: '2024-01-20'
    }
  ]);

  const handleGenerateVideo = async () => {
    if (!imageUrls[0] || !prompt) {
      alert('请填写图片URL和提示词');
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/marketing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: imageUrls.filter(url => url.trim() !== ''),
          prompt: prompt,
          duration: 10,
          resolution: '1080p'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedVideo(data.videoUrl);
        // 添加到内容列表
        const newContent: ContentItem = {
          id: Date.now().toString(),
          title: `AI生成视频 - ${new Date().toLocaleDateString()}`,
          type: 'video',
          language: '多语言',
          status: 'published',
          createdAt: new Date().toISOString().split('T')[0],
        };
        setContentList([newContent, ...contentList]);
      }
    } catch (error) {
      console.error('生成失败:', error);
      alert('视频生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const addImageField = () => {
    setImageUrls([...imageUrls, '']);
  };

  const updateImageUrl = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const removeImageField = (index: number) => {
    if (imageUrls.length > 1) {
      setImageUrls(imageUrls.filter((_, i) => i !== index));
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Noto Serif SC', 'Georgia', serif",
        background: "#0C0E13",
        color: "#E8E4DC",
        minHeight: "100vh",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&family=Instrument+Sans:wght@300;400;500&display=swap');

        :root {
          --gold: #C8A96E;
          --gold-dim: rgba(200,169,110,0.15);
          --surface: #141720;
          --surface2: #1A1E28;
          --border: rgba(232,228,220,0.08);
          --text-muted: rgba(232,228,220,0.45);
        }

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
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

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

        .tab {
          padding: 16px 32px;
          cursor: pointer;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 13px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border-bottom: 2px solid transparent;
          transition: all 0.3s;
        }
        .tab.active {
          border-bottom-color: var(--gold);
          color: var(--gold);
        }

        .content-card {
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 24px;
          transition: border-color 0.3s;
        }
        .content-card:hover { border-color: rgba(200,169,110,0.3); }

        .input-field {
          font-family: 'Instrument Sans', sans-serif;
          background: rgba(232,228,220,0.06);
          border: 1px solid var(--border);
          color: #E8E4DC;
          padding: 12px 16px;
          font-size: 14px;
          outline: none;
          width: 100%;
          transition: border-color 0.2s;
        }
        .input-field:focus { border-color: rgba(200,169,110,0.5); }

        .status-badge {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 2px;
          text-transform: uppercase;
        }
        .status-published { background: rgba(126, 200, 169, 0.2); color: #7EC8A9; }
        .status-draft { background: rgba(200, 169, 110, 0.2); color: var(--gold); }
        .status-generating { background: rgba(110, 158, 200, 0.2); color: #6E9EC8; }
      `}</style>

      {/* 导航栏 */}
      <nav
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(12,14,19,0.95)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
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
          <Link href="/" style={{ textDecoration: "none" }}>
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
          </Link>

          <div style={{ display: "flex", gap: 36 }}>
            {["解决方案", "案例研究", "定价", "关于我们"].map((l) => (
              <a key={l} href="#" className="nav-link">
                {l}
              </a>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-ghost" style={{ padding: "9px 20px" }}>
              返回首页
            </button>
          </div>
        </div>
      </nav>

      {/* 页面标题 */}
      <section style={{ padding: "60px 40px 40px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ marginBottom: 48 }}>
          <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 11, letterSpacing: "0.15em", color: "var(--gold)" }}>
            — 内容营销
          </span>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 48, marginTop: 16, color: "#F0EDE6" }}>
            AI 驱动的内容<span style={{ color: "var(--gold)" }}>创作与分发</span>
          </h1>
          <p style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 15, color: "var(--text-muted)", maxWidth: 600, marginTop: 16 }}>
            多语言内容自动生成，精准触达全球买家。从文案到视频，一站式完成营销内容创作。
          </p>
        </div>

        {/* 标签页 */}
        <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border)", marginBottom: 48 }}>
          <div className={`tab ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>
            内容管理
          </div>
          <div className={`tab ${activeTab === 'video' ? 'active' : ''}`} onClick={() => setActiveTab('video')}>
            AI视频生成
          </div>
          <div className={`tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            效果分析
          </div>
        </div>

        {/* 内容管理标签页 */}
        {activeTab === 'content' && (
          <div>
            {/* 创建新内容按钮 */}
            <div style={{ marginBottom: 32, display: "flex", gap: 16 }}>
              <button className="btn-primary">创建新文章</button>
              <button className="btn-ghost">批量生成</button>
              <button className="btn-ghost" onClick={() => setActiveTab('video')}>生成视频</button>
            </div>

            {/* 内容列表 */}
            <div style={{ display: "grid", gap: 16 }}>
              {contentList.map((item) => (
                <div key={item.id} className="content-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                    <div>
                      <span className={`status-badge status-${item.status}`}>
                        {item.status === 'published' ? '已发布' : 
                         item.status === 'generating' ? '生成中' : '草稿'}
                      </span>
                      <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, marginTop: 12, color: "#F0EDE6" }}>
                        {item.title}
                      </h3>
                    </div>
                    <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 12, color: "var(--text-muted)" }}>
                      {item.createdAt}
                    </span>
                  </div>
                  
                  <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                    <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 12, color: "var(--text-muted)" }}>
                      类型: {item.type === 'article' ? '文章' : item.type === 'video' ? '视频' : '社交媒体'}
                    </span>
                    <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 12, color: "var(--text-muted)" }}>
                      语言: {item.language}
                    </span>
                  </div>

                  {item.performance && (
                    <div style={{ display: "flex", gap: 24, padding: "16px 0", borderTop: "1px solid var(--border)" }}>
                      <div>
                        <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, color: "var(--text-muted)" }}>浏览量</span>
                        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, marginLeft: 8, color: "var(--gold)" }}>
                          {item.performance.views.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, color: "var(--text-muted)" }}>点击</span>
                        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, marginLeft: 8, color: "var(--gold)" }}>
                          {item.performance.clicks.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, color: "var(--text-muted)" }}>转化</span>
                        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, marginLeft: 8, color: "var(--gold)" }}>
                          {item.performance.conversions}
                        </span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <button className="btn-ghost" style={{ padding: "8px 16px" }}>编辑</button>
                    <button className="btn-ghost" style={{ padding: "8px 16px" }}>预览</button>
                    <button className="btn-ghost" style={{ padding: "8px 16px" }}>发布</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI视频生成标签页 */}
        {activeTab === 'video' && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            {/* 左侧：生成表单 */}
            <div className="content-card" style={{ padding: 32 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 24, color: "#F0EDE6" }}>
                从图片生成视频
              </h2>
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontFamily: "'Instrument Sans', sans-serif", fontSize: 12, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  图片URL
                </label>
                {imageUrls.map((url, index) => (
                  <div key={index} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateImageUrl(index, e.target.value)}
                      className="input-field"
                      placeholder="https://example.com/image.jpg"
                    />
                    {imageUrls.length > 1 && (
                      <button
                        onClick={() => removeImageField(index)}
                        className="btn-ghost"
                        style={{ padding: "12px 16px" }}
                      >
                        删除
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addImageField}
                  className="btn-ghost"
                  style={{ width: "100%", marginTop: 8 }}
                >
                  + 添加图片
                </button>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontFamily: "'Instrument Sans', sans-serif", fontSize: 12, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  视频提示词
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="input-field"
                  placeholder="描述你想要生成的视频内容，例如：产品在现代化的工厂中自动运转，展现工业4.0的科技感"
                  rows={6}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontFamily: "'Instrument Sans', sans-serif", fontSize: 12, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  高级设置
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <select className="input-field">
                    <option>视频时长: 10秒</option>
                    <option>视频时长: 15秒</option>
                    <option>视频时长: 30秒</option>
                  </select>
                  <select className="input-field">
                    <option>分辨率: 720p</option>
                    <option>分辨率: 1080p</option>
                    <option>分辨率: 4K</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateVideo}
                disabled={isGenerating}
                className="btn-primary"
                style={{ width: "100%" }}
              >
                {isGenerating ? '生成中...' : '生成视频'}
              </button>
            </div>

            {/* 右侧：预览和结果 */}
            <div className="content-card" style={{ padding: 32 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 24, color: "#F0EDE6" }}>
                生成预览
              </h2>
              
              {generatedVideo ? (
                <div>
                  <div style={{ background: "#000", aspectRatio: "16/9", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <video src={generatedVideo} controls style={{ width: "100%", height: "100%" }} />
                  </div>
                  <p style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, color: "var(--text-muted)", wordBreak: "break-all" }}>
                    视频地址: {generatedVideo}
                  </p>
                  <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <button className="btn-primary">下载视频</button>
                    <button className="btn-ghost">分享链接</button>
                    <button className="btn-ghost">添加到内容库</button>
                  </div>
                </div>
              ) : (
                <div style={{ background: "var(--surface2)", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
                  <span style={{ fontSize: 48, color: "var(--text-muted)" }}>🎥</span>
                  <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 14, color: "var(--text-muted)" }}>
                    填写左侧表单，生成您的营销视频
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 效果分析标签页 */}
        {activeTab === 'analytics' && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 32 }}>
              {[
                { label: "总内容数", value: "48", change: "+12", period: "本月" },
                { label: "总曝光量", value: "125.3K", change: "+23%", period: "较上月" },
                { label: "转化率", value: "3.8%", change: "+0.6%", period: "较上月" }
              ].map((stat) => (
                <div key={stat.label} className="content-card">
                  <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{stat.label}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: "#F0EDE6", marginBottom: 8 }}>{stat.value}</div>
                  <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, color: "#7EC8A9" }}>{stat.change} {stat.period}</div>
                </div>
              ))}
            </div>

            <div className="content-card" style={{ padding: 32 }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, marginBottom: 24, color: "#F0EDE6" }}>内容效果排名</h3>
              <div style={{ display: "grid", gap: 16 }}>
                {contentList
                  .filter(item => item.performance)
                  .sort((a, b) => (b.performance?.views || 0) - (a.performance?.views || 0))
                  .map((item, index) => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: index < 2 ? "1px solid var(--border)" : "none" }}>
                      <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: index === 0 ? "var(--gold)" : "var(--text-muted)", minWidth: 40 }}>#{index + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 14, color: "#F0EDE6" }}>{item.title}</div>
                        <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                          <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 12, color: "var(--text-muted)" }}>{item.performance?.views.toLocaleString()} 浏览</span>
                          <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 12, color: "var(--text-muted)" }}>{item.performance?.clicks.toLocaleString()} 点击</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 16, color: "var(--gold)" }}>
                          {((item.performance?.conversions || 0) / (item.performance?.clicks || 1) * 100).toFixed(1)}%
                        </div>
                        <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 11, color: "var(--text-muted)" }}>转化率</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}