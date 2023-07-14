import * as vscode from 'vscode';
import { Timer } from './timer';
import { recordWorking, recordEnd, recordStart, checkForUnfinishedData, getUserLogsFile } from './fs';
import { TimeyIcon } from './icon';
import { prettyOutputTimeCalc, prettyOutputTimeCalcForUserAllDirs } from './timeCalculator';
import { getUserName, recordProjectPathIfNotExists } from './fs';

const inactiveInterval = 1000 * 60 * (vscode.workspace.getConfiguration('timeyWimey').get<number>('inactivityInterval') ?? 1); // how long till user considered inactive
const workingInterval = 1000 * 60 * (vscode.workspace.getConfiguration('timeyWimey').get<number>('sessionActiveInterval') ?? 3); // how long till check no unexpected crash

let userName = vscode.workspace.getConfiguration('timeyWimey').get('userName') as string;
let icon = new TimeyIcon();

let progressTimer: Timer;
let inactiveTimer: Timer;
let currentlyActive = false;


export async function activate(context: vscode.ExtensionContext) {
	// record this workspace path
	await recordProjectPathIfNotExists();

	// register showStats command
	context.subscriptions.push(
		vscode.commands.registerCommand('timeyWimey.showStats', async () => {
			const documentUri = vscode.Uri.parse('virtual:Timey Wimey stats');
			const documentContent = `# Time data for this project\n=================\n${await prettyOutputTimeCalc()}`;

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
		})
	);

	icon.icon.command = "timeyWimey.showStats";

	// register showGlobalUserStats command
	context.subscriptions.push(
		vscode.commands.registerCommand('timeyWimey.showGlobalUserStats', async () => {
			const documentUri = vscode.Uri.parse('virtual:Timey Wimey golbal stats');
			const documentContent = `# Global time data for user ${userName}\n=================\n${await prettyOutputTimeCalcForUserAllDirs(userName)}`;
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
		})
	);

	// register stopStart command
	context.subscriptions.push(
		vscode.commands.registerCommand('timeyWimey.stopStart', async () => {
			if (currentlyActive) {
				await recordEnd();
				await recordStart();
				inactiveTimer.reset();
			}
		})
	);

	await checkForUnfinishedData();

	// listen to input to editor
	vscode.workspace.onDidChangeTextDocument(async (event) => {
		if (event.document.uri.path === await getUserLogsFile()) { return; } // make sure the editing of the timey file doesnt look like user activity

		if (!currentlyActive) {
			await recordStart();

			progressTimer.start();
			inactiveTimer.start();
			currentlyActive = true;
			icon.wakeUp();
		}
		else {
			inactiveTimer.reset();
		}
	});

	progressTimer = new Timer(workingInterval, async () => await recordWorking());
	inactiveTimer = new Timer(inactiveInterval, async () => {
		await recordEnd();
		currentlyActive = false;
		inactiveTimer.stop();
		progressTimer.stop();
		icon.sleep();
	});
}

export async function deactivate() {
	if (currentlyActive) {
		await recordEnd();
		currentlyActive = false;
		inactiveTimer.stop();
		progressTimer.stop();
	}
}

