/*!
 * 
 *  Via Profit Services / Settings Manager
 * 
 *  Repository https://gitlab.com/via-profit-services/file-storage
 *  Contact    promo@via-profit.ru
 *  Website    https://via-profit.ru
 *       
 */
module.exports=function(e){var i={};function n(t){if(i[t])return i[t].exports;var a=i[t]={i:t,l:!1,exports:{}};return e[t].call(a.exports,a,a.exports,n),a.l=!0,a.exports}return n.m=e,n.c=i,n.d=function(e,i,t){n.o(e,i)||Object.defineProperty(e,i,{enumerable:!0,get:t})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,i){if(1&i&&(e=n(e)),8&i)return e;if(4&i&&"object"==typeof e&&e&&e.__esModule)return e;var t=Object.create(null);if(n.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:e}),2&i&&"string"!=typeof e)for(var a in e)n.d(t,a,function(i){return e[i]}.bind(null,a));return t},n.n=function(e){var i=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(i,"a",i),i},n.o=function(e,i){return Object.prototype.hasOwnProperty.call(e,i)},n.p="",n(n.s=6)}([function(e,i){e.exports=require("@via-profit-services/core")},function(e,i,n){"use strict";var t=this&&this.__awaiter||function(e,i,n,t){return new(n||(n=Promise))((function(a,r){function d(e){try{o(t.next(e))}catch(e){r(e)}}function l(e){try{o(t.throw(e))}catch(e){r(e)}}function o(e){var i;e.done?a(e.value):(i=e.value,i instanceof n?i:new n((function(e){e(i)}))).then(d,l)}o((t=t.apply(e,i||[])).next())}))},a=this&&this.__rest||function(e,i){var n={};for(var t in e)Object.prototype.hasOwnProperty.call(e,t)&&i.indexOf(t)<0&&(n[t]=e[t]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var a=0;for(t=Object.getOwnPropertySymbols(e);a<t.length;a++)i.indexOf(t[a])<0&&Object.prototype.propertyIsEnumerable.call(e,t[a])&&(n[t[a]]=e[t[a]])}return n},r=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(i,"__esModule",{value:!0});const d=r(n(15)),l=r(n(4)),o=n(0),u=r(n(16)),s=r(n(17)),m=n(18),c=n(2),f=n(5);class p{constructor(e){this.props=e}static getPathFromUuid(e){return[e.substr(0,2),e.substr(2,2),e.substr(4)].join("/")}static getFilenameFromUuid(e){const{storagePath:i}=c.getParams(),n=p.getPathFromUuid(e);return l.default.join("/",i,n)}static getFileTypeByMimeType(e){switch(e){case"image/png":case"image/jpeg":case"image/webp":case"image/gif":case"image/svg":return f.FileType.image;default:return f.FileType.document}}static getExtensionByMimeType(e){return u.default.extension(e)||"txt"}static getMimeTypeByExtension(e){return u.default.lookup(e)||"text/plain"}static extractExtensionFromFilename(e){return e.split(".").pop()}static getMimeTypeByFilename(e){const i=p.extractExtensionFromFilename(e);return p.getMimeTypeByExtension(i)}getFiles(e){return t(this,void 0,void 0,(function*(){const{context:i}=this.props,{knex:n}=i,{staticPrefix:t,host:r,ssl:d,staticDelimiter:l}=c.getParams(),{limit:u,offset:s,orderBy:m,where:f}=e,p=yield n.select(["*",n.raw('count(*) over() as "totalCount"')]).orderBy(o.convertOrderByToKnex(m)).from("fileStorage").limit(u||1).offset(s||0).where(e=>o.convertWhereToKnex(e,f)).orderBy(o.convertOrderByToKnex(m)).then(e=>({totalCount:e.length?Number(e[0].totalCount):0,nodes:e.map(e=>{var{totalCount:i,url:n}=e,o=a(e,["totalCount","url"]);return Object.assign(Object.assign({},o),{url:o.isLocalFile?`http${d?"s":""}://${r}${t}/${l}/${n}`:n})})})),{totalCount:y,nodes:v}=p;return{totalCount:y,nodes:v,where:f,orderBy:m,limit:u,offset:s}}))}getFilesByIds(e){return t(this,void 0,void 0,(function*(){const{nodes:i}=yield this.getFiles({where:[["id",o.TWhereAction.IN,e]],offset:0,limit:e.length});return i}))}getDriver(e){return t(this,void 0,void 0,(function*(){const i=yield this.getFilesByIds([e]);return!!i.length&&i[0]}))}updateFile(e,i){return t(this,void 0,void 0,(function*(){const{knex:n,timezone:t}=this.props.context;yield n("fileStorage").update(Object.assign(Object.assign({},i),{updatedAt:s.default.tz(t).format()})).where("id",e)}))}createFile(e,i){return t(this,void 0,void 0,(function*(){const{knex:n,timezone:t}=this.props.context,{storageAbsolutePath:a}=c.getParams(),r=i.id||m.v4(),u=p.getExtensionByMimeType(i.mimeType),f=`${p.getPathFromUuid(r)}.${u}`,y=i.url||f,v=(yield n("fileStorage").insert(Object.assign(Object.assign({isLocalFile:!0,id:r,url:y,type:p.getFileTypeByMimeType(i.mimeType)},i),{createdAt:s.default.tz(t).format(),updatedAt:s.default.tz(t).format()})).returning("id"))[0];if(!v)throw new o.ServerError("Failed to register file in Database");const k=l.default.join(a,f),N=l.default.dirname(k);return new Promise(i=>{d.default.existsSync(N)||d.default.mkdirSync(N,{recursive:!0}),e.pipe(d.default.createWriteStream(k)).on("close",()=>{i({id:v,absoluteFilename:k})})})}))}deleteFiles(e){return t(this,void 0,void 0,(function*(){const{knex:i}=this.props.context,n=yield this.getFilesByIds(e);n.length&&n.forEach(e=>{if(e.isLocalFile||e.url.match(/^\/[a-z0-9]+/i)){const i=p.getFilenameFromUuid(e.id),n=l.default.resolve(i),t=l.default.dirname(i),a=l.default.resolve(t,"..");try{d.default.existsSync(n)&&d.default.unlinkSync(n),d.default.readdirSync(t).length&&d.default.unlinkSync(t),d.default.readdirSync(a).length&&d.default.unlinkSync(a)}catch(i){throw new o.ServerError(`\n              Failed to delete file ${e.id} in path ${n}`,{err:i})}}});const t=yield i("fileStorage").del().whereIn("id",e).returning("id");return t.forEach(e=>{const i=p.getFilenameFromUuid(e);console.log("remove file from path "+i)}),t}))}}i.FileStorageService=p,i.default=p},function(e,i,n){"use strict";(function(e){var t=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(i,"__esModule",{value:!0});const a=t(n(4)),r=a.default.join(e,"..","..",".."),d={params:{storagePath:"",staticPrefix:"",ssl:!1,host:"localhost",staticPrefixAbsolutePath:"",storageAbsolutePath:"",rootPath:r,imageOptimMaxWidth:800,imageOptimMaxHeight:600,staticDelimiter:"s",genericDelimiter:"g"}};i.setParams=e=>{const i=a.default.resolve(r,e.staticPrefix),n=a.default.resolve(r,e.storagePath);d.params=Object.assign(Object.assign(Object.assign({},d.params),e),{staticPrefixAbsolutePath:i,storageAbsolutePath:n})},i.getParams=()=>d.params,i.default=d}).call(this,"src/schemas/file-storage")},function(e,i,n){"use strict";var t=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(i,"__esModule",{value:!0});const a=n(0),r=t(n(1)),d={files:null};i.default=function(e){if(null!==d.files)return d;const i=new r.default({context:e});return d.files=new a.DataLoader(e=>i.getFilesByIds(e).then(i=>a.collateForDataloader(e,i))),d}},function(e,i){e.exports=require("path")},function(e,i,n){"use strict";Object.defineProperty(i,"__esModule",{value:!0}),function(e){e.image="image",e.document="document"}(i.FileType||(i.FileType={}))},function(e,i,n){"use strict";Object.defineProperty(i,"__esModule",{value:!0}),function(e){for(var n in e)i.hasOwnProperty(n)||(i[n]=e[n])}(n(7))},function(e,i,n){"use strict";Object.defineProperty(i,"__esModule",{value:!0}),function(e){for(var n in e)i.hasOwnProperty(n)||(i[n]=e[n])}(n(8))},function(e,i,n){"use strict";function t(e){for(var n in e)i.hasOwnProperty(n)||(i[n]=e[n])}var a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(i,"__esModule",{value:!0});const r=a(n(9));i.makeSchema=r.default;const d=a(n(1));i.service=d.default,t(n(5)),t(n(24))},function(e,i,n){"use strict";var t=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}},a=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var i={};if(null!=e)for(var n in e)Object.hasOwnProperty.call(e,n)&&(i[n]=e[n]);return i.default=e,i};Object.defineProperty(i,"__esModule",{value:!0});const r=t(n(10)),d=n(2),l=t(n(11)),o=t(n(13)),u=a(n(23));i.makeSchema=e=>{d.setParams(e);const i=r.default(e);return{typeDefs:u,resolvers:o.default,permissions:l.default,expressMiddleware:i}},i.default=i.makeSchema},function(e,i,n){"use strict";Object.defineProperty(i,"__esModule",{value:!0});const t=n(0),a=n(2);i.default=e=>({context:i})=>{const{staticPrefix:n}=e,{logger:r}=i,{storageAbsolutePath:d,staticDelimiter:l}=a.getParams();r.fileStorage.info(`Registered static directory in [${d}] with static prefix [${n}]`);const o=t.Express.Router();return o.use(`${n}/${l}`,t.Express.static(d)),o}},function(e,i,n){"use strict";Object.defineProperty(i,"__esModule",{value:!0});const t=n(12);i.permissions=t.shield({}),i.default=i.permissions},function(e,i){e.exports=require("graphql-shield")},function(e,i,n){"use strict";var t=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(i,"__esModule",{value:!0});const a=t(n(14)),r=t(n(19)),d=t(n(20)),l=t(n(21)),o=t(n(22)),u={Query:{fileStorage:()=>({})},Mutation:{fileStorage:()=>({})},FileStorageQuery:{list:d.default,image:(e,i)=>i},FileStorageMutation:{delete:a.default,upload:o.default},File:r.default,Image:l.default};i.default=u},function(e,i,n){"use strict";var t=this&&this.__awaiter||function(e,i,n,t){return new(n||(n=Promise))((function(a,r){function d(e){try{o(t.next(e))}catch(e){r(e)}}function l(e){try{o(t.throw(e))}catch(e){r(e)}}function o(e){var i;e.done?a(e.value):(i=e.value,i instanceof n?i:new n((function(e){e(i)}))).then(d,l)}o((t=t.apply(e,i||[])).next())}))},a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(i,"__esModule",{value:!0});const r=n(0),d=a(n(3)),l=a(n(1));i.default=(e,i,n)=>t(void 0,void 0,void 0,(function*(){const{ids:e}=i,{logger:t,token:a}=n,{uuid:o}=a,u=new l.default({context:n}),s=d.default(n);try{const i=yield u.deleteFiles(e);return i.forEach(e=>{s.files.clear(e),t.fileStorage.debug(`File ${e} was deleted. Initiator: Account ${o}`)}),i.length!==e.length&&t.fileStorage.debug("Not all files were deleted, because some of them were not found in the database"),!0}catch(e){throw t.fileStorage.error("Failed to Delete files",{err:e,uuid:o}),new r.ServerError("Failed to Delete files",{err:e,uuid:o})}}))},function(e,i){e.exports=require("fs")},function(e,i){e.exports=require("mime-types")},function(e,i){e.exports=require("moment-timezone")},function(e,i){e.exports=require("uuid")},function(e,i,n){"use strict";var t=this&&this.__awaiter||function(e,i,n,t){return new(n||(n=Promise))((function(a,r){function d(e){try{o(t.next(e))}catch(e){r(e)}}function l(e){try{o(t.throw(e))}catch(e){r(e)}}function o(e){var i;e.done?a(e.value):(i=e.value,i instanceof n?i:new n((function(e){e(i)}))).then(d,l)}o((t=t.apply(e,i||[])).next())}))},a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(i,"__esModule",{value:!0});const r=a(n(3)),d=new Proxy({id:()=>({}),createdAt:()=>({}),updatedAt:()=>({}),owner:()=>({}),category:()=>({}),mimeType:()=>({}),url:()=>({}),description:()=>({}),metaData:()=>({})},{get:(e,i)=>(e,n,a)=>t(void 0,void 0,void 0,(function*(){const{id:n}=e,t=r.default(a);return(yield t.files.load(n))[i]}))});i.default=d},function(e,i,n){"use strict";var t=this&&this.__awaiter||function(e,i,n,t){return new(n||(n=Promise))((function(a,r){function d(e){try{o(t.next(e))}catch(e){r(e)}}function l(e){try{o(t.throw(e))}catch(e){r(e)}}function o(e){var i;e.done?a(e.value):(i=e.value,i instanceof n?i:new n((function(e){e(i)}))).then(d,l)}o((t=t.apply(e,i||[])).next())}))},a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(i,"__esModule",{value:!0});const r=n(0),d=a(n(3)),l=a(n(1));i.default=(e,i,n)=>t(void 0,void 0,void 0,(function*(){const{logger:e}=n,t=r.buildQueryFilter(i),a=new l.default({context:n}),o=d.default(n);try{const e=yield a.getFiles(t),i=r.buildCursorConnection(e,"files");return e.nodes.forEach(e=>{o.files.clear(e.id).prime(e.id,e)}),i}catch(i){throw e.fileStorage.error("Failed to get Files list",{err:i}),new r.ServerError("Failed to get Files list",{err:i})}}))},function(e,i,n){"use strict";var t=this&&this.__awaiter||function(e,i,n,t){return new(n||(n=Promise))((function(a,r){function d(e){try{o(t.next(e))}catch(e){r(e)}}function l(e){try{o(t.throw(e))}catch(e){r(e)}}function o(e){var i;e.done?a(e.value):(i=e.value,i instanceof n?i:new n((function(e){e(i)}))).then(d,l)}o((t=t.apply(e,i||[])).next())}))},a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(i,"__esModule",{value:!0});const r=a(n(3)),d=n(2),l=a(n(1)),o=new Proxy({id:()=>({}),createdAt:()=>({}),updatedAt:()=>({}),owner:()=>({}),category:()=>({}),mimeType:()=>({}),url:()=>({}),description:()=>({}),metaData:()=>({})},{get:(e,i)=>(e,n,a)=>t(void 0,void 0,void 0,(function*(){const{id:n,transform:t}=e,o=r.default(a),u=yield o.files.load(n);if("url"===i&&t){const e=Buffer.from(JSON.stringify(t),"utf8").toString("base64"),i=l.default.getExtensionByMimeType(u.mimeType),{staticPrefix:n,host:a,ssl:r,genericDelimiter:o}=d.getParams();if(u.isLocalFile){return`http${r?"s":""}://${a}${n}/r/${Buffer.from(JSON.stringify({id:u.id,ext:i}),"utf8").toString("base64")}/t/${e}.${i}`}return`http${r?"s":""}://${a}${n}/${o}/${Buffer.from(u.url,"utf8").toString("base64")}/t/${e}.${i}`}return u[i]}))});i.default=o},function(e,i,n){"use strict";var t=this&&this.__awaiter||function(e,i,n,t){return new(n||(n=Promise))((function(a,r){function d(e){try{o(t.next(e))}catch(e){r(e)}}function l(e){try{o(t.throw(e))}catch(e){r(e)}}function o(e){var i;e.done?a(e.value):(i=e.value,i instanceof n?i:new n((function(e){e(i)}))).then(d,l)}o((t=t.apply(e,i||[])).next())}))},a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(i,"__esModule",{value:!0});const r=n(0),d=a(n(1));i.default=(e,i,n)=>t(void 0,void 0,void 0,(function*(){const{file:e,info:t}=i,{logger:a,token:l}=n,{uuid:o}=l,{createReadStream:u,filename:s}=yield e,m=new d.default({context:n}),c=d.default.getMimeTypeByFilename(s);try{const e=yield m.createFile(u(),Object.assign({mimeType:c},t));return a.fileStorage.info(`File uploaded successfully in [${e.absoluteFilename}]`,{uuid:o,mimeType:c}),{id:e.id,url:"/test/"}}catch(e){throw a.fileStorage.error("Failed to Upload files",{err:e,uuid:o}),new r.ServerError("Failed to Upload files",{err:e,uuid:o})}}))},function(e,i){var n={kind:"Document",definitions:[{kind:"ObjectTypeExtension",name:{kind:"Name",value:"Query"},interfaces:[],directives:[],fields:[{kind:"FieldDefinition",name:{kind:"Name",value:"fileStorage"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"FileStorageQuery"}}},directives:[]}]},{kind:"ObjectTypeExtension",name:{kind:"Name",value:"Mutation"},interfaces:[],directives:[],fields:[{kind:"FieldDefinition",name:{kind:"Name",value:"fileStorage"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"FileStorageMutation"}}},directives:[]}]},{kind:"ObjectTypeDefinition",name:{kind:"Name",value:"FileStorageMutation"},interfaces:[],directives:[],fields:[{kind:"FieldDefinition",name:{kind:"Name",value:"delete"},arguments:[{kind:"InputValueDefinition",name:{kind:"Name",value:"ids"},type:{kind:"NonNullType",type:{kind:"ListType",type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"ID"}}}}},directives:[]}],type:{kind:"NamedType",name:{kind:"Name",value:"Boolean"}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"upload"},arguments:[{kind:"InputValueDefinition",name:{kind:"Name",value:"file"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"FileUpload"}}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"info"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"FileUploadInfo"}}},directives:[]}],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"File"}}},directives:[]}]},{kind:"InputObjectTypeDefinition",name:{kind:"Name",value:"FileUploadInfo"},directives:[],fields:[{kind:"InputValueDefinition",name:{kind:"Name",value:"owner"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"ID"}}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"category"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"description"},type:{kind:"NamedType",name:{kind:"Name",value:"String"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"metaData"},type:{kind:"NamedType",name:{kind:"Name",value:"JSON"}},directives:[]}]},{kind:"ObjectTypeDefinition",name:{kind:"Name",value:"FileStorageQuery"},interfaces:[],directives:[],fields:[{kind:"FieldDefinition",description:{kind:"StringValue",value:"Returns Drivers list bundle",block:!0},name:{kind:"Name",value:"list"},arguments:[{kind:"InputValueDefinition",name:{kind:"Name",value:"first"},type:{kind:"NamedType",name:{kind:"Name",value:"Int"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"offset"},type:{kind:"NamedType",name:{kind:"Name",value:"Int"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"after"},type:{kind:"NamedType",name:{kind:"Name",value:"String"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"orderBy"},type:{kind:"ListType",type:{kind:"NamedType",name:{kind:"Name",value:"FilesOrderBy"}}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"filter"},type:{kind:"NamedType",name:{kind:"Name",value:"FilesListFilter"}},directives:[]}],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"FilesListConnection"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"image"},arguments:[{kind:"InputValueDefinition",name:{kind:"Name",value:"id"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"ID"}}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"transform"},type:{kind:"NamedType",name:{kind:"Name",value:"ImageTransformInput"}},directives:[]}],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"Image"}}},directives:[]}]},{kind:"InputObjectTypeDefinition",name:{kind:"Name",value:"FilesListFilter"},directives:[],fields:[{kind:"InputValueDefinition",name:{kind:"Name",value:"owner"},type:{kind:"NamedType",name:{kind:"Name",value:"ID"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"category"},type:{kind:"NamedType",name:{kind:"Name",value:"String"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"mimeType"},type:{kind:"NamedType",name:{kind:"Name",value:"String"}},directives:[]}]},{kind:"ObjectTypeDefinition",description:{kind:"StringValue",value:"File adge bundle",block:!0},name:{kind:"Name",value:"FilesEdge"},interfaces:[{kind:"NamedType",name:{kind:"Name",value:"Edge"}}],directives:[],fields:[{kind:"FieldDefinition",name:{kind:"Name",value:"node"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"File"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"cursor"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}},directives:[]}]},{kind:"InputObjectTypeDefinition",description:{kind:"StringValue",value:"Possible data to order list of files",block:!0},name:{kind:"Name",value:"FilesOrderBy"},directives:[],fields:[{kind:"InputValueDefinition",name:{kind:"Name",value:"field"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"FilesOrderField"}}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"direction"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"OrderDirection"}}},directives:[]}]},{kind:"EnumTypeDefinition",description:{kind:"StringValue",value:"Possible data to sort of files list",block:!0},name:{kind:"Name",value:"FilesOrderField"},directives:[],values:[{kind:"EnumValueDefinition",name:{kind:"Name",value:"category"},directives:[]},{kind:"EnumValueDefinition",name:{kind:"Name",value:"mimeType"},directives:[]},{kind:"EnumValueDefinition",name:{kind:"Name",value:"createdAt"},directives:[]},{kind:"EnumValueDefinition",name:{kind:"Name",value:"updatedAt"},directives:[]}]},{kind:"EnumTypeDefinition",name:{kind:"Name",value:"FileType"},directives:[],values:[{kind:"EnumValueDefinition",name:{kind:"Name",value:"image"},directives:[]},{kind:"EnumValueDefinition",name:{kind:"Name",value:"document"},directives:[]}]},{kind:"ObjectTypeDefinition",description:{kind:"StringValue",value:"Files list connection",block:!0},name:{kind:"Name",value:"FilesListConnection"},interfaces:[{kind:"NamedType",name:{kind:"Name",value:"Connection"}}],directives:[],fields:[{kind:"FieldDefinition",name:{kind:"Name",value:"totalCount"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"Int"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"pageInfo"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"PageInfo"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"edges"},arguments:[],type:{kind:"NonNullType",type:{kind:"ListType",type:{kind:"NamedType",name:{kind:"Name",value:"FilesEdge"}}}},directives:[]}]},{kind:"ObjectTypeDefinition",name:{kind:"Name",value:"File"},interfaces:[{kind:"NamedType",name:{kind:"Name",value:"Node"}}],directives:[],fields:[{kind:"FieldDefinition",name:{kind:"Name",value:"id"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"ID"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"createdAt"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"DateTime"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"updatedAt"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"DateTime"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"owner"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"ID"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"type"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"FileType"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"category"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"mimeType"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"url"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"description"},arguments:[],type:{kind:"NamedType",name:{kind:"Name",value:"String"}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"metaData"},arguments:[],type:{kind:"NamedType",name:{kind:"Name",value:"JSON"}},directives:[]}]},{kind:"ObjectTypeDefinition",name:{kind:"Name",value:"Image"},interfaces:[{kind:"NamedType",name:{kind:"Name",value:"Node"}}],directives:[],fields:[{kind:"FieldDefinition",name:{kind:"Name",value:"id"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"ID"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"createdAt"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"DateTime"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"updatedAt"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"DateTime"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"owner"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"ID"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"type"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"FileType"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"category"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"mimeType"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"url"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"description"},arguments:[],type:{kind:"NamedType",name:{kind:"Name",value:"String"}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"metaData"},arguments:[],type:{kind:"NamedType",name:{kind:"Name",value:"JSON"}},directives:[]}]},{kind:"InputObjectTypeDefinition",name:{kind:"Name",value:"ImageTransformInput"},directives:[],fields:[{kind:"InputValueDefinition",name:{kind:"Name",value:"width"},type:{kind:"NamedType",name:{kind:"Name",value:"Int"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"height"},type:{kind:"NamedType",name:{kind:"Name",value:"Int"}},directives:[]}]}],loc:{start:0,end:1688}};n.loc.source={body:'\nextend type Query {\n  fileStorage: FileStorageQuery!\n}\n\nextend type Mutation {\n  fileStorage: FileStorageMutation!\n}\n\ntype FileStorageMutation {\n  delete(ids: [ID!]!): Boolean\n  upload(\n    file: FileUpload!\n    info: FileUploadInfo!\n  ): File!\n}\n\ninput FileUploadInfo {\n  owner: ID!\n  category: String!\n  description: String\n  metaData: JSON\n}\n\ntype FileStorageQuery {\n  """\n  Returns Drivers list bundle\n  """\n  list(\n    first: Int\n    offset: Int\n    after: String\n    orderBy: [FilesOrderBy]\n    filter: FilesListFilter\n  ): FilesListConnection!\n  image(id: ID! transform: ImageTransformInput): Image!\n}\n\ninput FilesListFilter {\n  owner: ID\n  category: String\n  mimeType: String\n}\n\n"""\nFile adge bundle\n"""\ntype FilesEdge implements Edge {\n  node: File!\n  cursor: String!\n}\n\n"""\nPossible data to order list of files\n"""\ninput FilesOrderBy {\n  field: FilesOrderField!\n  direction: OrderDirection!\n}\n\n\n"""\nPossible data to sort of files list\n"""\nenum FilesOrderField {\n  category\n  mimeType\n  createdAt\n  updatedAt\n}\n\nenum FileType {\n  image\n  document\n}\n\n"""\nFiles list connection\n"""\ntype FilesListConnection implements Connection {\n  totalCount: Int!\n  pageInfo: PageInfo!\n  edges: [FilesEdge]!\n}\n\n\ntype File implements Node {\n  id: ID!\n  createdAt: DateTime!\n  updatedAt: DateTime!\n  owner: ID!\n  type: FileType!\n  category: String!\n  mimeType: String!\n  url: String!\n  description: String\n  metaData: JSON\n}\n\ntype Image implements Node {\n  id: ID!\n  createdAt: DateTime!\n  updatedAt: DateTime!\n  owner: ID!\n  type: FileType!\n  category: String!\n  mimeType: String!\n  url: String!\n  description: String\n  metaData: JSON\n}\n\ninput ImageTransformInput {\n  width: Int\n  height: Int\n}\n',name:"GraphQL request",locationOffset:{line:1,column:1}};e.exports=n},function(e,i,n){"use strict";Object.defineProperty(i,"__esModule",{value:!0});const t=n(25);n(26);const a=n(27),r=t.format.combine(t.format.metadata(),t.format.json(),t.format.timestamp({format:"YYYY-MM-DDTHH:mm:ssZZ"}),t.format.splat(),t.format.printf(e=>{const{timestamp:i,level:n,message:t,metadata:a}=e,r="{}"!==JSON.stringify(a)?a:null;return`${i} ${n}: ${t} ${r?JSON.stringify(r):""}`}));i.configureFileStorageLogger=e=>{const{logDir:i,logFilenamePattern:n}=e,d=n||a.LOG_FILENAME_FILES_STORAGE;return t.createLogger({level:"debug",format:r,transports:[new t.transports.DailyRotateFile({filename:`${i}/${d}`,level:"info",datePattern:a.LOG_DATE_PATTERNT,zippedArchive:!0,maxSize:a.LOG_MAZ_SIZE,maxFiles:a.LOG_MAZ_FILES}),new t.transports.DailyRotateFile({filename:`${i}/${a.LOG_FILENAME_ERRORS}`,level:"error",datePattern:a.LOG_DATE_PATTERNT,zippedArchive:!0,maxSize:a.LOG_MAZ_SIZE,maxFiles:a.LOG_MAZ_FILES}),new t.transports.DailyRotateFile({filename:`${i}/${a.LOG_FILENAME_DEBUG}`,level:"debug",datePattern:a.LOG_DATE_PATTERNT,zippedArchive:!0,maxSize:a.LOG_MAZ_SIZE,maxFiles:a.LOG_MAZ_FILES})]})},i.default=i.configureFileStorageLogger},function(e,i){e.exports=require("winston")},function(e,i){e.exports=require("winston-daily-rotate-file")},function(e,i,n){"use strict";Object.defineProperty(i,"__esModule",{value:!0});const t=n(0);i.LOG_MAZ_FILES=t.LOG_MAZ_FILES,i.LOG_MAZ_SIZE=t.LOG_MAZ_SIZE,i.LOG_DATE_PATTERNT=t.LOG_DATE_PATTERNT,i.LOG_FILENAME_DEBUG=t.LOG_FILENAME_DEBUG,i.LOG_FILENAME_ERRORS=t.LOG_FILENAME_ERRORS,i.LOG_FILENAME_FILES_STORAGE="file-storage-%DATE%.log"}]);