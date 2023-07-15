import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import { homedir } from 'os';
import { join as joinPaths } from 'path';

async function fileExists(path: string) {
    try {
        const stats = await fs.stat(path);
        if (stats.isFile()) return true;
        return false;
    } catch (e) {
        if (e instanceof Error && 'code' in e && e.code === 'ENOENT') return false;
        throw e;
    }
}


// Global

async function getUserHomeTimeyDir() {
    const path = joinPaths(homedir(), ".vscode/extensions/quacken.timey-wimey");
    await fs.mkdir(path, { recursive: true });
    return path;
}

async function getProjectPathsFile() {
    const path = joinPaths(await getUserHomeTimeyDir(), "project-paths.txt");
    if (!await fileExists(path)) await fs.writeFile(path, "", "utf-8");
    return path;
}

export async function getProjectPaths() {
    const filePath = await getProjectPathsFile();

    const pathsAsText = await fs.readFile(filePath, 'utf8');
    return new Set(pathsAsText.split("\n"));
}

export async function recordProjectPathIfNotExists() {
    const localPath = await getUserLogsFile();
    const globalPath = await getProjectPathsFile();
    const paths = await getProjectPaths();

    if (!paths.has(localPath)) await fs.appendFile(globalPath, localPath + "\n");
}

// Per-workspace

export async function getWorkspaceTimeyDir() {
    const path = joinPaths(vscode.workspace.workspaceFolders![0].uri.path, '.vscode/timeyWimey');
    await fs.mkdir(path, { recursive: true });
    return path;
}

export async function getUserLogsFile() {
    const path = joinPaths(await getWorkspaceTimeyDir(), `/${await getUserName()}.txt`);
    if (!await fileExists(path)) {
        await fs.writeFile(path, "", "utf-8");
        await createGitignoreIfNeeded();
    }
    return path;
}

export async function getUserName(): Promise<string> {
    let name = vscode.workspace.getConfiguration('timeyWimey').get<string>('userName');

    while (name === undefined) {
        name = await vscode.window.showInputBox({
            prompt: "Enter your name for Timey Wimey",
            placeHolder: "John Doe"
        });

        await vscode.workspace.getConfiguration().update("timeyWimey.userName", name, vscode.ConfigurationTarget.Global);
    }

    return name;
}

export async function createGitignoreIfNeeded() {
    if (!vscode.workspace.getConfiguration('timeyWimey').get<boolean>('includeInGitIgnore')) return;
    const gitIgnorePath = joinPaths(vscode.workspace.workspaceFolders![0].uri.path, '.gitignore');
    await fs.appendFile(gitIgnorePath, '\n.vscode/timeyWimey\n');
}

/** Remove all lines ending with "working" from file */
export async function removeWorkingEntries(path?: string) {
    path ??= await getUserLogsFile();
    const lines = (await fs.readFile(path, 'utf8')).split('\n');
    const newLines = lines.filter(line => !line.endsWith('working'));
    await fs.writeFile(path, newLines.join('\n'));
}

/** Append working to file with timestamp */
export async function recordWorking() {
    const path = await getUserLogsFile();
    await fs.appendFile(path, `${Date.now()} working\n`, "utf-8");
}

// append end to file with timestamp
export async function recordEnd() {
    const path = await getUserLogsFile();
    await fs.appendFile(path, `${Date.now()} end\n`, "utf-8");
}

// append start to file with timestamp
export async function recordStart() {
    const path = await getUserLogsFile();
    await fs.appendFile(path, `${Date.now()} start\n`, "utf-8");
}

export async function checkForUnfinishedData() {
    const path = await getUserLogsFile();

    // look at last line of file
    const data = await fs.readFile(path, 'utf8');

    if (data.endsWith('working')) {
        // unexpected exit, append end

        const lines = data.split('\n');
        const lastLine = lines.at(-1)!;
        const timestamp = lastLine.split(' ')[0];
        const endLine = `\n${timestamp} end`;

        await fs.appendFile(path, endLine);
    }
}
