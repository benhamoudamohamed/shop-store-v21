/// <reference types="node" />

export const Config = () => ({
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  origin: process.env.ORIGIN,
  database: {
    type: process.env.DB_TYPE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    autoLoadEntities: true,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  },
  jwtSecret: process.env.JWT_SECRET,
  expiresIn_T: process.env.EXPIRES_IN_T,
  expiresIn_RT: process.env.EXPIRES_IN_RT,
  jwtSecret_ACTIVATION: process.env.JWT_SECRET_ACTIVATION,
  expiresIn_ACTIVATION: process.env.EXPIRES_IN_ACTIVATION,
  mailHost: process.env.MAIL_HOST,
  mailPort: process.env.MAIL_PORT,
  mailUser: process.env.MAIL_USER,
  mailPassword: process.env.MAIL_PASSWORD,
})
