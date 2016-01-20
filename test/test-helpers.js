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

var _ = require('underscore'),
    chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    q = require('q');

chai.use(sinonChai);

var REQUEST_ERROR = {
    message: "request error messsage"
};

var REQUEST_CONFLICT = {
    statusCode: 400,
    response: {
        body: {
            status: "Conflict"
        }
    }
};

var SERVER_ERROR = {
    statusCode: 500,
    response: {
        body: {
            status: "request error messsage"
        }
    }
};

var NOT_FOUND_ERROR = {
    statusCode: 404,
    response: {
        body: {
            status: "Not found"
        }
    }
};

var EMPTY_RESOURCE = {
    total_results: 0,
    resouces: []
};

function failingPromise(error) {
    var deferred = q.defer();
    deferred.reject(error);
    return deferred.promise;
}

function successPromise(response) {
    var deferred = q.defer();
    deferred.resolve(response);
    return deferred.promise;
}

function assertStatus(response, code, message) {
    return function() {
        expect(response.status).calledWith(code);
        if(message) {
            expect(response.send).calledWith(_.isString(message) ? message : JSON.stringify(message));
        }
    };
}

function mockResponse() {
    return {
        status: sinon.stub().returnsThis(),
        send: sinon.stub().returnsThis()
    };
}


module.exports = {
    failingPromise: failingPromise,
    successPromise: successPromise,
    assertStatus: assertStatus,
    mockResponse: mockResponse,
    REQUEST_ERROR: REQUEST_ERROR,
    REQUEST_CONFLICT: REQUEST_CONFLICT,
    SERVER_ERROR: SERVER_ERROR,
    NOT_FOUND_ERROR: NOT_FOUND_ERROR,
    EMPTY_RESOURCE: EMPTY_RESOURCE
};
