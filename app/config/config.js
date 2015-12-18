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
    if (!!vcapApplication.uris) {
        return new URL(vcapApplication.uris[0]).host.split(".").slice(1).join(".");
    } else {
        return getRequiredProperty("domain");
    }
}

function getNatsUrl() {
    var nats = getUserProvidedService("nats-provider");
    if (nats != null) {
        return nats.url;
    } else {
        return getRequiredProperty("nats_url");
    }
}

function getTokenKeyUrl() {
    var sso = getUserProvidedService("sso");
    if (sso != null) {
        return sso.tokenKey;
    }

    var tokenKeyUrl = getProperty("token_key_url");
    if (!!tokenKeyUrl) {
        return tokenKeyUrl;
    }

    return util.format("https://uaa.%s/token_key", getDomain());
}

function getAuthGatewayHost() {
    var authGatewayHost = getProperty("auth_gateway_host");
    if (!!authGatewayHost) {
        return authGatewayHost;
    }

    return util.format("auth-gateway.%s", getDomain())
}

function getRouteHost() {
    var routeHost = getProperty("CF_INSTANCE_IP");
    if (!!routeHost) {
        return routeHost;
    }
    return getRequiredProperty("route_host");
}

function getRoutePort() {
    var routePort = getProperty("CF_INSTANCE_PORT");
    if (!!routePort) {
        return parseInt(routePort);
    }
    return parseInt(getRequiredProperty("route_port"));
}

function getRouteUri() {
    var routeUri = getProperty("route_uri");
    if (!!routeUri) {
        return routeUri;
    }

    return util.format("auth-proxy.%s", getDomain());
}

function getCfApi() {
    var cfApi = getProperty("cf_api");
    if (!!cfApi) {
        return cfApi;
    }

    return util.format("cf-api.%s", getDomain());
}

function getUaaApi() {
    var uaaApi = getProperty("uaa_api");
    if (!!uaaApi) {
        return uaaApi;
    }

    return util.format("uaa.%s", getDomain());
}

function getRequiredProperty(name) {
    var property = getProperty(name);
    if (!!property) {
        return property;
    } else {
        throw new Error('Property: ' + name.toUpperCase() + ' is required.');
    }
}

function getProperty(name) {
    if (!name || !_.isString(name)) {
        return null;
    }
    var value = process.env[name.toUpperCase()];
    if (!value) {
        value = defaults[name.toLowerCase()];
    }
    return value;
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
