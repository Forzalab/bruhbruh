# Deploying Gates of Babylon to csci4x

Live URL: **http://csci4x.com:6677** (plain http; port approved by Kerney)

How it works: `publish-site.sh` builds the site on your laptop and commits it to
the `deploy/gob-site` branch. That branch holds only:

    serve.sh     starts/restarts the server
    README.md
    site/        index.html + assets/  (the ONLY folder that gets served)

On csci4x you clone that branch and run `./serve.sh`. The server needs git,
python3 and curl. It does not need Node.

---

## 1. One-time setup on csci4x (private repo auth)

The repo is private, so csci4x needs read access. Pick ONE:

**A. Deploy key (recommended, read-only, only this repo)**

    ssh-keygen -t ed25519 -f ~/.ssh/gob_deploy -N ""
    cat ~/.ssh/gob_deploy.pub

Paste the `.pub` line into GitHub > Forzalab/bruhbruh > Settings > Deploy keys
(leave "Allow write access" OFF). Then add to `~/.ssh/config`:

    Host github-gob
      HostName github.com
      User git
      IdentityFile ~/.ssh/gob_deploy

and clone with `git@github-gob:Forzalab/bruhbruh.git`.

**B. Fine-grained personal access token**

GitHub > Settings > Developer settings > Fine-grained tokens. Repository access:
only `Forzalab/bruhbruh`. Permissions: **Contents: Read-only**. Nothing else.
Clone with `https://github.com/Forzalab/bruhbruh.git` and give the token as the
password when git asks.

> Never paste a token or private key into chat, Discord, an issue, or a commit.
> If one leaks, revoke it on GitHub right away and make a new one.

First clone and start:

    git clone -b deploy/gob-site <clone-url> ~/gob && cd ~/gob && ./serve.sh

---

## 2. The two commands

On your laptop, inside the bruhbruh repo. It builds, checks, commits, and pushes:

    scripts/publish-site.sh              # builds ui/r8-win
    scripts/publish-site.sh ui/r9-q      # or any other branch
    scripts/publish-site.sh --dry-run    # build and check only, no commit or push

On csci4x:

    cd ~/gob && git pull && ./serve.sh

Both are safe to re-run. If nothing changed, publish says so and makes no commit.

## 3. Updating after a new build

Run `publish-site.sh` on your laptop, then run the csci4x command again.
`serve.sh` stops its old server and starts a fresh one.

## 4. Stopping the server

    kill $(cat ~/gob/.server.pid)

Only kill that PID. Never `pkill python` or `killall`: other students on this
box run servers too.

Log: `~/gob/.server.log`. Other port: `PORT=6678 ./serve.sh`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `port 6677 is in use by something this script did not start` | Someone else has the port, or you started a server by hand. Find yours with `ps -u $USER -o pid,args \| grep http.server`, and kill only that PID. Or use `PORT=6678 ./serve.sh` and tell the team the new URL. |
| Browser says "can't connect" or shows a security error | You typed **https**. The URL is **http**://csci4x.com:6677. Some browsers upgrade to https silently, so type the `http://` yourself. |
| Page loads but is **blank** (white screen) | Open DevTools > Console. 404s on `/assets/...` mean a wrong base path. The build uses absolute `/assets/` paths, so it must be served at the root of the port. Serve `site/` itself, not a parent folder, and don't put it under a sub-path unless you set `base` in `vite.config.js`. |
| `crypto.randomUUID is not a function` or `crypto.subtle` undefined | Plain http is an "insecure context". publish-site.sh refuses such builds; remove those calls in the source. |
| `refusing to serve $HOME` / `contains .ssh` | Safety check. Only `~/gob/site` should ever be served. |
| `git pull` fails | Auth expired (token) or the deploy key was removed. Redo step 1. |
| `push rejected` from publish-site.sh | Someone published first. Re-run the script. |
