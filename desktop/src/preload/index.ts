import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

export type LogEntry = {
  type: "info" | "success" | "skip" | "error";
  filename: string;
  message: string;
};

export type Stats = {
  uploaded: number;
  skipped: number;
  failed: number;
};

export type Event = {
  id: string;
  name: string;
  slug: string;
  event_date: string | null;
};

const api = {
  // Auth
  login: (email: string, password: string) =>
    ipcRenderer.invoke("login", { email, password }) as Promise<{
      success?: boolean;
      error?: string;
      user?: { email: string };
    }>,
  logout: () => ipcRenderer.invoke("logout") as Promise<{ success: boolean }>,
  getSession: () =>
    ipcRenderer.invoke("get-session") as Promise<{ user: { email: string } | null }>,

  // Events
  getEvents: () =>
    ipcRenderer.invoke("get-events") as Promise<{ events: Event[]; error?: string }>,

  // Folder picker
  selectFolder: () => ipcRenderer.invoke("select-folder") as Promise<string | null>,

  // Watcher
  startWatch: (opts: { slug: string; folder: string; concurrency?: number; thumbSize?: number; quality?: number }) =>
    ipcRenderer.invoke("start-watch", opts) as Promise<{ success?: boolean; error?: string }>,
  stopWatch: () => ipcRenderer.invoke("stop-watch") as Promise<{ success: boolean }>,

  // Events from main → renderer
  onLog: (cb: (entry: LogEntry) => void) => {
    const handler = (_: Electron.IpcRendererEvent, entry: LogEntry) => cb(entry);
    ipcRenderer.on("log", handler);
    return () => ipcRenderer.off("log", handler);
  },
  onStats: (cb: (stats: Stats) => void) => {
    const handler = (_: Electron.IpcRendererEvent, stats: Stats) => cb(stats);
    ipcRenderer.on("stats", handler);
    return () => ipcRenderer.off("stats", handler);
  },
  onWatchStopped: (cb: () => void) => {
    const handler = () => cb();
    ipcRenderer.on("watch-stopped", handler);
    return () => ipcRenderer.off("watch-stopped", handler);
  },
};

contextBridge.exposeInMainWorld("electron", electronAPI);
contextBridge.exposeInMainWorld("api", api);
