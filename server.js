const dotenv = require('dotenv');
const mongoose = require('mongoose');
/// before require app
dotenv.config({
  path: './config.env',
});

// handle uncaught exception of synchronous code
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught Exception! synchronous 💥 Shutting down...');
  process.exit(1);
});

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

async function dbConnect() {
  await mongoose.connect(DB);
}

dbConnect().catch((err) => console.log(err));

const server = app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

// handle unhandled rejection of asynchronous code
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection! 💥 Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
// 201  >> insert
// 200 >> get / update
// delete >> 204
// 404 >> not found
// 500 >> internal server error
// 400 >> bad request
// 401 >> unauthorized
// 403 >> forbidden
