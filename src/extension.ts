import * as vscode from 'vscode';
import * as fs from 'fs';
import { Timer } from './timer';
import { recordWorking, recordEnd, recordStart, checkForUnfinishedData } from './fileIO';
import { TimeyIcon } from './icon';
import { prettyOutputTimeCalc } from './timeCalculator';

const inactiveInterval = 1000 * 60 * (vscode.workspace.getConfiguration('timeyWimey').get('inactivityInterval') as number); // how long till user considered inactive
const workingInterval = 1000 * 60 * (vscode.workspace.getConfiguration('timeyWimey').get('sessionActiveInterval') as number); // how long till check no unexpected crash
const includeInGitIgnore = vscode.workspace.getConfiguration('timeyWimey').get('includeInGitIgnore') as boolean;
var filePath = vscode.workspace.workspaceFolders![0].uri.path + '/.vscode/timeyWimey';
var file: fs.WriteStream | undefined = undefined;

var userName = "userName";	//FIXME prolly wont be possible from vscode api? maybe from config?
var icon = new TimeyIcon();

const progressTimer = new Timer(workingInterval, () => recordWorking(file!));
const inactiveTimer = new Timer(inactiveInterval, () => {
	recordEnd(file!);
	currentlyActive = false;
	inactiveTimer.stop();
	progressTimer.stop();
	icon.sleep();
});


var currentlyActive = false;


export function activate(context: vscode.ExtensionContext) {
	vscode.window.showInformationMessage('  👀   Timey Wimey is tracking your code time here!');

	//create folder if doesnt exist
	const folderExists = fs.existsSync(filePath);
	if (!folderExists) {
		fs.mkdirSync(filePath, { recursive: true });
	}


	let disposable = vscode.commands.registerCommand('timeyWimey.showStats', () => {
		const documentUri = vscode.Uri.parse('virtual:stats.txt');
		const documentContent = prettyOutputTimeCalc(vscode.workspace.workspaceFolders![0].uri.path + '/.vscode/timeyWimey');

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


	filePath += `/${userName}.txt`;
	file = fs.createWriteStream(filePath, { flags: 'a+' });
	try {
		fs.accessSync(filePath, fs.constants.F_OK);
		console.log('Timey file already exists');
	} catch (err) {
		// File doesn't exist, create it
		try {
			fs.writeFileSync(filePath, '');
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

	checkForUnfinishedData(filePath);

	// listen to input
	vscode.workspace.onDidChangeTextDocument(event => {
		if (event.document.uri.path === filePath) { return; } // make sure the editing of the timey file doesnt look like user activity
		if (!currentlyActive) {
			recordStart(file!);

			progressTimer.start();
			inactiveTimer.start();
			currentlyActive = true;
			icon.wakeUp();
		}
		else {
			inactiveTimer.reset();
		}
	});

}

export function deactivate() {
	if (currentlyActive) {
		recordEnd(file!);
		currentlyActive = false;
		inactiveTimer.stop();
		progressTimer.stop();
	}
}

