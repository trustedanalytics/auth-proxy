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
/* jshint -W030 */
'use strict';

var chai = require('chai'),
    expect = chai.expect,
    mockery = require('mockery'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    q = require('q'),
    th = require('../test-helpers');

chai.use(sinonChai);

describe('Organization test', function() {

    var sut;
    var forwardingMock;



    var ORG_RESOURCE = {
        metadata: {
            guid: 'guid123'
        }
    };

    var ORG_CREATE_REQUEST = {
        url: 'http://localhost:8080/sth',
        protocol: 'http',
        body: {
            name: "org-test-1"
        },
        headers: {
            authorization: "bearer token"
        }
    };

    var ORG_DELETE_REQUEST = {
        url: 'http://localhost:8080/v2/organizations/guid123',
        protocol: 'http',
        headers: {
            authorization: "bearer token"
        },
        params: {
            org_guid: 'guid123'
        }
    };



    beforeEach(function() {
        forwardingMock = getForwardingMock();

        mockery.registerAllowables(['q', 'underscore', 'url-parse', 'util', './', '../logging', '../config/config',
            './default-config.json', '../../app/lib/organization']);
        mockery.registerMock('../utils/request-forwarding', forwardingMock);
        mockery.registerSubstitute('../logging', '../../test/mocks/logging-mock');
        mockery.enable();

        sut = require('../../app/lib/organization');
    });

    afterEach(function() {
        mockery.disable();
        mockery.deregisterAll();

        delete require.cache[require.resolve('../../app/lib/organization')];
    });


    it('create organization, create cc org', function() {
        forwardingMock.ccForward.returns(th.successPromise(ORG_RESOURCE));
        var response = th.mockResponse();

        return sut.create(ORG_CREATE_REQUEST, response)
            .then(function() {
                expect(forwardingMock.ccForward, 'ccforward').to.be.calledWith(ORG_CREATE_REQUEST);
                expect(forwardingMock.agForward, 'agforward').to.be.calledWith(ORG_CREATE_REQUEST, '/organizations/guid123');
            })
            .then(th.assertStatus(response, 201, ORG_RESOURCE));
    });

    it('create organization, cc forward request fails, return gateway error', function() {
        forwardingMock.ccForward.returns(th.failingPromise(th.REQUEST_ERROR));
        var response = th.mockResponse();

        return sut.create(ORG_CREATE_REQUEST, response)
            .then(function() {
                expect(forwardingMock.ccForward, 'ccforward').to.be.calledWith(ORG_CREATE_REQUEST);
                expect(forwardingMock.agForward, 'agforward').not.to.be.called;
            })
            .then(th.assertStatus(response, 502));
    });

    it('create organization, cc forward conflict (400), return 400', function() {
        forwardingMock.ccForward.returns(th.failingPromise(th.REQUEST_CONFLICT));
        var response = th.mockResponse();

        return sut.create(ORG_CREATE_REQUEST, response)
            .then(function() {
                expect(forwardingMock.ccForward, 'ccforward').to.be.calledWith(ORG_CREATE_REQUEST);
                expect(forwardingMock.agForward, 'agforward').not.to.be.called;
            })
            .then(th.assertStatus(response, 400));
    });

    it('create organization, cc forward server error, forward error', function() {
        forwardingMock.ccForward.returns(th.failingPromise(th.SERVER_ERROR));
        var response = th.mockResponse();

        return sut.create(ORG_CREATE_REQUEST, response)
            .then(th.assertStatus(response, th.SERVER_ERROR.statusCode));
    });

    it('create organization, ag forward request failure, gateway error', function() {
        forwardingMock.ccForward.returns(th.successPromise(ORG_RESOURCE));
        forwardingMock.agForward.returns(th.failingPromise(th.REQUEST_ERROR));
        var response = th.mockResponse();

        return sut.create(ORG_CREATE_REQUEST, response)
            .then(th.assertStatus(response, 502));
    });

    it('create organization, ag forward server error, return 502', function() {
        forwardingMock.ccForward.returns(th.successPromise(ORG_RESOURCE));
        forwardingMock.agForward.returns(th.failingPromise(th.SERVER_ERROR));
        var response = th.mockResponse();

        return sut.create(ORG_CREATE_REQUEST, response)
            .then(th.assertStatus(response, 502));
    });

    it('create organization, ag incomplete, return 202', function() {
        forwardingMock.ccForward.returns(th.successPromise(ORG_RESOURCE));
        forwardingMock.agForward.returns(th.successPromise({statusCode: 202}));
        var response = th.mockResponse();

        return sut.create(ORG_CREATE_REQUEST, response)
            .then(th.assertStatus(response, 202));
    });



    it('delete organization, no org found, delete from ag and pass 404', function() {
        forwardingMock.ccForward.returns(th.failingPromise(th.NOT_FOUND_ERROR));
        var response = th.mockResponse();

        return sut.delete(ORG_DELETE_REQUEST, response)
            .then(function() {
                expect(forwardingMock.ccForward).to.be.calledWith(ORG_DELETE_REQUEST);
                expect(forwardingMock.agForward).not.to.be.called;
            })
            .then(th.assertStatus(response, 404));
    });

    it('delete organization, cc forward request fails, return gateway error', function() {
        forwardingMock.ccForward.returns(th.failingPromise(th.REQUEST_ERROR));
        var response = th.mockResponse();

        return sut.delete(ORG_DELETE_REQUEST, response)
            .then(function() {
                expect(forwardingMock.ccForward).to.be.calledWith(ORG_DELETE_REQUEST);
                expect(forwardingMock.agForward).not.to.be.called;
            })
            .then(th.assertStatus(response, 502));
    });

    it('delete organization, cc forward server error, forward error', function() {
        forwardingMock.ccForward.returns(th.failingPromise(th.SERVER_ERROR));
        var response = th.mockResponse();

        return sut.delete(ORG_DELETE_REQUEST, response)
            .then(function() {
                expect(forwardingMock.ccForward).to.be.calledWith(ORG_DELETE_REQUEST);
                expect(forwardingMock.agForward).not.to.be.called;
            })
            .then(th.assertStatus(response, th.SERVER_ERROR.statusCode));
    });

    it('delete organization, ag forward request failure, gateway error', function() {
        forwardingMock.ccForward.returns(th.successPromise());
        forwardingMock.agForward.returns(th.failingPromise(th.REQUEST_ERROR));
        var response = th.mockResponse();

        return sut.delete(ORG_DELETE_REQUEST, response)
            .then(function() {
                expect(forwardingMock.ccForward).to.be.calledWith(ORG_DELETE_REQUEST);
                expect(forwardingMock.agForward).to.be.calledWith(ORG_DELETE_REQUEST);
            })
            .then(th.assertStatus(response, 502));
    });

    it('delete organization, ag forward server error, gateway error', function() {
        forwardingMock.ccForward.returns(th.successPromise());
        forwardingMock.agForward.returns(th.failingPromise(th.SERVER_ERROR));
        var response = th.mockResponse();

        return sut.delete(ORG_DELETE_REQUEST, response)
            .then(function() {
                expect(forwardingMock.ccForward).to.be.calledWith(ORG_DELETE_REQUEST);
                expect(forwardingMock.agForward).to.be.calledWith(ORG_DELETE_REQUEST);
            })
            .then(th.assertStatus(response, 502));
    });

    it('delete organization, ag async, return 202', function() {
        forwardingMock.ccForward.returns(th.successPromise());
        forwardingMock.agForward.returns(th.successPromise({statusCode: 202}));
        var response = th.mockResponse();

        return sut.delete(ORG_DELETE_REQUEST, response)
            .then(function() {
                expect(forwardingMock.ccForward).to.be.calledWith(ORG_DELETE_REQUEST);
                expect(forwardingMock.agForward).to.be.calledWith(ORG_DELETE_REQUEST);
            })
            .then(th.assertStatus(response, 202));
    });
});


function getForwardingMock() {
    return {
        ccForward: sinon.mock().returns(q.defer().promise),
        agForward: sinon.mock().returns(th.successPromise({statusCode: 200}))
    };
}
