import * as vscode from 'vscode';

export class TimeyIcon {
    icon: vscode.StatusBarItem;

    constructor() {
        this.icon = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.icon.command = "vscode.window.showWarningMessage('Timey Wimey')";
        this.icon.text = '👀';
        this.icon.tooltip = 'Timey Wimey';
        this.icon.show();
    }

    public wakeUp() {
        this.icon.text = '🔥';
        this.icon.tooltip = 'Working hard!';
        this.icon.show();
    }

    public sleep() {
        this.icon.text = '💤';
        this.icon.tooltip = 'Hardly working!';
        this.icon.show();
    }
}