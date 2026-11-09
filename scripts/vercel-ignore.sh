#!/bin/sh
# Vercel's "ignore build" step (vercel.ts, ignoreCommand): exit 0 skips the
# build, anything else builds, including when the last deployed commit can't
# be compared. In a file of its own: Vercel refuses an ignoreCommand longer
# than 256 characters (on 9 Nov 2026 a longer one failed the deployment).

# Production is never skipped: a live publish reaches it only through the
# rebuild its deploy hook asks for, a build of a commit that hasn't changed
[ "$VERCEL_ENV" = "production" ] && exit 1

# A review round's branch is built whenever it is pushed (once, as a rule)
case "$VERCEL_GIT_COMMIT_REF" in review/*) exit 1 ;; esac

# Staging renders every request from Sanity, so content needs no build there:
# skip commits that change nothing it is built from
git diff --quiet "${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}" HEAD -- . ":(exclude)studio" ":(exclude).github" ":(exclude).claude" ":(exclude)CLAUDE.md" ":(exclude)README.md"
