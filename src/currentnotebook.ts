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
 * The value means: **the most recently focused notebook that is still open.**
 *
 * Stickiness is what makes the field useful -- `INotebookTracker` keeps its
 * current widget when focus moves to a chat, so the answer survives the user
 * going to ask a question. But it must not outlive the notebook it names.
 * Lumino's `FocusTracker`, on disposal of the current widget, falls back to the
 * remaining widget with the highest focus number *among those that have ever
 * been focused*; a notebook that was opened but never clicked has focus number
 * -1 and is skipped. So closing the focused notebook while every other open
 * notebook is untouched leaves `current` null -- and remembering the previous
 * value there would publish the path of a notebook that no longer exists.
 *
 * Hence the guard: keep the previous value only while it is still open, and
 * otherwise report nothing. "Nothing" is the honest answer when the user has
 * not been in any of the notebooks that remain, and a consumer that says "I
 * cannot tell which notebook you mean" is better than one confidently
 * answering about a file the user never opened.
 *
 * @param current - path of the tracker's current notebook, or null
 * @param openPaths - paths of every notebook currently open
 * @param previous - the value published last time
 */
export function nextGlobalNotebookPath(
  current: string | null,
  openPaths: readonly string[],
  previous: string | null
): string | null {
  if (current) {
    return current;
  }
  if (previous && openPaths.includes(previous)) {
    return previous;
  }
  return null;
}
