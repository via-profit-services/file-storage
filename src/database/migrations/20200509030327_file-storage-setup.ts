import { Knex } from 'knex';

export async function up(knex: Knex): Promise<any> {
  return knex.raw(`
    DROP TABLE if exists "fileStorage" cascade;
    DROP TABLE if exists "fileStorageCategories" cascade;
    drop type if exists "fileStorageType";


    CREATE TYPE "fileStorageType" AS enum (
      'image',
      'document'
    );


    CREATE TABLE "fileStorage" (
      id uuid NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "owner" uuid NULL,
      "type" "fileStorageType" NOT NULL,
      category varchar(100) NOT NULL,
      "mimeType" varchar(255) NOT NULL,
      url varchar(255) NOT NULL,
      description varchar(255) NOT NULL,
      "isLocalFile" bool NOT NULL DEFAULT true,
      "metaData" jsonb NOT NULL DEFAULT '{}'::jsonb,
      CONSTRAINT "fileStorage_pk" PRIMARY KEY (id)
    );

    CREATE TABLE "fileStorageCategories" (
      category varchar(100) NOT NULL,
      CONSTRAINT "fileStorageCategories_un" UNIQUE (category)
    );

    ALTER TABLE "fileStorage" ADD CONSTRAINT "fileStorage_category_fk" FOREIGN KEY (category) REFERENCES "fileStorageCategories"(category) ON DELETE CASCADE;
  `);
}


export async function down(knex: Knex): Promise<any> {
  return knex.raw(`
    DROP TABLE if exists "fileStorage" cascade;
    DROP TABLE if exists "fileStorageCategories" cascade;
    drop type if exists "fileStorageType";
  `);
}
