import type { WebviewApi } from "vscode-webview";

import type { Answer, Query } from "@extension/src/ui/backend";
import type { DBRowSelect } from "@extension/src/db/schema";

const isDev = process.env.NODE_ENV === "development";

let vscode: WebviewApi<unknown>;
if (!isDev) {
  vscode = acquireVsCodeApi();
}

function postMessage(message: Query) {
  if (isDev) {
    console.log(message);
  } else {
    vscode.postMessage(message);
  }
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

    window.addEventListener("message", messageHandler);

    postMessage({
      type: "fullData",
      from,
      to,
      workspaces,
    });
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
