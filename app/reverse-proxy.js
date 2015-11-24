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
var _ = require('underscore');
var url = require('url');
var util = require('util');
var Q = require('q');
var URL = require('url-parse');
var config = require('./config/config');
var logger = require('./logging').logger;

module.exports = {
    createOrganization: createOrganization,
    deleteOrganization: deleteOrganization,

    addUserToOrganization: addUserToOrganization,
    removeUserFromOrganization: removeUserFromOrganization,

    addUserToOrganizationByUsername: addUserToOrganizationByUsername,
    removeUserFromOrganizationByUsername: removeUserFromOrganizationByUsername
};

function createOrganization(req, res) {
    requestOrganizationByNamePromise(req)
        .then(function (orgResponse) {
            verifySuccess(orgResponse);

            if (body(orgResponse).total_results === 1) {
                var authGatewayUrl = new URL(req.url)
                    .set('pathname', util.format('/organizations/%s', body(orgResponse).resources[0].metadata.guid));

                return authGatewayPromise(req, authGatewayUrl, {method: 'PUT'});
            } else {
                return cloudControllerPromise(req, new URL(req.url))
                    .then(function (ccResponse) {
                        verifySuccess(ccResponse);

                        var authGatewayUrl = new URL(req.url)
                            .set('pathname', util.format('/organizations/%s', body(ccResponse).metadata.guid));
                        return authGatewayPromise(req, authGatewayUrl, {method: 'PUT'});
                    });
            }
        })
        .then(function (agResponse) {
            verifySuccess(agResponse);
            res.status(agResponse.statusCode).send();
        })
        .catch(function (error) {
            res.status(502).send(error.message);
        })
        .done();
}

function deleteOrganization(req, res) {
    cloudControllerPromise(req, new URL(req.url))
        .then(function (ccResponse) {
            verifySuccess(ccResponse, [404]);

            var authGatewayUrl = new URL(req.url)
                .set('pathname', util.format('/organizations/%s', req.params.org_guid));
            return authGatewayPromise(req, authGatewayUrl, {method: 'DELETE'});
        })
        .then(function (agResponse) {
            verifySuccess(agResponse);
            res.status(agResponse.statusCode).send();
        })
        .catch(function (error) {
            res.status(502).send(error.message);
        })
        .done();

}

function addUserToOrganization(req, res) {
    cloudControllerPromise(req, new URL(req.url))
        .then(function (ccResponse) {
            verifySuccess(ccResponse);

            var authGatewayUrl = new URL(req.url)
                .set('pathname', util.format('/organizations/%s/users/%s', req.params.org_guid, req.params.user_guid));
            return authGatewayPromise(req, authGatewayUrl, {method: 'PUT'});
        })
        .then(function (agResponse) {
            verifySuccess(agResponse);
            res.status(agResponse.statusCode).send();
        })
        .catch(function (error) {
            res.status(502).send(error.message);
        })
        .done();
}

function removeUserFromOrganization(req, res) {
    cloudControllerPromise(req, new URL(req.url))
        .then(function (ccResponse) {
            verifySuccess(ccResponse);

            var authGatewayUrl = new URL(req.url)
                .set('pathname', util.format('/organizations/%s/users/%s', req.params.org_guid, req.params.user_guid));
            return authGatewayPromise(req, authGatewayUrl, {method: 'DELETE'});
        })
        .then(function (agResponse) {
            verifySuccess(agResponse);
            res.status(agResponse.statusCode).send();
        })
        .catch(function (error) {
            res.status(502).send(error.message);
        })
        .done();
}

function addUserToOrganizationByUsername(req, res) {
    requestUserPromise(req)
        .then(function (userResponse) {
            verifySuccess(userResponse);

            if (body(userResponse).totalResults === 1) {
                return cloudControllerPromise(req, new URL(req.url))
                    .then(function (ccResponse) {
                        verifySuccess(ccResponse);

                        var authGatewayUrl = new URL(req.url)
                            .set('pathname', util.format('/organizations/%s/users/%s', req.params.org_guid, body(userResponse).resources[0].id));

                        return authGatewayPromise(req, authGatewayUrl, {method: 'PUT'});
                    });
            } else {
                return responsePromise(200);
            }
        })
        .then(function (agResponse) {
            verifySuccess(agResponse);
            res.status(agResponse.statusCode).send();
        })
        .catch(function (error) {
            res.status(502).send(error.message);
        })
        .done();
}

function removeUserFromOrganizationByUsername(req, res) {
    requestUserPromise(req)
        .then(function (userResponse) {
            verifySuccess(userResponse);

            if (body(userResponse).totalResults === 1) {
                return cloudControllerPromise(req, new URL(req.url))
                    .then(function (ccResponse) {
                        verifySuccess(ccResponse);

                        var authGatewayUrl = new URL(req.url)
                            .set('pathname', util.format('/organizations/%s/users/%s', req.params.org_guid, body(userResponse).resources[0].id));

                        return authGatewayPromise(req, authGatewayUrl, {method: 'DELETE'});
                    });
            } else {
                return responsePromise(200);
            }
        })
        .then(function (agResponse) {
            verifySuccess(agResponse);
            res.status(agResponse.statusCode).send();
        })
        .catch(function (error) {
            res.status(502).send(error.message);
        })
        .done();
}

function cloudControllerPromise(req, url) {
    var hostname = config.getCfApi();

    url.set('hostname', hostname);
    url.set('protocol', req.protocol + ':');

    var options = {
        headers: req.headers,
        body: JSON.stringify(req.body),
        method: req.method
    };
    options.headers['x-forwarded-host'] = req.headers['host'];
    options.headers['host'] = hostname;

    return requestPromise(url.href, options);
}

function authGatewayPromise(req, url, options) {
    var hostname = config.getAuthGatewayHost();

    url.set('hostname', hostname);
    url.set('protocol', req.protocol + ':');

    options.headers = req.headers;
    options.headers['x-forwarded-host'] = req.headers['host'];
    options.headers['host'] = hostname;

    return requestPromise(url.href, options);
}

function requestOrganizationByNamePromise(req) {
    var uri = new URL(util.format('%s://%s/v2/organizations?q=name:%s', req.protocol, config.getCfApi(), req.body.name));
    return requestPromise(uri.href, {
        headers: {
            authorization: req.headers.authorization
        },
        method: 'GET'
    });
}

function requestUserPromise(req) {
    var uri = new URL(util.format('%s://%s/Users?attributes=id,userName&filter=userName+Eq+%22%s%22', req.protocol, config.getUaaApi(), req.body.name));
    return requestPromise(uri.href, {
        headers: {
            authorization: req.headers.authorization
        },
        method: 'GET'
    });
}

function requestPromise(uri, options) {
    var deferred = Q.defer();
    logger.info("method: %s, uri: %s", options.method, uri);
    request(uri.toString(), options, function (err, res) {
        if (err) {
            deferred.reject(new Error({message: "Request to " + uri + " failed."}));
        } else {
            deferred.resolve(res);
        }
    });
    return deferred.promise;
}

function responsePromise(statusCode) {
    var deferred = Q.defer();
    deferred.resolve({statusCode: statusCode});
    return deferred.promise;
}

function formatResponse(res) {
    return {
        source: res.req.path,
        status: res.statusCode,
        message: res.body,
        timestamp: new Date().getTime()
    };
}

function verifySuccess(response, expectedStatusCodes) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
        if (typeof expectedStatusCodes !== "undefined") {
            if (_.contains(expectedStatusCodes, response.statusCode)) {
                return;
            }
        }
        throw new Error(JSON.stringify(formatResponse(response)));
    }
}

function body(response) {
    return JSON.parse(response.body);
}
