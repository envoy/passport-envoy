const fetch = require("node-fetch");
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}
const { Strategy: OAuth2Strategy } = require("passport-oauth2");
const { GraphQLClient } = require("graphql-request");
const EnvoyTokenError = require("./errors/envoyTokenError");
const EnvoyGraphQLError = require("./errors/envoyGraphQLError");

function defaultVerify(req, accessToken, _refreshToken, profile, done) {
  if (req.session) {
    req.session.accessToken = accessToken;
  }
  done(null, profile.me);
}

/**
 * `Strategy` constructor.
 *
 * The Envoy authentication strategy authenticates requests by delegating to Envoy using
 * the OAuth 2.0 protocol.
 *
 * Applications may supply a `verify` callback which accepts an `accessToken`, an optional
 * `refreshToken` and service-specific `profile`, and then calls the `done` callback
 * supplying a `user`, which should be set to `false` if the credentials are not valid.
 * If an exception occured, `err` should be set. If none if passed in, the strategy will
 * use a default `verify` callback that will set `accessToken` in the session and yield
 * the results of the `me` GraphQL schema.
 *
 * Options:
 *   - `clientID`      your Envoy application's client id
 *   - `clientSecret`  your Envoy application's client secret
 *   - `callbackURL`   URL to which Envoy will redirect the user after granting
 *                     authorization
 *   - `scope`         list of scopes your application is requesting. This can be an array
 *                     of strings, or a string delimited by commas
 *   - `profileQuery`  a GraphQL query for fetching the profile. A default query will be
 *                     issued which will fetch only the `id`, `name` and `email` if none
 *                     is this option is not set.
 *
 * Example:
 *
 *     passport.use(new Strategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.com/auth/envoy/callback',
 *         scope: ['public', 'token.refresh']
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @constructor
 * @param {object} options
 * @param {function} verify
 * @access public
 */
class Strategy extends OAuth2Strategy {
  /**
   * Override the host if you are testing against a different environment.
   *
   * Example:
   *
   *     Strategy.host = "envoy.dev";
   *     passport.use(new Strategy({
   *       ...
   *     }))
   */
  static host = "envoy.com";

  /** The name of the Strategy. Used when calling `passport.authenticate('envoy')` */
  name = "envoy";

  graphqlURL = `https://app.${Strategy.host}/a/graphql`;
  profileQuery = `
    query UserQuery {
      me {
        id
        name: formattedName
        email
      }
    }
  `;

  constructor(
    {
      authorizationURL = `https://dashboard.${Strategy.host}/a/auth/v0/authorize`,
      tokenURL = `https://app.${Strategy.host}/a/auth/v0/token`,
      profileQuery,
      ...rest
    },
    verify = defaultVerify
  ) {
    super(
      {
        authorizationURL,
        tokenURL,
        passReqToCallback: verify === defaultVerify,
        ...rest,
      },
      verify
    );

    if (profileQuery) {
      this.profileQuery = profileQuery;
    }
  }

  /**
   * Retrieve user profile from Envoy.
   *
   * This function constructs a normalized profile, with the following properties:
   *
   *   - `id`
   *   - `name`
   *   - `email`
   *
   * You can customize the fields returned by the profile by passing in a `profileQuery`
   * option to the `Strategy` initializer
   *
   * @param {string} accessToken
   * @param {function} done
   * @access protected
   */
  async userProfile(accessToken, done) {
    const client = new GraphQLClient(this.graphqlURL, {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    try {
      const response = await client.request(this.profileQuery);
      return done(null, { provider: "envoy", ...response });
    } catch (e) {
      return done(new EnvoyGraphQLError("Failed to fetch user profile", e));
    }
  }

  parseErrorResponse(body, status) {
    const json = JSON.parse(body);
    if (json.error && typeof json.error == "string" && status === 404) {
      return new EnvoyTokenError(json.error);
    }
    return super.parseErrorResponse(body, status);
  }
}

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
