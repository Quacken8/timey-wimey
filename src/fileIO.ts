import * as fs from 'fs';

// remove all lines ending with "working" from file
export function removeWorkingEntries(filePath: string) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    const newLines = lines.filter(line => !line.endsWith('working'));
    fs.writeFileSync(filePath, newLines.join('\n'));
}


export function recordWorking(file: fs.WriteStream) {
    // append working to file with timestamp

    const timestamp = new Date().getTime();
    const progressLine = `\n${timestamp} working`;

    file.write(progressLine);

}

export function recordEnd(file: fs.WriteStream) {
    // append end to file with timestamp

    const timestamp = new Date().getTime();
    const endLine = `\n${timestamp} end`;

    file.write(endLine);
}

export function recordStart(file: fs.WriteStream) {
    // append start to file with timestamp
    const timestamp = new Date().getTime();
    const startLine = `\n${timestamp} start`;

    file.write(startLine);
}

export function checkForUnfinishedData(filePath: string) {

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