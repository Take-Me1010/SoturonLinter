
import * as vscode from 'vscode';
import { IDiagnosticsCreator, ICodeActionProvider } from './iprovider';

export interface DelimiterMappingDictionary {
    [deprecatedDelimiter: string]: string
}

function getKeys(dict: DelimiterMappingDictionary): string[] {
    return Object.keys(dict);
}

/* 区切り文字による問題であることを示すコード． */
export const DUPLICATED_DELIMITER_CODE = "soturon_linter_duplicated_delimiters";

export class DelimiterProvider implements vscode.CodeActionProvider, ICodeActionProvider {

    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];
    diagnosticsCreator: DelimiterDiagnosticsCreator;

    constructor(private deprecatedDelimitersMapping: DelimiterMappingDictionary) {
        this.diagnosticsCreator = new DelimiterDiagnosticsCreator(deprecatedDelimitersMapping);
    }

    public provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.CodeAction[] {
        // for each diagnostic entry that has the matching `code`, create a code action command
        return context.diagnostics
            .filter(diagnostic => diagnostic.code === DUPLICATED_DELIMITER_CODE)
            .map(diagnostic => this.createCodeAction(document, diagnostic));
    }

    public createCodeAction(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        const range = diagnostic.range;
        const duplicatedDelimiter = document.getText(range);
        const preferredDelimiter = this.deprecatedDelimitersMapping[duplicatedDelimiter];
        
        const fixAction = new vscode.CodeAction(`Convert to ${preferredDelimiter}`, vscode.CodeActionKind.QuickFix);
        fixAction.edit = new vscode.WorkspaceEdit();

        fixAction.edit.replace(document.uri, range, preferredDelimiter);
        fixAction.isPreferred = true;

        return fixAction;
    }

}


class DelimiterDiagnosticsCreator implements IDiagnosticsCreator {
    constructor(private deprecatedDelimitersMapping: DelimiterMappingDictionary) {

    }

    createDiagnostic(doc: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];

        const text = doc.getText();

        const duplicatedDelimiters = getKeys(this.deprecatedDelimitersMapping);
        const reg = new RegExp(duplicatedDelimiters.join('|'), 'g');

        let match = reg.exec(text);

        while (match) {
            const startPos = doc.positionAt(match.index);
            const endPos = doc.positionAt(match.index + match[0].length);

            const range = new vscode.Range(startPos, endPos);
            const message = `${match[0]}は非推奨に設定されています。`;

            const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning);
            diagnostic.code = DUPLICATED_DELIMITER_CODE;
            diagnostics.push(diagnostic);

            match = reg.exec(text);
        }

        return diagnostics;
    }
}
