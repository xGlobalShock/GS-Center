# GS Center — Repository Strategy Guide

> Complete setup instructions for the private/public repo architecture.

---

## 1. Repository Architecture

```
┌─────────────────────────────────────────────────────┐
│  xGlobalShock/GS-Center  (PRIVATE)                  │
│                                                     │
│  ├── src/              ← Full source code           │
│  ├── electron/         ← Electron main process      │
│  ├── main-process/     ← IPC handlers               │
│  ├── native-monitor/   ← C# sidecar                 │
│  ├── public-repo/      ← Public-facing files (sync) │
│  │   ├── README.md     ← Polished public README     │
│  │   ├── CHANGELOG.md  ← User-facing changelog      │
│  │   ├── LICENSE        ← MIT license               │
│  │   └── .gitignore    ← Safety net                 │
│  ├── .github/workflows/                             │
│  │   ├── release.yml   ← Build & publish to public  │
│  │   └── sync-public.yml ← Sync public-repo/ files  │
│  └── ...               ← All other private files    │
│                                                     │
│  ➜ CI/CD builds app → publishes releases            │
│  ➜ Sync workflow → pushes README/assets             │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  xGlobalShock/GS-Center-Releases  (PUBLIC)          │
│                                                     │
│  ├── README.md         ← Auto-synced from private   │
│  ├── CHANGELOG.md      ← Auto-synced from private   │
│  ├── LICENSE           ← Auto-synced from private    │
│  ├── .gitignore        ← Blocks source code          │
│  └── Releases/         ← GitHub Releases             │
│      ├── v2.2.9/                                     │
│      │   ├── GS-Center-Setup-2.2.9.exe              │
│      │   ├── latest.yml                              │
│      │   └── *.blockmap                              │
│      └── ...                                         │
│                                                     │
│  ➜ Users download from here                         │
│  ➜ electron-updater checks here for updates         │
│  ➜ Issues/discussions happen here                   │
└─────────────────────────────────────────────────────┘
```

---

## 2. Step-by-Step Setup

### Step 1: Create the Public Repository

1. Go to https://github.com/new
2. Repository name: `GS-Center-Releases`
3. Description: `GS Center — All-in-one PC optimization for gamers & streamers. Download the latest version here.`
4. Visibility: **Public**
5. Do NOT initialize with README (we'll push our own)
6. Click **Create repository**

### Step 2: Create a GitHub Personal Access Token (PAT)

1. Go to https://github.com/settings/tokens?type=beta (Fine-grained tokens)
2. Click **Generate new token**
3. Name: `GS-Center-Release-Bot`
4. Expiration: 1 year (or custom)
5. Repository access: Select **Only select repositories** → choose `GS-Center-Releases`
6. Permissions:
   - **Contents**: Read and write
   - **Metadata**: Read-only (auto-selected)
7. Click **Generate token**
8. **Copy the token immediately** — you won't see it again

### Step 3: Add the PAT as a Secret on the Private Repo

1. Go to https://github.com/xGlobalShock/GS-Center/settings/secrets/actions
2. Click **New repository secret**
3. Name: `PUBLIC_REPO_TOKEN`
4. Value: paste the PAT from Step 2
5. Click **Add secret**

### Step 4: Initialize the Public Repository

Run these commands locally:

```bash
# Navigate to a temporary directory
cd /tmp

# Clone the empty public repo
git clone https://github.com/xGlobalShock/GS-Center-Releases.git
cd GS-Center-Releases

# Copy initial files from the private repo's public-repo/ directory
cp /path/to/GC-Center/public-repo/* .
cp /path/to/GC-Center/public-repo/.gitignore .

# Commit and push
git add -A
git commit -m "Initial public repo setup"
git push origin main

# Clean up
cd ..
rm -rf GS-Center-Releases
```

Or from PowerShell on Windows:

```powershell
# From your GC Center project directory
cd E:\Dev

git clone https://github.com/xGlobalShock/GS-Center-Releases.git
Copy-Item "GC Center\public-repo\*" "GS-Center-Releases\" -Recurse -Force
Copy-Item "GC Center\public-repo\.gitignore" "GS-Center-Releases\" -Force
cd GS-Center-Releases
git add -A
git commit -m "Initial public repo setup"
git push origin main
cd ..
Remove-Item GS-Center-Releases -Recurse -Force
```

### Step 5: Make the Private Repo Private

1. Go to https://github.com/xGlobalShock/GS-Center/settings
2. Scroll to **Danger Zone**
3. Click **Change repository visibility**
4. Select **Private**
5. Confirm

### Step 6: Verify the Setup

1. Visit https://github.com/xGlobalShock/GS-Center-Releases — should show the public README
2. Run the **Build & Release** workflow from the private repo's Actions tab
3. Check that a release appears on https://github.com/xGlobalShock/GS-Center-Releases/releases
4. Test the auto-updater in the app to confirm it can find updates

---

## 3. Release & Distribution Workflow

### How to Release a New Version

1. **Bump the version** in `package.json`:
   ```json
   "version": "2.3.0"
   ```

2. **Update the changelog** in `public-repo/CHANGELOG.md`

3. **Commit and push** to `main`:
   ```bash
   git add -A
   git commit -m "release: v2.3.0"
   git push origin main
   ```

4. **Trigger the release workflow**:
   - Go to Actions → Build & Release → Run workflow
   - Choose whether it's a pre-release or stable release
   - The workflow will:
     1. Create a git tag `v2.3.0` on the private repo
     2. Build the Electron app on Windows
     3. Publish the installer + `latest.yml` to `GS-Center-Releases` releases

5. **Done** — users will auto-update, and new users download from the public repo

### How electron-updater Works with This Setup

The `package.json` publish config points to `GS-Center-Releases`:
```json
"publish": {
  "provider": "github",
  "owner": "xGlobalShock",
  "repo": "GS-Center-Releases"
}
```

electron-updater will:
1. Check `https://github.com/xGlobalShock/GS-Center-Releases/releases/latest`
2. Download `latest.yml` to compare versions
3. If a newer version exists, download the `.exe` and apply the update

Since the releases repo is **public**, no authentication token is needed in the app.

---

## 4. README Sync Strategy

The README is maintained in **one place**: `public-repo/README.md` in the private repo.

### Automatic Sync

The `sync-public.yml` workflow triggers automatically when any file in `public-repo/` changes on the `main` branch. It:

1. Checks out both repos
2. Copies `public-repo/*` → public repo root
3. Commits and pushes

### Manual Sync

You can also trigger the sync manually from the Actions tab → **Sync Public Repo** → Run workflow.

### What Gets Synced

Only files inside `public-repo/` are synced. This is an **allowlist** approach:
- `README.md`
- `CHANGELOG.md`
- `LICENSE`
- `.gitignore`
- Any future assets (screenshots, etc.)

**Nothing else from the private repo is ever touched.**

---

## 5. Security Checklist

### Pre-Launch Verification

- [ ] Private repo visibility is set to **Private**
- [ ] No source code files exist in `public-repo/`
- [ ] No `.env`, API keys, or secrets in `public-repo/`
- [ ] `public-repo/.gitignore` blocks `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.css`
- [ ] Public README does NOT contain:
  - [ ] Project structure / file tree
  - [ ] Development setup / build commands
  - [ ] Internal architecture details
  - [ ] Database schema
  - [ ] API endpoints or IPC channel names
  - [ ] Supabase project URL or keys
  - [ ] PayPal integration details
- [ ] GitHub PAT has **minimal scope** (only `GS-Center-Releases` repo, contents read/write)
- [ ] PAT is stored as a **repository secret**, never hardcoded
- [ ] CI/CD workflow only uploads build artifacts (`.exe`, `.yml`, `.blockmap`)
- [ ] No `node_modules/`, `dist/`, or build configs in the public repo

### Ongoing Security

- [ ] Review PAT expiration quarterly — rotate before it expires
- [ ] Audit public repo periodically for accidental commits
- [ ] Never merge PRs on the public repo from unknown contributors
- [ ] Keep the public repo's default branch protected

---

## 6. File Reference

| File | Location | Purpose |
|------|----------|---------|
| `public-repo/README.md` | Private repo | Public-facing README (synced to public) |
| `public-repo/CHANGELOG.md` | Private repo | User-facing changelog (synced to public) |
| `public-repo/LICENSE` | Private repo | MIT license (synced to public) |
| `public-repo/.gitignore` | Private repo | Safety net for public repo (synced) |
| `.github/workflows/release.yml` | Private repo | Build & publish releases to public repo |
| `.github/workflows/sync-public.yml` | Private repo | Sync public-repo/ to public repo |
| `REPO_STRATEGY.md` | Private repo | This document (setup guide) |

---

## 7. Troubleshooting

### Release workflow fails with "Resource not accessible by integration"
The `PUBLIC_REPO_TOKEN` secret is missing or the PAT doesn't have the right scope. Regenerate the PAT with `Contents: Read and write` permission on the `GS-Center-Releases` repo.

### Auto-updater can't find updates
Ensure `package.json` publish config points to `GS-Center-Releases`, not `GS-Center`. Rebuild and release a new version — the app must be rebuilt with the updated config.

### Sync workflow doesn't trigger
Verify the push was to the `main` branch and files inside `public-repo/` actually changed. You can also trigger it manually from the Actions tab.

### Public repo shows old README
Manually trigger the Sync Public Repo workflow, or check the workflow logs for errors.
