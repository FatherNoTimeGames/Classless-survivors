# Run and host Classless Survivors

The release ZIP contains **web/** (the complete production site), this guide,
PLAYING.md, START-HERE.txt and a SHA-256 file inventory. Upload the **contents of
web/** to an HTTPS static host and open the site's trailing-slash address.
There is no server application, account system, database or runtime API to configure.
Opening index.html directly as a file is unsupported.

## Recommended free hosting: GitHub Pages

GitHub Pages fits the existing FatherNoTimeGames/Classless-survivors repository
and supports HTTPS and service workers. Pages is free for public repositories;
private-repository availability depends on the GitHub plan. Publishing the game
does not add accounts or online requirements for players.

The source includes a **Deploy game to GitHub Pages** workflow, started manually:

1. Put this completed source, including `.github/workflows/pages.yml`, on the
   repository's default branch (normally `main`). Manual workflows must exist
   there to appear in Actions. The delivery commit is local until pushed or merged.
2. In the repository, choose **Settings → Pages → Build and deployment → Source →
   GitHub Actions**. Keep **Enforce HTTPS** enabled when available.
3. Open **Actions → Deploy game to GitHub Pages → Run workflow**, choose the branch
   containing the completed game, and run it. It installs locked dependencies,
   runs unit tests and the production build, and uploads only `dist/`.
4. Open the URL returned by the deployment job. For the normal project site the
   expected path is `/Classless-survivors/`; use the URL GitHub actually reports.
   Wait for **Offline ready**, then test a reload with networking disabled.

The workflow deliberately has no automatic push trigger. Later releases use the
same manual action. GitHub controls eligibility, quotas and repository permissions.
No remote deployment was performed during release preparation: no host was
configured, and the environment's Pages API request was blocked by network policy.

## Other hosts, including ChatGPT Sites

Use any host that accepts a complete static directory, gives it a stable HTTPS
address, and allows service workers. ChatGPT Sites is usable if it meets those
requirements; its deployment and offline behavior have not been verified here.
A temporary preview URL or embedded sandbox does not establish offline support.

Preserve **every** generated path and byte. The same build works at a domain root
or a folder such as `/Classless-survivors/`. Serve the folder's trailing-slash URL.
Use JavaScript MIME type for `sw.js` and `.js`, CSS for `.css`, JSON/manifest for
`manifest.webmanifest`, SVG for `.svg` and PNG for `.png`. Do not inject analytics,
rewrite missing assets to HTML, minify the uploaded files again or restrict them
behind a login: the offline worker verifies their exact SHA-256 digests.

Let `index.html`, `sw.js` and `manifest.webmanifest` revalidate, for example with
`Cache-Control: no-cache`. Hashed `assets/` files may use long immutable caching.
Deploy a complete release atomically where possible. Otherwise upload hashed
assets first, then HTML/manifest/worker, retaining previous hashed assets during
rollout. A failed or incomplete update preserves the previous offline copy.

After publishing, confirm there are no browser-console errors, make/save a mixed
build, wait for **Offline ready**, disconnect, reload and start a run. Actual HTTPS
hosting, physical phones/tablets and native OS installation need verification on
the chosen host/device. Export saves before changing origin or clearing site data.

## Local development and production checks

Use Node **24.19.0 or later within Node 24**, npm **11+**, and the source checkout:

```sh
npm ci
npm run dev
```

Open the address printed by Vite on your own computer. Development uses port 5173
and does not register the offline worker. To try production locally instead:

```sh
npm run build
npm run preview
```

Preview uses port 4173 and is for local verification. Loopback addresses support
service workers; plain HTTP on a phone over a LAN does not. Use HTTPS for deployment.

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

The browser suite starts its own preview on 4173; stop a running preview first.
An existing system Chromium can be selected using the environment variable
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`; the cloud checks use `/usr/bin/chromium`.
`npm run check` combines unit tests, build and browser checks after browser setup.

## Create and verify a release ZIP

Packaging additionally needs the free `zip` and `unzip` command-line tools
(available in the prepared Linux environment; install them on other machines).
From the checkout:

```sh
npm run release
npm run test:release
```

The first command rebuilds and creates `release/classless-survivors-1.0.0.zip`
and its `.sha256` checksum. The second extracts that ZIP into a temporary folder,
verifies its inventory and hashes, then serves the extracted site at both a root
and project subdirectory. Desktop, touch tablet and Android portrait Chromium
checks save a mixed build, reload offline, move, fight, earn XP and select an
upgrade. Screenshots and `smoke-results.json` are written under `release/`.
Set the Chromium executable-path variable for this command if needed.

Only `web/` belongs on the host. Source, tests, benchmarks, dependencies, browser
reports and local save data are excluded from the ZIP's production directory.
Checksums detect changed bytes; they are not a signature or proof of authorship.
Release output is generated and ignored by Git; source scripts and guides are committed.
