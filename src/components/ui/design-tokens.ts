// 全局设计token - 商务白色主题
export const tokens = {
  colors: {
    bg: '#FFFFFF',
    bgSoft: '#F8F9FB',
    bgCard: '#FFFFFF',
    bgMuted: '#F2F4F7',
    border: '#E5E9EF',
    borderStrong: '#CBD2DC',
    text: '#0F1A2E',
    textSecondary: '#4A5568',
    textMuted: '#8896A8',
    accent: '#1A4FBF',
    accentHover: '#1540A0',
    accentSoft: '#EEF3FF',
    success: '#0D7A5F',
    successSoft: '#E8F7F3',
    warning: '#B45309',
    warningSoft: '#FEF3C7',
    danger: '#C0392B',
    dangerSoft: '#FDECEA',
    gold: '#B8922A',
    goldSoft: '#FDF6E3',
  },
  fonts: {
    display: "'Playfair Display', 'Georgia', serif",
    body: "'DM Sans', 'Helvetica Neue', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  shadow: {
    sm: '0 1px 3px rgba(15,26,46,0.06), 0 1px 2px rgba(15,26,46,0.04)',
    md: '0 4px 12px rgba(15,26,46,0.08), 0 2px 4px rgba(15,26,46,0.04)',
    lg: '0 8px 24px rgba(15,26,46,0.10), 0 4px 8px rgba(15,26,46,0.06)',
  },
};

export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #FFFFFF;
    --bg-soft: #F8F9FB;
    --bg-card: #FFFFFF;
    --bg-muted: #F2F4F7;
    --border: #E5E9EF;
    --border-strong: #CBD2DC;
    --text: #0F1A2E;
    --text-secondary: #4A5568;
    --text-muted: #8896A8;
    --accent: #1A4FBF;
    --accent-hover: #1540A0;
    --accent-soft: #EEF3FF;
    --success: #0D7A5F;
    --success-soft: #E8F7F3;
    --warning: #B45309;
    --warning-soft: #FEF3C7;
    --danger: #C0392B;
    --danger-soft: #FDECEA;
    --gold: #B8922A;
    --gold-soft: #FDF6E3;
    --font-display: 'Playfair Display', Georgia, serif;
    --font-body: 'DM Sans', 'Helvetica Neue', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --shadow-sm: 0 1px 3px rgba(15,26,46,0.06);
    --shadow-md: 0 4px 12px rgba(15,26,46,0.08);
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: var(--font-body);
    background: var(--bg-soft);
    color: var(--text);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: var(--font-body);
    font-size: 13px; font-weight: 500;
    letter-spacing: 0.02em;
    padding: 9px 18px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.18s ease;
    border: 1px solid transparent;
    white-space: nowrap;
  }
  .btn-primary {
    background: var(--accent); color: #fff;
    border-color: var(--accent);
  }
  .btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(26,79,191,0.25); }
  .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }
  .btn-outline {
    background: transparent; color: var(--text);
    border-color: var(--border-strong);
  }
  .btn-outline:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
  .btn-ghost {
    background: transparent; color: var(--text-secondary);
    border-color: transparent;
  }
  .btn-ghost:hover { background: var(--bg-muted); color: var(--text); }

  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  .input {
    font-family: var(--font-body);
    font-size: 14px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text);
    padding: 9px 13px;
    outline: none;
    width: 100%;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(26,79,191,0.1); }
  .input::placeholder { color: var(--text-muted); }

  .label {
    font-family: var(--font-body);
    font-size: 12px; font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
    display: block; margin-bottom: 6px;
  }

  .badge {
    display: inline-flex; align-items: center;
    font-family: var(--font-body);
    font-size: 11px; font-weight: 500;
    padding: 3px 9px;
    border-radius: 20px;
  }
  .badge-success { background: var(--success-soft); color: var(--success); }
  .badge-warning { background: var(--warning-soft); color: var(--warning); }
  .badge-danger { background: var(--danger-soft); color: var(--danger); }
  .badge-accent { background: var(--accent-soft); color: var(--accent); }
  .badge-muted { background: var(--bg-muted); color: var(--text-muted); }

  .section-title {
    font-family: var(--font-display);
    font-size: 22px; font-weight: 600;
    color: var(--text);
    margin-bottom: 4px;
  }
  .section-subtitle {
    font-family: var(--font-body);
    font-size: 14px;
    color: var(--text-muted);
  }

  .divider { height: 1px; background: var(--border); margin: 20px 0; }

  .stat-value {
    font-family: var(--font-display);
    font-size: 32px; font-weight: 600;
    color: var(--text); line-height: 1.1;
  }
  .stat-label {
    font-size: 12px; color: var(--text-muted);
    margin-top: 4px;
  }
  .stat-change {
    font-size: 12px; font-weight: 500;
    margin-top: 2px;
  }
  .stat-change.up { color: var(--success); }
  .stat-change.down { color: var(--danger); }

  textarea.input { resize: vertical; min-height: 80px; }

  select.input {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238896A8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
    cursor: pointer;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }
  .spinner-dark {
    border-color: rgba(15,26,46,0.15);
    border-top-color: var(--accent);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in { animation: fadeIn 0.3s ease forwards; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .pulse { animation: pulse 1.5s ease infinite; }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg-soft); }
  ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
`;
