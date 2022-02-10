
import * as vscode from 'vscode';


export interface IDiagnosticsCreator {
    createDiagnostic(doc: vscode.TextDocument): vscode.Diagnostic[];
}

export interface ICodeActionProvider {
    diagnosticsCreator: IDiagnosticsCreator;
}

