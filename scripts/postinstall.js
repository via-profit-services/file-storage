/* eslint-disable */
const fs = require('fs');
const path = require('path');

const initCWD = process.env.INIT_CWD;
const migrationsSource = path.resolve(__dirname, '../.knex/migrations');
const migrationsDestination = path.resolve(initCWD, './.knex/migrations');
const migrationFiles = fs.readdirSync(migrationsSource).filter((filename) => filename.match(/\.js$/));

if (!fs.existsSync(path.basename(migrationsDestination))) {
  fs.mkdirSync(path.basename(migrationsDestination), { recursive: true });
}

migrationFiles.forEach((filename) => {
  fs.copyFileSync(
    path.resolve(migrationsSource, filename),
    path.resolve(migrationsDestination, filename),
  )
});
