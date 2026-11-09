# Prompt of the scheduled task `newsletters mark read (self-bind)`

Copy of the stored prompt (trigger trig_01RfJUzBwBiozc98dvGxw9VY, created
2026-11-09, bound to session_014biwXUQ5bZx4rDKcp8oRis). Keep in sync. If the
task is ever recreated in the claude.ai Routines UI, select the Gmail connector
and the repository gynciuz/spikes and paste the block below the rule.

Schedule: daily, 06:40 Europe/Vilnius.

---
Daily newsletters run. Mark Gintaras's newsletter subscriptions as read in
Gmail. Do only what is listed here. Never send, reply, forward, trash, archive
or relabel mail, and never touch a message whose sender is not on the list. No
commits, no pushes.

1. Settings and sender list. The spikes clone is at /home/user/spikes. Run
   `git fetch origin` there. Read `newsletters/settings.txt` and
   `newsletters/senders.txt` from origin/main (`git show origin/main:<path>`);
   if they are not on origin/main, read them from
   origin/claude/newsletter-subscriptions-automation-24fseu. If the clone is
   gone and cannot be re-cloned, use the defaults and the fallback list at the
   end of this prompt and say so. Settings are `key: value` lines; defaults are
   enabled yes, lookback_days 14, candidates yes, push no. A sender line is
   non-empty and does not start with `#`.
   If `enabled` is `no`: mark nothing, say in one line that the run is paused
   by settings.txt, and end the turn.

2. Query. Load the Gmail tools with ToolSearch if they are not loaded
   (search_threads, update_message_labels). If no Gmail tool is available,
   stop, mark nothing, and say exactly that. For each sender line make a
   `from:<line>` term. Query: `is:unread newer_than:<lookback_days>d (<term1>
   OR <term2> OR ...)`; split into several queries if over about 25 terms.

3. Collect. search_threads, view THREAD_VIEW_METADATA_ONLY, pageSize 50, follow
   nextPageToken to the end. For every message whose labelIds contains UNREAD
   and whose sender matches a line (domain, exact address, or display-name
   word), record its message id and sender. Skip anything that does not match,
   even when it appears in the results.

4. Mark read. For each recorded id: update_message_labels with removeLabelIds
   ["UNREAD"], no addLabelIds. Count successes and failures.

5. Candidates, only if `candidates` is `yes`. One search: `is:unread
   newer_than:7d (category:updates OR category:promotions) unsubscribe`, view
   THREAD_VIEW_SUMMARY, pageSize 50. Distinct senders not on the list,
   untouched, at most 10, each with the subject of its newest message.

6. Report, under eight lines: count marked read, by sender name with counts;
   failures; candidates; which list and settings were used. Plain English, no
   preamble, no facts that did not come from the mailbox or the repo. If `push`
   is `yes`, also call PushNotification with the one-line result. Then end the
   turn.

Fallback sender list (copy of newsletters/senders.txt, 2026-11-09):
substack.com, buttondown.email, semafor.com, ian@gzeromedia.com,
ed@edwardconard.com, peter@builtformars.com, alertbox@nngroup.com,
tamas@heydesigner.com, hello@goodui.org, barryseconomics@creator.patreon.com,
newsletter@contentdesign.london, 6nuliai.
