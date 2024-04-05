import dayjs from "dayjs";
import { DB, getDB } from "./db/db";
import {
  IntervalEntry,
  LastCommitEntry,
  OpenFileEntry,
  TimeEntry,
  WindowFocusEntry,
  WorkingEntry,
  WorkspaceEntry,
} from "./types";
import { webviewCallback } from "./ui/frontendMaker";
import { subscribe } from "./utils";
import * as vscode from "vscode";

export function registerCommands(context: vscode.ExtensionContext) {
  const db = getDB(context);

  subscribe(
    vscode.commands.registerCommand("timeyWimey.openDB", () => {
      const filePath = vscode.Uri.file(db.getFilePath());
      vscode.commands.executeCommand("vscode.open", filePath);
    }),
    context
  );

  subscribe(
    vscode.commands.registerCommand("timeyWimey.showStats", () =>
      webviewCallback(context)
    ),
    context
  );

  subscribe(
    vscode.commands.registerCommand("timeyWimey.insertEntry", () =>
      enterLine(db)
    ),
    context
  );
}

async function enterLine(db: DB) {
  const time: TimeEntry = {
    key: "timestamp",
    value: dayjs(),
  };
  const length = await vscode.window.showInputBox({
    title: "How many minutes have you been working for?",
    placeHolder: "69",
    validateInput: (input) => {
      if (!input || isNaN(Number(input))) {
        return "Input must be a number";
      }
      return null;
    },
  });
  if (length === undefined) return;

  let working: string | undefined | boolean = await vscode.window.showQuickPick(
    ["yes", "no"],
    {
      title: "Were you actively writing?",
    }
  );
  if (working === undefined) return;
  working = working === "yes";
  let focused: string | undefined | boolean = working
    ? true
    : await vscode.window.showQuickPick(["yes", "no"], {
        title: "Was the window focused?",
      });
  if (focused === undefined) return;
  focused = focused === "yes" || focused === true;

  const wantWorkspace = await vscode.window.showQuickPick(["no", "yes"], {
    title: "Do you want to associate this with a workspace?",
  });
  if (wantWorkspace === undefined) return;

  let workspace =
    wantWorkspace === "yes"
      ? (
          await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: "Select workspace",
            canSelectFolders: true,
            canSelectFiles: false,
          })
        )?.[0].fsPath
      : null;
  if (workspace === undefined) return;
  workspace ??= undefined;

  const wantFile = await vscode.window.showQuickPick(["no", "yes"], {
    title: "Do you want to associate this with a specific file?",
  });
  if (wantFile === undefined) return;

  let file =
    wantFile === "yes"
      ? (
          await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: "Select file",
          })
        )?.[0].fsPath
      : null;
  if (file === undefined) return;
  file ??= undefined;

  const wantCommit = await vscode.window.showQuickPick(["no", "yes"], {
    title: "Do you want to associate this with a commit?",
  });
  let commit =
    wantCommit === "yes"
      ? await vscode.window.showInputBox({
          title: "Enter the commit hash",
          placeHolder: "123456",
        })
      : null;
  if (commit === undefined) return;
  commit ??= undefined;

  const wantCustom = await vscode.window.showQuickPick(["no", "yes"], {
    title: "Do you want to add a custom field?",
  });

  let custom =
    wantCustom === "yes"
      ? await vscode.window.showInputBox({
          title: "Enter the custom field",
          placeHolder: "JSON",
        })
      : null;

  if (custom === undefined) return;
  custom ??= undefined;

  const entries = [
    Promise.resolve(time),
    Promise.resolve({ key: "interval_minutes", value: Number(length) }),
    Promise.resolve({ key: "working", value: working }),
    Promise.resolve({ key: "window_focused", value: focused }),
    Promise.resolve({ key: "workspace", value: workspace }),
    Promise.resolve({ key: "current_file", value: file }),
    Promise.resolve({ key: "last_commit_hash", value: commit }),
    Promise.resolve({
      key: "custom",
      value: custom !== undefined ? JSON.parse(custom) : undefined,
    }),
  ];

  await db.insert(entries as any);
}
