import * as vscode from "vscode";
import { DBRowSelect } from "../db/schema";
import { getDB } from "../db/db";
import dayjs from "dayjs";
import { match } from "ts-pattern";
import {
  SummaryData,
  getMostUsedFiles,
  summarize as summarize,
} from "./parseForUI";
import { HistogramData, binForHistogram } from "./histogramBinner";
import {
  OpenFileEntry,
  CustomEntry,
  IntervalEntry,
  WorkingEntry,
  WindowFocusEntry,
  TimeEntry,
  LastCommitEntry,
  CheckerOutput,
} from "../types";

export type FullDataAnswer = {
  address: number;
  content: DBRowSelect[];
};

export type WorkspacesAnswer = {
  address: number;
  content: string[];
};

export type SummaryAnswer = {
  address: number;
  content: SummaryData;
};

export type TopFilesAnswer = {
  address: number;
  content: Record<string, number>;
};

export type LinesAffectedAnswer = {
  address: number;
  content: number;
};

export type FolderSelectAnswer = {
  address: number;
  content: string;
};

export type FileSelectAnswer = {
  address: number;
  content: string;
};

export type HistogramAnswer = {
  address: number;
  content: HistogramData;
};

export type FullDataQuery = {
  type: "fullData";
  address: number;
  from: Date;
  to: Date;
  workspaces: string[];
};

export type WorkspacesQuery = {
  type: "workspaces";
  address: number;
};

export type SummaryQuery = {
  type: "summary";
  address: number;
  from: Date;
  to: Date;
  workspaces: string[];
};

export type TopFilesQuery = {
  type: "topFiles";
  address: number;
  from: Date;
  to: Date;
  workspaces: string[];
  number: number;
};

export type HistogramQuery = {
  type: "histogram";
  address: number;
  from: Date;
  to: Date;
  workspaces: string[];
};

export type FileSelectQuery = {
  type: "selectFile";
  address: number;
};

export type FolderSelectQuery = {
  type: "selectFolder";
  address: number;
};

export type InsertEntryQuery = {
  type: "insertEntry";
  address: number;
  entries: CheckerOutput[];
};

export type DeleteQuery = {
  type: "delete";
  address: number;
  deleteOptions:
    | {
        date: Date;
      }
    | {
        workspace: string;
      };
};

export type LinesAffectedQuery = {
  type: "linesAffected";
  address: number;
  deleteOptions:
    | {
        date: Date;
      }
    | {
        workspace: string;
      }
    | undefined;
};

export type Query =
  | FullDataQuery
  | WorkspacesQuery
  | SummaryQuery
  | TopFilesQuery
  | FileSelectQuery
  | FolderSelectQuery
  | HistogramQuery
  | InsertEntryQuery
  | LinesAffectedQuery
  | DeleteQuery;

export type Answer =
  | FullDataAnswer
  | WorkspacesAnswer
  | SummaryAnswer
  | TopFilesAnswer
  | FileSelectAnswer
  | FolderSelectAnswer
  | LinesAffectedAnswer
  | HistogramAnswer;

export function registerApiReplies(
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext
) {
  const sendToWebview = (message: Answer) => {
    panel.webview.postMessage(message);
  };
  panel.webview.onDidReceiveMessage(async (message: Query) => {
    const db = await getDB(context);
    const address = message.address;
    match(message.type)
      .with("fullData", async () => {
        const { workspaces, from, to } = message as FullDataQuery;
        const content = await db.getRows(dayjs(from), dayjs(to), workspaces);
        sendToWebview({
          address,
          content,
        });
      })
      .with("workspaces", async () => {
        sendToWebview({
          address,
          content: (await db.getWorkspaces()).map((w) =>
            w === null ? "no workspace" : w
          ),
        });
      })
      .with("summary", async () => {
        const { workspaces, from, to } = message as SummaryQuery;
        const rows = await db.getRows(dayjs(from), dayjs(to), workspaces);
        const content = summarize(rows);
        sendToWebview({
          content,
          address,
        });
      })
      .with("topFiles", async () => {
        const { workspaces, from, to, number } = message as TopFilesQuery;
        const rows = await db.getRows(dayjs(from), dayjs(to), workspaces);
        const content = getMostUsedFiles(rows, number);
        sendToWebview({
          content,
          address,
        });
      })
      .with("histogram", async () => {
        const { workspaces, from, to } = message as HistogramQuery;
        const rows = await db.getRows(dayjs(from), dayjs(to), workspaces);
        const content = binForHistogram(rows, dayjs(from), dayjs(to));
        sendToWebview({
          content,
          address,
        });
      })
      .with("selectFile", async () => {
        const content =
          (
            await vscode.window.showOpenDialog({
              canSelectMany: false,
              openLabel: "Select File",
              canSelectFolders: false,
              canSelectFiles: true,
            })
          )?.[0].fsPath.replace(/^file:\/\//, "") ?? "";

        sendToWebview({
          content,
          address,
        });
      })
      .with("selectFolder", async () => {
        const content =
          (
            await vscode.window.showOpenDialog({
              canSelectMany: false,
              openLabel: "Select Workspace",
              canSelectFolders: true,
              canSelectFiles: false,
            })
          )?.[0].fsPath.replace(/^file:\/\//, "") ?? "";
        sendToWebview({
          content,
          address,
        });
      })
      .with("insertEntry", async () => {
        const { entries } = message as InsertEntryQuery;
        await db.insert(
          entries.map((e) =>
            Promise.resolve(
              e.key === "timestamp"
                ? {
                    key: "timestamp",
                    value: dayjs(new Date((e.value as any) * 1000)),
                  }
                : e
            )
          )
        );
      })
      .with("linesAffected", async () => {
        let content = 0;
        if ((message as LinesAffectedQuery).deleteOptions === undefined)
          content = await db.getLineCount({
            workspace: undefined,
            date: undefined,
          });
        else {
          const options = (message as LinesAffectedQuery).deleteOptions!;
          if ("workspace" in options)
            content = await db.getLineCount({
              workspace: options.workspace,
              date: undefined,
            });
          else
            content = await db.getLineCount({
              date: dayjs(options.date),
              workspace: undefined,
            });
        }
        sendToWebview({
          content,
          address,
        });
      })
      .with("delete", async () => {
        console.log("trying to delete");
        console.log({ message });
      })
      .exhaustive();
  });
}
