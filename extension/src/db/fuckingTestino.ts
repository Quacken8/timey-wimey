import sqlite3InitModule, { Sqlite3Static } from "@sqlite.org/sqlite-wasm";

const start = function (sqlite3: Sqlite3Static) {
  console.log("Running SQLite3 version", sqlite3.version.libVersion);
  const db = new sqlite3.oo1.DB("fokinTest.sqlite3", "ct");
  db.exec("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT);");
  db.exec("INSERT INTO test (name) VALUES ('Hello, world!');");
  console.log(db.selectArray("SELECT * FROM test;"));
  // Your SQLite code here.
};

console.log("Loading and initializing SQLite3 module...");
sqlite3InitModule({
  print: (msg: string) => console.log(msg),
  printErr: (err: string) => console.error(err),
}).then((sqlite3) => {
  try {
    console.log("Done initializing. Running demo...");
    start(sqlite3);
  } catch (err: any) {
    console.error(err.name, err.message);
  }
});
