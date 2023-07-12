import * as vscode from 'vscode';
import * as fs from 'fs';
const userHomeTimeyDir = require('os').homedir() + "/.vscode/extensions/timeyWimey";

export function promptUserName() {
    // prompt for username
    const name = vscode.window.showInputBox({
        prompt: "Enter your name for Timey Wimey",
        placeHolder: "John Doe"
    });

    // save username to file
    name.then((userName) => {
        if (userName) {
            fs.writeFileSync(userHomeTimeyDir + "/username.txt", userName);
        }
    });
}

export function getUserName(): string {
    const userName = fs.readFileSync(userHomeTimeyDir + "/username.txt", 'utf8');
    return userName;
}

export function getOrPromptUserName(): string {
    try {
        return getUserName();
    }
    catch (err) {
        promptUserName();
        return getUserName();
    }
}

// creazes projectPaths.txt in home folder if it doesnt exist
export function createProjectPathsFile() {
    try {
        fs.accessSync(userHomeTimeyDir + "/projectPaths.txt", fs.constants.F_OK);
    }
    catch (err) {
        fs.writeFileSync(userHomeTimeyDir + "/projectPaths.txt", "");
    }
}

export function recordProjectPath(path: string) {
    fs.appendFileSync(userHomeTimeyDir + "/projectPaths.txt", path + "\n");
}

export function recordProjectPathIfNotExists(path: string) {
    const projectPaths = getProjectPaths();
    if (!projectPaths.includes(path)) {
        recordProjectPath(path);
    }
}

export function getProjectPaths(): string[] {
    const projectPaths = fs.readFileSync(userHomeTimeyDir + "/projectPaths.txt", 'utf8').split("\n");
    return projectPaths;
}