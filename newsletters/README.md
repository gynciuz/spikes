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

Daily at 06:40 Europe/Vilnius, as a claude.ai routine named
`newsletters mark read`. The routine is stored on the account, not in this repo;
`PROMPT.md` is the copy of its instructions, kept here so changes are versioned.
If the prompt here changes, the stored routine has to be updated to match.

## Setting the routine up

The routine must be created in the claude.ai Routines UI with two things
selected: the **Gmail** connector and the repository **gynciuz/spikes**. A
routine created from inside a Claude Code session cannot carry either, and the
session it fires then has no Gmail tools and no repo (tested 2026-11-09; that
routine is left disabled on the account with the reason in its name).

Steps: new routine, name `newsletters mark read`, schedule daily 06:40
Europe/Vilnius, connector Gmail, repository gynciuz/spikes, push notification
on, prompt pasted from `PROMPT.md` below its rule line. Then run it once by hand
and check `LOG.md` gained a row.

## Each run

1. Reads `senders.txt` from this repo (falls back to the copy embedded in the prompt).
2. Searches Gmail for unread mail from those senders, newer than 14 days.
3. Removes UNREAD from each matching message.
4. Lists unread senders from the Updates and Promotions tabs that carry an
   unsubscribe link but are not on the list, as candidates. It does not touch
   them.
5. Appends one line to `LOG.md` and pushes it to `main`. If the push is
   refused, the line goes into the run's final message instead.

## Known interactions

The trading workspace's macro ingest reads Semafor, Conard and GZERO issues from
the same mailbox. It tracks what it has read by message id, not by the unread
flag, so marking those read does not affect it.
