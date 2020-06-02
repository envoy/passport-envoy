/**
 * `EnvoyTokenError` error.
 *
 * EnvoyTokenError represents an error received from a Envoy's token endpoint. Note that
 * these responses don't conform to the OAuth 2.0 specification.
 *
 * @constructor
 * @param {string} [message]
 * @access public
 */
class EnvoyTokenError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = EnvoyTokenError;
