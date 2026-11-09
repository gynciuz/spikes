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
`newsletters mark read`. The task is stored on the account, not in this repo;
`PROMPT.md` is the copy of its instructions, kept here so changes are versioned.
If the prompt here changes, the stored task has to be updated to match.

## Each run

1. Clones this repo and reads `senders.txt`.
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
