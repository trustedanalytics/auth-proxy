#!/bin/bash
#
#  Copyright (c) 2015 Intel Corporation
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

function version() {
    cat package.json | grep 'version' | awk '{ print $2 }' | sed s/\"//g | sed s/,//g
}

# Proxy Configuration
#--build-arg http_proxy=
#--build-arg https_proxy=
#--build-arg no_proxy=

sudo docker build --no-cache \
	--tag="tap/auth-proxy:`version`" \
	.
