/* global describe, it, before, expect */
/* jshint expr: true */

const EnvoyStrategy = require("../lib/strategy");
const queryMock = require("./queryMock");

describe("Strategy#userProfile", function () {
  afterEach(function () {
    queryMock.reset();
  });

  describe("fetched from default endpoint", function () {
    const strategy = new EnvoyStrategy({
      clientID: "ABC123",
      clientSecret: "secret",
    });

    let profile;

    before(function () {
      queryMock.setup(strategy.graphqlURL);
    });

    beforeEach(function (done) {
      queryMock.mockQuery({
        name: "UserQuery",
        data: {
          me: {
            id: "500308595",
            name: "Kamal Mahyuddin",
            email: "kamal@example.com",
          },
        },
      });

      strategy.userProfile("token", function (err, p) {
        if (err) {
          return done(err);
        }
        profile = p;
        done();
      });
    });

    afterEach(function () {
      queryMock.reset();
    });

    it("should parse profile", function () {
      expect(profile.provider).to.equal("envoy");

      expect(profile.me.id).to.equal("500308595");
      expect(profile.me.name).to.equal("Kamal Mahyuddin");
      expect(profile.me.email).to.equal("kamal@example.com");
    });
  });

  describe("fetched from default endpoint, with a custom profileQuery", function () {
    const strategy = new EnvoyStrategy({
      clientID: "ABC123",
      clientSecret: "secret",
      profileQuery: `
        query CustomUserQuery {
          me {
            id
            formattedName
          }
        }
      `,
    });

    let profile;

    before(function () {
      queryMock.setup(strategy.graphqlURL);
    });

    beforeEach(function (done) {
      queryMock.mockQuery({
        name: "CustomUserQuery",
        data: {
          me: {
            id: "500308595",
            formattedName: "Kamal Mahyuddin",
          },
        },
      });
      strategy.userProfile("token", function (err, p) {
        if (err) {
          return done(err);
        }
        profile = p;
        done();
      });
    });

    afterEach(function () {
      queryMock.reset();
    });

    it("should parse profile", function () {
      expect(profile.provider).to.equal("envoy");
      expect(profile.me.id).to.equal("500308595");
      expect(profile.me.formattedName).to.equal("Kamal Mahyuddin");
    });
  });

  describe("error caused by graphql throwing a 500", function () {
    const strategy = new EnvoyStrategy({
      clientID: "ABC123",
      clientSecret: "secret",
    });

    let err, profile;

    before(function () {
      queryMock.setup(strategy.graphqlURL);
    });

    beforeEach(function (done) {
      queryMock.mockQuery({
        name: "UserQuery",
        status: 500,
      });

      strategy.userProfile("token", function (e, p) {
        err = e;
        profile = p;
        done();
      });
    });

    afterEach(function () {
      queryMock.reset();
    });

    it("should error", function () {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.constructor.name).to.equal("EnvoyGraphQLError");
      expect(err.message).to.equal("Failed to fetch user profile");
    });
  });

  describe("error caused by graphql throwing a GraphQL error", function () {
    const strategy = new EnvoyStrategy({
      clientID: "ABC123",
      clientSecret: "secret",
    });

    let err, profile;

    before(function () {
      queryMock.setup(strategy.graphqlURL);
    });

    beforeEach(function (done) {
      queryMock.mockQuery({
        name: "UserQuery",
        graphqlErrors: [{ me: "envoy-web is unreachable" }],
      });

      strategy.userProfile("token", function (e, p) {
        err = e;
        profile = p;
        done();
      });
    });

    afterEach(function () {
      queryMock.reset();
    });

    it("should error", function () {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.constructor.name).to.equal("EnvoyGraphQLError");
      expect(err.message).to.equal("Failed to fetch user profile");
    });
  });
});
