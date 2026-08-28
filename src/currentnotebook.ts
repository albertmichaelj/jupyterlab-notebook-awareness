/**
 * Tracking which notebook the user is currently working in.
 *
 * Kept out of `index.ts` so the rule can be unit-tested without booting a
 * JupyterLab shell: nothing here imports from `@jupyterlab/*`.
 */

/**
 * The field published to GLOBAL awareness naming the user's current notebook.
 *
 * WHY THIS EXISTS. `@jupyter/collaboration` already publishes `current`, the
 * focused main-area widget, and that is correct for presence -- the RTC panel
 * shows what each user is looking at, chats and terminals included. It is the
 * wrong signal for "which notebook is this user working in", because the
 * moment the user clicks into a chat panel to ask a question `current` becomes
 * `chat:...` and the notebook is gone. A consumer is then left with a list of
 * open documents and no way to tell which one was meant; the common fallback,
 * "use it if exactly one notebook is open", fails for anyone working across
 * two files.
 *
 * The per-notebook `notebookPath` field this extension already sets cannot
 * answer it either: it is written into each notebook's own awareness, where
 * the path is by definition already known.
 *
 * So this names the LAST notebook the user focused, and is deliberately
 * STICKY -- it is not cleared when focus moves to a chat, a terminal, or the
 * file browser. It clears only when no notebook is open at all.
 */
export const GLOBAL_NOTEBOOK_PATH_FIELD = 'notebookPath';

/**
 * The next value of the global notebook path.
 *
 * Pure, so the stickiness rule is testable without a JupyterLab shell.
 *
 * @param current - path of the tracker's current notebook, or null
 * @param notebookCount - how many notebooks are open
 * @param previous - the value published last time
 */
export function nextGlobalNotebookPath(
  current: string | null,
  notebookCount: number,
  previous: string | null
): string | null {
  if (current) {
    return current;
  }
  if (notebookCount === 0) {
    // Nothing is open, so there is no current notebook to remember. Clearing
    // matters: a stale path would otherwise outlive the notebook it names.
    return null;
  }
  // A notebook is open but the tracker has no current widget. Keep the last
  // one rather than reporting "none" -- this is the case that makes the value
  // useful, because it is what happens while the user is typing in a chat.
  return previous;
}
