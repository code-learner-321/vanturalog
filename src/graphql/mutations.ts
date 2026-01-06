// @/graphql/mutations.ts
import { gql } from "@apollo/client";

export const LOGIN_USER = gql`
  mutation LoginUser($username: String!, $password: String!) {
    login(input: { 
      username: $username, 
      password: $password,
      clientMutationId: "login_mutation" 
    }) {
      authToken
      user {
        id
        name
        email
        nicename
        roles {
          nodes {
            name
          }
        }
      }
    }
  }
`;

export const REGISTER_USER_MUTATION = `
  mutation RegisterUser($username: String!, $email: String!, $password: String!) {
    registerUser(input: {
      username: $username,
      email: $email,
      password: $password
    }) {
      user {
        id
        username
        email
      }
    }
  }
`;