import * as vscode from 'vscode';
import { Timer } from './timer';
import { recordWorking, recordEnd, recordStart, checkForUnfinishedData, getUserLogsFile } from './fs';
import { TimeyIcon } from './icon';
import { prettyOutputTimeCalc, prettyOutputTimeCalcForUserAllDirs } from './timeCalculator';
import { recordProjectPathIfNotExists } from './fs';

export async function activate(context: vscode.ExtensionContext) {
	// mark a resource to be disposed of on the extension's deactivation
	const subscribe = <T extends vscode.Disposable>(d: T) => {
		context.subscriptions.push(d);
		return d;
	};
	const onDeactivate = (f: () => void): void => void subscribe({ dispose: f });

	// load configuration
	const config = vscode.workspace.getConfiguration('timeyWimey');
	const inactiveInterval = 1000 * 60 * (config.get<number>('inactivityInterval') ?? 1); // how long till user considered inactive
	const workingInterval = 1000 * 60 * (config.get<number>('sessionActiveInterval') ?? 3); // how long till check no unexpected crash
	const userName = config.get<string>('userName') ?? '';


	// create icon
	const icon = new TimeyIcon();
	icon.icon.command = "timeyWimey.showStats";


	// create kitchen timers to track (in)activity
	const progressTimer = subscribe(
		new Timer(workingInterval, async () => await recordWorking())
	);
	const inactiveTimer = subscribe(
		new Timer(inactiveInterval, async () => {
			icon.sleep();
			await recordEnd();
		})
	);
	const isCurrentlyActive = () => inactiveTimer.ticking;

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
			inactiveTimer.start();
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
			inactiveTimer.start();
		})
	);
}
