import type Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
  return knex.raw(`
    drop table if exists "fileStorageCategories" cascade;
    create table "fileStorageCategories" (
      "category" varchar(100) not null,
      CONSTRAINT "fileStorageCategories_un" UNIQUE ("category")
    );

    alter table "fileStorage" add constraint "fileStorage_category_fk" foreign key ("category") references "fileStorageCategories"("category") on delete cascade;
  `);
}


export async function down(knex: Knex): Promise<any> {
  return knex.raw(`
    alter table "fileStorage" drop constraint "fileStorage_category_fk";
    drop table  "fileStorageCategories" cascade;
  `);
}
