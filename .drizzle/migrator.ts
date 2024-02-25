import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";

export const doMigrate = (pathToDB: string) => {
  const betterSqlite = new Database(pathToDB);
  const db = drizzle(betterSqlite);

  migrate(db, { migrationsFolder: ".drizzle/migrations" });

  betterSqlite.close();
  console.log("closed");
};

doMigrate("/home/ondra/.vscode/extensions/timeyBoogaloo/db/timey.db");
