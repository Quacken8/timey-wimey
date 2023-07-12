import * as vscode from 'vscode';
import * as fs from 'fs';
const userHomeTimeyDir = require('os').homedir() + "/.vscode/extensions/timeyWimey";

export async function promptUserName() {
    // prompt for username
    const name = await vscode.window.showInputBox({
        prompt: "Enter your name for Timey Wimey",
        placeHolder: "John Doe"
    });

    // save username to file
    if (name) {
        const folderExists = fs.existsSync(userHomeTimeyDir);
        if (!folderExists) {
            fs.mkdirSync(userHomeTimeyDir, { recursive: true });
        }
        fs.writeFileSync(userHomeTimeyDir + "/username.txt", name);
    }

}

export function getUserName(): string {
    const userName = fs.readFileSync(userHomeTimeyDir + "/username.txt", 'utf8');
    return userName;
}

export async function getOrPromptUserName(): Promise<string> {
    try {
        return getUserName();
    }
    catch (err) {
        await promptUserName();
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