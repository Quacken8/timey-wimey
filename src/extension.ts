import * as vscode from 'vscode';
import { Timer } from './timer';
import { recordWorking, recordEnd, recordStart, checkForUnfinishedData, getUserLogsFile } from './fs';
import { TimeyIcon } from './icon';
import { prettyOutputTimeCalc, prettyOutputTimeCalcForUserAllDirs, prettyOutputTimeCalcPerCommit } from './timeCalculator';
import { recordProjectPathIfNotExists } from './fs';

// make asynchronous unsubscriptions more pleasant to work with
const subs: Array<() => void | Promise<void>> = [];
function onDeactivate(f: () => void | Promise<void>) {
	subs.push(f);
}
export async function deactivate() {
	for (const f of subs) {
		await f();
	}
}


export async function activate(context: vscode.ExtensionContext) {
	// mark a resource to be disposed of on the extension's deactivation
	const subscribe = <T extends { dispose(): void }>(d: T) => {
		context.subscriptions.push(d);
		return d;
	};

	// load configuration
	const config = vscode.workspace.getConfiguration('timeyWimey');
	let inactiveInterval = 1000 * 60 * (config.get<number>('inactivityInterval') ?? 1); // how long till user considered inactive
	let workingInterval = 1000 * 60 * (config.get<number>('sessionActiveInterval') ?? 3); // how long till check no unexpected crash
	let userName = config.get<string>('userName') ?? '';

	// create icon
	const icon = new TimeyIcon();
	icon.icon.command = "timeyWimey.showStats";


	// create a kitchen timer to track (in)activity
	const activityTimer = subscribe(
		new Timer({
			interval: inactiveInterval,
			async callback() {
				icon.sleep();
				progressTimer.stop();
				await recordEnd();
			}
		})
	);
	const isCurrentlyActive = () => activityTimer.ticking;

	// create a timer that periodically logs progress
	// in case VSC is killed or crashes
	const progressTimer = subscribe(
		new Timer({
			interval: workingInterval,
			repeating: true,
			async callback() {
				if (isCurrentlyActive()) await recordWorking();
				else progressTimer.stop();
			}
		})
	);

	// subscribe to configuration changes
	subscribe(
		vscode.workspace.onDidChangeConfiguration(async (event) => {
			if (event.affectsConfiguration('timeyWimey.inactivityInterval')) {
				inactiveInterval = 1000 * 60 * (config.get<number>('inactivityInterval') ?? 1);
			}
			if (event.affectsConfiguration('timeyWimey.sessionActiveInterval')) {
				workingInterval = 1000 * 60 * (config.get<number>('sessionActiveInterval') ?? 3);
			}
			if (event.affectsConfiguration('timeyWimey.userName')) {
				userName = config.get<string>('userName') ?? '';
			}
		})
	);

	onDeactivate(async () => {
		if (isCurrentlyActive()) await recordEnd();
	});


	// record this workspace's path and prepare local data
	await recordProjectPathIfNotExists();
	await checkForUnfinishedData();


	// listen to input to editor
	subscribe(
		vscode.workspace.onDidChangeTextDocument(async (event) => {
			if (event.document.uri.path === await getUserLogsFile()) { return; } // make sure the editing of the timey file doesnt look like user activity

			if (!isCurrentlyActive()) {
				recordStart();
				progressTimer.start();
				icon.wakeUp();
			}
			activityTimer.start();
		})
	);


	// register showStats command
	subscribe(
		vscode.commands.registerCommand('timeyWimey.showStats', async () => {
			const documentUri = vscode.Uri.parse('virtual:Timey Wimey stats');
			const documentContent = `# Time data for this project\n=================\n${await prettyOutputTimeCalc()}`;

			subscribe(vscode.workspace.registerTextDocumentContentProvider('virtual', {
				provideTextDocumentContent(uri: vscode.Uri): string {
					if (uri.path === documentUri.path) {
						return documentContent;
					}
					return '';
				}
			}));

			const doc = await vscode.workspace.openTextDocument(documentUri);
			vscode.window.showTextDocument(doc, { preview: false, viewColumn: vscode.ViewColumn.One });
		})
	);

	// register showStatsPerCommit command
	subscribe(
		vscode.commands.registerCommand('timeyWimey.showStatsPerCommit', async () => {
			const documentUri = vscode.Uri.parse('virtual:Timey Wimey stats per commit');
			const thisFolder = vscode.workspace.workspaceFolders![0].uri.path.split('/').at(-1)!;
			const documentContent = `# Time spent on this project (${thisFolder}) per commit:\n=================\n${await prettyOutputTimeCalcPerCommit()}`;

			subscribe(vscode.workspace.registerTextDocumentContentProvider('virtual', {
				provideTextDocumentContent(uri: vscode.Uri): string {
					if (uri.path === documentUri.path) {
						return documentContent;
					}
					return '';
				}
			}));

			const doc = await vscode.workspace.openTextDocument(documentUri);
			vscode.window.showTextDocument(doc, { preview: false, viewColumn: vscode.ViewColumn.One });
		})
	);

	// register showGlobalUserStats command
	subscribe(
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
	subscribe(
		vscode.commands.registerCommand('timeyWimey.stopStart', async () => {
			if (isCurrentlyActive()) {
				await recordEnd();
			}
			await recordStart();
			activityTimer.start();
		})
	);
}
