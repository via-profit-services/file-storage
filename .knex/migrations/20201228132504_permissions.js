module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 503:
/***/ (function(__unused_webpack_module, exports) {


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
function up(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        return knex.raw(`
    DROP TABLE IF EXISTS roles CASCADE;

    CREATE TABLE roles (
      "name" varchar(100) NOT NULL,
      "description" text NULL,
      CONSTRAINT roles_pk PRIMARY KEY (name)
    );

    DROP TABLE IF EXISTS "privileges" CASCADE;
      CREATE TABLE "privileges" (
      "name" varchar(100) NOT NULL,
      "description" text NULL,
      CONSTRAINT privileges_pk PRIMARY KEY (name)
    );

    DROP TABLE IF EXISTS "roles2privileges" CASCADE;
    CREATE TABLE "roles2privileges" (
      "role" varchar(100) NOT NULL,
      "privilege" varchar(100) NOT NULL,
      CONSTRAINT "roles2privileges_un" UNIQUE (role, privilege)
    );

    ALTER TABLE "roles2privileges" ADD CONSTRAINT "roles2privileges_privilege_fk" FOREIGN KEY (privilege) REFERENCES privileges(name) ON DELETE CASCADE;
    ALTER TABLE "roles2privileges" ADD CONSTRAINT "roles2privileges_role_fk" FOREIGN KEY (role) REFERENCES roles(name) ON DELETE CASCADE;
  

    DROP TYPE IF EXISTS "permissionsType";
    CREATE TYPE "permissionsType" AS ENUM (
      'grant',
      'restrict'
    );
    
    DROP TABLE IF EXISTS "permissions" CASCADE;
    CREATE TABLE "permissions" (
      "typeName" varchar(100) NOT NULL,
      "fieldName" varchar(100) NOT NULL,
      "type" "permissionsType" NOT NULL DEFAULT 'grant'::"permissionsType",
      "privilege" varchar(100) NOT NULL,
      CONSTRAINT permissions_un UNIQUE ("typeName","fieldName",privilege)
    );

    ALTER TABLE "permissions" ADD CONSTRAINT "permissions_privilege_fk" FOREIGN KEY (privilege) REFERENCES privileges(name) ON DELETE CASCADE;

    
    -- insert default roles set
    insert into roles
      ("name", "description")
    values 
      ('viewer', 'Used as viewer/reader. Accounts have this role can make request only to display data, not mutate.'),
      ('developer', 'Accounts have this role can make all requests without limits.'),
      ('administrator', 'Accounts have this role can make all requests without limits.');

    -- insert privileges
    insert into privileges
      ("name", "description")
    values
      ('*', 'Unlimited access'),
      ('user.read.phones', 'Read user phone number'),
      ('account.read.login', 'Read user login'),
      ('account.read.password', 'Read user password hash'),
      ('account.read.recoveryPhones', 'Read account recovery phones');

    -- insert roles2privileges
    insert into "roles2privileges"
      ("role", "privilege")
    values
      ('developer', '*'),
      ('administrator', '*'),
      ('viewer', 'user.read.phones'),
      ('viewer', 'account.read.login');

    -- inser permissions
    insert into "permissions"
      ("typeName", "fieldName", "type", "privilege")
    values
    ('TokenBag', '*', 'grant', '*'),
    ('AccessToken', '*', 'grant', '*'),
    ('RefreshToken', '*', 'grant', '*'),
    ('AccessTokenPayload', '*', 'grant', '*'),
    ('RefreshTokenPayload', '*', 'grant', '*'),
    ('TokenRegistrationError', '*', 'grant', '*'),
    ('TokenVerificationError', '*', 'grant', '*'),
    ('AuthentificationMutation', '*', 'grant', '*'),
    ('AuthentificationQuery', '*', 'grant', '*'),
    ('Account', 'login', 'grant', 'account.read.login'),
    ('Account', 'password', 'grant', 'account.read.password'),
    ('Account', 'recoveryPhones', 'grant', 'account.read.recoveryPhones'),
    ('User', 'phones', 'grant', 'user.read.phones');
  `);
    });
}
exports.up = up;
function down(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        return knex.raw(`
    DROP TABLE IF EXISTS "permissions" CASCADE;
    DROP TABLE IF EXISTS "roles2privileges" CASCADE;
    DROP TABLE IF EXISTS "privileges" CASCADE;
    DROP TABLE IF EXISTS "roles" CASCADE;
  `);
    });
}
exports.down = down;


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
/******/ 	return __webpack_require__(503);
/******/ })()
;