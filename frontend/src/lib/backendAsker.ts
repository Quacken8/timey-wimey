import type { CheckerOutput } from "@extension/src/types";
import type {
  Answer,
  HistogramQuery,
  Query,
  SummaryQuery,
  TopFilesQuery,
  WorkspacesQuery,
  FileSelectQuery,
  FolderSelectQuery,
  InsertEntryQuery,
  DeleteQuery,
  LinesAffectedQuery,
} from "@extension/src/ui/backend";
import type { HistogramData } from "@extension/src/ui/histogramBinner";
import type { SummaryData } from "@extension/src/ui/parseForUI";
import dayjs from "dayjs";

let vscode = acquireVsCodeApi();

let postbox: Record<number, (value: Answer["content"]) => void> = {};

function postMan(event: { data: Answer }) {
  if (event.data.address in postbox) {
    postbox[event.data.address](event.data.content);
    delete postbox[event.data.address];
  }
}
window.addEventListener("message", postMan);

let idk = 0;
function generateAddress(): number {
  idk += 1;
  if (idk >= Number.MAX_SAFE_INTEGER) idk = 0;
  return idk;
}

function postMessage(
  message: Omit<Query, "address">,
  resolve: (value: Answer["content"]) => void,
  reject: (reason: any) => void
) {
  const address = generateAddress();
  const query = { ...message, address };
  postbox[address] = resolve;

  const timeout =
    message.type === "selectFile" || message.type === "selectFolder"
      ? 5 * 60 * 1000
      : 5 * 1000;
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

export function getHistogramData(
  from: Date,
  to: Date,
  workspaces: string[]
): Promise<HistogramData> {
  return new Promise((resolve, reject) => {
    const message: Omit<HistogramQuery, "address"> = {
      type: "histogram",
      from,
      to,
      workspaces,
    };
    postMessage(message, resolve as any, reject);
  });
}

export function selectFile(): Promise<string> {
  return new Promise((resolve, reject) => {
    const message: Omit<FileSelectQuery, "address"> = {
      type: "selectFile",
    };
    postMessage(message, resolve as any, reject);
  });
}

export function selectFolder(): Promise<string> {
  return new Promise((resolve, reject) => {
    const message: Omit<FolderSelectQuery, "address"> = {
      type: "selectFolder",
    };
    postMessage(message, resolve as any, reject);
  });
}

export function insertEntry(entries: any[]) {
  new Promise((resolve, reject) => {
    const message: Omit<InsertEntryQuery, "address"> = {
      type: "insertEntry",
      entries,
    };
    postMessage(message, resolve as any, reject);
  });
}

export function linesAffected(
  deleteOptions:
    | {
        workspace: string;
      }
    | {
        date: Date;
      }
    | undefined
) {
  return new Promise<number>((resolve, reject) => {
    const message: Omit<LinesAffectedQuery, "address"> = {
      type: "linesAffected",
      deleteOptions,
    };
    postMessage(message, resolve as any, reject);
  });
}

export function deleteEntries(
  deleteOptions:
    | {
        workspace: string;
      }
    | {
        date: Date;
      }
) {
  new Promise((resolve, reject) => {
    const message: Omit<DeleteQuery, "address"> = {
      type: "delete",
      deleteOptions,
    };
    postMessage(message, resolve as any, reject);
  });
}
