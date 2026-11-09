# newsletters: mark subscriptions as read

Every morning a scheduled Claude task opens Gmail and marks unread newsletter
mail as read. It removes the UNREAD label and nothing else: no archive, no
trash, no other label, no reply, no forward.

## What counts as a newsletter

Whatever `senders.txt` says. A message is in scope when it is unread, is at most
14 days old, and its sender matches a line in that file. Anything else is left
alone, including mail from the same category tab that is not on the list
(receipts, account notices, job alerts).

To add a subscription, add its sender to `senders.txt` and commit. To stop
touching one, delete the line.

## Schedule

Daily at 06:40 Europe/Vilnius, as a claude.ai scheduled task named
`newsletters mark read (self-bind)`. It wakes the Claude Code session that set
it up (session_014biwXUQ5bZx4rDKcp8oRis), which holds the Gmail connector and a
clone of this repo. `PROMPT.md` is the copy of the stored prompt, kept here so
changes are versioned; if it changes here, the stored task is updated to match.

Why self-bind: a scheduled task that starts a fresh session cannot carry the
Gmail connector or this repo when created from inside a session (tested
2026-11-09: that session had no Gmail tools and no repo). The fresh-session
task is kept disabled on the account, renamed RETIRED. The alternative is to
create the task in the claude.ai Routines UI with Gmail and gynciuz/spikes
selected; the prompt in `PROMPT.md` works for either.

## Each run

1. Fetches origin and reads `senders.txt` from main (falls back to the copy
   embedded in the prompt).
2. Searches Gmail for unread mail from those senders, newer than 14 days.
3. Removes UNREAD from each matching message.
4. Lists unread senders from the Updates and Promotions tabs that carry an
   unsubscribe link but are not on the list, as candidates. It does not touch
   them.
5. Reports counts in the session. The record of runs is the scheduled task's
   run history on the account; nothing is committed.

## Known interactions

The trading workspace's macro ingest reads Semafor, Conard and GZERO issues from
the same mailbox. It tracks what it has read by message id, not by the unread
flag, so marking those read does not affect it.
