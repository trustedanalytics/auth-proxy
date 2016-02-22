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

var passport = require('passport'),
    app = require('express')(),
    bodyParser = require('body-parser'),
    logger = require('morgan'),
    reverseProxy = require('./reverse-proxy'),
    auth = require('./auth/auth');

module.exports = app;

app.use(bodyParser.json());
app.use(logger('dev'));


auth.init(app)
    .then(function () {

        // authenticate requests
        app.use(passport.authenticate('jwt-bearer', {session: false}));

        // https://apidocs.cloudfoundry.org/225/organizations/creating_an_organization.html
        app.post('/v2/organizations',
            reverseProxy.createOrganization
        );

        // https://apidocs.cloudfoundry.org/225/organizations/delete_a_particular_organization.html
        app.delete('/v2/organizations/:org_guid',
            reverseProxy.deleteOrganization
        );

        // https://apidocs.cloudfoundry.org/225/organizations/associate_user_with_the_organization.html
        app.put('/v2/organizations/:org_guid/users/:user_guid',
            reverseProxy.addUserToOrganization
        );

        // https://apidocs.cloudfoundry.org/225/organizations/remove_user_from_the_organization.html
        app.delete('/v2/organizations/:org_guid/users/:user_guid',
            reverseProxy.removeUserFromOrganization
        );

        // https://apidocs.cloudfoundry.org/225/organizations/associate_user_with_the_organization_by_username.html
        app.put('/v2/organizations/:org_guid/users',
            reverseProxy.addUserToOrganizationByUsername
        );

        // https://apidocs.cloudfoundry.org/225/organizations/disassociate_user_with_the_organization_by_username.html
        app.delete('/v2/organizations/:org_guid/users',
            reverseProxy.removeUserFromOrganizationByUsername
        );

        // https://apidocs.cloudfoundry.org/225/users/associate_organization_with_the_user.html
        app.put('/v2/users/:user_guid/organizations/:org_guid',
            reverseProxy.addUserToOrganization
        );

        // https://apidocs.cloudfoundry.org/225/users/remove_organization_from_the_user.html
        app.delete('/v2/users/:user_guid/organizations/:org_guid',
            reverseProxy.removeUserFromOrganization
        );
    }).then(function () {
        console.info("initialization completed...");
    }).catch(function (err) {
        console.error(err);
    }).done();