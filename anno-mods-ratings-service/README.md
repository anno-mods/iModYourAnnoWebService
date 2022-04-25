# README

This web service is intended to store and share mod ratings. The APIs have been designed to be used with the [I Mod Your Anno]() package.

## APIs

3 APIs are available at [https://rdkqg5bvoj.execute-api.eu-west-1.amazonaws.com/prod/](https://rdkqg5bvoj.execute-api.eu-west-1.amazonaws.com/prod/):

|Endpoint|Description|Parameters|
|---|---|---|
|`POST /like`|Likes a mod|`userId`, `modId`|
|`POST /unlike`|Unlikes a mod|`userId`, `modId`|
|`GET /list`|Lists all the ratings for all mods|none|
