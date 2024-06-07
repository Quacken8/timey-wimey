import dayjs from "dayjs";
import * as vscode from "vscode";

export type PromiseType<T> = T extends Promise<infer U> ? U : T;
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

export type CheckerOutput =
  | TimeEntry
  | IntervalEntry
  | WorkingEntry
  | WindowFocusEntry
  | WorkspaceEntry
  | OpenFileEntry
  | LastCommitEntry
  | CustomEntry;
export type Checker = () => Promise<CheckerOutput>;

export type CheckerSetuper = (context: vscode.ExtensionContext) => Checker;

export type TimeEntry = {
  key: "timestamp";
  value: dayjs.Dayjs;
};

export type IntervalEntry = {
  key: "interval_minutes";
  value: number;
};

export type WorkingEntry = {
  key: "working";
  value: boolean;
};

export type WindowFocusEntry = {
  key: "window_focused";
  value: boolean;
};

export type WorkspaceEntry = {
  key: "workspace";
  value: string | undefined;
};

export type OpenFileEntry = {
  key: "current_file";
  value: string | undefined;
};

export type LastCommitEntry = {
  key: "last_commit_hash";
  value: string | undefined;
};

export type CustomEntry = {
  key: "custom";
  value: JSONValue;
};
