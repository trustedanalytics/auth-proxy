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
var defaults = require('./default-config.json');
var util = require('util');
var URL = require('url-parse');

var vcapServices = JSON.parse(process.env.VCAP_SERVICES || '{}');
var vcapApplication = JSON.parse(process.env.VCAP_APPLICATION || '{}');
var userProvided = vcapServices['user-provided'] || [];

function isCloud() {
    return !!process.env.VCAP_SERVICES;
}

function getDomain() {
    if (vcapApplication.uris) {
        return new URL(vcapApplication.uris[0]).host.split(".").slice(1).join(".");
    }
    return getRequiredProperty("domain");
}

function getNatsUrl() {
    var nats = getUserProvidedService("nats-provider");
    if (nats) {
        return nats.url;
    }
    return getRequiredProperty("nats_url");
}

function getTokenKeyUrl() {
    var sso = getUserProvidedService("sso");
    if (sso) {
        return sso.tokenKey;
    }

    var tokenKeyUrl = getProperty("token_key_url");
    if (tokenKeyUrl) {
        return tokenKeyUrl;
    }

    return util.format("https://uaa.%s/token_key", getDomain());
}

function getAuthGatewayHost() {
    return getProperty("auth_gateway_host") || util.format("auth-gateway.%s", getDomain());
}

function getRouteHost() {
    return getProperty("CF_INSTANCE_IP") || getRequiredProperty("route_host");
}

function getRoutePort() {
    var routePort = getProperty("CF_INSTANCE_PORT") || getRequiredProperty("route_port");
    return parseInt(routePort);
}

function getRouteUri() {
    return getProperty("route_uri") ||  util.format("auth-proxy.%s", getDomain());
}

function getCfApi() {
    return getProperty("cf_api") || util.format("cf-api.%s", getDomain());
}

function getUaaApi() {
    return getProperty("uaa_api") || util.format("uaa.%s", getDomain());
}

function getRequiredProperty(name) {
    var property = getProperty(name);
    if (!property) {
        throw new Error('Property: ' + name.toUpperCase() + ' is required.');
    }
    return property;
}

function getProperty(name) {
    if (!_.isString(name)) {
        return null;
    }
    return process.env[name.toUpperCase()] || defaults[name.toLowerCase()];
}

function getUserProvidedService(name) {
    var service = _.findWhere(userProvided, {name: name});
    return service && service.credentials;
}

module.exports = {
    get: getProperty,
    getTokenKeyUrl: getTokenKeyUrl,
    getAuthGatewayHost: getAuthGatewayHost,
    getNatsUrl: getNatsUrl,
    getCfApi: getCfApi,
    getUaaApi: getUaaApi,
    getRouteHost: getRouteHost,
    getRoutePort: getRoutePort,
    getRouteUri: getRouteUri,
    isCloud: isCloud
};
