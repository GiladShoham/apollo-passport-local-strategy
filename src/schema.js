// PassportResult defined in apollo-passport

const typeDefinitions = `
type RootMutation {
  apCreateUserEmailPassword (input: apUserInput!): PassportResult,
  apUpdateUserPassword (userId: String!, oldPassword: String!, newPassword: String!): String,
  apLoginEmailPassword (email: String!, password: String!): PassportResult
}
`;

export default [typeDefinitions];
