# Via Profit services / File-Storage

![via-profit-services-cover](./assets/via-profit-services-cover.png)

> Via Profit services / **File-Storage** - это пакет, который является частью сервиса, базирующегося на `via-profit-services` и представляет собой реализацию схемы для хранения каких-либо файлов, изображений и прочих документов.

# Не стабильная версия!

## Содержание

- [Установка и настройка](#setup)
- [Как использовать](#how-to-use)
- [Подключение](#integration)

## <a name="setup"></a> Установка и настройка

### Установка

```bash
yarn add ssh://git@gitlab.com:via-profit-services/file-storage.git#semver:^0.0.1
```

Список версий [см. здесь](https://gitlab.com/via-profit-services/file-storage/-/tags)

### Миграции

После первой установки примените все необходимые миграции:

```bash
yarn knex:migrate:latest
```

После применения миграций будут созданы все необходимые таблицы в вашей базе данных


## <a name="how-to-use"></a> Как использовать

...Soon


### <a name="integration"></a> Подключение

Для интеграции модуля требуется задействовать типы и резолверы модуля, затем необходимо подключить Express middleware, поставляемое пакетом. Так же необходимо сконфигурировать логгер.

_Замечание:_ Sharp использует натиыные node-модули, поэтому нобходимо преверить конфигурацию `webpack` на наличие соответствующего лоадера:

```js
// webpack.config.js
module.exports = {
  target: 'node',
  module: {
    rules: [
      {
        test: /\.node$/,
        use: 'node-loader',
      },
      ...
    ]
  }
};
```

Модуль экспортирует наружу:
 - [Sharp](https://sharp.pixelplumbing.com/)
 - configureFileStorageLogger - Функция конфигурации логгера
 - makeSchema - Функция, результатом работы котрой является объекс, содержащий:
    - typeDefs - служебные Типы
    - resolvers - Служеюные Резолверы
    - service - Класс, реализующий модель данного модуля
    - permissions - Разрешения для [GraphQL-chield](https://github.com/maticzav/graphql-shield)


Пример подключения:

```ts
import { App } from '@via-profit-services/core';
import { makeSchema } from '@via-profit-services/file-storage';

const fileStorage = makeSchema({
  staticPrefix: '/static',
  storagePath: './public',
  host: 'www.example.com',
  imageOptimMaxWidth: 800,
  imageOptimMaxHeight: 600,
});

const app = new App({
  ...
  typeDefs: [
    fileStorage.typeDefs,
  ],
  resolvers: [
    fileStorage.resolvers,
  ],
  permissions: [
    fileStorage.permissions,
  ],
  expressMiddlewares: [
    fileStorage.expressMiddleware
  ]
  ...
});
app.bootstrap();

```


## TODO

- [ ] Write the CONTRIBUTING docs
- [ ] Write the tests
- [ ] Create Subscriptions
