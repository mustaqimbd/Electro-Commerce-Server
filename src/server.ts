/* eslint-disable no-console */

process.on('uncaughtException', error => {
  console.log(`😓 Uncaught exception happened. Exiting the process.`);
  console.log('Error:->', error);
  process.exit(1);
});

import { Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import config from './config';

let server: Server;

const bootstrap = async () => {
  try {
    await mongoose.connect(config.DBUrl as string);
    console.log(`===${config.env}===`);
    console.log(`👌 Database is connected successfully.`);
    server = app.listen(config.port, () => {
      console.log(
        `😍 The server is running on http://localhost:${config.port}`,
      );
    });
  } catch (error) {
    console.log(`❌ Can't connect to Database.`);
    console.log('Error:->', error);
  }

  process.on('unhandledRejection', error => {
    console.log(`😴 Unhandled rejection happened. Exiting the process.`);
    console.log('Error:->', error);
    if (server) {
      server.close(() => {
        process.exit(1);
      });
    }
    process.exit(1);
  });
};

bootstrap();
