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

var request = require('request');
var passport = require('passport');
var config = require('./config/config');
var JwtBearerStrategy = require('passport-http-jwt-bearer');
var Q = require('q');
var logger = require('./logging').logger;

module.exports = {
    init: init
};

function init(app) {
    var deferred = Q.defer();
    logger.info("initializing security...");

    request(config.getTokenKeyUrl(), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            passport.use(new JwtBearerStrategy(
                JSON.parse(body).value,
                function (token, done) {
                    return done(null, token);
                }
            ));
            app.use(passport.initialize());
            deferred.resolve(app);
        } else {
            deferred.reject(new Error(error))
        }
    });

    return deferred.promise;
}
