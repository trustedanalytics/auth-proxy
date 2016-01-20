/**
 * Copyright (c) 2015 Intel Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
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
    reqHelpers = require('../../app/utils/request-helpers'),
    th = require('../test-helpers');

chai.use(sinonChai);

describe('User test', function() {

    var SUT_PATH = '../../app/lib/user';
    var sut;
    var forwardingMock;
    var reqHelpersMock;

    var USER_REQUEST = {
        url: 'http://localhost:8080/v2/organizations/org123/users/userguid123',
        protocol: 'http',
        params: {
            org_guid: 'org123'
        },
        headers: {
            authorization: "bearer token"
        }
    };

    /*var USER_NAME_REQUEST = {
        url: 'http://localhost:8080/v2/organizations/org123/users',
        protocol: 'http',
        params: {
            org_guid: 'org123'
        },
        body: {
            name: 'user123@example.com'
        },
        headers: {
            authorization: "bearer token"
        }
    };

    var USER = {
        total_results: 1,
        resources: [{
            metadata: {
                guid: 'userguid123'
            }
        }]
    };
*/

    beforeEach(function () {
        forwardingMock = getForwardingMock();
        reqHelpersMock = getReqHelpersMock();

        mockery.registerAllowables(['underscore', 'url-parse', 'util', './', '../logging', '../config/config',
            './default-config.json', SUT_PATH]);
        mockery.registerMock('../utils/request-forwarding', forwardingMock);
        mockery.registerMock('../utils/request-helpers', reqHelpersMock);
        mockery.registerSubstitute('../logging', '../../test/mocks/logging-mock');
        mockery.enable();

        sut = require(SUT_PATH);
    });

    afterEach(function () {
        mockery.disable();
        mockery.deregisterAll();

        delete require.cache[require.resolve(SUT_PATH)];
    });

    it('add to org, cc forward request fails, gateway error', function () {
        forwardingMock.ccForward.returns(th.failingPromise(th.REQUEST_ERROR));
        var response = th.mockResponse();

        return sut.addToOrg(USER_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_REQUEST);
                expect(forwardingMock.agForward).not.called;
            })
            .then(th.assertStatus(response, 502));
    });

    it('add to org, cc server error, forward error', function () {
        forwardingMock.ccForward.returns(th.failingPromise(th.SERVER_ERROR));
        var response = th.mockResponse();

        return sut.addToOrg(USER_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_REQUEST);
                expect(forwardingMock.agForward).not.called;
            })
            .then(th.assertStatus(response, th.SERVER_ERROR.statusCode));
    });

    it('add to org, ag request fails, gateway error', function () {
        forwardingMock.ccForward.returns(th.successPromise());
        forwardingMock.agForward.returns(th.failingPromise(th.REQUEST_ERROR));
        var response = th.mockResponse();

        return sut.addToOrg(USER_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_REQUEST);
                expect(forwardingMock.agForward).calledWith(USER_REQUEST);
            })
            .then(th.assertStatus(response, 502));
    });

    it('add to org, ag server error, gateway error', function () {
        forwardingMock.ccForward.returns(th.successPromise());
        forwardingMock.agForward.returns(th.failingPromise(th.SERVER_ERROR));
        var response = th.mockResponse();

        return sut.addToOrg(USER_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_REQUEST);
                expect(forwardingMock.agForward).calledWith(USER_REQUEST);
            })
            .then(th.assertStatus(response, 502));
    });

    it('add to org, success, forward cc response', function () {
        var responseMsg = {
            statusCode: 201,
            message: "OK"
        };
        forwardingMock.ccForward.returns(th.successPromise(responseMsg));
        var response = th.mockResponse();

        return sut.addToOrg(USER_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_REQUEST);
                expect(forwardingMock.agForward).calledWith(USER_REQUEST);
            })
            .then(th.assertStatus(response, 201));
    });

    it('add to org, ag async, forward cc response with 202 code', function () {
        var responseMsg = {
            statusCode: 201,
            message: "OK"
        };
        forwardingMock.ccForward.returns(th.successPromise(responseMsg));
        forwardingMock.agForward.returns(th.successPromise({statusCode: 202}));
        var response = th.mockResponse();

        return sut.addToOrg(USER_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_REQUEST);
                expect(forwardingMock.agForward).calledWith(USER_REQUEST);
            })
            .then(th.assertStatus(response, 202));
    });



    it('remove from org, cc forward request fails, gateway error', function () {
        forwardingMock.ccForward.returns(th.failingPromise(th.REQUEST_ERROR));
        var response = th.mockResponse();

        return sut.removeFromOrg(USER_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_REQUEST);
                expect(forwardingMock.agForward).not.called;
            })
            .then(th.assertStatus(response, 502));
    });

    it('remove from org, cc server error, forward error', function () {
        forwardingMock.ccForward.returns(th.failingPromise(th.SERVER_ERROR));
        var response = th.mockResponse();

        return sut.removeFromOrg(USER_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_REQUEST);
                expect(forwardingMock.agForward).not.called;
            })
            .then(th.assertStatus(response, th.SERVER_ERROR.statusCode));
    });

    it('remove from org, ag request fails, gateway error', function () {
        forwardingMock.ccForward.returns(th.successPromise());
        forwardingMock.agForward.returns(th.failingPromise(th.REQUEST_ERROR));
        var response = th.mockResponse();

        return sut.removeFromOrg(USER_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_REQUEST);
                expect(forwardingMock.agForward).calledWith(USER_REQUEST);
            })
            .then(th.assertStatus(response, 502));
    });

    it('remove from org, ag server error, gateway error', function () {
        forwardingMock.ccForward.returns(th.successPromise());
        forwardingMock.agForward.returns(th.failingPromise(th.SERVER_ERROR));
        var response = th.mockResponse();

        return sut.removeFromOrg(USER_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_REQUEST);
                expect(forwardingMock.agForward).calledWith(USER_REQUEST);
            })
            .then(th.assertStatus(response, 502));
    });

    it('remove from org, success, forward cc response', function () {
        var responseMsg = {
            statusCode: 200,
            message: "OK"
        };
        forwardingMock.ccForward.returns(th.successPromise(responseMsg));
        var response = th.mockResponse();

        return sut.removeFromOrg(USER_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_REQUEST);
                expect(forwardingMock.agForward).calledWith(USER_REQUEST);
            })
            .then(th.assertStatus(response, 200));
    });

    it('remove from org, ag async, forward cc response with 202 code', function () {
        var responseMsg = {
            statusCode: 200,
            message: "OK"
        };
        forwardingMock.ccForward.returns(th.successPromise(responseMsg));
        forwardingMock.agForward.returns(th.successPromise({statusCode: 202}));
        var response = th.mockResponse();

        return sut.removeFromOrg(USER_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_REQUEST);
                expect(forwardingMock.agForward).calledWith(USER_REQUEST);
            })
            .then(th.assertStatus(response, 202));
    });



    /*it('add to org by name, cc forward request fails, gateway error', function () {
        forwardingMock.ccForward.returns(th.failingPromise(th.REQUEST_ERROR));
        var response = th.mockResponse();

        return sut.addToOrgByName(USER_NAME_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_NAME_REQUEST);
                expect(forwardingMock.agForward).not.called;
                expect(reqHelpersMock.getJsonRequest).not.called;
            })
            .then(th.assertStatus(response, 502));
    });

    it('add to org by name, cc server error, forward error', function () {
        forwardingMock.ccForward.returns(th.failingPromise(th.SERVER_ERROR));
        var response = th.mockResponse();

        return sut.addToOrgByName(USER_NAME_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_NAME_REQUEST);
                expect(forwardingMock.agForward).not.called;
                expect(reqHelpersMock.getJsonRequest).not.called;
            })
            .then(th.assertStatus(response, th.SERVER_ERROR.statusCode));
    });

    it('add to org by name, uaa request fails, gateway error', function () {
        forwardingMock.ccForward.returns(th.successPromise());
        reqHelpersMock.getJsonRequest.returns(th.failingPromise(th.REQUEST_ERROR));
        var response = th.mockResponse();

        return sut.addToOrgByName(USER_NAME_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_NAME_REQUEST);
                expect(reqHelpersMock.getJsonRequest).called;
                expect(forwardingMock.agForward).not.called;
            })
            .then(th.assertStatus(response, 502));
    });

    it('add to org by name, uaa server error, forward error', function () {
        forwardingMock.ccForward.returns(th.successPromise());
        reqHelpersMock.getJsonRequest.returns(th.failingPromise(th.SERVER_ERROR));
        var response = th.mockResponse();

        return sut.addToOrgByName(USER_NAME_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_NAME_REQUEST);
                expect(reqHelpersMock.getJsonRequest).called;
                expect(forwardingMock.agForward).not.called;
            })
            .then(th.assertStatus(response, th.SERVER_ERROR.statusCode));
    });

    it('add to org by name, user not found, gateway error', function () {
        forwardingMock.ccForward.returns(th.successPromise());
        reqHelpersMock.getJsonRequest.returns(th.failingPromise(th.EMPTY_RESOURCE));
        var response = th.mockResponse();

        return sut.addToOrgByName(USER_NAME_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_NAME_REQUEST);
                expect(reqHelpersMock.getJsonRequest).called;
                expect(forwardingMock.agForward).not.called;
            })
            .then(th.assertStatus(response, 502));
    });

    it('add to org by name, ag request fails, gateway error', function () {
        forwardingMock.ccForward.returns(th.successPromise());
        reqHelpersMock.getJsonRequest.returns(th.successPromise(USER));
        forwardingMock.agForward.returns(th.failingPromise(th.REQUEST_ERROR));
        var response = th.mockResponse();

        return sut.addToOrgByName(USER_NAME_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_NAME_REQUEST);
                expect(reqHelpersMock.getJsonRequest).called;
                expect(forwardingMock.agForward).calledWith(USER_NAME_REQUEST, '/v2/organizations/org123/users/userguid123');
            })
            .then(th.assertStatus(response, 502));
    });

    it('add to org by name, ag server error, forward error', function () {
        forwardingMock.ccForward.returns(th.successPromise());
        reqHelpersMock.getJsonRequest.returns(th.successPromise(USER));
        forwardingMock.agForward.returns(th.failingPromise(th.SERVER_ERROR));
        var response = th.mockResponse();

        return sut.addToOrgByName(USER_NAME_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_NAME_REQUEST);
                expect(reqHelpersMock.getJsonRequest).called;
                expect(forwardingMock.agForward).calledWith(USER_NAME_REQUEST, '/v2/organizations/org123/users/userguid123');
            })
            .then(th.assertStatus(response, th.SERVER_ERROR.statusCode));
    });

    it('add to org by name, success, forward cc response', function () {
        var responseMsg = {
            statusCode: 201,
            message: "OK"
        };
        forwardingMock.ccForward.returns(th.successPromise(responseMsg));
        reqHelpersMock.getJsonRequest.returns(th.successPromise(USER));
        var response = th.mockResponse();

        return sut.addToOrgByName(USER_NAME_REQUEST, response)
            .then(function () {
                expect(forwardingMock.ccForward).calledWith(USER_NAME_REQUEST);
                expect(reqHelpersMock.getJsonRequest).called;
                expect(forwardingMock.agForward).calledWith(USER_NAME_REQUEST, '/v2/organizations/org123/users/userguid123');
            })
            .then(th.assertStatus(response, 201));
    });*/
});


function getForwardingMock() {
    return {
        ccForward: sinon.mock().returns(q.defer().promise),
        agForward: sinon.mock().returns(th.successPromise({statusCode: 200}))
    };
}
function getReqHelpersMock() {
    return {
        Method: reqHelpers.Method,
        getJsonRequest: sinon.mock().returns(q.defer().promise),
        handleError: reqHelpers.handleError,
        handleAsyncResponse: reqHelpers.handleAsyncResponse
    };
}
