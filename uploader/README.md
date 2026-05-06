# PhotoLive Uploader

Watch a local folder and auto-upload new photos to a PhotoLive event.

## Setup

```bash
cd uploader
npm install
cp .env.example .env
# edit .env with your Supabase URL + service-role key
```

## Usage

```bash
npm run start -- --event <event-slug> --folder "C:\Path\To\Photos"
```

Or after `npm run build`:

```bash
node dist/index.js --event <event-slug> --folder "C:\Path\To\Photos"
```

## Flags

| Flag | Description |
|---|---|
| `--event <slug>` | Event slug (from dashboard URL `/e/<slug>`) — **required** |
| `--folder <path>` | Folder to watch — **required** |
| `--concurrency <n>` | Parallel uploads (default `3`) |
| `--thumb-size <px>` | Thumb longest edge (default `800`) |
| `--quality <0-100>` | Thumb JPEG quality (default `80`) |

## Behavior

- Watches for new `.jpg/.jpeg/.png/.webp/.heic` files (case-insensitive)
- Reads EXIF `DateTimeOriginal`, falls back to file mtime
- Uploads original to bucket `photos/<eventId>/<uuid>.<ext>`
- Generates thumbnail (Sharp) and uploads to `thumbs/<eventId>/<uuid>.jpg`
- Inserts row into `photos` table → triggers Supabase Realtime
- Tracks uploaded files in `.uploader-state.json` inside the watched folder
  (so a restart skips already-uploaded photos)
- Retries network errors 3× with exponential backoff
