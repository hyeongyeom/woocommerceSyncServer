import * as mongodb from 'mongodb'
import mongoose from 'mongoose';

import config from '../config'

// let MongoClient = mongodb.MongoClient;

module.exports = function connectMongoDB(app, callback) {
    console.log(config.collection.url);

    mongoose.connect(config.collection.url, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useCreateIndex: true, 
        useFindAndModify: false 
    }, function (err: Error) {
        if (err) {
            callback(err);
            return;
        }
        
        callback();
    });
    mongoose.connection.on('disconnected', connectMongoDB);
};