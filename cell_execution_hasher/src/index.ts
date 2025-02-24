import {
    // JupyterFrontEnd,
    JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
    INotebookTracker,
    // Notebook,
    // NotebookPanel,
} from '@jupyterlab/notebook';

import * as crypto from 'crypto';

// import {
//     // IOutputArea,
//     OutputArea
//   } from '@jupyterlab/outputarea';

function hashOutput(outputString: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(outputString);
    return hash.digest('hex'); // Return the hashed value in hexadecimal format
}

/**
 * Plugin to log cell outputs to console
*/
const plugin: JupyterFrontEndPlugin<void> = {
    id: 'CellOutputExample',
    autoStart: true,
    requires: [INotebookTracker],
    activate: function (app, notebookTracker) {
        notebookTracker.widgetAdded.connect((_tracker: any, panel: { content: any; }) => {
            let notebook = panel.content;
            const notebookModel = notebook.model;
            notebookModel.cells.changed.connect((_: any, change: { type: string; newValues: any; }) => {
                if (change.type != 'add') {
                    return;
                }
                for (const cellModel of change.newValues) {
                    // ensure we have CodeCellModel
                    if (cellModel.type != 'code') {
                        return;
                    }
                    // IOutputAreaModel
                    let outputs = cellModel.outputs;
                    if (!outputs) {
                        continue;
                    }
                    outputs.changed.connect(() => {
                        console.log('Outputs of the cell', cellModel.id, 'in', notebook.title.label, 'changed:');
                        console.log(
                            '\tThere are now', outputs.length, 'outputs:'
                        );
                        for (let i = 0; i < outputs.length; i++) {
                            // IOutputModelß
                            const outputModel = outputs.get(i);
                            console.log('\t\t', outputModel.data);
                            // console.log('\t\t', hashOutput(outputModel.data));
                            // also has `outputModel.executionCount` and `outputModel.metadata`
                        }
                    });
                }
            });
        })},
    // id: 'cell-output-logger:plugin', https://github.com/Willgunter/writing-observer-research.git
    // description: 'Logs cell outputs to console',
    // autoStart: true,
    // requires: [INotebookTracker],
    // activate: (
    //   app: JupyterFrontEnd,
    //   notebookTracker: INotebookTracker
    // ) => {
    //   console.log('Cell Output Logger Extension is activated!');

    //   // Function to handle new output
    // //   const handleOutput = (outputArea: OutputArea, output: any) => {
    // //     console.log('Cell Output:', output);
    // //   };

    //   // Watch for notebook changes
    //   notebookTracker.widgetAdded.connect((sender: INotebookTracker, panel: NotebookPanel) => {
    //     // Watch for cell outputs
    //     panel.content.activeCellChanged.connect((_sender: Notebook, cell: any) => {
    //         console.log("hasdfi")
    //       if (cell) {
    //         const outputArea: OutputArea = cell.outputArea;

    //         // Subscribe to future outputs
    //         outputArea.model.changed.connect((sender: any) => {
    //           const outputs: any[] = outputArea.model.toJSON();
    //           console.log('Cell Execution Output:', outputs);
    //         });
    //       }
    //     });
    //   });
    // }
};

export default plugin;