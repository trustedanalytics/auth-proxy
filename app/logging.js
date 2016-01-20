/**
 * Copyright (c) 2015 Intel Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

var config = require('./config/config');
var winston = require('winston');
var fs = require('fs');
var Q = require('q');
var morgan = require('morgan');

var logger = new winston.Logger();

logger.add(winston.transports.Console, {level: 'info'});

if (!config.isCloud()) {
    ensureExists('./logs')
        .then(function () {
            logger.add(winston.transports.File, {
                name: 'info',
                filename: './logs/auth-proxy.log',
                level: 'info'
            });
            logger.add(winston.transports.File, {
                name: 'error',
                filename: './logs/auth-proxy-error.log',
                level: 'error'
            });
        })
        .catch(function (err) {
            logger.warn("Failed to set up file logging: %j", err);
        });
}

function ensureExists(path) {
    var deferred = Q.defer();

    fs.mkdir(path, function (err) {
        if (err && err.code !== 'EEXIST') {
            deferred.reject(err);
        } else {
            deferred.resolve();
        }
    });

    return deferred.promise;
}

module.exports = {
    logger: logger,
    middleware: morgan("dev")
};
