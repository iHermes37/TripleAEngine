"use client";

import { useState } from "react";
import { globalStyles } from "@/components/ui/design-tokens";

interface ContentItem {
  id: string;
  title: string;
  type: "article" | "video" | "social";
  language: string;
  status: "draft" | "generating" | "published";
  createdAt: string;
  performance?: { views: number; clicks: number; conversions: number };
}

const MOCK_CONTENT: ContentItem[] = [
  { id: "1", title: "中国制造业出海趋势分析 2024", type: "article", language: "英文", status: "published", createdAt: "2024-01-15", performance: { views: 12500, clicks: 2300, conversions: 156 } },
  { id: "2", title: "如何选择目标市场——东南亚篇", type: "video", language: "多语言", status: "published", createdAt: "2024-01-18", performance: { views: 8900, clicks: 1450, conversions: 88 } },
  { id: "3", title: "产品展示系列 - 工业缝纫机", type: "social", language: "西班牙语", status: "draft", createdAt: "2024-01-20" },
];

// ── Video Generator ────────────────────────────────────────────────────
function VideoGeneratorTab() {
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(10);
  const [ratio, setRatio] = useState("9:16");
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [taskStatus, setTaskStatus] = useState<"idle" | "pending" | "processing" | "completed" | "failed">("idle");
  const [error, setError] = useState("");

  function addUrl() { setImageUrls([...imageUrls, ""]); }
  function removeUrl(i: number) { setImageUrls(imageUrls.filter((_, idx) => idx !== i)); }
  function updateUrl(i: number, v: string) { const n = [...imageUrls]; n[i] = v; setImageUrls(n); }

  async function pollTask(id: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/content/video/task/${id}`);
        const data = await res.json();
        if (data.data?.status === "completed") {
          clearInterval(interval);
          setVideoUrl(data.data.video?.url || "");
          setTaskStatus("completed");
        } else if (data.data?.status === "failed") {
          clearInterval(interval);
          setTaskStatus("failed");
          setError("视频生成失败，请重试");
        }
      } catch { clearInterval(interval); }
    }, 3000);
    setTimeout(() => clearInterval(interval), 180000);
  }

  async function handleGenerate() {
    const urls = imageUrls.filter(u => u.trim());
    if (!urls.length || !prompt.trim()) { setError("请填写图片 URL 和提示词"); return; }
    setError(""); setLoading(true); setTaskStatus("pending"); setVideoUrl("");

    // Use existing /api/marketing route (direct video gen)
    try {
      const res = await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: urls, prompt, duration, resolution: "1080p" }),
      });
      const data = await res.json();
      if (data.success) {
        setVideoUrl(data.videoUrl);
        setTaskStatus("completed");
      } else if (data.task_id) {
        setTaskId(data.task_id);
        setTaskStatus("processing");
        pollTask(data.task_id);
      } else {
        setError(data.error || "生成失败");
        setTaskStatus("failed");
      }
    } catch {
      setError("网络错误，请稍后重试");
      setTaskStatus("failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 24 }}>
      {/* Form */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ fontSize: 16 }}>AI 视频生成</div>
          <div className="section-subtitle">图片 + 提示词 → 营销视频</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="label">产品图片 URL</label>
            {imageUrls.map((url, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input className="input" type="url" placeholder="https://example.com/product.jpg" value={url} onChange={e => updateUrl(i, e.target.value)} />
                {imageUrls.length > 1 && (
                  <button className="btn btn-ghost" style={{ padding: "9px 12px", flexShrink: 0 }} onClick={() => removeUrl(i)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
            ))}
            <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center", fontSize: 12 }} onClick={addUrl}>+ 添加图片</button>
          </div>
          <div>
            <label className="label">视频提示词</label>
            <textarea className="input" rows={4} placeholder="例：产品在现代工厂中自动运转，科技感强，背景音乐轻快" value={prompt} onChange={e => setPrompt(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="label">时长（秒）</label>
              <select className="input" value={duration} onChange={e => setDuration(Number(e.target.value))}>
                {[5, 10, 15, 30].map(d => <option key={d} value={d}>{d}s</option>)}
              </select>
            </div>
            <div>
              <label className="label">画面比例</label>
              <select className="input" value={ratio} onChange={e => setRatio(e.target.value)}>
                {["9:16", "16:9", "1:1"].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {error && <div style={{ background: "var(--danger-soft)", color: "var(--danger)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13 }}>{error}</div>}
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading} style={{ justifyContent: "center" }}>
            {loading ? <><span className="spinner" /> 提交中...</> : "生成视频"}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="card" style={{ padding: 24 }}>
        <div className="section-title" style={{ fontSize: 16, marginBottom: 20 }}>预览</div>
        {taskStatus === "idle" && (
          <div style={{ aspectRatio: "16/9", background: "var(--bg-soft)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>填写表单后生成视频</div>
          </div>
        )}
        {(taskStatus === "pending" || taskStatus === "processing") && (
          <div style={{ aspectRatio: "16/9", background: "var(--bg-soft)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div className="spinner spinner-dark" style={{ width: 40, height: 40, borderWidth: 3 }} />
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>视频生成中，预计 30-90 秒...</div>
            {taskId && <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Task: {taskId}</div>}
          </div>
        )}
        {taskStatus === "completed" && videoUrl && (
          <div>
            <video controls src={videoUrl} style={{ width: "100%", borderRadius: "var(--radius-md)", background: "#000" }} />
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <a href={videoUrl} download className="btn btn-primary" style={{ textDecoration: "none" }}>下载视频</a>
              <button className="btn btn-outline" onClick={() => navigator.clipboard.writeText(videoUrl)}>复制链接</button>
            </div>
          </div>
        )}
        {taskStatus === "failed" && (
          <div style={{ aspectRatio: "16/9", background: "var(--danger-soft)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ color: "var(--danger)", fontSize: 14 }}>生成失败，请检查参数后重试</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Auto Publish ───────────────────────────────────────────────────────
// function AutoPublishTab() {
//   const [taskId, setTaskId] = useState("");
//   const [platforms, setPlatforms] = useState<string[]>(["douyin"]);
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [tags, setTags] = useState("");
//   const [scheduleAt, setScheduleAt] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<{ publish_id: string; results: { platform: string; status: string; post_url?: string; error?: string; scheduled_at?: string }[] } | null>(null);
//   const [error, setError] = useState("");

//   const allPlatforms = ["douyin", "instagram", "youtube", "xiaohongshu", "twitter"];
//   function togglePlatform(p: string) {
//     setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
//   }

//   async function handlePublish() {
//     if (!taskId.trim() && !title.trim()) { setError("请填写任务 ID 或内容标题"); return; }
//     if (!platforms.length) { setError("请选择至少一个发布平台"); return; }
//     setError(""); setLoading(true); setResult(null);
//     try {
//       const res = await fetch("/api/content/publish", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           media: { type: "video", source: "task", task_id: taskId },
//           platforms,
//           post_config: {
//             title,
//             description,
//             tags: tags.split(",").map(t => t.trim()).filter(Boolean),
//             schedule_at: scheduleAt || undefined,
//           },
//         }),
//       });
//       const data = await res.json();
//       if (data.code === 200) setResult(data.data);
//       else setError(data.message || "发布失败");
//     } catch {
//       setError("网络错误，请稍后重试");
//     } finally {
//       setLoading(false);
//     }
//   }

//   const statusMap: Record<string, { label: string; badge: string }> = {
//     published: { label: "已发布", badge: "badge-success" },
//     failed: { label: "失败", badge: "badge-danger" },
//     scheduled: { label: "已排期", badge: "badge-warning" },
//     pending: { label: "处理中", badge: "badge-accent" },
//   };

//   return (
//     <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 24 }}>
//       <div className="card" style={{ padding: 24 }}>
//         <div style={{ marginBottom: 20 }}>
//           <div className="section-title" style={{ fontSize: 16 }}>自动发布</div>
//           <div className="section-subtitle">多平台一键分发内容</div>
//         </div>
//         <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//           <div>
//             <label className="label">视频文件地址</label>
//             <input className="input" placeholder="abc123" value={taskId} onChange={e => setTaskId(e.target.value)} />
//           </div>
//           <div>
//             <label className="label">发布平台</label>
//             <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
//               {allPlatforms.map(p => (
//                 <button key={p} onClick={() => togglePlatform(p)}
//                   style={{ padding: "6px 14px", borderRadius: "var(--radius-md)", fontSize: 12, cursor: "pointer", border: "1px solid", transition: "all 0.15s",
//                     background: platforms.includes(p) ? "var(--accent-soft)" : "transparent",
//                     color: platforms.includes(p) ? "var(--accent)" : "var(--text-muted)",
//                     borderColor: platforms.includes(p) ? "var(--accent)" : "var(--border)",
//                     fontFamily: "var(--font-body)",
//                   }}>
//                   {p}
//                 </button>
//               ))}
//             </div>
//           </div>
//           <div>
//             <label className="label">标题</label>
//             <input className="input" placeholder="视频标题" value={title} onChange={e => setTitle(e.target.value)} />
//           </div>
//           <div>
//             <label className="label">正文描述</label>
//             <textarea className="input" rows={3} placeholder="视频描述..." value={description} onChange={e => setDescription(e.target.value)} />
//           </div>
//           <div>
//             <label className="label">标签（逗号分隔）</label>
//             <input className="input" placeholder="出海, 制造业, AI" value={tags} onChange={e => setTags(e.target.value)} />
//           </div>
//           <div>
//             <label className="label">定时发布（留空立即发布）</label>
//             <input type="datetime-local" className="input" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)} />
//           </div>
//           {error && <div style={{ background: "var(--danger-soft)", color: "var(--danger)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13 }}>{error}</div>}
//           <button className="btn btn-primary" onClick={handlePublish} disabled={loading} style={{ justifyContent: "center" }}>
//             {loading ? <><span className="spinner" /> 发布中...</> : "一键发布"}
//           </button>
//         </div>
//       </div>

//       <div>
//         {!result && !loading && (
//           <div className="card" style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 280, gap: 12 }}>
//             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//               <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
//             </svg>
//             <div style={{ color: "var(--text-muted)", fontSize: 14 }}>发布后各平台结果将显示在这里</div>
//           </div>
//         )}
//         {result && (
//           <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//             <div style={{ fontSize: 13, color: "var(--text-muted)" }}>发布 ID: <span style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{result.publish_id}</span></div>
//             {result.results.map((r, i) => (
//               <div key={i} className="card" style={{ padding: 20 }}>
//                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                   <div style={{ fontWeight: 500, fontSize: 15, textTransform: "capitalize" }}>{r.platform}</div>
//                   <span className={`badge ${statusMap[r.status]?.badge || "badge-muted"}`}>{statusMap[r.status]?.label || r.status}</span>
//                 </div>
//                 {r.post_url && <div style={{ marginTop: 8, fontSize: 12 }}><a href={r.post_url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>{r.post_url}</a></div>}
//                 {r.error && <div style={{ marginTop: 8, fontSize: 12, color: "var(--danger)" }}>{r.error}</div>}
//                 {r.scheduled_at && <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>计划发布：{r.scheduled_at.split("T")[0]}</div>}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// ── Content Library ────────────────────────────────────────────────────
function ContentLibraryTab() {
  const [contentList] = useState<ContentItem[]>(MOCK_CONTENT);
  const typeLabels: Record<string, string> = { article: "文章", video: "视频", social: "社交媒体" };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>共 {contentList.length} 条内容</div>
        <button className="btn btn-primary">+ 新建内容</button>
      </div>
      {contentList.map(item => (
        <div key={item.id} className="card" style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span className={`badge ${item.status === "published" ? "badge-success" : item.status === "generating" ? "badge-accent" : "badge-muted"}`}>
                  {item.status === "published" ? "已发布" : item.status === "generating" ? "生成中" : "草稿"}
                </span>
                <span className="badge badge-muted">{typeLabels[item.type] || item.type}</span>
                <span className="badge badge-muted">{item.language}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.createdAt}</div>
            </div>
            {item.performance && (
              <div style={{ display: "flex", gap: 24, textAlign: "center", flexShrink: 0, marginLeft: 24 }}>
                {[
                  { label: "浏览", value: item.performance.views.toLocaleString() },
                  { label: "点击", value: item.performance.clicks.toLocaleString() },
                  { label: "转化", value: item.performance.conversions },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--text)" }}>{m.value}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="divider" style={{ margin: "14px 0 10px" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline" style={{ fontSize: 12, padding: "6px 14px" }}>编辑</button>
            <button className="btn btn-outline" style={{ fontSize: 12, padding: "6px 14px" }}>预览</button>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 14px" }}>发布</button>
          </div>
        </div>
      ))}
    </div>
  );
}
// ── Auto Publish ───────────────────────────────────────────────────────
// ── Auto Publish ───────────────────────────────────────────────────────
function AutoPublishTab() {
  const [contentType, setContentType] = useState<"video" | "article">("video");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [platforms, setPlatforms] = useState<string[]>(["youtube"]);
  const [title, setTitle] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "private" | "unlisted">("public");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ 
    publish_id: string; 
    results: { 
      platform: number; 
      status: string; 
      post_url?: string; 
      video_id?: string; 
      error?: string; 
      scheduled_at?: string; 
      published_at?: string 
    }[] 
  } | null>(null);
  const [error, setError] = useState("");

  // 平台映射：前端标识 -> 显示名称和后端枚举值
  const platformConfig: Record<string, { label: string; value: number }> = {
    youtube: { label: "YouTube", value: 0 },
    tiktok: { label: "TikTok", value: 1 },
    douyin: { label: "抖音", value: 1 },  // 抖音映射到 TikTok
    xiaohongshu: { label: "小红书", value: 2 },
    instagram: { label: "Instagram", value: 3 },
  };

  const allPlatforms = Object.keys(platformConfig);
  
  const privacyOptions: { value: typeof privacy; label: string }[] = [
    { value: "public", label: "公开" },
    { value: "private", label: "私密" },
    { value: "unlisted", label: "不公开" },
  ];

  // 平台名称映射（用于显示）
  const getPlatformLabel = (platformValue: number): string => {
    const entry = Object.entries(platformConfig).find(([_, config]) => config.value === platformValue);
    return entry ? entry[1].label : `平台 ${platformValue}`;
  };

  function togglePlatform(p: string) {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  async function handlePublish() {
    if (!title.trim()) { 
      setError("请填写内容标题"); 
      return; 
    }
    if (contentType === "video" && !videoFile) { 
      setError("请选择视频文件"); 
      return; 
    }
    if (!platforms.length) { 
      setError("请选择至少一个发布平台"); 
      return; 
    }
    
    setError(""); 
    setLoading(true); 
    setResult(null);
    
    try {
      const formData = new FormData();
      
      // 添加视频文件
      if (contentType === "video" && videoFile) {
        formData.append("video", videoFile);
      }
      
      // 转换为后端期望的数字枚举值
      const platformValues = platforms
        .map(p => platformConfig[p]?.value)
        .filter(v => v !== undefined);
      
      if (platformValues.length === 0) {
        setError("没有有效的发布平台");
        setLoading(false);
        return;
      }
      
      console.log("选择的平台:", platforms);
      console.log("转换后的枚举值:", platformValues);
      formData.append("platforms", JSON.stringify(platformValues));
      
      // 处理定时发布时间
      let scheduleAtISO = undefined;
      if (scheduleAt) {
        scheduleAtISO = new Date(scheduleAt).toISOString();
        console.log("定时发布时间:", scheduleAtISO);
      }
      
      // 构建发布配置
      const postConfig = {
        title,
        privacy,
        description: description || undefined,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        schedule_at: scheduleAtISO,
        categoryId: categoryId || undefined,
      };
      
      console.log("发布配置:", postConfig);
      formData.append("post_config", JSON.stringify(postConfig));
      
      // 发送请求
      const res = await fetch("/api/marketing/videos/publish", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      console.log("服务器响应:", data);
      
      if (data.code === 200) {
        setResult(data.data);
      } else {
        setError(data.message || "发布失败");
      }
    } catch (error) {
      console.error("发布错误:", error);
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  const statusMap: Record<string, { label: string; badge: string }> = {
    success: { label: "已发布", badge: "badge-success" },
    failed: { label: "失败", badge: "badge-danger" },
    scheduled: { label: "已排期", badge: "badge-warning" },
    pending: { label: "处理中", badge: "badge-accent" },
  };

  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 24 }}>
      <div className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ fontSize: 16 }}>自动发布</div>
          <div className="section-subtitle">多平台一键分发内容</div>
        </div>
        
        {/* 内容类型切换 */}
        <div style={{ 
          display: "flex", 
          gap: 8, 
          marginBottom: 20, 
          background: "var(--bg-secondary)", 
          borderRadius: "var(--radius-full)", 
          padding: 4 
        }}>
          <button
            onClick={() => setContentType("video")}
            style={{
              flex: 1,
              padding: "8px 16px",
              borderRadius: "var(--radius-full)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              border: "none",
              transition: "all 0.2s",
              background: contentType === "video" ? "var(--accent)" : "transparent",
              color: contentType === "video" ? "white" : "var(--text-muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            📹 视频
          </button>
          <button
            onClick={() => setContentType("article")}
            style={{
              flex: 1,
              padding: "8px 16px",
              borderRadius: "var(--radius-full)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              border: "none",
              transition: "all 0.2s",
              background: contentType === "article" ? "var(--accent)" : "transparent",
              color: contentType === "article" ? "white" : "var(--text-muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            📝 文章
          </button>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 视频文件上传 */}
          {contentType === "video" && (
            <div>
              <label className="label">视频文件 *</label>
              <div style={{
                border: "1px dashed var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "20px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                background: "var(--bg-secondary)",
              }}
              onClick={() => document.getElementById("video-upload")?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith("video/")) setVideoFile(file);
              }}
              >
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  style={{ display: "none" }}
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                />
                {videoFile ? (
                  <div style={{ color: "var(--accent)" }}>
                    <div>🎬 {videoFile.name}</div>
                    <div style={{ fontSize: 12, marginTop: 8 }}>{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</div>
                    <div style={{ fontSize: 11, marginTop: 4, color: "var(--text-muted)" }}>
                      点击或拖拽替换文件
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "var(--text-muted)" }}>
                    <div>📁 点击或拖拽上传视频</div>
                    <div style={{ fontSize: 12, marginTop: 8 }}>支持 MP4, MOV, AVI, MKV 等格式，最大 500MB</div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 文章内容输入 */}
          {contentType === "article" && (
            <div>
              <label className="label">文章内容</label>
              <textarea 
                className="input" 
                rows={8} 
                placeholder="在此输入文章内容..."
                value={description} 
                onChange={e => setDescription(e.target.value)} 
              />
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                支持 Markdown 格式
              </div>
            </div>
          )}
          
          {/* 发布平台 */}
          <div>
            <label className="label">发布平台 *</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allPlatforms.map(p => (
                <button 
                  key={p} 
                  onClick={() => togglePlatform(p)}
                  style={{ 
                    padding: "6px 14px", 
                    borderRadius: "var(--radius-md)", 
                    fontSize: 12, 
                    cursor: "pointer", 
                    border: "1px solid", 
                    transition: "all 0.15s",
                    background: platforms.includes(p) ? "var(--accent-soft)" : "transparent",
                    color: platforms.includes(p) ? "var(--accent)" : "var(--text-muted)",
                    borderColor: platforms.includes(p) ? "var(--accent)" : "var(--border)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {platformConfig[p].label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
              💡 抖音和 TikTok 共享同一个平台（TikTok）
            </div>
          </div>
          
          {/* 标题 */}
          <div>
            <label className="label">标题 *</label>
            <input 
              className="input" 
              placeholder="内容标题" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              maxLength={100}
            />
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              {title.length}/100 字符
            </div>
          </div>
          
          {/* 隐私设置 */}
          <div>
            <label className="label">隐私设置</label>
            <div style={{ display: "flex", gap: 12 }}>
              {privacyOptions.map(option => (
                <label key={option.value} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="privacy"
                    value={option.value}
                    checked={privacy === option.value}
                    onChange={() => setPrivacy(option.value)}
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 13 }}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* 正文描述 */}
          {contentType === "video" && (
            <div>
              <label className="label">视频描述</label>
              <textarea 
                className="input" 
                rows={3} 
                placeholder="视频描述..." 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
              />
            </div>
          )}
          
          {/* 标签 */}
          <div>
            <label className="label">标签</label>
            <input 
              className="input" 
              placeholder="出海, 制造业, AI" 
              value={tags} 
              onChange={e => setTags(e.target.value)} 
            />
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              用逗号分隔多个标签
            </div>
          </div>
          
          {/* 分类 ID */}
          <div>
            <label className="label">分类 ID（可选）</label>
            <input 
              className="input" 
              placeholder="例如: 22 (娱乐), 10 (音乐), 20 (游戏)" 
              value={categoryId} 
              onChange={e => setCategoryId(e.target.value)} 
            />
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              不同平台有不同的分类 ID，留空将使用默认分类
            </div>
          </div>
          
          {/* 定时发布 */}
          <div>
            <label className="label">定时发布</label>
            <input 
              type="datetime-local" 
              className="input" 
              value={scheduleAt} 
              onChange={e => setScheduleAt(e.target.value)} 
            />
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              留空则立即发布
            </div>
          </div>
          
          {error && (
            <div style={{ 
              background: "var(--danger-soft)", 
              color: "var(--danger)", 
              borderRadius: "var(--radius-md)", 
              padding: "10px 14px", 
              fontSize: 13 
            }}>
              {error}
            </div>
          )}
          
          <button 
            className="btn btn-primary" 
            onClick={handlePublish} 
            disabled={loading} 
            style={{ justifyContent: "center" }}
          >
            {loading ? (
              <>
                <span className="spinner" /> 发布中...
              </>
            ) : (
              "一键发布"
            )}
          </button>
        </div>
      </div>

      {/* 结果展示区域 */}
      <div>
        {!result && !loading && (
          <div className="card" style={{ 
            padding: 48, 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            minHeight: 280, 
            gap: 12 
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              发布后各平台结果将显示在这里
            </div>
          </div>
        )}
        
        {loading && !result && (
          <div className="card" style={{ 
            padding: 48, 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            minHeight: 280, 
            gap: 12 
          }}>
            <div className="spinner" style={{ width: 40, height: 40 }} />
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              正在发布到 {platforms.length} 个平台...
            </div>
          </div>
        )}
        
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ 
              fontSize: 13, 
              color: "var(--text-muted)", 
              padding: "12px 16px", 
              background: "var(--bg-secondary)", 
              borderRadius: "var(--radius-md)" 
            }}>
              <div>发布 ID: <span style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{result.publish_id}</span></div>
              <div style={{ marginTop: 4 }}>
                成功: {result.results.filter(r => r.status === "success").length} / 总数: {result.results.length}
              </div>
            </div>
            
            {result.results.map((r, i) => (
              <div key={i} className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 500, fontSize: 15 }}>
                    {getPlatformLabel(r.platform)}
                  </div>
                  <span className={`badge ${statusMap[r.status]?.badge || "badge-muted"}`}>
                    {statusMap[r.status]?.label || r.status}
                  </span>
                </div>
                
                {r.video_id && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                    视频 ID: {r.video_id}
                  </div>
                )}
                
                {r.post_url && (
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    <a href={r.post_url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                      🔗 查看发布内容
                    </a>
                  </div>
                )}
                
                {r.error && (
                  <div style={{ 
                    marginTop: 8, 
                    fontSize: 12, 
                    color: "var(--danger)", 
                    background: "var(--danger-soft)", 
                    padding: 8, 
                    borderRadius: "var(--radius-sm)" 
                  }}>
                    ❌ {r.error}
                  </div>
                )}
                
                {r.scheduled_at && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                    📅 计划发布：{new Date(r.scheduled_at).toLocaleString()}
                  </div>
                )}
                
                {r.published_at && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                    ✅ 发布时间：{new Date(r.published_at).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}






// ── Main ───────────────────────────────────────────────────────────────
const TABS = [
  { key: "library", label: "内容库" },
  { key: "video", label: "AI 视频生成" },
  { key: "publish", label: "自动发布" },
];

export default function MarketingPage() {
  const [tab, setTab] = useState("library");

  return (
    <>
      <style>{globalStyles}</style>
      <style>{`
        .page-header { background: var(--bg-card); border-bottom: 1px solid var(--border); padding: 28px 32px 0; }
        .tab-nav { display: flex; gap: 4; margin-top: 20px; }
        .tab-btn { padding: 10px 20px; font-size: 13px; font-weight: 500; font-family: var(--font-body); background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; color: var(--text-muted); transition: all 0.18s; }
        .tab-btn:hover { color: var(--text); }
        .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
        .page-content { padding: 28px 32px; }
      `}</style>

      <div className="page-header">
        <div>
          <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Content Marketing</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, color: "var(--text)" }}>内容营销</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>AI 视频生成 · 内容管理 · 多平台自动发布</p>
        </div>
        <div className="tab-nav">
          {TABS.map(t => (
            <button key={t.key} className={`tab-btn${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {tab === "library" && <ContentLibraryTab />}
        {tab === "video" && <VideoGeneratorTab />}
        {tab === "publish" && <AutoPublishTab />}
      </div>
    </>
  );
}
