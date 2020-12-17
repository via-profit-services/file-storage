module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 827:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.down = exports.up = void 0;
const uuid_1 = __webpack_require__(231);
function up(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        const accounts = yield knex.select('*').from('accounts');
        yield knex.raw(`
    alter table "accounts" drop column "name" cascade; 
    alter table "accounts" drop column "comment"; 

    CREATE TABLE "users" (
      "id" uuid NOT NULL,
      "account" uuid NULL,
      "name" varchar(100) NOT NULL,
      "phones" jsonb NOT NULL DEFAULT '[]'::jsonb,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "deleted" boolean NOT NULL DEFAULT false,
      "comment" text NULL,
      CONSTRAINT users_pkey PRIMARY KEY (id)
    );
 
    CREATE INDEX "usersDeletedIndex" ON users USING btree (deleted);
    ALTER TABLE "users" ADD CONSTRAINT "usersToAccounts_fk" FOREIGN KEY (account) REFERENCES "accounts"(id) ON DELETE SET NULL;

  `);
        if (accounts.length) {
            yield knex.insert(accounts.map((account) => ({
                id: uuid_1.v4(),
                createdAt: account.createdAt,
                updatedAt: account.updatedAt,
                account: account.id,
                name: account.name,
                phones: '[]',
                deleted: account.deleted,
                comment: account.comment,
            }))).into('users');
        }
    });
}
exports.up = up;
function down(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield knex('users').select('*').whereNotNull('account');
        yield knex.raw(`
    drop table if exists "users" cascade;
    alter table "accounts" add column "name" varchar(100) NOT NULL default '';
    alter table "accounts" add column "comment" text NULL;
  `);
        yield users.reduce((prev, user) => __awaiter(this, void 0, void 0, function* () {
            yield prev;
            knex('accounts').update({
                name: user.name,
                comment: user.comment,
            }).where({
                id: user.account,
            });
        }), Promise.resolve());
    });
}
exports.down = down;


/***/ }),

/***/ 231:
/***/ ((module) => {

module.exports = require("uuid");;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(827);
/******/ })()
;