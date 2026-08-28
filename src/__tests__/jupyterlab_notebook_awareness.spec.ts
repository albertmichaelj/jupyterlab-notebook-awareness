import { nextGlobalNotebookPath } from '../currentnotebook';

describe('nextGlobalNotebookPath', () => {
  it('reports the notebook the tracker currently has', () => {
    expect(nextGlobalNotebookPath('a.ipynb', ['a.ipynb'], null)).toEqual(
      'a.ipynb'
    );
  });

  it('follows the user from one notebook to another', () => {
    expect(
      nextGlobalNotebookPath('b.ipynb', ['a.ipynb', 'b.ipynb'], 'a.ipynb')
    ).toEqual('b.ipynb');
  });

  // The reason this field exists: clicking into a chat to ask a question makes
  // the chat the focused widget, so `current` in global awareness becomes
  // `chat:...`. The answer to "which notebook am I working in" must survive
  // that, or every question asked from a chat is unanswerable.
  it('keeps the last notebook when focus moves to a chat', () => {
    expect(
      nextGlobalNotebookPath(null, ['a.ipynb', 'b.ipynb'], 'a.ipynb')
    ).toEqual('a.ipynb');
  });

  // Closing the focused notebook while the others were never focused leaves
  // Lumino's FocusTracker with no current widget. Remembering the previous
  // value here would name a notebook that is gone.
  it('does not name a notebook that has been closed', () => {
    expect(nextGlobalNotebookPath(null, ['b.ipynb'], 'a.ipynb')).toBeNull();
  });

  // Same close, but the user had been in b.ipynb earlier, so the tracker hands
  // it back as current and it is a genuine answer.
  it('falls back to another notebook the user had been in', () => {
    expect(nextGlobalNotebookPath('b.ipynb', ['b.ipynb'], 'a.ipynb')).toEqual(
      'b.ipynb'
    );
  });

  it('clears once no notebook is open', () => {
    expect(nextGlobalNotebookPath(null, [], 'a.ipynb')).toBeNull();
  });

  it('reports nothing while notebooks are open but none was ever current', () => {
    expect(nextGlobalNotebookPath(null, ['a.ipynb'], null)).toBeNull();
  });
});
