import "dotenv/config";
import { createDbConnection, getDbPath, runMigrations } from "./db.mjs";

const db = createDbConnection();
runMigrations(db);
db.close();

// eslint-disable-next-line no-console
console.log(`Migrations completed. DB: ${getDbPath()}`);
