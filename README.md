# Best Games web scrapper

## Description
This is a web scrapper that will get the listed top games from any website. I use NintendoLife for my examples since their top50 structures are kept accross consoles.

With the trimRoms flag turned on, will remove the roms not found with a partial match from the list.

**LIMITATIONS**
The match algorithm is very primitive with normalizing both your rom files and the list of game names (removing extensions, spaces, etc.). If a match is found and the async fs call to unlink the file is not commented, it will delete the file from your system. I know the nested `.some` will give abherent matches with only numbers or `the` but hey it's a start.

## Installation
With node installed, run `npm install` to install the dependencies (including typescript).

## Quick Usage (NintendoLife example)
1. Create a `.env` with your home directory path:
`HOMEDIR="/home/yourusername"`

2. Customize the `bestGamesFetcher.ts`:
- Change the `selectConsole` to your console of interest
- Change the `baseUrl` to the website you want to scrape (and urls if needed)
- Change the `romsDir` to the directory where your roms are located
- Keep the `fs.promises.unlink()` commented out for a dry run or uncomment to delete the file matches

3. Run `ts-node bestGamesFetcher.ts --help` to see the options:

- `--trimRoms` will remove the roms not found with a partial match from the list
- No options will just print the list of roms found and save to a file

**See the base example with snes already pushed on the repo**