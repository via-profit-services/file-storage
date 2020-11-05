export async function up(knex: any): Promise<any> {
  return knex.raw(`
    ALTER TYPE "fileStorageType" RENAME TO "fileStorageTypeOLD";
    create type "fileStorageType" as enum (
      'image',
      'document',
      'template'
    );
    ALTER TABLE "fileStorage" ALTER COLUMN "type" TYPE "fileStorageType" USING 'document'::"fileStorageType";
    drop type "fileStorageTypeOLD" cascade;
  `);
}


export async function down(knex: any): Promise<any> {
  return knex.raw(`
    ALTER TYPE "fileStorageType" RENAME TO "fileStorageTypeOLD";
    create type "fileStorageType" as enum (
      'image',
      'document'
    );
    ALTER TABLE "fileStorage" ALTER COLUMN "type" TYPE "fileStorageType" USING 'document'::"fileStorageType";
    drop type "fileStorageTypeOLD" cascade;
  `);
}
