# Auth-proxy
>Service that provides centralized entry point for handling requests regarding granting and revoking permissions
>to cloud foundry and Hadoop.

## General description
Auth-proxy ensures that some of the request to Cloud Controller are intercepted and delegated
to both Cloud Controller and Auth-gateway. It performs necessary translation of Cloud Foundry
API calls to Auth-gateway API. This ensures that Auth-gateway is notified about all requests that
grant or revoke access to some of the platform components (e.g. organization). Having this
information Auth-gateway can perform additional actions regarding access and security in Hadoop.

## The request flow
![](docs/AuthProxy.png)

User actions performed either through Console or CF CLI result in REST calls to Cloud Controller. All
of them are routed via Load balancer which is configured to intercept some of them (defined in next
section) and to delegate them to Auth-proxy.
Auth-proxy optionally translates resource names (e.g organization, user) into guid's and then
sequentially calls Cloud Controller and Auth-gateway. All actions delegated through Auth-proxy
are idempotent.
Service logically is communicating with Cloud Controller and Auth-gateway but on network level
whole communication goes through load balancer (that's why there are dashed arrows between Auth-proxy
and Cloud Controller or Auth-gateway).

## Auth-proxy REST Api (consistent with CF api docs)
-   Create organization 
    (https://apidocs.cloudfoundry.org/225/organizations/creating_an_organization.html)
    ```
    POST /v2/organizations
    ```

-   Delete organization 
    (https://apidocs.cloudfoundry.org/225/organizations/delete_a_particular_organization.html)
    ```
    DELETE /v2/organizations/:org_guid
    ```

-   Add user to organization (by guid)
    (https://apidocs.cloudfoundry.org/225/organizations/associate_user_with_the_organization.html)
    ```
    PUT /v2/organizations/:org_guid/users/:user_guid
    ```
  
    (https://apidocs.cloudfoundry.org/225/users/associate_organization_with_the_user.html)
    ```
    PUT /v2/users/:user_guid/organizations/:org_guid
    ```

-   Remove user from organization (by guid)
    (https://apidocs.cloudfoundry.org/225/organizations/remove_user_from_the_organization.html)
    ```
    DELETE /v2/organizations/:org_guid/users/:user_guid
    ```
   
    (https://apidocs.cloudfoundry.org/225/users/remove_organization_from_the_user.html)
    ```
    DELETE /v2/users/:user_guid/organizations/:org_guid
    ```
        
Whole sequence diagram of how auth-proxy responses in certain situations can be found here: ![sequence diagram](docs/sequence-diagram.png)

## Local development
Auth-proxy is a nodejs application. First install all dependencies:
```sh
npm install
```

To run service locally you don't need to use and configure nats. To disable it change variable *profile* in *app/config/default-config.json* to 'local'.

Than start server:
```sh
npm start
```

Configuration of service can be changed by either overriding defaults using environment variables or defining them in *app/config/default-config.json*.
In case they are defined in both places environment variables have higher priority. Service is also using best effort approach to guess parameters
that were not specified but are needed for initialization. In case required parameters are missing service will notify about it and shutdown gracefully.

## Create docker image
```sh
./build.sh
```

## Start docker container

Required parameters:
```sh
-e DOMAIN="domain.com"
-e NATS_URL="nats://LOGIN:PASSWORD@IP:PORT"
-e ROUTE_HOST="HOST_IP"
-e ROUTE_PORT=HOST_PORT
``` 

Optional parameters:
```sh
-e TOKEN_KEY_URL="https://uaa.DOMAIN/token_key"
-e CF_API="api.DOMAIN"
-e UAA_API="uaa.DOMAIN"
-e AUTH_GATEWAY_HOST="auth-gateway.DOMAIN"
-e ROUTE_URI="auth-proxy.DOMAIN"
``` 

Example:
```sh
sudo docker run \
-e DOMAIN="domain.com" \
-e NATS_URL="nats://nats_login:nats_password@127.0.0.1:4222" \
-e ROUTE_HOST="127.0.0.1" \
-e ROUTE_PORT=61009 \
tap/auth-proxy:0.4.0
```

## Deploy as application in TAP
Install nodejs dependencies:
```sh
npm install
```
Then you can push application:
```sh
cf push
```
Application can be accessed using auth-proxy-app.DOMAIN or auth-proxy.DOMAIN (after it register itself in gorouter)
