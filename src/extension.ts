import * as vscode from 'vscode';
import * as fs from 'fs';
import { Timer } from './timer';
import { recordWorking, recordEnd, recordStart, checkForUnfinishedData } from './fileIO';
import { TimeyIcon } from './icon';
import { prettyOutputTimeCalc, prettyOutputTimeCalcForUserAllDirs } from './timeCalculator';
import { createProjectPathsFile, getOrPromptUserName, getUserName, promptUserName, recordProjectPathIfNotExists } from './userInfo';

const inactiveInterval = 1000 * 60 * (vscode.workspace.getConfiguration('timeyWimey').get('inactivityInterval') as number); // how long till user considered inactive
const workingInterval = 1000 * 60 * (vscode.workspace.getConfiguration('timeyWimey').get('sessionActiveInterval') as number); // how long till check no unexpected crash
const includeInGitIgnore = vscode.workspace.getConfiguration('timeyWimey').get('includeInGitIgnore') as boolean;
const localDirPath = vscode.workspace.workspaceFolders![0].uri.path + '/.vscode/timeyWimey';
var thisUsersFile: fs.WriteStream | undefined = undefined;

var userName = vscode.workspace.getConfiguration('timeyWimey').get('userName') as string;
var icon = new TimeyIcon();

const progressTimer = new Timer(workingInterval, () => recordWorking(thisUsersFile!));
const inactiveTimer = new Timer(inactiveInterval, () => {
	recordEnd(thisUsersFile!);
	currentlyActive = false;
	inactiveTimer.stop();
	progressTimer.stop();
	icon.sleep();
});


var currentlyActive = false;


export async function activate(context: vscode.ExtensionContext) {
	// check for username
	if (userName === "") {
		userName = await promptUserName();
	}

	//create local folder if doesnt exist
	const folderExists = fs.existsSync(localDirPath);
	if (!folderExists) {
		fs.mkdirSync(localDirPath, { recursive: true });
	}

	//check for home projects folder
	createProjectPathsFile();
	recordProjectPathIfNotExists(localDirPath);

	// register showStats command
	let disposable = vscode.commands.registerCommand('timeyWimey.showStats', () => {
		const documentUri = vscode.Uri.parse('virtual:stats.txt');
		const documentContent = prettyOutputTimeCalc(localDirPath);

		vscode.workspace.registerTextDocumentContentProvider('virtual', {
			provideTextDocumentContent(uri: vscode.Uri): string {
				if (uri.path === documentUri.path) {
					return documentContent;
				}
				return '';
			}
		});

		vscode.workspace.openTextDocument(documentUri).then((doc) => {
			vscode.window.showTextDocument(doc, { preview: false, viewColumn: vscode.ViewColumn.One });
		});
	});

	icon.icon.command = "timeyWimey.showStats";
	context.subscriptions.push(disposable);

	// register showGlobalUserStats command
	disposable = vscode.commands.registerCommand('timeyWimey.showGlobalUserStats', () => {
		const documentUri = vscode.Uri.parse('virtual:globalUserStats.txt');
		const documentContent = prettyOutputTimeCalcForUserAllDirs(userName);
		vscode.workspace.registerTextDocumentContentProvider('virtual', {
			provideTextDocumentContent(uri: vscode.Uri): string {
				if (uri.path === documentUri.path) {
					return documentContent;
				}
				return '';
			}
		});

		vscode.workspace.openTextDocument(documentUri).then((doc) => {
			vscode.window.showTextDocument(doc, { preview: false, viewColumn: vscode.ViewColumn.One });
		});
	});


	const localFilePath = localDirPath + `/${userName}.txt`;
	try {
		fs.accessSync(localFilePath, fs.constants.F_OK);
		console.log('Timey file already exists');
	} catch (err) {
		// File doesn't exist, create it
		try {
			fs.writeFileSync(localFilePath, '');
			if (includeInGitIgnore) {

				// add it to gitignore
				const gitIgnorePath = vscode.workspace.workspaceFolders![0].uri.path + '/.gitignore';
				try {
					fs.appendFileSync(gitIgnorePath, '\n.vscode/timeyWimey');
					console.log('Timey file added to gitignore successfully.');
				} catch (err) {
					console.error('Error adding timey file to gitignore:', err);
				}
			}

			console.log('Timey file created successfully.');
		} catch (err) {
			console.error('Error creating timey file:', err);
		}
	}
	
	checkForUnfinishedData(localFilePath);
	thisUsersFile = fs.createWriteStream(localFilePath, { flags: 'a+' });

	// listen to input to editor
	vscode.workspace.onDidChangeTextDocument(event => {
		if (event.document.uri.path === localFilePath) { return; } // make sure the editing of the timey file doesnt look like user activity
		if (!currentlyActive) {
			recordStart(thisUsersFile!);

			progressTimer.start();
			inactiveTimer.start();
			currentlyActive = true;
			icon.wakeUp();
		}
		else {
			inactiveTimer.reset();
		}
	});

	vscode.window.showInformationMessage('\t👀\tTimey Wimey is tracking your code time here!');
}

export function deactivate() {
	if (currentlyActive) {
		recordEnd(thisUsersFile!);
		currentlyActive = false;
		inactiveTimer.stop();
		progressTimer.stop();
	}
}

