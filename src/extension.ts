import * as vscode from 'vscode';
import * as providers from './providers';

export function activate(context: vscode.ExtensionContext) {
	// Activateするだけのコマンド
	context.subscriptions.push(
		vscode.commands.registerCommand("soturonlinter.activate", () => {

		})
	);

	//TODO: 設定に組み込む
	const mapping = {
		"、": "，",
		"。": "．"
	};

	const delimiterProvider = new providers.DelimiterProvider(mapping);
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('*', delimiterProvider, {
			providedCodeActionKinds: providers.DelimiterProvider.providedCodeActionKinds
		}));

	const soturonDiagnostics = vscode.languages.createDiagnosticCollection("Soturon-Linter");
	context.subscriptions.push(soturonDiagnostics);


	function refreshDiagnostics(doc: vscode.TextDocument, soturonDiagnostics: vscode.DiagnosticCollection): void {
		const diagnostics: vscode.Diagnostic[] = delimiterProvider.diagnosticsCreator.createDiagnostic(doc);

		soturonDiagnostics.set(doc.uri, diagnostics);
	}

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor) {
				refreshDiagnostics(editor.document, soturonDiagnostics);
			}
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e.document, soturonDiagnostics))
	);

	context.subscriptions.push(
		vscode.workspace.onDidCloseTextDocument(doc => soturonDiagnostics.delete(doc.uri))
	);
}
