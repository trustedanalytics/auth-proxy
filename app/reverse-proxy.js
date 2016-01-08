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

function createOrganization(proxyRequest, proxyResponse) {
    ccGetOrganizationByName(proxyRequest)
        .then(function (ccGetOrgResponse) {
            if (!body(ccGetOrgResponse).total_results) {
                return ccForward(proxyRequest, new URL(proxyRequest.url))
                    .then(function(ccCreateOrgResponse) {
                        return body(ccCreateOrgResponse);
                    });
            }
            return body(ccGetOrgResponse).resources[0];
        })
        .then(function (ccOrg) {
            var url = new URL(proxyRequest.url)
                .set('pathname', util.format('/organizations/%s', ccOrg.metadata.guid));
            return agForward(proxyRequest, url, {method: 'PUT'})
                .then(function (agResponse) {
                    return ccOrg;
                })
        })
        .then(function (ccOrg) {
            proxyResponse.status(201).send(ccOrg);
        })
        .catch(function (error) {
            logger.error(error.message);
            proxyResponse.status(502).send(error.message);
        })
        .done();
}

function deleteOrganization(proxyRequest, proxyResponse) {
    ccForward(proxyRequest, new URL(proxyRequest.url))
        .catch(function (error) {
            if (error.statusCode !== 404) {
                throw error;
            }
        })
        .then(function (ccResponse) {
            var url = new URL(proxyRequest.url)
                .set('pathname', util.format('/organizations/%s', proxyRequest.params.org_guid));
            return agForward(proxyRequest, url, {method: 'DELETE'})
                .then(function (agResponse) {
                    return ccResponse;
                })
        })
        .then(function (ccResponse) {
            proxyResponse.status(ccResponse.statusCode).send();
        })
        .catch(function (error) {
            logger.error(error.message);
            proxyResponse.status(502).send(error.message);
        })
        .done();
}

function addUserToOrganization(proxyRequest, proxyResponse) {
    ccForward(proxyRequest, new URL(proxyRequest.url))
        .then(function (ccResponse) {
            var url = new URL(proxyRequest.url)
                .set('pathname', util.format('/organizations/%s/users/%s', proxyRequest.params.org_guid, proxyRequest.params.user_guid));
            return agForward(proxyRequest, url, {method: 'PUT'})
                .then(function (agResponse) {
                    return ccResponse;
                });
        })
        .then(function (ccResponse) {
            proxyResponse.status(ccResponse.statusCode).send(ccResponse.body);
        })
        .catch(function (error) {
            logger.error(error.message);
            proxyResponse.status(502).send(error.message);
        })
        .done();
}

function removeUserFromOrganization(req, res) {
    ccForward(req, new URL(req.url))
        .then(function (ccResponse) {
            var url = new URL(req.url)
                .set('pathname', util.format('/organizations/%s/users/%s', req.params.org_guid, req.params.user_guid));
            return agForward(req, url, {method: 'DELETE'})
                .then(function (agResponse) {
                    return ccResponse;
                });
        })
        .then(function (ccResponse) {
            res.status(ccResponse.statusCode).send(ccResponse.body);
        })
        .catch(function (error) {
            logger.error(error.message);
            res.status(502).send(error.message);
        })
        .done();
}

function addUserToOrganizationByUsername(proxyRequest, proxyResponse) {
    ccForward(proxyRequest, new URL(proxyRequest.url))
        .then(function (ccResponse) {
            return uaaGetUserByName(proxyRequest)
                .then(function (uaaResponse) {
                    if (!body(uaaResponse).totalResults) {
                        throw new Error("user does not exist")
                    }
                    return body(uaaResponse).resources[0].id;
                })
                .then(function(userGuid) {
                    var url = new URL(proxyRequest.url)
                        .set('pathname', util.format('/organizations/%s/users/%s', proxyRequest.params.org_guid, userGuid));
                    return agForward(proxyRequest, url, {method: 'PUT'});
                })
                .then(function(agResponse) {
                    return ccResponse;
                })
        }).then(function(ccResponse) {
            proxyResponse.status(ccResponse.statusCode).send(ccResponse.body);
        }).catch(function (error) {
            logger.error(error.message);
            proxyResponse.status(502).send(error.message);
        })
        .done();
}

function removeUserFromOrganizationByUsername(proxyRequest, proxyResponse) {
    ccForward(proxyRequest, new URL(proxyRequest.url))
        .then(function (ccResponse) {
            return uaaGetUserByName(proxyRequest)
                .then(function (uaaResponse) {
                    if (!body(uaaResponse).totalResults) {
                        throw new Error("user does not exist")
                    }
                    return body(uaaResponse).resources[0].id;
                })
                .then(function(userGuid) {
                    var url = new URL(proxyRequest.url)
                        .set('pathname', util.format('/organizations/%s/users/%s', proxyRequest.params.org_guid, userGuid));
                    return agForward(proxyRequest, url, {method: 'DELETE'});
                })
                .then(function(agResponse) {
                    return ccResponse;
                })
        }).then(function(ccResponse) {
            proxyResponse.status(ccResponse.statusCode).send(ccResponse.body);
        }).catch(function (error) {
            logger.error(error.message);
            proxyResponse.status(502).send(error.message);
        })
        .done();
}

function ccForward(req, url) {
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

function agForward(req, url, options) {
    var hostname = config.getAuthGatewayHost();

    url.set('hostname', hostname);
    url.set('protocol', req.protocol + ':');

    options.headers = req.headers;
    options.headers['x-forwarded-host'] = req.headers['host'];
    options.headers['host'] = hostname;

    return requestPromise(url.href, options);
}

function ccGetOrganizationByName(req) {
    var uri = new URL(util.format('%s://%s/v2/organizations?q=name:%s', req.protocol, config.getCfApi(), req.body.name));
    return requestPromise(uri.href, {
        headers: {
            authorization: req.headers.authorization
        },
        method: 'GET'
    });
}

function uaaGetUserByName(req) {
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
    logger.info("outgoing request - method: %s, uri: %s", options.method, uri);
    request(uri.toString(), options, function (err, res) {
        if (err) {
            deferred.reject(new Error("Request to " + uri + " failed."));
        } else {
            var error = checkError(res);
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(res);
            }
        }
    });
    return deferred.promise;
}

function checkError(response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
        return formatResponse(response);
    }
    return null;
}

function formatResponse(res) {
    return {
        source: res.req.path,
        statusCode: res.statusCode,
        message: res.body,
        timestamp: new Date().getTime()
    };
}

function body(response) {
    return JSON.parse(response.body);
}
