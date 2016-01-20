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

var requestPromise = require('request-promise'),
    UrlParser = require('url-parse'),
    _ = require('underscore');

var methods = {
    GET: "GET",
    POST: "POST",
    DELETE: "DELETE",
    PUT: "PUT"
};

function jsonRequest(method, url, options) {
    var requestObject = _.extend({}, options, {
        url: url,
        method: method,
        json: true
    });
    return requestPromise(requestObject);
}

function pipedRequest(req, hostname, path, options) {
    var url = new UrlParser(req.url);

    url.set('protocol', req.protocol + ':');
    url.set('hostname', hostname);
    if(path) {
        url.set('pathname', path);
    }

    options = _.extend({
        uri: url.href,
        headers: req.headers,
        body: req.body,
        method: req.method,
        json: true
    }, options);

    if(_.isObject(options.body) && !options.json) {
        options.body = JSON.stringify(options.body);
    }
    options.headers['x-forwarded-host'] = req.headers.host;
    options.headers.host = hostname;

    return requestPromise(options);
}

function handleError(response, error) {
    if(error.statusCode) {
        response.status(error.statusCode).send(JSON.stringify(error.response.body));
    } else {
        response.status(502).send(error.message);
    }
}

function toGatewayPath(path) {
    return (path || '').replace('^/?v2/', '/');
}

function handleAsyncResponse(response, body) {
    return {
        body: body,
        async: response.statusCode === 202
    };
}

module.exports = {
    getJsonRequest: jsonRequest,
    getPipedRequest: pipedRequest,
    handleError: handleError,
    toGatewayPath: toGatewayPath,
    handleAsyncResponse: handleAsyncResponse,
    Method: methods
};