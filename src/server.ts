/* eslint-disable no-console */
import mongoose from 'mongoose';
import app from './app';
import config from './config';

const bootstrap = async () => {
  try {
    await mongoose.connect(config.DBUrl as string);
    console.log(`===${config.env}===`);
    console.log(`👌 Database is connected successfully.`);
    app.listen(config.port, () => {
      console.log(
        `😍 The server is running on http://localhost:${config.port}`,
      );
    });
  } catch (error) {
    console.log(error);
  }
};

bootstrap();
