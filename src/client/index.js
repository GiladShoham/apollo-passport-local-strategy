import gql from 'graphql-tag';
import createHash from 'sha.js';

function hashPassword(plaintext) {
  return createHash('sha256').update(plaintext).digest('hex');
}

const mutation = {
  createUserEmailPassword: gql`
    mutation createUserEmailPassword (
      $input : apUserInput!
    ) {
      apCreateUserEmailPassword(input: $input){
        error
        token
      }
    }
  `,

  loginWithEmailPassword: gql`
    mutation login (
      $email: String!
      $password: String!
    ) {
      apLoginEmailPassword (
        email: $email
        password: $password
      ) {
        error
        token
      }
    }
  `,

  setUserPassword: gql`
    mutation login (
      $userId: String!
      $oldPassword: String!
      $newPassword: String!
    ) {
      apUpdateUserPassword (
        userId: $userId
        oldPassword: $oldPassword
        newPassword: $newPassword
      )
    }
  `
};

const extensionMethods = {

  async createUserEmailPassword(userInput) {
    this.loginStart();
    if (userInput.password) {
      userInput.password = hashPassword(userInput.password);
    }

    const result = await this.apolloClient.mutate({
      mutation: mutation.createUserEmailPassword,
      variables: {
        input: userInput,
      },
    });

    this.loginComplete(result, 'apCreateUserEmailPassword');
  },

  async loginWithEmailPassword(email, password) {
    this.loginStart();

    const result = await this.apolloClient.mutate({
      mutation: mutation.loginWithEmailPassword,
      variables: {
        email,
        password: hashPassword(password)
      }
    });

    this.loginComplete(result, 'apLoginEmailPassword');
  },

  // what status updates should this get?
  // that logic could also be used for re-requesting additional permissions on services
  async updateUserPassword(userId, oldPassword, newPassword) {
    return await this.apolloClient.mutate({
      mutation: mutation.setUserPassword,
      variables: {
        userId,
        oldPassword: hashPassword(oldPassword),
        newPassword: hashPassword(newPassword)
      }
    });
  }

};

class LocalStrategy {

  constructor(apolloPassport) {
    this.ap = apolloPassport;
    apolloPassport.extendWith(extensionMethods);
  }

}

export { hashPassword };
export default LocalStrategy;
