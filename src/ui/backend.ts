import * as vscode from "vscode";
import { DBRowSelect } from "../db/schema";
import { DB, getDB, getFromDB, getReposFromDB } from "../db/db";
import dayjs from "dayjs";
import { match } from "ts-pattern";

export type Answer =
  | {
      type: "fullData";
      content: DBRowSelect[];
    }
  | {
      type: "workspaces";
      content: string[];
    };

export type DateRange = {
  from: dayjs.Dayjs;
  to: dayjs.Dayjs;
};

export type Query =
  | { type: "fullData"; from: Date; to: Date; workspaces: string[] }
  | { type: "workspaces" };

export function registerApiReplies(
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext
) {
  const sendToWebview = (message: Answer) => {
    panel.webview.postMessage(message);
  };
  panel.webview.onDidReceiveMessage(async (message: Query) => {
    const db = await getDB(context);
    match(message.type)
      .with("fullData", async () => {
        const { workspaces, from, to } = message as any;
        sendToWebview(await getFullData(from, to, workspaces, db));
      })
      .with("workspaces", async () => {
        sendToWebview(await getRepos(db));
      })
      .exhaustive();
  });
}

async function getFullData(
  from: Date,
  to: Date,
  workspaces: string[],
  db: DB
): Promise<Answer> {
  return {
    content: await getFromDB(db, dayjs(from), dayjs(to), workspaces),
    type: "fullData",
  };
}

// async function getPossibleRange(db: DB): Promise<DateRange> {
//   return getDateRangeFromDB(db);
// }

async function getRepos(db: DB): Promise<Answer> {
  const workspaces = (await getReposFromDB(db)).map((repo) =>
    repo === null ? "no workspace" : repo
  );
  return {
    content: workspaces,
    type: "workspaces",
  };
}
