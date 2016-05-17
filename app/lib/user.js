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
    util = require('util'),
    errorHandlers = require('../utils/error-handlers'),
    forwarding = require('../utils/request-forwarding'),
    requestHelpers = require('../utils/request-helpers'),
    config = require('../config/config');

var types = {
    ADD: "ADD",
    DELETE: "DELETE"
};

function forward(type, req, res) {
    var ccResponse = null,
        userGuid = req.params.org_guid,
        handlers = errorHandlers.get(res, 'add/remove user', userGuid);
    return forwarding.ccForward(req)
        .catch(handlers.cleanErrorHandler)
        .then(function (_ccResponse) {
            ccResponse = _ccResponse;
        })
        .then(function(){
            var path = req.url.replace(/^\/v2/, '');
            return forwarding.agForward(req, path, {json: false});
        })
        .then(function (agResponse) {
            console.info("Got response from AG", agResponse);
            return agResponse.statusCode === 202;
        })
        .then(function(async) {
            var status;
            if(async) {
                status = 202;
            } else if(type === types.ADD) {
                status = 201;
            } else {
                status = 200;
            }
            res.status(status).send(JSON.stringify(ccResponse));
        })
        .catch(handlers.dirtyErrorHandler);
}

function forwardWithUserByName(type, req, res) {
    var ccResponse = null,
        userGuid = req.params.org_guid,
        handlers = errorHandlers.get(res, 'add/remove user by name', userGuid);
    req.headers['content-length'] = JSON.stringify(req.body).length;
    return forwarding.ccForward(req)
        .catch(handlers.cleanErrorHandler)
        .then(function (_ccResponse) {
            ccResponse = _ccResponse;
        })
        .then(function () {
            return uaaGetUserByName(req)
                .then(function (user) {
                    var path = util.format('/organizations/%s/users/%s', req.params.org_guid, user.id);
                    return forwarding.agForward(req, path, {json: false});
                })
                .then(function (agResponse) {
                    console.info("Got response from AG", agResponse);
                    return agResponse.statusCode === 202;
                });
        })
        .then(function(async) {
            var status;
            if(async) {
                status = 202;
            } else if(type === types.ADD) {
                status = 201;
            } else {
                status = 200;
            }
            res.status(status).send(JSON.stringify(ccResponse));
        })
        .catch(handlers.dirtyErrorHandler);
}

function uaaGetUserByName(req) {
    var username = req.body.username;
    var uri = util.format('%s://%s/Users?attributes=id,userName&filter=userName+Eq+%22%s%22', req.protocol,
        config.getUaaHost(), username);
    var options = {
        headers: {
            authorization: req.headers.authorization
        }
    };
    return requestHelpers
        .getJsonRequest(requestHelpers.Method.GET, uri, options)
        .then(function (userResource) {
            console.info("Got response from UAA", userResource);
            var user = userResource && _.first(userResource.resources);
            if (!user) {
                throw new Error(util.format("User %s does not exist", username));
            }
            return user;
        });
}

module.exports = {
    addToOrg: _.partial(forward, types.ADD),
    removeFromOrg: _.partial(forward, types.DELETE),
    addToOrgByName: _.partial(forwardWithUserByName, types.ADD),
    removeFromOrgByName: _.partial(forwardWithUserByName, types.DELETE)
};