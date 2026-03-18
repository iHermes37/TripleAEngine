"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { globalStyles } from "../ui/design-tokens";

const NAV_ITEMS = [
  {
    group: "核心功能",
    items: [
      {
        href: "/dashboard/market",
        label: "市场调研",
        sublabel: "Market Intelligence",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        ),
      },
      {
        href: "/dashboard/marketing",
        label: "内容营销",
        sublabel: "Content Marketing",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        ),
      },
      {
        href: "/dashboard/operations",
        label: "智能运营",
        sublabel: "Smart Operations",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        ),
      },
      {
        href: "/dashboard/analytics",
        label: "数据分析",
        sublabel: "Data Analytics",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        ),
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <style>{globalStyles}</style>
      <style>{`
        .sidebar {
          width: 240px;
          min-width: 240px;
          background: var(--bg-card);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow-y: auto;
        }
        .sidebar-logo {
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--border);
        }
        .logo-mark {
          width: 32px; height: 32px;
          background: var(--accent);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .logo-text {
          font-family: var(--font-display);
          font-size: 15px; font-weight: 600;
          color: var(--text);
        }
        .logo-sub {
          font-size: 10px; color: var(--text-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-family: var(--font-body);
        }
        .nav-section { padding: 20px 12px 8px; }
        .nav-group-label {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
          padding: 0 8px;
          margin-bottom: 6px;
          font-family: var(--font-body);
        }
        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s;
          text-decoration: none;
          color: var(--text-secondary);
          margin-bottom: 2px;
        }
        .nav-item:hover {
          background: var(--bg-soft);
          color: var(--text);
        }
        .nav-item.active {
          background: var(--accent-soft);
          color: var(--accent);
        }
        .nav-icon { flex-shrink: 0; opacity: 0.7; }
        .nav-item.active .nav-icon { opacity: 1; }
        .nav-label {
          font-family: var(--font-body);
          font-size: 13px; font-weight: 500;
          line-height: 1.2;
        }
        .nav-sublabel {
          font-size: 10px;
          color: var(--text-muted);
          font-family: var(--font-body);
          line-height: 1;
          margin-top: 1px;
        }
        .nav-item.active .nav-sublabel { color: var(--accent); opacity: 0.7; }
        .sidebar-footer {
          margin-top: auto;
          padding: 16px 12px;
          border-top: 1px solid var(--border);
        }
        .user-chip {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background 0.15s;
        }
        .user-chip:hover { background: var(--bg-soft); }
        .avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--accent);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 600; color: #fff;
          flex-shrink: 0;
          font-family: var(--font-body);
        }
        .user-name { font-size: 13px; font-weight: 500; color: var(--text); font-family: var(--font-body); }
        .user-role { font-size: 11px; color: var(--text-muted); font-family: var(--font-body); }
        .back-link {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: var(--text-muted);
          text-decoration: none; padding: 6px 8px;
          border-radius: var(--radius-sm);
          transition: color 0.15s;
          font-family: var(--font-body);
          margin-bottom: 8px;
        }
        .back-link:hover { color: var(--accent); }
      `}</style>

      <div className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="logo-mark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <div className="logo-text">TripleA</div>
              <div className="logo-sub">Engine</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="nav-section" style={{ flex: 1 }}>
          {NAV_ITEMS.map((group) => (
            <div key={group.group}>
              <div className="nav-group-label">{group.group}</div>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item${pathname === item.href ? " active" : ""}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <div>
                    <div className="nav-label">{item.label}</div>
                    <div className="nav-sublabel">{item.sublabel}</div>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <Link href="/" className="back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            返回官网
          </Link>
          <div className="user-chip">
            <div className="avatar">A</div>
            <div>
              <div className="user-name">管理员</div>
              <div className="user-role">企业版账户</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
