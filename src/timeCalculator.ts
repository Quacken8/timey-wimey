import * as fs from 'fs';

function getFilesInFolder(folderPath: string): string[] {
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

function getMondayUTX(date: Date): number {
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return monday.getTime();
}

function getFirstOfThisMonthUTX(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

interface CodingTime {
    userName: string;
    today: number;
    thisWeek: number;
    thisMonth: number;
}

export function calculateTime(folderUri: string) : CodingTime[] {
    // search .vscode/timewimey for all text files
    const files = getFilesInFolder(folderUri);
    
    const today = new Date();
    const thisMondayUTX = getMondayUTX(today);
    const thisFirstUTX = getFirstOfThisMonthUTX(today);

    // for each file make codingTime
    for (const file of files) {
        
        

    }

    // return codingTime


}