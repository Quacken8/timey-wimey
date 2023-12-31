import * as fs from 'fs/promises';
import { assert, error } from 'console';
import { File, getCommitInfos, getFileNamesInFolder, getProjectPaths, getWorkspaceTimeyDir, removeWorkingEntries } from './fs';


enum EntryType {
    START = 'start',
    END = 'end',
    WORKING = 'working'
}

/** Fixes the contents of the file by removing big gaps, fixing consecutive starts/stops, adds missing stops, fixes wrong formatting*/
function fixFileContent(lines: string[], expectedWorkingGapMS: number): string[] {

    interface WorkingSession {
        start: number;
        end: number | undefined;
        workings: number[];
    }

    // split the lines into several arrays bounded by start and stop entries
    let workingSessions: WorkingSession[] = [];

    let currentSession: WorkingSession | undefined = undefined;

    for (let line of lines) {
        if (line.trim() === '') continue;   // skip empty lines (shouldn't be any, but just in case)

        // first check correct line formatting
        const splitLine = line.split(' ');
        if (splitLine.length !== 2) {
            // typical error of missing newline
            const match = line.match(/^(\d+\s\D+)(\d+\s\D+)/);
            if (match) {
                // add the second part to the next line
                lines.splice(lines.indexOf(line) + 1, 0, match[2] );
                line = match[1];
            }
            else {
                throw new Error(`Line "${line}" is not formatted correctly!`);
            }
        }
        const time = parseInt(splitLine[0]);
        const action = splitLine[1] as EntryType; // TODO check if this is a valid entry type

        switch (action) {
            case EntryType.START:

                if (currentSession !== undefined) {
                    // stop is missing from the last session, estimate it from working
                    currentSession.end = currentSession.workings.at(-1) ? currentSession.workings.at(-1)! : currentSession.start;
                    workingSessions.push(currentSession);
                }

                currentSession = {
                    start: time,
                    end: undefined,
                    workings: []
                };
                break;
            
            case EntryType.END:
                if (currentSession === undefined) {
                    // start is missing from this session, we can't do anything
                    continue;
                }
                // check whether there hasn't been too big of a gap between end and last working
                const lastWorkingEntry = currentSession.workings.at(-1);
                if (lastWorkingEntry !== undefined && Math.abs(time - lastWorkingEntry) > 3 * expectedWorkingGapMS) {
                    // gap too big, split the session
                    currentSession.end = lastWorkingEntry;
                    workingSessions.push(currentSession);
                    currentSession = {
                        start: lastWorkingEntry,
                        end: undefined,
                        workings: []
                    };
                }
                currentSession.end = time;
                workingSessions.push(currentSession);
                currentSession = undefined;
                break;
            
            case EntryType.WORKING:
                if (currentSession === undefined) {
                    // start is missing from this session, let's start now
                    currentSession = {
                        start: time,
                        end: undefined,
                        workings: []
                    };
                }
                // check whether there hasn't been too big of a gap between end and last working
                const lastWorking = currentSession.workings.at(-1);
                if (lastWorking !== undefined && Math.abs(time - lastWorking) > 3 * expectedWorkingGapMS) {
                    // gap too big, split the session
                    currentSession.end = lastWorking;
                    workingSessions.push(currentSession);
                    currentSession = {
                        start: lastWorking,
                        end: undefined,
                        workings: []
                    };
                }

                currentSession.workings.push(time);
                break;
            
            default:
                break;
        }
    }
    // now that we went through all the lines, we need to check if the last session has an end
    if (currentSession !== undefined) {
        // stop is missing from the last session, estimate it from working
        currentSession.end = currentSession.workings.at(-1) ? currentSession.workings.at(-1)! : currentSession.start;
        workingSessions.push(currentSession);
    }

    // now we have all the sessions fixed, we need to merge them back into one array
    let fixedLines: string[] = [];
    for (const session of workingSessions) {
        fixedLines.push(`${session.start} ${EntryType.START}`);
        for (const working of session.workings) {
            fixedLines.push(`${working} ${EntryType.WORKING}`);
        }
        fixedLines.push(`${session.end} ${EntryType.END}`);
    }

    return fixedLines;
}

interface CodingTimePerCommit {
    commitAuthor: string;
    commitMessage: string;
    commitTime: Date;
    userNames: string[];
    hoursSpent: number[];
}

// returns a list of commits and the time spend between them per user
async function calculateTimePerCommit(projectTimeyFolderUri: string): Promise<CodingTimePerCommit[]> {

    // these filenames double as usernames
    const filenames = await getFileNamesInFolder(projectTimeyFolderUri);

    let commits = await getCommitInfos();

    let toReturn: CodingTimePerCommit[] = [];

    if (commits === undefined) return toReturn;
    commits = commits.reverse();

    // load all user files with their time data
    const files: File[] = await Promise.all(filenames.map(async filename => {
        const fileContents = await fs.readFile(filename, 'utf8');
        return {
            name: filename,
            lines: fileContents.split('\n')
        };
    }));

    // now go through commits and find the time spent between them per user
    let timesPerCommit: CodingTimePerCommit[] = [];

    // treating first commit as a special case
    const firstCommit = commits[0];

    let firstCommitsUsers: string[] = [];
    let firstCommitsHours: number[] = [];

    for (const file of files) {
        if (file.lines.length === 0) continue;
        const firstRelevantLine = file.lines[0] === '' ? file.lines[1] : file.lines[0];
        const firstTimepoint = new Date(parseInt(firstRelevantLine.split(' ')[0]));
        if (firstTimepoint > firstCommit!.time) continue;   // this user contributed after the first commit
        const hoursSpent = (firstCommit!.time.getTime() - firstTimepoint.getTime()) / 1000 / 60 / 60;
        firstCommitsUsers.push(file.name.split('/')[file.name.split('/').length - 1].split('.')[0]);
        firstCommitsHours.push(hoursSpent);
    }

    timesPerCommit.push({
        commitAuthor: firstCommit!.author,
        commitMessage: firstCommit!.message,
        commitTime: firstCommit!.time,
        userNames: firstCommitsUsers,
        hoursSpent: firstCommitsHours
    });

    // now all the in between commits
    for (let i = 0; i < commits.length - 1; i++) {
        const earlyCommit = commits[i];
        const lateCommit = commits[i + 1];

        let users: string[] = [];
        let times: number[] = [];

        // now for each user
        for (const file of files) {
            if (file.lines.length === 0) continue;
            const username = file.name.split('/')[file.name.split('/').length - 1].split('.')[0];

            // get their times
            const starts = file.lines.filter(line => line.endsWith('start'));
            const ends = file.lines.filter(line => line.endsWith('end'));
            if (starts.length === ends.length + 1) {
                // the user hasnt ended their current session, so lets artificially add an end
                const rightNow = new Date().getTime();
                ends.push(`${rightNow} end`);
            }
            assert(starts.length === ends.length, "There is a different number of start times to end times in " + username + "!");

            // and add the differences of their times if they fit in the commit
            let thisCommitHours = 0;
            for (let i = 0; i < starts.length; i++) {
                const startTime = parseInt(starts[i].split(' ')[0]);
                const endTime = parseInt(ends[i].split(' ')[0]);

                const startOverlap = Math.max(startTime, earlyCommit.time.getTime());
                const endOverlap = Math.min(endTime, lateCommit.time.getTime());

                if (startOverlap < endOverlap) {
                    thisCommitHours += (endOverlap - startOverlap) / 1000 / 60 / 60;
                }
            }

            // add this user to the list
            users.push(username);
            times.push(thisCommitHours);
        }

        // when all user per this commit are done, add this commit to the list
        timesPerCommit.push({
            commitAuthor: lateCommit.author,
            commitMessage: lateCommit.message,
            commitTime: lateCommit.time,
            userNames: users,
            hoursSpent: times
        });
    }

    // and return the list
    return timesPerCommit.reverse();
}

export async function prettyOutputTimeCalcPerCommit(projectTimeyFolderUri?: string): Promise<string> {
    projectTimeyFolderUri ??= await getWorkspaceTimeyDir();

    const commits = await calculateTimePerCommit(projectTimeyFolderUri);

    let stringData = "";

    for (const commit of commits) {
        stringData += `## Commit by ${commit.commitAuthor} from ${commit.commitTime.toDateString()} ("${commit.commitMessage}")\n`;
        for (let i = 0; i < commit.userNames.length; i++) {
            stringData += `${commit.userNames[i]}: ${commit.hoursSpent[i].toFixed(2)} hours\n`;
        }
    }
    return stringData;
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

interface CodingTimeDWM {
    userName: string;
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
}

// calculates time spent coding in hours for today, this week, this month, and last month per user
export async function calculateTimePerDWM(projectTimeyFolderUri: string): Promise<CodingTimeDWM[]> {

    // these filenames double as usernames
    const userFilenames = await getFileNamesInFolder(projectTimeyFolderUri);

    const today = new Date();
    const todayUTX = getTodayUTX(today);
    const thisMondayUTX = getMondayUTX(today);
    const thisFirstUTX = getFirstOfThisMonthUTX(today);
    const lastFirstUTX = getFirstOfLastMonthUTX(today);

    let toReturn: CodingTimeDWM[] = [];

    // for each file make codingTime
    for (const userFilename of userFilenames) {
        const userName = userFilename.split('/')[userFilename.split('/').length - 1].split('.')[0]

        const fileContents = (await fs.readFile(userFilename, 'utf8')).split('\n');

        const starts = fileContents.filter(line => line.endsWith('start'));
        const ends = fileContents.filter(line => line.endsWith('end'));
        if (starts.length === ends.length + 1) {
            // the user hasnt ended their current session, so lets artificially add an end
            const rightNow = new Date().getTime();
            ends.push(`${rightNow} end`);
        }
        assert(starts.length === ends.length, "There is a different number of start times to end times in " + userFilename + "!");

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
export async function prettyOutputTimeCalc(projectTimeyFolderUri?: string, userName?: string): Promise<string> {
    projectTimeyFolderUri ??= await getWorkspaceTimeyDir();

    const data = await calculateTimePerDWM(projectTimeyFolderUri);
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
        stringData += await prettyOutputTimeCalc(dir, userName);
    }
    return stringData;
}