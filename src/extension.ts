import * as vscode from 'vscode';
import * as providers from './providers';

export function activate(context: vscode.ExtensionContext) {
	/* 拡張機能の名前 */
	const extensionName = "soturon-linter";

	const config = vscode.workspace.getConfiguration(extensionName);
	
	const defaultTargetLanguages = ["latex"];
	const targetLanguages: string[] = config.get("validLanguages") || defaultTargetLanguages;

	const defaultMapping = {
		"、": "，",
		"。": "．"
	};
	const mapping: providers.DelimiterMappingDictionary = config.get("deprecatedDelimitersMap") || defaultMapping;

	const delimiterProvider = new providers.DelimiterProvider(mapping);


	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(targetLanguages, delimiterProvider, {
			providedCodeActionKinds: providers.DelimiterProvider.providedCodeActionKinds
		}));

	const soturonDiagnostics = vscode.languages.createDiagnosticCollection("Soturon-Linter");
	context.subscriptions.push(soturonDiagnostics);


	function refreshDiagnostics(doc: vscode.TextDocument, soturonDiagnostics: vscode.DiagnosticCollection): void {
		if (targetLanguages.includes(doc.languageId)){
			const diagnostics: vscode.Diagnostic[] = delimiterProvider.diagnosticsCreator.createDiagnostic(doc);
			soturonDiagnostics.set(doc.uri, diagnostics);
		}
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

	
	// Activateコマンド
	context.subscriptions.push(
		vscode.commands.registerCommand(`${extensionName}.activate`, () => {
			const editor = vscode.window.activeTextEditor;
			if(editor) {
				refreshDiagnostics(editor.document, soturonDiagnostics);
			}
		})
	);
}
