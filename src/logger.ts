import { createLogger, transports, format, Logger } from 'winston';
import * as winston from 'winston'
import config from './config';
import WinstonCloudWatch from 'winston-cloudwatch';
const { combine, timestamp, printf, json, cli, splat, colorize, errors } = format
var AWS = require('aws-sdk');  //SDK(Software development kit) 


AWS.config.update({
  region: config.aws.aws_region,
  accessKeyId: config.aws.access_key_id,
  secretAccessKey: config.aws.secret_access_key
});


// let transport = [];
// if (process.env.NODE_ENV !== 'development') {
//   transport.push(
//     new winston.transports.Console({
//       format: winston.format.combine(
//         winston.format.cli(),
//         winston.format.splat(),
//         winston.format.colorize()
//       )
//     }),
//   )
// } else {
//   transport.push(
//     new winston.transports.Console({
//       format: winston.format.combine(
//         winston.format.cli(),
//         winston.format.splat(),
//         winston.format.colorize()
//       )
//     }),
//     new winston.transports.File({
//       filename: "./logs/error.log",
//       level: "error"
//     }),
//     new winston.transports.File({
//       filename: "./logs/info.log",
//       level: "info"
//     })
//   )
// }

// const LoggerInstance1: winston.Logger = winston.createLogger({
//   level: config.logs.level,
//   levels: winston.config.npm.levels,
//   format: winston.format.combine(
//     winston.format.timestamp({
//       format: 'YYYY-MM-DD HH:mm:ss'
//     }),
//     winston.format.errors({ stack: true }),
//     winston.format.splat(),
//     winston.format.json()
//   ),
//   transports: transport /*: [
//         new winston.transports.Console(),
//         LoggingWinston,
//     ]*/
// });

const today = new Date();
const month = today.getMonth() + 1;
const day = today.getDate();
const logStreamName = `${today.getFullYear()}-${(("00" + month.toString()).slice(-2))}-${(("00" + day.toString()).slice(-2))}`


const LoggerInstance: Logger = createLogger({
  level: config.logs.level,
  levels: winston.config.npm.levels,
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    errors({ stack: true }),
    splat(),
    json()
  ),
  transports: [
    // new WinstonCloudWatch({
    //   cloudWatchLogs: new AWS.CloudWatchLogs(),
    //   logGroupName: 'wcSyncServer_app_logs',
    //   logStreamName,
    //   jsonMessage: true
    // }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.cli(),
        winston.format.splat(),
        winston.format.colorize()
      )
    }),
    new winston.transports.File({
      filename: "./logs/error.log",
      level: "error"
    }),
    new winston.transports.File({
      filename: "./logs/info.log",
      level: "info"
    })
  ]
});



export default LoggerInstance;