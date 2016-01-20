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

var nats = require('nats');
var config = require('./config/config');
var logger = require('./logging').logger;
var Q = require('q');

module.exports = {
    init: init
};

function init() {
    var deferred = Q.defer();

    if (config.get("profile") === "local") {
        deferred.resolve();
        return deferred.promise;
    }

    logger.info("initializing routing...");

    var msg = JSON.stringify({
        host: config.getRouteHost(),
        port: config.getRoutePort(),
        uris: [config.getRouteUri()]
    });

    var subject = "router.register";

    var router = nats.connect({url: config.getNatsUrl()});
    router.publish(subject, msg, function () {
        logger.info('route registered: ' + msg);
        deferred.resolve();
    });

    setInterval(function () {
        router.publish(subject, msg, function () {
            logger.info('route registered: ' + msg);
        });
    }, 1000 * 60);

    return deferred.promise;
}
