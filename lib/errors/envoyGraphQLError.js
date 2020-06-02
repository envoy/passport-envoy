/**
 * `EnvoyGraphQLError` error.
 *
 * EnvoyTokenError represents an error received from a Envoy's GraphQL endpoint.
 *
 * @constructor
 * @param {string} [message]
 * @param {Error} [err]
 * @access public
 */
class EnvoyGraphQLError extends Error {
  constructor(message, err) {
    super(message, err);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = EnvoyGraphQLError;
