#!/usr/bin/env bash
# serve.sh: run ON csci4x from the root of a deploy/gob-site clone.
# Serves ONLY ./site on $PORT (default 6677). Safe to re-run: it restarts
# the server it started last time (tracked in .server.pid) and nothing else.
#   first time:  git clone -b deploy/gob-site <url> ~/gob && cd ~/gob && ./serve.sh
#   update:      cd ~/gob && git pull && ./serve.sh
set -euo pipefail

PORT="${PORT:-6677}"
PUBLIC_HOST="${PUBLIC_HOST:-csci4x.com}"
ROOT="$(cd "$(dirname "$0")" && pwd -P)"
SITE="$ROOT/site"
PID_FILE="$ROOT/.server.pid"
LOG_FILE="$ROOT/.server.log"
SESSION="gob-site-$PORT"

die()  { echo "ERROR: $*" >&2; exit 1; }
info() { echo "==> $*"; }

command -v python3 >/dev/null || die "python3 not found"
command -v curl >/dev/null    || die "curl not found"
case "$PORT" in ''|*[!0-9]*) die "PORT must be a number, got '$PORT'";; esac

# --- safety: only ever serve ./site, never $HOME or anything with .ssh ---
[ -d "$SITE" ] || die "$SITE is missing. Are you in a deploy/gob-site clone? Try: git pull"
SITE="$(cd "$SITE" && pwd -P)"
REAL_HOME="$(cd "$HOME" && pwd -P)"
[ "$SITE" != "$REAL_HOME" ] || die "refusing to serve \$HOME ($REAL_HOME)"
[ "$SITE" != "/" ]          || die "refusing to serve /"
[ ! -e "$SITE/.ssh" ]       || die "refusing to serve $SITE: it contains .ssh"
[ -f "$SITE/index.html" ]   || die "$SITE/index.html missing; the build was not published correctly"

# keep pid/log out of git status so 'git pull' stays clean
if [ -d "$ROOT/.git" ] && ! grep -qx '.server.*' "$ROOT/.git/info/exclude" 2>/dev/null; then
  echo '.server.*' >> "$ROOT/.git/info/exclude"
fi

# --- stop the server WE started last time (by PID file only) ---
if [ -f "$PID_FILE" ]; then
  OLD_PID="$(cat "$PID_FILE")"
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null \
     && ps -o args= -p "$OLD_PID" | grep -q 'http.server'; then
    info "Stopping previous server (PID $OLD_PID)"
    kill "$OLD_PID"
    for _ in 1 2 3 4 5 6 7 8 9 10; do kill -0 "$OLD_PID" 2>/dev/null || break; sleep 0.5; done
    if kill -0 "$OLD_PID" 2>/dev/null; then die "PID $OLD_PID did not stop; stop it manually"; fi
  fi
  rm -f "$PID_FILE"
fi
if command -v tmux >/dev/null && tmux has-session -t "=$SESSION" 2>/dev/null; then
  tmux kill-session -t "=$SESSION"
fi

# --- is the port free? ---
if curl -s -o /dev/null --max-time 2 "http://localhost:$PORT/"; then
  die "port $PORT is in use by something this script did not start. Try another: PORT=6678 ./serve.sh"
fi

# --- start ---
info "Starting python3 http.server on port $PORT (serving $SITE only)"
: > "$LOG_FILE"
if command -v tmux >/dev/null; then
  tmux new-session -d -s "$SESSION" \
    "cd '$SITE' && echo \$\$ > '$PID_FILE' && exec python3 -m http.server '$PORT' --bind 0.0.0.0 >>'$LOG_FILE' 2>&1"
  for _ in 1 2 3 4 5 6 7 8 9 10; do [ -s "$PID_FILE" ] && break; sleep 0.3; done
else
  ( cd "$SITE" && nohup python3 -m http.server "$PORT" --bind 0.0.0.0 >>"$LOG_FILE" 2>&1 & echo $! > "$PID_FILE" )
fi
[ -s "$PID_FILE" ] || die "server did not start; see $LOG_FILE"

# --- verify ---
ok=0
for _ in $(seq 1 20); do
  if curl -fsS --max-time 2 "http://localhost:$PORT/" 2>/dev/null | grep -q '<div id="root">'; then ok=1; break; fi
  sleep 0.5
done
if [ "$ok" != 1 ]; then
  echo "--- last lines of $LOG_FILE ---" >&2; tail -n 20 "$LOG_FILE" >&2 || true
  die "server is not answering on port $PORT"
fi

info "Server running, PID $(cat "$PID_FILE"), log $LOG_FILE"
echo
echo "    Site is live:  http://$PUBLIC_HOST:$PORT     (http, NOT https)"
echo "    Stop it:       kill \$(cat $PID_FILE)"
