// PassportResult defined in apollo-passport

const typeDefinitions = `
type RootMutation {
  apCreateUserEmailPassword (input: apUserInput!): PassportResult,
  apVerifyAccount (userId: String, verificationToken: String!): String,
  apRecoverPassworedRequest (email: String): String,
  apRecoverPasswored (userId: String!, token: String!, newPassword: String!): String,
  apUpdateUserPassword (userId: String!, oldPassword: String!, newPassword: String!): String,
  apLoginEmailPassword (email: String!, password: String!): PassportResult
}
`;

export default [typeDefinitions];
