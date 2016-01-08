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

set -e

if ! [ "$DOMAIN" ]; then
    echo "DOMAIN environment variable is required"
    exit 1
fi

if ! [ "$NATS_URL" ]; then
    echo "NATS_URL environment variable is required"
    exit 1
fi

if ! [ "$ROUTE_HOST" ]; then
    echo "ROUTE_HOST environment variable is required"
    exit 1
fi

if ! [ "$ROUTE_PORT" ]; then
    echo "ROUTE_PORT environment variable is required"
    exit 1
fi

if ! [ "$TOKEN_KEY_URL" ]; then
    echo "TOKEN_KEY_URL environment variable is required"
    exit 1
fi

exec "$@"
