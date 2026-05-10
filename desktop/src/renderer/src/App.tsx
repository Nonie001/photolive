import { useCallback, useEffect, useRef, useState } from "react";

type AppState = "loading" | "login" | "idle" | "watching";

type Event = { id: string; name: string; slug: string; event_date: string | null };
type LogEntry = { type: "info" | "success" | "skip" | "error"; filename: string; message: string };
type Stats = { uploaded: number; skipped: number; failed: number };

const api = (window as unknown as { api: typeof import("../preload").api }).api ?? window.api;

export default function App() {
  const [screen, setScreen] = useState<AppState>("loading");
  const [userEmail, setUserEmail] = useState("");

  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Upload form
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [folder, setFolder] = useState("");
  const [startError, setStartError] = useState("");

  // Log
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats>({ uploaded: 0, skipped: 0, failed: 0 });
  const logEndRef = useRef<HTMLDivElement>(null);

  // ── Init: check existing session ─────────────────────────────────────────────

  useEffect(() => {
    window.api.getSession().then(({ user }) => {
      if (user) {
        setUserEmail(user.email ?? "");
        loadEvents();
        setScreen("idle");
      } else {
        setScreen("login");
      }
    });
  }, []);

  // ── IPC listeners ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const offLog = window.api.onLog((entry) =>
      setLogs((prev) => [...prev.slice(-200), entry]),
    );
    const offStats = window.api.onStats((s) => setStats(s));
    const offStopped = window.api.onWatchStopped(() => setScreen("idle"));
    return () => {
      offLog();
      offStats();
      offStopped();
    };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  async function loadEvents() {
    const { events: evts } = await window.api.getEvents();
    setEvents(evts);
    if (evts.length > 0 && !selectedSlug) setSelectedSlug(evts[0].slug);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const res = await window.api.login(email, password);
    setLoginLoading(false);
    if (res.error) {
      setLoginError(res.error);
      return;
    }
    setUserEmail(res.user?.email ?? "");
    await loadEvents();
    setScreen("idle");
  }

  async function handleLogout() {
    await window.api.logout();
    setScreen("login");
    setEvents([]);
    setSelectedSlug("");
    setFolder("");
    setLogs([]);
    setStats({ uploaded: 0, skipped: 0, failed: 0 });
  }

  async function handleSelectFolder() {
    const f = await window.api.selectFolder();
    if (f) setFolder(f);
  }

  async function handleStart() {
    if (!selectedSlug || !folder) return;
    setStartError("");
    setLogs([]);
    setStats({ uploaded: 0, skipped: 0, failed: 0 });
    const res = await window.api.startWatch({ slug: selectedSlug, folder });
    if (res.error) {
      setStartError(res.error);
      return;
    }
    setScreen("watching");
  }

  async function handleStop() {
    await window.api.stopWatch();
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (screen === "loading") {
    return (
      <div style={styles.center}>
        <p style={{ color: "var(--muted)" }}>กำลังโหลด...</p>
      </div>
    );
  }

  if (screen === "login") {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h1 style={styles.logo}>PhotoLive</h1>
          <p style={{ color: "var(--muted)", marginBottom: 24, textAlign: "center", fontSize: 13 }}>
            เข้าสู่ระบบเพื่อเริ่มอัปโหลด
          </p>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label>อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label>รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {loginError && <p style={{ color: "var(--error)", fontSize: 13 }}>{loginError}</p>}
            <button
              type="submit"
              disabled={loginLoading}
              style={{ ...styles.btnPrimary, marginTop: 4 }}
            >
              {loginLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>PhotoLive</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--muted)", fontSize: 12 }}>{userEmail}</span>
          <button onClick={handleLogout} style={styles.btnGhost} disabled={screen === "watching"}>
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Form */}
      <div style={styles.section}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label>อีเวนต์</label>
            {events.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>ยังไม่มีอีเวนต์ — สร้างได้ที่เว็บ photolive</p>
            ) : (
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                disabled={screen === "watching"}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.slug}>
                    {ev.name} ({ev.slug})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label>โฟลเดอร์รูปภาพ</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="เลือกโฟลเดอร์..."
                readOnly
                disabled={screen === "watching"}
              />
              <button
                type="button"
                onClick={handleSelectFolder}
                disabled={screen === "watching"}
                style={{ ...styles.btnSecondary, whiteSpace: "nowrap" }}
              >
                เลือก
              </button>
            </div>
          </div>

          {startError && <p style={{ color: "var(--error)", fontSize: 13 }}>{startError}</p>}

          {screen === "idle" ? (
            <button
              onClick={handleStart}
              disabled={!selectedSlug || !folder}
              style={styles.btnPrimary}
            >
              เริ่ม Watch
            </button>
          ) : (
            <button onClick={handleStop} style={styles.btnDanger}>
              หยุด
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {(screen === "watching" || logs.length > 0) && (
        <div style={styles.stats}>
          <StatBadge label="อัปโหลด" value={stats.uploaded} color="var(--success)" />
          <StatBadge label="ข้ามแล้ว" value={stats.skipped} color="var(--muted)" />
          <StatBadge label="ผิดพลาด" value={stats.failed} color="var(--error)" />
          {screen === "watching" && (
            <span style={{ color: "var(--accent)", fontSize: 12, marginLeft: "auto" }}>
              ● กำลัง watch...
            </span>
          )}
        </div>
      )}

      {/* Log */}
      {logs.length > 0 && (
        <div style={styles.logBox}>
          {logs.map((entry, i) => (
            <div key={i} style={{ ...styles.logRow, color: logColor(entry.type) }}>
              <span style={styles.logIcon}>{logIcon(entry.type)}</span>
              {entry.filename && (
                <span style={{ color: "var(--text)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {entry.filename}
                </span>
              )}
              <span style={{ color: "var(--muted)", flex: 1 }}>{entry.message}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <span style={{ fontSize: 20, fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: 11, color: "var(--muted)" }}>{label}</span>
    </div>
  );
}

function logColor(type: LogEntry["type"]) {
  return { info: "var(--muted)", success: "var(--success)", skip: "var(--muted)", error: "var(--error)" }[type];
}

function logIcon(type: LogEntry["type"]) {
  return { info: "·", success: "↑", skip: "–", error: "✗" }[type];
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  center: { display: "flex", alignItems: "center", justifyContent: "center", height: "100%" } as React.CSSProperties,
  page: { display: "flex", flexDirection: "column" as const, height: "100%", overflow: "hidden" },
  card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 28, width: 340 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 },
  logo: { fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" },
  section: { padding: "20px 20px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 },
  stats: { display: "flex", alignItems: "center", gap: 24, padding: "12px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 },
  logBox: { flex: 1, overflow: "auto", padding: "8px 20px", display: "flex", flexDirection: "column" as const, gap: 3, fontFamily: "monospace", fontSize: 12 },
  logRow: { display: "flex", gap: 8, alignItems: "baseline" },
  logIcon: { width: 12, flexShrink: 0 },
  btnPrimary: { background: "var(--accent)", color: "#fff", fontWeight: 600, padding: "10px 16px" } as React.CSSProperties,
  btnSecondary: { background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", padding: "8px 14px" } as React.CSSProperties,
  btnDanger: { background: "#7f1d1d", color: "#fca5a5", fontWeight: 600, padding: "10px 16px" } as React.CSSProperties,
  btnGhost: { background: "transparent", color: "var(--muted)", fontSize: 12, padding: "4px 10px" } as React.CSSProperties,
} satisfies Record<string, React.CSSProperties>;

// expose api type for preload
declare global {
  interface Window {
    api: {
      getSession: () => Promise<{ user: { email: string } | null }>;
      login: (email: string, password: string) => Promise<{ success?: boolean; error?: string; user?: { email: string } }>;
      logout: () => Promise<{ success: boolean }>;
      getEvents: () => Promise<{ events: Event[]; error?: string }>;
      selectFolder: () => Promise<string | null>;
      startWatch: (opts: { slug: string; folder: string }) => Promise<{ success?: boolean; error?: string }>;
      stopWatch: () => Promise<{ success: boolean }>;
      onLog: (cb: (entry: LogEntry) => void) => () => void;
      onStats: (cb: (stats: Stats) => void) => () => void;
      onWatchStopped: (cb: () => void) => () => void;
    };
  }
}
