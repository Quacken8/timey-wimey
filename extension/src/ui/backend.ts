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

export type Query =
  | FullDataQuery
  | WorkspacesQuery
  | SummaryQuery
  | TopFilesQuery
  | HistogramQuery;

export type Answer =
  | FullDataAnswer
  | WorkspacesAnswer
  | SummaryAnswer
  | TopFilesAnswer
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
        console.log(rows);
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
      .exhaustive();
  });
}
