const { GraphQLError } = require("graphql");
const recordService = require("../services/recordService");
const dashboardService = require("../services/dashboardService");
const {
  ROLES,
  DASHBOARD_READ_ROLES,
  RECORD_READ_ROLES,
} = require("../config/roles");

const unauthenticatedError = () =>
  new GraphQLError("Authentication required", {
    extensions: {
      code: "UNAUTHENTICATED",
      http: { status: 401 },
    },
  });

const forbiddenError = () =>
  new GraphQLError("Forbidden", {
    extensions: {
      code: "FORBIDDEN",
      http: { status: 403 },
    },
  });

const requireRole = (context, allowedRoles) => {
  if (!context.user) {
    throw unauthenticatedError();
  }

  if (!allowedRoles.includes(context.user.role)) {
    throw forbiddenError();
  }

  return context.user;
};

const resolvers = {
  Query: {
    getRecords: async (_, { filter = {} }, context) => {
      requireRole(context, RECORD_READ_ROLES);
      return recordService.getRecords(filter);
    },
    getSummary: async (_, __, context) => {
      requireRole(context, DASHBOARD_READ_ROLES);
      return dashboardService.getDashboardSummary();
    },
  },
  Mutation: {
    createRecord: async (_, { input }, context) => {
      const user = requireRole(context, [ROLES.ADMIN]);
      return recordService.createRecord(input, user._id);
    },
    updateRecord: async (_, { id, input }, context) => {
      requireRole(context, [ROLES.ADMIN]);
      return recordService.updateRecord(id, input);
    },
    deleteRecord: async (_, { id }, context) => {
      requireRole(context, [ROLES.ADMIN]);
      await recordService.deleteRecord(id);
      return "Record deleted successfully";
    },
  },
  User: {
    id: (user) => user._id.toString(),
  },
  Record: {
    id: (record) => record._id.toString(),
  },
};

module.exports = resolvers;
