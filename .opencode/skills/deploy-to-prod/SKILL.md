---
name: deploy-to-prod
description: Use ALWAYS after finishing any source code change the user asked for. Builds, runs tests, commits to git, pushes to GitHub, and deploys to Firebase hosting. Trigger when the user's task involves modifying source files and the work is complete. Also trigger on keywords: deploy, subir, publicar, push, github, firebase, hosting.
---

# Deploy to Production

After completing any code change the user requested, if they say "sube", "deploy", "publica", "push a github", or similar, follow this workflow in order:

## Step 1: Verify build and tests

```powershell
npx tsc -b; if ($?) { npx vite build }
```

If build fails, fix errors and retry. Then:

```powershell
npx vitest run
```

If tests fail, fix and retry.

## Step 2: Commit to Git

Check status first:

```powershell
git status
```

Then stage all changes and commit with a descriptive message in the same style as previous commits (Spanish, concise, lowercase):

```powershell
git add -A
git commit -m "descripcion breve del cambio"
```

## Step 3: Push to GitHub

```powershell
git push
```

Remote is `origin` at `https://github.com/luisdavidol/figuritasintercambio.git`.

## Step 4: Deploy to Firebase

```powershell
npx firebase deploy --only hosting
```

Firebase project: `figuritas-mundial-42b71`. Hosting URL: `https://figuritas-mundial-42b71.web.app`.

## Important rules

- Run each step sequentially using `if ($?) { ... }` to abort on failure.
- Work directory is `D:\GIT\figuritasopencode`.
- Never skip the build verification step.
- If the user explicitly says "no hagas deploy" or "solo commit", skip steps accordingly.
- After deploy, always report the hosting URL to the user.
