# Fix scheduled Instagram publishing

## What is wrong
- The scheduler is paused because the AI gateway returned a workspace credit-limit `403`.
- Each of the four daily runs currently renders up to four posts as far as two days ahead, so it can consume far more credits than the intended four posts per day.
- The global pause guard also blocks already-rendered posts from publishing, leaving a growing overdue queue.

## Changes
1. Render only the single post whose scheduled time has arrived, once per scheduled run.
2. Run the engineering check immediately after that render, then publish that same approved post in the same invocation.
3. Keep the database lease and row claims so overlapping calls cannot double-render or double-post.
4. Treat AI credit `402/403` as an AI-generation pause, while still allowing already-rendered, approved posts to publish.
5. Keep bounded retries for temporary rate-limit/server errors without returning to five-minute polling.
6. Align the four daily cron invocations with the four posting slots and clear the stale pause after deploying.
7. Test the deployed function and verify scheduler state and queue results in the backend.

## Credit behavior
At most one new creative and its engineering check are attempted per scheduled invocation. No future two-day batch is rendered.
