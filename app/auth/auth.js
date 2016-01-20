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

var passport = require('passport');
var logger = require('../logging').logger;
var jwtBearerAuth = require('./jwt-bearer-auth');

module.exports = {
    init: init
};

function init(app) {
    logger.info("initializing security...");

    return jwtBearerAuth.getStrategy()
        .then(function (strategy) {
            passport.use(strategy);
            app.use(passport.initialize());
        });
}