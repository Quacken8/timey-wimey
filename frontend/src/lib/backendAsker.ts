import type { Answer, Query } from "@extension/src/ui/backend";
import type { DBRowSelect } from "@extension/src/db/schema";

let vscode = acquireVsCodeApi();

function postMessage(message: Query) {
  vscode.postMessage(message);
}

export function getData(
  from: Date,
  to: Date,
  workspaces: string[]
): Promise<DBRowSelect[]> {
  return new Promise((resolve) => {
    function messageHandler(event: { data: Answer }) {
      if (event.data.type === "fullData") {
        window.removeEventListener("message", messageHandler);
        resolve(event.data.content);
      }
    }

    const message: Query = {
      type: "fullData",
      from,
      to,
      workspaces,
    };
    window.addEventListener("message", messageHandler);
    postMessage(message);
  });
}

export function getWorkspaces(): Promise<string[]> {
  return new Promise((resolve) => {
    function messageHandler(event: { data: Answer }) {
      if (event.data.type === "workspaces") {
        window.removeEventListener("message", messageHandler);
        resolve(event.data.content);
      }
    }

    window.addEventListener("message", messageHandler);
    vscode.postMessage({ type: "workspaces" });
  });
}
