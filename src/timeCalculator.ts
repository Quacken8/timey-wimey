import { defaultCachePath } from '@vscode/test-electron/out/download';
import { assert } from 'console';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { removeWorkingEntries } from './fileIO';

// returns a list of all file names in a folder
function getFileNamesInFolder(folderPath: string): string[] {
    const files: string[] = [];

    // Read the contents of the folder
    const folderContents = fs.readdirSync(folderPath);

    // Iterate over each item in the folder
    folderContents.forEach((item: any) => {
        // Create the full path of the item
        const itemPath = `${folderPath}/${item}`;

        // Check if the item is a file
        if (fs.statSync(itemPath).isFile()) {
            files.push(itemPath); // Add the file path to the list
        }
    });

    return files;
}

function getTodayUTX(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getMondayUTX(date: Date): number {
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return monday.getTime();
}

function getFirstOfThisMonthUTX(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

function getFirstOfLastMonthUTX(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() - 1, 1).getTime();
}

interface CodingTime {
    userName: string;
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
}

// calculates time spent coding in hours for today, this week, this month, and last month per user
export function calculateTime(folderUri: string): CodingTime[] {

    const filenames = getFileNamesInFolder(folderUri);

    const today = new Date();
    const todayUTX = getTodayUTX(today);
    const thisMondayUTX = getMondayUTX(today);
    const thisFirstUTX = getFirstOfThisMonthUTX(today);
    const lastFirstUTX = getFirstOfLastMonthUTX(today);

    var toReturn: CodingTime[] = [];

    // for each file make codingTime
    for (const filename of filenames) {
        const userName = filename.split('/')[filename.split('/').length - 1].split('.')[0]

        removeWorkingEntries(filename);

        const fileContents = fs.readFileSync(filename, 'utf8').split('\n');

        const starts = fileContents.filter(line => line.endsWith('start'));
        const ends = fileContents.filter(line => line.endsWith('end'));
        if (starts.length === ends.length + 1) {
            // the user hasnt ended their current session, so lets artificially add an end
            const rightNow = new Date().getTime();
            ends.push(`${rightNow} end`);
        }
        assert(starts.length === ends.length, "There is a different number of start times to end times in " + filename + "!");

        var lastMonthHours = 0;
        var thisMonthHours = 0;
        var thisWeekHours = 0;
        var todayHours = 0;

        for (var i = 0; i < starts.length; i++) {
            const startTime = parseInt(starts[i].split(' ')[0]);
            const endTime = parseInt(ends[i].split(' ')[0]);

            if (startTime > lastFirstUTX && endTime < thisFirstUTX) {
                lastMonthHours += (endTime - startTime) / 1000 / 60 / 60;
            }
            if (startTime > thisFirstUTX) {
                thisMonthHours += (endTime - startTime) / 1000 / 60 / 60;
            }
            if (startTime > thisMondayUTX) {
                thisWeekHours += (endTime - startTime) / 1000 / 60 / 60;
            }
            if (startTime > todayUTX) {
                todayHours += (endTime - startTime) / 1000 / 60 / 60;
            }
        }

        toReturn.push({
            userName: userName,
            today: todayHours,
            thisWeek: thisWeekHours,
            thisMonth: thisMonthHours,
            lastMonth: lastMonthHours
        });
        console.log(toReturn);
    }

    // return codingTime
    return toReturn;

}

export function prettyOutputTimeCalc(folderURI: string): string {

    const data = calculateTime(folderURI);
    var stringData = "";

    for (const datapoint of data) {
        stringData += `#${datapoint.userName}\nToday:\t\t${datapoint.today.toFixed(2)} hours\nThis week:\t${datapoint.thisWeek.toFixed(2)} hours\nThis month:\t${datapoint.thisMonth.toFixed(2)} hours\nLast month:\t${datapoint.lastMonth.toFixed(2)}\n=================\n`;
    }

    return stringData;
}