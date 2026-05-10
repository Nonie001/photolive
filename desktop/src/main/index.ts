import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { startWatcher, type WatcherHandle } from "./watcher";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let mainWindow: BrowserWindow | null = null;
let watcherHandle: WatcherHandle | null = null;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true },
  realtime: { transport: ws },
});

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 580,
    height: 700,
    minWidth: 480,
    minHeight: 600,
    resizable: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
    title: "PhotoLive Uploader",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    backgroundColor: "#0a0a0a",
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// ── App lifecycle ──────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.photolive.desktop");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", async () => {
  if (watcherHandle) {
    await watcherHandle.stop();
    watcherHandle = null;
  }
  if (process.platform !== "darwin") app.quit();
});

// ── IPC: Auth ─────────────────────────────────────────────────────────────────

ipcMain.handle("login", async (_, { email, password }: { email: string; password: string }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };
  return { success: true, user: { email: data.user?.email } };
});

ipcMain.handle("logout", async () => {
  if (watcherHandle) {
    await watcherHandle.stop();
    watcherHandle = null;
  }
  await supabase.auth.signOut();
  return { success: true };
});

ipcMain.handle("get-session", async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null };
  return { user: { email: user.email } };
});

// ── IPC: Events ───────────────────────────────────────────────────────────────

ipcMain.handle("get-events", async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { events: [] };

  const { data, error } = await supabase
    .from("events")
    .select("id, name, slug, event_date")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { events: [], error: error.message };
  return { events: data ?? [] };
});

// ── IPC: Folder picker ────────────────────────────────────────────────────────

ipcMain.handle("select-folder", async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "เลือกโฟลเดอร์รูปภาพ",
    properties: ["openDirectory"],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// ── IPC: Watcher ──────────────────────────────────────────────────────────────

ipcMain.handle(
  "start-watch",
  async (_, { slug, folder, concurrency = 3, thumbSize = 800, quality = 80 }) => {
    if (watcherHandle) return { error: "กำลัง watch อยู่แล้ว" };

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return { error: "กรุณาเข้าสู่ระบบก่อน" };

    try {
      watcherHandle = await startWatcher({
        supabaseUrl: SUPABASE_URL,
        supabaseAnonKey: SUPABASE_ANON_KEY,
        supabaseAccessToken: session.access_token,
        eventSlug: slug,
        folder,
        concurrency,
        thumbSize,
        quality,
        onLog: (entry) => mainWindow?.webContents.send("log", entry),
        onStats: (stats) => mainWindow?.webContents.send("stats", stats),
      });
      return { success: true };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  },
);

ipcMain.handle("stop-watch", async () => {
  if (watcherHandle) {
    await watcherHandle.stop();
    watcherHandle = null;
  }
  mainWindow?.webContents.send("watch-stopped");
  return { success: true };
});
