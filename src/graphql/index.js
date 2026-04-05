const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const {
  ApolloServerPluginLandingPageGraphQLPlayground,
} = require("@apollo/server-plugin-landing-page-graphql-playground");
const typeDefs = require("./typeDefs");
const resolvers = require("./resolvers");
const buildGraphQLContext = require("./context");

const applyGraphQL = async (app) => {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });

  await apolloServer.start();

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(apolloServer, {
      context: buildGraphQLContext,
    }),
  );
};

module.exports = applyGraphQL;
