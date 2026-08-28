import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { Cell } from '@jupyterlab/cells';
import { IGlobalAwareness } from '@jupyter/collaborative-drive';
import type { Awareness } from 'y-protocols/awareness';
import {
  GLOBAL_NOTEBOOK_PATH_FIELD,
  nextGlobalNotebookPath
} from './currentnotebook';

/**
 * Command IDs for the extension.
 */
namespace CommandIDs {
  export const getCurrentNotebook = 'notebook-awareness:get-current-notebook';
  export const getCurrentCell = 'notebook-awareness:get-current-cell';
}

/**
 * Updates the awareness state for a notebook with current cell and path info
 */
function updateAwarenessState(
  notebook: NotebookPanel | null,
  activeCell?: Cell | null
): void {
  if (!notebook?.model?.sharedModel?.awareness) {
    return;
  }

  const awareness = notebook.model.sharedModel.awareness;
  const notebookPath = notebook.context?.path || null;
  const cellId =
    (activeCell || notebook.content?.activeCell)?.model?.sharedModel?.getId() ||
    null;

  // Set both fields atomically
  awareness.setLocalStateField('notebookPath', notebookPath);
  awareness.setLocalStateField('activeCellId', cellId);
}

/**
 * Initialization data for the jupyterlab-notebook-awareness extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-notebook-awareness:plugin',
  description:
    "A JupyterLab extension that tracks a user's current notebook and cell.",
  requires: [INotebookTracker],
  optional: [IGlobalAwareness],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    globalAwareness: Awareness | null
  ) => {
    // Publish the current notebook to global awareness, if collaboration is
    // installed. Optional on purpose: without it the extension behaves exactly
    // as before rather than failing to activate.
    let publishedPath: string | null = null;
    const publishCurrentNotebook = (): void => {
      if (!globalAwareness) {
        return;
      }
      let notebookCount = 0;
      notebookTracker.forEach(() => {
        notebookCount++;
      });
      const next = nextGlobalNotebookPath(
        notebookTracker.currentWidget?.context?.path || null,
        notebookCount,
        publishedPath
      );
      if (next !== publishedPath) {
        publishedPath = next;
        globalAwareness.setLocalStateField(GLOBAL_NOTEBOOK_PATH_FIELD, next);
      }
    };
    // Add commands for fetching current notebook and cell
    app.commands.addCommand(CommandIDs.getCurrentNotebook, {
      label: 'Get Current Notebook',
      execute: () => {
        const currentNotebook = notebookTracker.currentWidget;
        if (!currentNotebook) {
          return null;
        }

        return {
          path: currentNotebook.context?.path || null,
          title: currentNotebook.title.label,
          id: currentNotebook.id,
          model: {
            readOnly: currentNotebook.model?.readOnly,
            dirty: currentNotebook.model?.dirty
          },
          context: {
            path: currentNotebook.context?.path,
            contentsModel: currentNotebook.context?.contentsModel
          }
        };
      },
      describedBy: {
        args: {
          type: 'object',
          properties: {}
        }
      }
    });

    app.commands.addCommand(CommandIDs.getCurrentCell, {
      label: 'Get Current Cell',
      execute: () => {
        const currentNotebook = notebookTracker.currentWidget;
        if (!currentNotebook?.content?.activeCell) {
          return null;
        }

        const activeCell = currentNotebook.content.activeCell;
        const activeCellIndex = currentNotebook.content.activeCellIndex;

        return {
          id: activeCell.model?.sharedModel?.getId() || null,
          index: activeCellIndex,
          type: activeCell.model?.type,
          source: activeCell.model?.sharedModel?.getSource(),
          notebook: {
            path: currentNotebook.context?.path || null,
            title: currentNotebook.title.label
          }
        };
      },
      describedBy: {
        args: {
          type: 'object',
          properties: {}
        }
      }
    });

    // Handle when the active cell changes within a notebook
    notebookTracker.activeCellChanged.connect(
      (tracker: INotebookTracker, cell: Cell | null) => {
        updateAwarenessState(tracker.currentWidget, cell);
        publishCurrentNotebook();
      }
    );

    // Handle when the current notebook changes (switching between notebooks)
    notebookTracker.currentChanged.connect(
      (tracker: INotebookTracker, notebook: NotebookPanel | null) => {
        publishCurrentNotebook();
        if (notebook) {
          // Set initial state when notebook opens
          updateAwarenessState(notebook);

          // Also listen for when the notebook content is ready
          if (notebook.content) {
            // Set state again once content is fully loaded
            setTimeout(() => {
              updateAwarenessState(notebook);
            }, 100);
          }
        }
      }
    );

    // Handle when a notebook widget is added (covers page refresh case)
    notebookTracker.widgetAdded.connect(
      (tracker: INotebookTracker, notebook: NotebookPanel) => {
        // Wait for the notebook to be fully ready
        notebook.revealed.then(() => {
          updateAwarenessState(notebook);
        });

        // Also set state when the context is ready
        notebook.context.ready.then(() => {
          updateAwarenessState(notebook);
          publishCurrentNotebook();
        });
      }
    );

    // Set initial state for any already open notebooks
    if (notebookTracker.currentWidget) {
      updateAwarenessState(notebookTracker.currentWidget);
    }
    publishCurrentNotebook();

    // A notebook closing can change which notebook is current, and the tracker
    // reports that through currentChanged -- but the last notebook closing
    // leaves nothing to report, so re-check once the app has settled too.
    void app.restored.then(() => {
      publishCurrentNotebook();
    });
  }
};

export default plugin;

export { GLOBAL_NOTEBOOK_PATH_FIELD, nextGlobalNotebookPath };
