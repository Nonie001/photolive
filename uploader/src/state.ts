import { promises as fs } from "node:fs";

export type State = {
  version: 1;
  files: Record<string, { uploadedAt: string }>;
};

export async function loadState(path: string): Promise<State> {
  try {
    const text = await fs.readFile(path, "utf8");
    const parsed = JSON.parse(text) as State;
    if (parsed.version === 1 && parsed.files) return parsed;
  } catch {
    // missing or invalid -> fresh state
  }
  return { version: 1, files: {} };
}

let saveTimer: NodeJS.Timeout | null = null;

export async function saveState(path: string, state: State): Promise<void> {
  await fs.writeFile(path, JSON.stringify(state, null, 2), "utf8");
}

export async function markUploaded(
  path: string,
  state: State,
  filePath: string,
): Promise<void> {
  state.files[filePath] = { uploadedAt: new Date().toISOString() };
  // Debounced save (multiple files arriving at once).
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveState(path, state).catch(() => {});
  }, 500);
}
