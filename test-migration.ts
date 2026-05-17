import { readDatabase } from "./src/lib/database";
console.log("Migrating if needed...");
readDatabase();
console.log("Done");
