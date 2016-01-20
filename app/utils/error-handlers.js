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

var _ = require('underscore'),
    q = require('q'),
    util = require('util'),
    logger = require('../logging').logger,
    requestHelpers = require('../utils/request-helpers');

function catchDirtyError(response, requestType, orgId, err) {
    if(err && !err.handled) {
        logger.error(util.format("Failed to %s %s in gateway", requestType, orgId), errToStr(err));
        requestHelpers.handleError(response, new Error(util.format("Failed to %s %s. Your system may be in inconsistent state. " +
            "Please contact platform administrator.", requestType, orgId)));
    }
}

function catchCleanError(response, requestType, orgId, err) {
    if(!err.handled) {
        logger.error(util.format("Failed to %s %s in CF", requestType, orgId), errToStr(err));
        requestHelpers.handleError(response, err);
    }
    return reject(err);
}

function errToStr(err) {
    if(err instanceof Error) {
        return err.message + '\n' + err.stack;
    } else if(typeof err === 'string') {
        return err;
    } else if(_.isObject(err)) {
        return JSON.stringify(err);
    }
    return 'Unknown error';
}

function reject(err) {
    var e = err instanceof Error ? err : new Error(err);
    e.handled = true;
    var deferred = q.defer();
    deferred.reject(e);
    return deferred.promise;
}


function getErrorHandlers(response, requestType, orgId) {
    return {
        dirtyErrorHandler: _.partial(catchDirtyError, response, requestType, orgId),
        cleanErrorHandler: _.partial(catchCleanError, response, requestType, orgId)
    };
}

module.exports = {
    get: getErrorHandlers
};

