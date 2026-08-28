import { nextGlobalNotebookPath } from '../currentnotebook';

describe('nextGlobalNotebookPath', () => {
  it('reports the notebook the tracker currently has', () => {
    expect(nextGlobalNotebookPath('work/Analysis.ipynb', 1, null)).toEqual(
      'work/Analysis.ipynb'
    );
  });

  it('follows the user from one notebook to another', () => {
    expect(nextGlobalNotebookPath('b.ipynb', 2, 'a.ipynb')).toEqual('b.ipynb');
  });

  // The reason this field exists: clicking into a chat panel to ask a question
  // makes the chat the focused widget, so `current` in global awareness becomes
  // `chat:...`. The answer to "which notebook am I working in" must survive
  // that, or every question asked from a chat is unanswerable.
  it('keeps the last notebook when focus moves off it', () => {
    expect(nextGlobalNotebookPath(null, 2, 'a.ipynb')).toEqual('a.ipynb');
  });

  it('clears once no notebook is open', () => {
    expect(nextGlobalNotebookPath(null, 0, 'a.ipynb')).toBeNull();
  });

  it('stays null when nothing has ever been open', () => {
    expect(nextGlobalNotebookPath(null, 0, null)).toBeNull();
  });

  it('reports nothing while notebooks are open but none was ever current', () => {
    expect(nextGlobalNotebookPath(null, 1, null)).toBeNull();
  });
});
