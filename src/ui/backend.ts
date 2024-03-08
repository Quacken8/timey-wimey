import * as vscode from "vscode";
import { DBRowSelect } from "../db/schema";
import { getDB } from "../db/db";
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
    const db = getDB(context);
    match(message.type)
      .with("fullData", async () => {
        const { workspaces, from, to } = message as any;
        const content = await db.getRows(dayjs(from), dayjs(to), workspaces);
        sendToWebview({
          type: "fullData",
          content,
        });
      })
      .with("workspaces", async () => {
        sendToWebview({
          type: "workspaces",
          content: (await db.getWorkspaces()).map((w) =>
            w === null ? "no workspace" : w
          ),
        });
      })
      .exhaustive();
  });
}
