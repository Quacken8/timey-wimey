import * as vscode from "vscode";

export type Subscriber<T> = (value: T) => void;
export type Unsubscriber = () => void;

export function writableConfig<T>(
  config: string,
  key: string,
  defaultValue: T
) {
  const subs = new Set<Subscriber<T>>();
  let value = defaultValue;
  let removeListener = () => {};

  function getCurrentValue(): T {
    return vscode.workspace.getConfiguration(config).get(key) ?? defaultValue;
  }

  function start() {
    value = getCurrentValue();
    removeListener = vscode.workspace.onDidChangeConfiguration(change).dispose;
  }

  function change() {
    const newValue = getCurrentValue();
    const shouldCallSubscribers =
      typeof newValue === "object" || newValue !== value;
    if (!shouldCallSubscribers) return;

    value = newValue;
    for (const f of subs) {
      f(value);
    }
  }

  function stop() {
    removeListener();
  }

  function subscribe(f: Subscriber<T>): Unsubscriber {
    if (subs.size === 0) start();

    subs.add(f);
    f(value);

    return () => {
      subs.delete(f);
      if (subs.size === 0) stop();
    };
  }

  function get(): T {
    return value;
  }

  function set(value: T) {
    vscode.workspace.getConfiguration(config).update(key, value);
  }

  function update(f: (current: T) => T) {
    set(f(value));
  }

  function dispose() {
    subs.clear();
    (subscribe as any) = () => {
      throw new Error("Cannot subscribe to a disposed store");
    };
    stop();
  }

  return {
    subscribe,
    set,
    update,
    dispose,
  };
}
