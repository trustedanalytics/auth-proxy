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

# Base image
FROM debian:jessie

# Environment variables
ENV APP_HOME '/root/auth-proxy'
ENV PORT 8080

# Node installation
RUN apt-get update && apt-get install -y \
	curl \
	&& curl -sL "https://deb.nodesource.com/setup_4.x" | bash - \
	&& apt-get install -y nodejs

# Application copy
COPY app/ ${APP_HOME}/app/
COPY node_modules/ ${APP_HOME}/node_modules/
COPY package.json ${APP_HOME}/

# Entry point copy
COPY ["docker-entrypoint.sh", "/"]

# Entry point configuration
ENTRYPOINT ["/docker-entrypoint.sh"]

# Working directory
WORKDIR $APP_HOME

# Install dependencies
RUN npm install

# Expose port
EXPOSE $PORT

# Volume for logs
RUN mkdir -p $APP_HOME/logs
VOLUME $APP_HOME/logs

# Start auth-proxy
CMD ["npm", "start"]
