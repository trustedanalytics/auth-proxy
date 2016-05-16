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

var _ = require('underscore');
var util = require('util');
var URL = require('url-parse');

var vcapApplication = JSON.parse(process.env.VCAP_APPLICATION || '{}');

function getDomain() {
    var domain = getProperty('domain');
    if(domain) {
        return domain;
    }

    if (vcapApplication.uris) {
        return new URL(vcapApplication.uris[0]).host.split(".").slice(1).join(".");
    }

    throw new Error('Cannot fetch domain configuration');
}

function getAuthGatewayHost() {
    return getProperty("auth_gateway_host") || util.format("auth-gateway.%s", getDomain());
}

function getCfApiHost() {
    return getProperty("cf_api_host") || util.format("cf-api.%s", getDomain());
}

function getTokenKeyUrl() {
    return getProperty("token_key_url") || util.format("https://uaa.%s/token_key", getDomain());
}

function getUaaHost() {
    return getProperty("uaa_host") || util.format("uaa.%s", getDomain());
}

function getProperty(name) {
    if (!_.isString(name)) {
        return null;
    }
    return process.env[name.toUpperCase()];
}

module.exports = {
    get: getProperty,
    getAuthGatewayHost: getAuthGatewayHost,
    getCfApiHost: getCfApiHost,
    getTokenKeyUrl: getTokenKeyUrl,
    getUaaHost: getUaaHost
};
