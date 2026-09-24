#!/usr/bin/env bash
# publish-site.sh [--dry-run] [source-ref]
# Build the Gates of Babylon site from <source-ref> (default ui/r8-win) and
# commit the built files to the deploy/gob-site branch, then push.
# Runs on a dev machine (needs git + node/npm). Safe to re-run.
set -euo pipefail

DEPLOY_BRANCH="${DEPLOY_BRANCH:-deploy/gob-site}"
REMOTE="${REMOTE:-origin}"
DRY_RUN=0
REF=""

die()  { echo "ERROR: $*" >&2; exit 1; }
info() { echo "==> $*"; }

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help) sed -n '2,5p' "$0"; exit 0 ;;
    -*) die "unknown option: $arg" ;;
    *) [ -z "$REF" ] || die "only one source-ref allowed"; REF="$arg" ;;
  esac
done
REF="${REF:-ui/r8-win}"

command -v git >/dev/null || die "git not found"
command -v npm >/dev/null || die "npm not found (install Node.js on this machine; the server does not need it)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
[ -f "$SCRIPT_DIR/serve.sh" ] && [ -f "$SCRIPT_DIR/site-README.md" ] || die "serve.sh / site-README.md missing next to $0"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || die "run this from inside the bruhbruh git repo"
cd "$REPO_ROOT"

TMP="$(mktemp -d "${TMPDIR:-/tmp}/gob-publish.XXXXXX")"
BUILD_WT="$TMP/build"
DEPLOY_WT="$TMP/deploy"
cleanup() {
  git -C "$REPO_ROOT" worktree remove --force "$BUILD_WT"  >/dev/null 2>&1 || true
  git -C "$REPO_ROOT" worktree remove --force "$DEPLOY_WT" >/dev/null 2>&1 || true
  git -C "$REPO_ROOT" worktree prune >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

info "Fetching from $REMOTE"
git fetch --quiet "$REMOTE" || die "git fetch $REMOTE failed (network/auth?)"

# Prefer the remote copy of the ref so we build what the team pushed.
if git rev-parse --verify --quiet "$REMOTE/$REF^{commit}" >/dev/null; then
  SRC="$REMOTE/$REF"
elif git rev-parse --verify --quiet "$REF^{commit}" >/dev/null; then
  SRC="$REF"
else
  die "ref '$REF' not found locally or on $REMOTE"
fi
SHA="$(git rev-parse --short "$SRC^{commit}")"
info "Building $SRC ($SHA)"

git worktree add --quiet --detach "$BUILD_WT" "$SRC" || die "could not create build worktree"
(
  cd "$BUILD_WT"
  if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi
  npm run build
) || die "npm install/build failed (see output above)"

DIST="$BUILD_WT/dist"
[ -f "$DIST/index.html" ] || die "build produced no dist/index.html"
grep -q '<div id="root">' "$DIST/index.html" || die "dist/index.html has no <div id=\"root\"> marker"

info "Checking for APIs that break on plain http (insecure context)"
if grep -rlE 'randomUUID|crypto\.subtle' --include='*.js' "$DIST" ; then
  die "built JS uses crypto.randomUUID or crypto.subtle; these are undefined on http://csci4x.com. Replace them in the source first."
fi

info "Preparing $DEPLOY_BRANCH worktree"
if git rev-parse --verify --quiet "$REMOTE/$DEPLOY_BRANCH^{commit}" >/dev/null; then
  git worktree add --quiet --detach "$DEPLOY_WT" "$REMOTE/$DEPLOY_BRANCH" || die "could not check out $DEPLOY_BRANCH"
else
  die "$REMOTE/$DEPLOY_BRANCH does not exist; create it once as an orphan branch first"
fi

# Branch layout: site/ (served), serve.sh, README.md. Rebuild it from scratch.
find "$DEPLOY_WT" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
mkdir "$DEPLOY_WT/site"
cp -R "$DIST"/. "$DEPLOY_WT/site"/
cp "$SCRIPT_DIR/serve.sh" "$DEPLOY_WT/serve.sh"
cp "$SCRIPT_DIR/site-README.md" "$DEPLOY_WT/README.md"
git -C "$DEPLOY_WT" add -A
git -C "$DEPLOY_WT" update-index --chmod=+x serve.sh

if git -C "$DEPLOY_WT" diff --cached --quiet; then
  info "Build is identical to $REMOTE/$DEPLOY_BRANCH. Nothing to publish."
  exit 0
fi
git -C "$DEPLOY_WT" diff --cached --stat

MSG="site: build of $REF $SHA"
if [ "$DRY_RUN" = 1 ]; then
  info "DRY RUN: would commit \"$MSG\" and push to $REMOTE/$DEPLOY_BRANCH"
  exit 0
fi

git -C "$DEPLOY_WT" commit --quiet -m "$MSG" || die "commit failed"
git -C "$DEPLOY_WT" push "$REMOTE" "HEAD:refs/heads/$DEPLOY_BRANCH" \
  || die "push rejected. Someone else published first: just re-run this script."
info "Published $MSG. Now on csci4x run: cd ~/gob && git pull && ./serve.sh"
