declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    ANALYZE?: 'true';
    DEBUG?: 'true';


    SERVER_PORT: string;
    SERVER_HOST: string;

    GRAPHQL_ENDPOINT: string;

    DB_HOST: string;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
  }
}