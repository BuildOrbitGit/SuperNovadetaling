# Supernova Automobile Detailing — Site Notes

## Live URL
https://supernova-detailing.vercel.app

---

## How the Vercel CLI Deployment Works (bypassing the enterprise dashboard)

### The problem
Your Vercel account (`buildorbitstudio`) sits inside a **team** called `buildorbitstudios-projects`. On team accounts, Vercel's web dashboard enforces an enterprise onboarding flow for new projects — it wants you to connect GitHub, configure settings, etc. through their UI before you can deploy.

### The bypass
The Vercel CLI lets you skip all of that by passing `--scope` directly:

```bash
vercel --prod --scope buildorbitstudios-projects --yes
```

What each flag does:
- `--scope buildorbitstudios-projects` — tells the CLI which team to deploy under, bypassing the dashboard flow entirely
- `--prod` — deploy straight to production (not a preview URL)
- `--yes` — accept all defaults without interactive prompts

### Why it works
The CLI authenticates with your token directly against Vercel's API. It doesn't go through the web dashboard at all — it creates the project and deploys in one API call. The `--scope` flag is what routes it to your team instead of your personal account.

### After the first deploy
Vercel writes a `.vercel/project.json` file:

```json
{
  "projectId": "prj_9pfDKWnTGicMo72OVepJyHgWYdeo",
  "orgId":     "team_5NB6pStYe66D3rDKIiddVBpJ",
  "projectName": "supernova-detailing"
}
```

This file locks the CLI to this specific project. Every future deploy just needs:

```bash
vercel --prod
```

No `--scope` or `--name` needed — the project.json handles it automatically.

---

## Deploying updates

From this folder:

```bash
vercel --prod
```

That's it. Takes ~10 seconds.

---

## Project structure

| File | Purpose |
|------|---------|
| `index.html` | Single-page site |
| `style.css` | All styles |
| `script.js` | Animations, carousel, nav |
| `vercel.json` | Cache headers, security headers |
| `.vercel/project.json` | Links CLI to Vercel project (don't delete) |
| `*.jpg / *.png / *.webp` | All images (in root, not assets/) |

> **Note:** All images live in the project root. The HTML and CSS reference them without any subdirectory prefix.
