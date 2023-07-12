import * as vscode from 'vscode';
import * as fs from 'fs';
import { Timer } from './timer';
import { recordWorking, recordEnd, recordStart } from './fileIO';

const INACTIVE_INTERVAL = 1000 * (vscode.workspace.getConfiguration('timeyWimey').get('inactivityInterval') as number); // how long till user considered inactive
const working_INTERVAl = 1000 * 60 * (vscode.workspace.getConfiguration('timeyWimey').get('sessionActiveInterval') as number); // how long till check no unexpected crash
var filePath = vscode.workspace.workspaceFolders![0].uri.path + '/.vscode/timeyWimey';
var file: fs.WriteStream | undefined = undefined;

// TODO think about how to handle pushing to git: cuz then the user hasnt ended yet. Maybe we can force the end to run before git add commit and then make another start after git finishes? 
// TODO change acticvation to workspace opened
// TODO use the config to auto include the timey file in gitignore

var userName: string | undefined = undefined;

const progressTimer = new Timer(working_INTERVAl, () => recordWorking(file!));
const inactiveTimer = new Timer(INACTIVE_INTERVAL, () => {
	recordEnd(file!);
	currentlyActive = false;
	inactiveTimer.stop();
	progressTimer.stop(); });

const statusBarIcon = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
statusBarIcon.tooltip = 'Timey Wimey';
statusBarIcon.text = `$(clock) timeyy`;

function checkForUnfinishedData() {

	// look at last line of file
	const data = fs.readFileSync(filePath!, 'utf8');

	if (data.endsWith('working')) {
		// unexpected exit, append end

		const lines = data.split('\n');
		const lastLine = lines[lines.length - 1];
		const timestamp = lastLine.split(' ')[0];
		const endMail = lastLine.split(' ')[1];
		const endLine = `\n${timestamp} ${endMail} end`;

		fs.appendFileSync(filePath!, endLine); // NOTE im using sync but prolly cuz im kinda scared of async? is it a good idea?
	}

}


var currentlyActive = false;



export function activate(context: vscode.ExtensionContext) {
	vscode.window.showInformationMessage('Hello World from vscode-extensions!');

	userName = 'userName'; //TODO prolly wont be possible from vscode api? maybe from config?

	//create folder if doesnt exist
	const folderExists = fs.existsSync(filePath);
	if (!folderExists) {
		fs.mkdirSync(filePath, { recursive: true });
	}


	filePath += `/${userName}.txt`;
	file = fs.createWriteStream(filePath, { flags: 'a+' });
	try {
		fs.accessSync(filePath, fs.constants.F_OK);
		console.log('Timey file already exists');
	} catch (err) {
		// File doesn't exist, create it
		try {
			fs.writeFileSync(filePath, '');
			console.log('Timey file created successfully.');
		} catch (err) {
			console.error('Error creating timey file:', err);
		}
	}

	checkForUnfinishedData();

	// listen to input
	vscode.workspace.onDidChangeTextDocument(event => {
		if (event.document.uri.path === filePath) { return; } // make sure the editing of the timey file doesnt look like user activity
		if (!currentlyActive) {
			recordStart(file!);

			progressTimer.start();
			inactiveTimer.start();
			currentlyActive = true;
		}
		else {
			inactiveTimer.reset();
		}
	});

}

export function deactivate() {
	recordEnd(file!);
	currentlyActive = false;
	inactiveTimer.stop();
	progressTimer.stop();
}

