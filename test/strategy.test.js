/* global describe, it, expect, before */
/* jshint expr: true */

const chai = require("chai"),
  EnvoyStrategy = require("../lib/strategy");

describe("Strategy", function () {
  describe("constructed", function () {
    const strategy = new EnvoyStrategy(
      {
        clientID: "ABC123",
        clientSecret: "secret",
      },
      function () {}
    );

    it("should be named envoy", function () {
      expect(strategy.name).to.equal("envoy");
    });
  });

  describe("constructed with undefined options", function () {
    it("should throw", function () {
      expect(function () {
        const strategy = new EnvoyStrategy(undefined, function () {});
      }).to.throw(Error);
    });
  });

  describe("failure caused by user denying request", function () {
    const strategy = new EnvoyStrategy(
      {
        clientID: "ABC123",
        clientSecret: "secret",
      },
      function () {}
    );

    let info;

    before(function (done) {
      chai.passport
        .use(strategy)
        .fail(function (i) {
          info = i;
          done();
        })
        .req(function (req) {
          req.query = {};
          req.query.error = "access_denied";
          req.query.error_code = "200";
          req.query.error_description = "Permissions error";
          req.query.error_reason = "user_denied";
        })
        .authenticate();
    });

    it("should fail with info", function () {
      expect(info).to.not.be.undefined;
      expect(info.message).to.equal("Permissions error");
    });
  });

  describe("error caused by invalid code sent to token endpoint (note: error format does not conform to OAuth 2.0 specification)", function () {
    const strategy = new EnvoyStrategy(
      {
        clientID: "ABC123",
        clientSecret: "secret",
      },
      function () {}
    );

    // inject a "mock" oauth2 instance
    strategy._oauth2.getOAuthAccessToken = function (code, options, callback) {
      return callback({
        statusCode: 404,
        data: '{"error": "subject not found"}',
      });
    };

    let err;

    before(function (done) {
      chai.passport
        .use(strategy)
        .error(function (e) {
          err = e;
          done();
        })
        .req(function (req) {
          req.query = {};
          req.query.code = "SplxlOBeZQQYbYS6WxSbIA+ALT1";
        })
        .authenticate();
    });

    it("should error", function () {
      expect(err.constructor.name).to.equal("EnvoyTokenError");
      expect(err.message).to.equal("subject not found");
    });
  });

  describe("error caused by invalid code sent to token endpoint (note: error format conforms to OAuth 2.0 specification, though this is not the current behavior of the Envoy implementation)", function () {
    const strategy = new EnvoyStrategy(
      {
        clientID: "ABC123",
        clientSecret: "secret",
      },
      function () {}
    );

    // inject a "mock" oauth2 instance
    strategy._oauth2.getOAuthAccessToken = function (code, options, callback) {
      return callback({
        statusCode: 400,
        data:
          '{"error":"invalid_grant","error_description":"The provided value for the input parameter \'code\' is not valid."} ',
      });
    };

    let err;

    before(function (done) {
      chai.passport
        .use(strategy)
        .error(function (e) {
          err = e;
          done();
        })
        .req(function (req) {
          req.query = {};
          req.query.code = "SplxlOBeZQQYbYS6WxSbIA+ALT1";
        })
        .authenticate();
    });

    it("should error", function () {
      // expect(err.constructor.name).to.equal("TokenError");
      expect(err.message).to.equal(
        "The provided value for the input parameter 'code' is not valid."
      );
      expect(err.code).to.equal("invalid_grant");
    });
  });
});
