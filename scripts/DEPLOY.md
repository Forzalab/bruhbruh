# Deploying Gates of Babylon to csci4x

Live URL: **http://csci4x.com:6677** (plain http, NOT https)

One script, run on csci4x. It pulls `main`, builds, and serves `dist/`.

    ~/gates_of_babylon/scripts/deploy.sh

Needs: git, node/npm, python3, curl. Safe to re-run: it restarts only its own server.

## First time

    git clone <repo-url> ~/gates_of_babylon

The repo is private. Use a read-only deploy key or a fine-grained token
(Contents: Read-only). Never paste a token or key into chat or a commit.

No npm on csci4x? Install Node without root: https://github.com/nvm-sh/nvm

## Stop

    kill $(cat ~/gates_of_babylon/.server.pid)

Only that PID. Never `pkill python`: other students run servers on this box.
Log: `.server.log`. Other port: `PORT=6678 scripts/deploy.sh`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `could not switch to main` | You have local edits. `git status`, then commit or `git restore .` |
| `port 6677 is in use` | Someone else has it. `PORT=6678 scripts/deploy.sh` |
| Can't connect | You typed https. Type `http://` yourself. |
| Blank page | DevTools > Console. Serve `dist/` at the port root only. |
