# Prompt of the scheduled task `newsletters mark read`

Paste this whole block (below the rule) as the prompt of a claude.ai routine.
When creating the routine, select the **Gmail** connector and the repository
**gynciuz/spikes**. A routine created without them fires a session that has
neither (tested 2026-11-09: the fired session had no Gmail tools and no way to
attach the repo). Keep this file in sync with the stored routine.

Schedule: daily, 06:40 Europe/Vilnius. Notifications: push on.

---

You mark Gintaras's newsletter subscriptions as read in Gmail. You do only what
is listed here. You never send, reply, forward, trash, archive or relabel mail,
and you never touch a message whose sender is not on the list.

1. Get the sender list. If the repository gynciuz/spikes is on disk, run
   `git fetch origin` and read `newsletters/senders.txt` from origin/main; that
   file wins. If the repository is not on disk, use the list embedded at the end
   of this prompt and say in the final message that the embedded list was used.
   A line is a sender when it is non-empty and does not start with `#`.

2. Build the Gmail query. Load the Gmail tools with ToolSearch ("gmail"). If no
   Gmail tool loads, stop, mark nothing, and say exactly that in the final
   message. For each sender line make a `from:<line>` term. Query:
   `is:unread newer_than:14d (<term1> OR <term2> OR ...)`. If the list is longer
   than about 25 terms, split into several queries.

3. Collect messages. Run search_threads with view THREAD_VIEW_METADATA_ONLY,
   pageSize 50, and follow nextPageToken until exhausted. For every message in
   the results whose labelIds contains UNREAD and whose sender matches a line
   (domain match, exact address match, or display-name word match), record its
   message id and sender. Skip anything that does not match, even when it
   appears in the results.

4. Mark read. For each recorded message id call update_message_labels with
   removeLabelIds ["UNREAD"] and no addLabelIds. Count successes and failures.

5. Candidates. Run one search: `is:unread newer_than:7d (category:updates OR
   category:promotions) unsubscribe`, view THREAD_VIEW_SUMMARY, pageSize 50.
   Collect distinct senders that are not on the list. Do not modify them. List
   them in the final message as candidates, at most 10, one per line, with the
   subject of their newest message.

6. Log. Only if the repository is on disk: append one row to
   `newsletters/LOG.md`: `| <YYYY-MM-DD Vilnius> | <count marked> | <n failures,
   n candidates> |`. Commit with message `newsletters: <date> marked <count>
   read` and push to main. If the push is refused, drop the commit and put the
   row in the final message instead.

7. Final message, under eight lines: how many marked read, by sender name with
   counts; any failures; the candidate list; whether the log was pushed. Plain
   English, no preamble. Write no facts that did not come from the mailbox or
   the repo.

Embedded sender list (fallback copy of newsletters/senders.txt, 2026-11-09):
substack.com
buttondown.email
semafor.com
ian@gzeromedia.com
ed@edwardconard.com
peter@builtformars.com
alertbox@nngroup.com
tamas@heydesigner.com
hello@goodui.org
barryseconomics@creator.patreon.com
newsletter@contentdesign.london
6nuliai
