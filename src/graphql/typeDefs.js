const typeDefs = `#graphql
  enum RecordType {
    income
    expense
  }

  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Record {
    id: ID!
    amount: Float!
    type: RecordType!
    category: String!
    date: String!
    note: String
    createdBy: User!
    createdAt: String!
    updatedAt: String!
  }

  type Pagination {
    page: Int!
    limit: Int!
    total: Int!
    totalPages: Int!
  }

  type RecordList {
    data: [Record!]!
    pagination: Pagination!
  }

  type CategoryTotal {
    category: String!
    income: Float!
    expense: Float!
    net: Float!
  }

  type MonthlyTrend {
    month: String!
    totalIncome: Float!
    totalExpense: Float!
    netBalance: Float!
  }

  type Summary {
    totalIncome: Float!
    totalExpense: Float!
    netBalance: Float!
    categoryTotals: [CategoryTotal!]!
    monthlyTrends: [MonthlyTrend!]!
    recentTransactions: [Record!]!
  }

  input RecordFilterInput {
    startDate: String
    endDate: String
    category: String
    type: RecordType
    search: String
    page: Int
    limit: Int
    sortBy: String
    sortOrder: String
  }

  input CreateRecordInput {
    amount: Float!
    type: RecordType!
    category: String!
    date: String
    note: String
  }

  input UpdateRecordInput {
    amount: Float
    type: RecordType
    category: String
    date: String
    note: String
  }

  type Query {
    getRecords(filter: RecordFilterInput): RecordList!
    getSummary: Summary!
  }

  type Mutation {
    createRecord(input: CreateRecordInput!): Record!
    updateRecord(id: ID!, input: UpdateRecordInput!): Record!
    deleteRecord(id: ID!): String!
  }
`;

module.exports = typeDefs;
