import type {
  Answer,
  Query,
  SummaryQuery,
  TopFilesQuery,
  WorkspacesQuery,
} from "@extension/src/ui/backend";
import type { SummaryData } from "@extension/src/ui/parseToString";

let vscode = acquireVsCodeApi();

let postbox: Record<number, (value: Answer["content"]) => void> = {};

function postMan(event: { data: Answer }) {
  if (event.data.address in postbox) {
    postbox[event.data.address](event.data.content);
    delete postbox[event.data.address];
  }
}
window.addEventListener("message", postMan);

function postMessage(
  message: Omit<Query, "address">,
  resolve: (value: Answer["content"]) => void,
  reject: (reason: any) => void
) {
  const address = Math.random();
  const query = { ...message, address };
  postbox[address] = resolve;

  const timeout = 5000;
  setTimeout(() => {
    delete postbox[address];
    reject(`Request for ${message.type} timed out`);
  }, timeout);

  vscode.postMessage(query);
}

export function getTopFiles(
  from: Date,
  to: Date,
  workspaces: string[],
  number: number
): Promise<Record<string, number>> {
  return new Promise((resolve, reject) => {
    const message: Omit<TopFilesQuery, "address"> = {
      type: "topFiles",
      from,
      to,
      workspaces,
      number,
    };
    postMessage(message, resolve as any, reject);
  });
}

export function getSummary(
  from: Date,
  to: Date,
  workspaces: string[]
): Promise<SummaryData> {
  return new Promise((resolve, reject) => {
    const message: Omit<SummaryQuery, "address"> = {
      type: "summary",
      from,
      to,
      workspaces,
    };
    postMessage(message, resolve as any, reject);
  });
}

export function getWorkspaces(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const message: Omit<WorkspacesQuery, "address"> = { type: "workspaces" };
    postMessage(message, resolve as any, reject);
  });
}
