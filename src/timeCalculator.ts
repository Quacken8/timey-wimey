import * as fs from 'fs/promises';
import { assert } from 'console';
import { getProjectPaths, getWorkspaceTimeyDir, removeWorkingEntries } from './fs';

// returns a list of all file names in a folder
async function getFileNamesInFolder(folderPath: string): Promise<string[]> {
    const files: string[] = [];

    // Read the contents of the folder
    const folderContents = await fs.readdir(folderPath);

    // Iterate over each item in the folder
    for (const item of folderContents) {
        // Create the full path of the item
        const itemPath = `${folderPath}/${item}`;

        // Check if the item is a file
        if ((await fs.stat(itemPath)).isFile()) {
            files.push(itemPath); // Add the file path to the list
        }
    }

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
export async function calculateTime(folderUri: string): Promise<CodingTime[]> {

    const filenames = await getFileNamesInFolder(folderUri);

    const today = new Date();
    const todayUTX = getTodayUTX(today);
    const thisMondayUTX = getMondayUTX(today);
    const thisFirstUTX = getFirstOfThisMonthUTX(today);
    const lastFirstUTX = getFirstOfLastMonthUTX(today);

    let toReturn: CodingTime[] = [];

    // for each file make codingTime
    for (const filename of filenames) {
        const userName = filename.split('/')[filename.split('/').length - 1].split('.')[0]

        await removeWorkingEntries(filename);

        const fileContents = (await fs.readFile(filename, 'utf8')).split('\n');

        const starts = fileContents.filter(line => line.endsWith('start'));
        const ends = fileContents.filter(line => line.endsWith('end'));
        if (starts.length === ends.length + 1) {
            // the user hasnt ended their current session, so lets artificially add an end
            const rightNow = new Date().getTime();
            ends.push(`${rightNow} end`);
        }
        assert(starts.length === ends.length, "There is a different number of start times to end times in " + filename + "!");

        let lastMonthHours = 0;
        let thisMonthHours = 0;
        let thisWeekHours = 0;
        let todayHours = 0;

        for (let i = 0; i < starts.length; i++) {
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
    }

    // return codingTime
    return toReturn;

}


// prints out time spent coding in hours for today, this week, this month, and last month per user. If userName is set it will filter for that user
export async function prettyOutputTimeCalc(folderURI?: string, userName?: string): Promise<string> {
    folderURI ??= await getWorkspaceTimeyDir();

    const data = await calculateTime(folderURI);
    let stringData = "";

    for (const datapoint of data) {
        if (userName === undefined || datapoint.userName === userName) {
            stringData += userName === undefined ? `## ${datapoint.userName}\n` : "";
            stringData += `Today:\t\t${datapoint.today.toFixed(2)} hours
This week:\t${datapoint.thisWeek.toFixed(2)} hours
This month:\t${datapoint.thisMonth.toFixed(2)} hours
Last month:\t${datapoint.lastMonth.toFixed(2)} hours
-----------------
`;
        }
    }

    return stringData;
}

export async function prettyOutputTimeCalcForUserAllDirs(userName: string): Promise<string> {
    const allDirs = await getProjectPaths();
    let stringData = "";

    for (const dir of allDirs) {
        try {
            await fs.access(dir, fs.constants.R_OK);
        } catch (err) {
            // File doesn't exist, log and skip
            console.warn('Timey file does not exist in ' + dir);
            continue;
        }

        const dirToPrint = dir.split('/').slice(0, dir.split('/').length - 2).join('/') + '/';
        stringData += `## In ${dirToPrint}:\n`;
        stringData += prettyOutputTimeCalc(dir, userName);
    }
    return stringData;
}