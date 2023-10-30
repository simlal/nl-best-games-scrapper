import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";

import { get } from "https";
import { load } from "cheerio";

// optional trimRoms arg
const trimRomsArg: string = "--trimRoms";

// load env variables
dotenv.config();

// dirs from dotenv
const selectConsole = "nintendo_snes";    //*USE REAL NAME OF YOUR DIR WITH YOUR ROMS
const homeDir = process.env.HOMEDIR
let consoleDir: string;
if (homeDir) {
    const romsDir = path.join(homeDir, "roms");
    consoleDir = path.join(romsDir, selectConsole);    
}

// urls to scrape for bestGames
//* baseUrl and urls array to change according to website scrape
const baseUrl: string = "https://www.nintendolife.com/guides/50-best-super-nintendo-snes-games-of-all-time";
const urls: Array<string> = [
    baseUrl,
    baseUrl + "?page=2",
    baseUrl + "?page=3",
    baseUrl + "?page=4",
    baseUrl + "?page=5"
]
// unique css selector to fetch gameName
//*to change according to selector on site scrapped
const cssSelector: string = "h2 a";

// Manage optional trimRoms arg
function processArg() {
    if (process.argv.length > 3) {
        console.log("Too many arguments, only one optional argument allowed");
        process.exit(1);
    }

    
    if (process.argv[2] === "--help" && process.argv.length === 3) {
        console.log("Usage: node bestGamesFetcher.ts [trimRoms]");
        console.log("Optional argument: trimRoms - deletes roms not found in bestGamesList with vague matching");
        process.exit(1);
    } else if (process.argv[2] != trimRomsArg && process.argv.length === 3) {
        console.log("Invalid argument, enter '--trimRoms' to trim roms using vague matching of fetched bestGamesList");
        process.exit(1);
    } else if (process.argv[2] === trimRomsArg && process.argv.length === 3) {
        return true;
    } else {
        return false;
    }
}

// Fetch data for a single bestOf url
function getDocument(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      get(url, (res) => {
        console.log(`Fetching data from ${url}...`)
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
        res.on("error", (err) => reject(err));
      });
    });
}

async function fetchBestGames(): Promise<String[]> {
    const arr = new Array<String>;
    // Fetch each 10 entries per page
    const promises = urls.map(url => 
        getDocument(url)
        .then((data) => {
            const $ = load(data);
            const bestGames = $(cssSelector)
            bestGames.toArray().forEach(element => {
                const html = $(element).html();
                if (html != undefined) {
                    arr.push(html)
                }
            });
        })
    );
    try {
        await Promise.all(promises);
    } catch (err) {
        console.error(err);
    } finally {
        return arr;
    }
}

async function main(trimRoms: boolean): Promise<void> {
    // Fetch the best games from host
    const host = get(baseUrl).getHeader("host");
    console.log(`Best games for ${selectConsole} from ${host}:`)
    
    const bestGamesList = await fetchBestGames();
    console.log(bestGamesList)

    // Write results to file
    const resultsFileName: string = "bestGamesList.txt"


    fs.writeFile(path.join(".", resultsFileName), bestGamesList.join("\n"), err => {
        if (err) throw err;
        console.log(`file ${resultsFileName} saved!`)
    });

    if (trimRoms && consoleDir) {
        // Convert game items to normalized arr
        const normBestGamesList = bestGamesList.map(game => {
            const normalizedGameWords = game.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(" ");
            return normalizedGameWords;
        })

        // I/O operations
        try {
            const files = await fs.promises.readdir(consoleDir);
            let matchCount: number = 0

            for (let file of files) {
                // Strip extension from rom
                const fileBaseName: string = file.split(".")[0]
                const normalizedFileWords: string[] = fileBaseName.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(" ");
                
                // 
                const isFoundInArray = normBestGamesList.some(gameList => {
                    return normalizedFileWords.some(word => gameList.includes(word));
                });
                if (!isFoundInArray) {
                    // *REMOVE COMMENT TO ACTUALLY DELETE FILES 
                    // await fs.promises.unlink(path.join(consoleDir, file));
                    console.log(`Deleted ${file}`)
                } else {
                    matchCount += 1;
                }
            }
            console.log(`Kept ${matchCount} games post filtering of bestGamesList`)
        } catch(err) {
            console.log(err)
        }
    }
}

main(processArg());

