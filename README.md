# @envoy/passport-envoy

[Passport](http://passportjs.org/) strategy for authenticating with
[Envoy](https://envoy.com/) using the OAuth 2.0 API.

This module lets you authenticate using Envoy in your Node.js applications. By plugging
into Passport, Envoy authentication can be easily and unobtrusively integrated into any
application or framework that supports [Connect](http://www.senchalabs.org/connect/)-style
middleware, including [Express](http://expressjs.com/).

## Install

```bash
$ npm install @envoy/passport-envoy
```

## Usage

#### Create an Application

Before using `passport-envoy`, you must register an application with Envoy by reaching out
to the Envoy [partnership team](mailto:partners@envoy.com). Your application will be
issued a client ID and client secret, which need to be provided to the strategy. You will
also need to configure a redirect URI which matches the route in your application.

#### Configure Strategy

The Envoy authentication strategy authenticates users using an Envoy account and OAuth 2.0
tokens. The client ID and secret obtained when creating an application are supplied as
options when creating the strategy. You can optionally pass in a `verify` callback, which
receives the access token and optional refresh token, as well as `profile` which contains
the authenticated user's Envoy profile. The `verify` callback must call `done` providing a
user to complete authentication.

```javascript
const { Strategy } = require("@envoy/passport-envoy");

passport.use(
  new Strategy({
    clientID: ENVOY_CLIENT_ID,
    clientSecret: ENVOY_CLIENT_SECRET,
    callbackURL: "http://www.example.com/auth/envoy/callback",
  })
);
```

`profile` is the result of querying the Envoy GraphQL API with the following query.

```graphql
query User {
  me {
    id
    name: formattedName
    email
  }
}
```

What gets yielded to the `verify` callback has the following shape.

```json
{
  "me": {
    "id": "12345",
    "name": "John Doe",
    "email": "johndoe@example.com"
  }
}
```

You can customize the GraphQL query by passing in a `profileQuery` option to the strategy.

```javascript
passport.use(
  new Strategy({
    clientID: ENVOY_CLIENT_ID,
    clientSecret: ENVOY_CLIENT_SECRET,
    callbackURL: "http://www.example.com/auth/envoy/callback",
    profileQuery: `
      query User {
        me {
          id
          name: formattedName
          email
          employee {
            id
          }
          organization {
            id
            name
          }
        }
      }
    `,
  })
);
```

If you are querying more than the `me` schema, don't forget to pass in a custom `verify`
callback, or you'll only see data under `me`.

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'envoy'` strategy, to authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/) application:

```javascript
app.get("/auth/envoy", passport.authenticate("envoy", { scope: ["profile"] }));

app.get(
  "/auth/envoy/callback",
  passport.authenticate("envoy", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);
```

## Examples

Developers using the popular [Express](http://expressjs.com/) web framework can refer to
an [example](https://github.com/passport/express-4.x-facebook-example) as a starting point
for their own web applications. The example shows how to authenticate users using
Facebook. However, because both Facebook and Envoy use OAuth 2.0, the code is similar.
Simply replace references to Facebook with corresponding references to Envoy.

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2020-present Envoy <[https://envoy.com](https://envoy.com)>
