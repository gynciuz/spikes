# newsletters: mark subscriptions as read

Every morning a Google Apps Script in the owner's Google account marks unread
newsletter mail as read. It removes the unread flag and nothing else: no
archive, no trash, no other label, no reply, no forward.

## What counts as a newsletter

Whatever `senders.txt` says. A message is in scope when it is unread, is at most
`lookback_days` old, and its sender matches a line in that file. Anything else is
left alone, including mail from the same category tab that is not on the list
(receipts, account notices, job alerts).

## Controls

The run reads `settings.txt` and `senders.txt` from `main` on GitHub at the
start of every run. Edit, commit, done.

| Want to | Edit |
|---------|------|
| Add or drop a subscription | `senders.txt` |
| Pause or resume the run | `settings.txt`, `enabled: yes / no` |
| Look further back or less far | `settings.txt`, `lookback_days` |
| Stop or start the candidate list | `settings.txt`, `candidates` |
| E-mail yourself the run report | `settings.txt`, `report_email: yes` |
| Change the time or remove the schedule | script.google.com, the project's Triggers page; or run `setupTrigger` / `removeTrigger` |
| Change what the run does | `apps-script/Code.gs`, then paste it over the script at script.google.com |

## Setting it up (once)

1. Open script.google.com, New project, name it `newsletters`.
2. Replace the contents of `Code.gs` with `apps-script/Code.gs` from this repo.
3. Run `setupTrigger` once from the editor. Approve the permissions it asks for
   (Gmail, fetching an external URL, sending mail as you). Google shows an
   "unverified app" warning for personal scripts; Advanced, then continue.
4. Run `runNow` once and read the log. It says how many were marked and from whom.

The daily trigger fires at about 07:00 Europe/Vilnius (Google gives a 15-minute
window). The script's execution history on script.google.com is the record of
runs.

## Each run

1. Fetches `settings.txt` and `senders.txt` from GitHub (falls back to the copies
   embedded in the script if GitHub cannot be reached, and says so). Stops when
   `enabled: no`.
2. Searches Gmail for unread mail from those senders inside the lookback.
3. Marks each matching message read. A message that matched the query but not
   the list is skipped and counted.
4. Lists unread senders from the Updates and Promotions tabs that carry an
   unsubscribe link but are not on the list, as candidates. It does not touch
   them.
5. Logs the report; e-mails it to you when `report_email: yes`.

## Why not a Claude routine

Tried first, 2026-11-09. A Claude scheduled task could read the mailbox but not
change it: the Gmail connector's Google grant does not include modifying mail,
in this session and in a fresh one. Both Claude tasks are kept disabled on the
account, renamed RETIRED. The Apps Script runs with the account's own Gmail
permission and has no such gap.

## Known interactions

The trading workspace's macro ingest reads Semafor, Conard and GZERO issues from
the same mailbox. It tracks what it has read by message id, not by the unread
flag, so marking those read does not affect it.
