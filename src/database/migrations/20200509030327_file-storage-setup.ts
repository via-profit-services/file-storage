import { Knex } from '@via-profit-services/core';


export async function up(knex: Knex): Promise<any> {
  return knex.raw(`

    drop type if exists "fileStorageType" cascade;

    create type "fileStorageType" as enum (
      'image',
      'document'
    );

    drop table if exists "fileStorage";

    CREATE TABLE "fileStorage" (
      "id" uuid NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "owner" uuid NULL,
      "type" "fileStorageType" NOT NULL,
      "category" varchar(100) NOT NULL,
      "mimeType" varchar(255) NOT NULL,
      "url" varchar(255) NOT NULL,
      "description" varchar(255) NULL DEFAULT NULL,
      "isLocalFile" boolean NOT NULL DEFAULT true,
      "metaData" jsonb NOT NULL DEFAULT '{}'::jsonb,
      CONSTRAINT "fileStorage_pk" PRIMARY KEY (id)
    );
    
    comment on column "fileStorage"."category" is 'Just the name of the file category, for example, for a catalog - items;category';
  `);
}


export async function down(knex: Knex): Promise<any> {
  return knex.raw(`
    drop table if exists "fileStorage" cascade;
    drop type if exists "fileStorageType" cascade;
  `);
}
