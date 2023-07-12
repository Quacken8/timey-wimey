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