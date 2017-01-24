// PassportResult defined in apollo-passport

const typeDefinitions = `
type RootMutation {
  apCreateUserEmailPassword (input: apUserInput!): PassportResult,
  apVerifyAccount (userId: String, verificationToken: String!): SimpleError,
  apRecoverPassworedRequest (email: String): String,
  apRecoverPasswored (userId: String!, token: String!, newPassword: String!): String,
  apUpdateUserPassword (userId: String!, oldPassword: String!, newPassword: String!): String,
  apLoginEmailPassword (email: String!, password: String!): PassportResult
}

type SimpleError {
  errCode: String,
  errMessage: String
}
`;

export default [typeDefinitions];
