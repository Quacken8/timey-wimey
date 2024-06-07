# Timey Wimey Time Tracker

Timey Wimey is a simple, free time tracker extension for Visual Studio Code. It keeps track of time spent coding per project.

## Features

- Tracks your working time per workspace, per file, and even per commit.
- Uses local installation of `sqlite3` making it work anywhere where sqlite runs.
- Allows you to use your own database instead of sqlite.
- Shows the tracking data in a handy webview UI
- **TBD** Allows you to add a custom tracker to track whatever you'd like.

## !Prerequisites

- By default this extension requires the machine's shell to understand `sqlite3`. For MacOS and most Linux distros `sqlite3` is already installed.
- If it isn't installed download it from [the official website](https://sqlite.org/download.html) and don't forget to put it in PATH
  - or define your own db command in the configuration

## Usage

- The extension tracks time automatically by checking what you are working in periodical intervals
- During the interval you are considered working if the Vscode window was focused and considered writing if you have written or deleted any text
- A timer on the right side of the status bar shows how much time you have spent working today.
- The timer updates every minute, however if the checking interval is longer than that new data won't show until the interval ends
- Clicking on the timer opens up an interactive UI with a graph and a bunch of filtering options
- Timey also supports manual entries which may come in handy for situations where work related to a workspace or a file doesn't neccesiraly also mean your Vscode was in focus

## Configuration

You can customize the behavior of Timey Wimey in your settings:

- `timeyWimey.writeInterval`: How often to write to the database in minutes (default: 5). Shorter time means more accurate data but bigger database
- `timeyWimey.dbCommand`: What command to use to talk to the database (default: `sqlite3`). It is expected it understands sqlite3 syntax, specifically `command -cmd \".parameter init\" -cmd \".parameter set :name 'value'\" -cmd \".separator LINE ROW\" \"path/to/db/file.sqlite\" \"SQL QUERY WITH :name PARAMETERS\"`, output to sdtout is expected with columns separated by `LINE` and rows by `ROW`, and the schema of the database is expected as such:
  | Column name | type | flag |
  |-------------|------|------|
  | 'id' | integer |PRIMARY KEY AUTOINCREMENT NOT NULL |
  | 'date' | integer |NOT NULL |
  | 'interval_minutes' | real |NOT NULL |
  | 'working'| integer | NOT NULL |
  | 'window_focused'| integer | NOT NULL |
  | 'workspace'| text| |
  | 'current_file' | text| |
  | 'last_commit_hash'| text| |
  | 'custom' | text| |
