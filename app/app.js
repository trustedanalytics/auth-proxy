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
var passport = require('passport');
var express = require('express');
var bodyParser = require('body-parser');
var reverseProxy = require('./reverse-proxy');
var router = require('./router');
var auth = require('./auth');
var logger = require('./logging').logger;

var app = express();
app.use(bodyParser.json());

module.exports = app;

auth.init(app)
    .then(router.init(app))
    .then(function (app) {
        // https://apidocs.cloudfoundry.org/225/organizations/creating_an_organization.html
        app.post('/v2/organizations',
            passport.authenticate('jwt-bearer', {session: false}),
            reverseProxy.createOrganization
        );

        // https://apidocs.cloudfoundry.org/225/organizations/delete_a_particular_organization.html
        app.delete('/v2/organizations/:org_guid',
            passport.authenticate('jwt-bearer', {session: false}),
            reverseProxy.deleteOrganization
        );

        // https://apidocs.cloudfoundry.org/225/organizations/associate_user_with_the_organization.html
        app.put('/v2/organizations/:org_guid/users/:user_guid',
            passport.authenticate('jwt-bearer', {session: false}),
            reverseProxy.addUserToOrganization
        );

        // https://apidocs.cloudfoundry.org/225/organizations/remove_user_from_the_organization.html
        app.delete('/v2/organizations/:org_guid/users/:user_guid',
            passport.authenticate('jwt-bearer', {session: false}),
            reverseProxy.removeUserFromOrganization
        );

        // https://apidocs.cloudfoundry.org/225/organizations/associate_user_with_the_organization_by_username.html
        app.put('/v2/organizations/:org_guid/users',
            passport.authenticate('jwt-bearer', {session: false}),
            reverseProxy.addUserToOrganizationByUsername
        );

        // https://apidocs.cloudfoundry.org/225/organizations/disassociate_user_with_the_organization_by_username.html
        app.delete('/v2/organizations/:org_guid/users',
            passport.authenticate('jwt-bearer', {session: false}),
            reverseProxy.removeUserFromOrganizationByUsername
        );

        // https://apidocs.cloudfoundry.org/225/users/associate_organization_with_the_user.html
        app.put('/v2/users/:user_guid/organizations/:org_guid',
            passport.authenticate('jwt-bearer', {session: false}),
            reverseProxy.addUserToOrganization
        );

        // https://apidocs.cloudfoundry.org/225/users/remove_organization_from_the_user.html
        app.delete('/v2/users/:user_guid/organizations/:org_guid',
            passport.authenticate('jwt-bearer', {session: false}),
            reverseProxy.removeUserFromOrganization
        );
    }).then(function () {
        logger.info("initialization completed...");
    }).catch(function (err) {
        logger.error(err);
    }).done();
