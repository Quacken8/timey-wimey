import * as vscode from "vscode";

export const showInFile = (text: string) => {
  const documentUri = vscode.Uri.parse("virtual:stats.txt");
  const documentContent = text;

  vscode.workspace.registerTextDocumentContentProvider("virtual", {
    provideTextDocumentContent(uri: vscode.Uri): string {
      if (uri.path === documentUri.path) {
        return documentContent;
      }
      return "";
    },
  });

  vscode.workspace.openTextDocument(documentUri).then((doc) => {
    vscode.window.showTextDocument(doc, {
      preview: false,
      viewColumn: vscode.ViewColumn.One,
    });
  });
};
