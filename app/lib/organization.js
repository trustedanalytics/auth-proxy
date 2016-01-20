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

var urlParse = require('url-parse'),
    util = require('util'),
    errorHandlers = require('../utils/error-handlers'),
    logger = require('../logging').logger,
    forwarding = require('../utils/request-forwarding'),
    requestHelpers = require('../utils/request-helpers');

function createOrganization(request, response) {
    var orgName = request.body.name,
        org = null,
        handlers = errorHandlers.get(response, 'create organization', orgName);
    logger.info('Creating organization', orgName);

    return forwarding.ccForward(request)
        .then(function (_org) {
            org = _org;
            logger.debug("Got response from CF", org);
            logger.info(util.format('Organization created in CF', orgName, org.metadata.guid));
        })
        .catch(handlers.cleanErrorHandler)
        .then(function () {
            var path = util.format('/organizations/%s', org.metadata.guid);
            return forwarding.agForward(request, path, {method: requestHelpers.Method.PUT, json: false});
        })
        .then(function (agResponse) {
            logger.debug("Got response from AG", agResponse);
            logger.info(util.format('Organization created in auth-gateway', orgName, org.metadata.guid));
            return agResponse.statusCode === 202;
        })
        .then(function (async) {
            response.status(async ? 202 : 201).send(JSON.stringify(org));
        })
        .catch(handlers.dirtyErrorHandler);
}

function deleteOrganization(request, response) {
    var url = new urlParse(request.url),
        orgId = request.params.org_guid,
        handlers = errorHandlers.get(response, 'delete organization', orgId);
    logger.info('Deleting organization', orgId);

    return forwarding.ccForward(request)
        .catch(handlers.cleanErrorHandler)
        .then(function () {
            logger.info("Deleted organization from CF", url.pathname);
            var path = util.format('/organizations/%s', orgId);
            return forwarding.agForward(request, path, {method: requestHelpers.Method.DELETE, json: false});
        })
        .then(function (agResponse) {
            logger.debug("Got response from AG", agResponse);
            logger.info("Deleted organization from auth-gateway", url.pathname);
            return agResponse.statusCode === 202;
        })
        .then(function (async) {
            response.status(async ? 202 : 200).send();
        })
        .catch(handlers.dirtyErrorHandler);
}





module.exports = {
    create: createOrganization,
    delete: deleteOrganization
};