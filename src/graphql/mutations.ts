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
export const GET_SINGLE_POST = gql`
  query GetSinglePost($slug: String!) {
    postBy(slug: $slug) {
      databaseId
      title
      content
      comments(where: { orderby: COMMENT_DATE }) {
        nodes {
          id
          databaseId
          content
          date
          status
          parentDatabaseId
          author { 
            node { 
              name 
              avatar { url }
            } 
          }
        }
      }
    }
    globalStyles {
      css
    }
  }
`;

export const CREATE_COMMENT = gql`
  mutation CreateComment($author: String!, $email: String!, $content: String!, $postId: Int!, $clientMutationId: String!) {
    createComment(input: {
      author: $author, 
      authorEmail: $email, 
      content: $content, 
      commentOn: $postId,
      clientMutationId: $clientMutationId
    }) {
      success
      comment { 
        id 
        databaseId
        content 
        status
      }
    }
  }
`;
export const GET_ABOUT_DATA = `
  query GetAboutPageData {
    mainAuthors {
      nodes {
        title
        content
      }
    }
    sidebarAuthors(where: { orderby: { field: DATE, order: ASC } }) {
      nodes {
        title
        content
      }
    }
  }
`;
export const GET_CONTACT_PAGE_DATA = `
        query GetContactPageData {
          contactTopContents(first: 1) {
            nodes {
              title
              content
            }
          }
          contactMeSidebars(where: { orderby: { field: DATE, order: ASC } }) {
            nodes {
              title
              content
            }
          }
        }
      `;
export const SEND_MAIL_MUTATION = `
      mutation SendEmail($name: String!, $email: String!, $subject: String!, $message: String!) {
        sendEmail(input: {name: $name, email: $email, subject: $subject, message: $message}) {
          success
        }
      }
    `;
export const GET_POSTS = gql`
  query get_posts($categoryName: String) {
    posts(where: { categoryName: $categoryName }, first: 100) {
      nodes {
        id
        title
        uri
        excerpt
        content 
        categories {
          nodes {
            name
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        author {
          node {
            name
            description
            avatar(size: 512) {
              url
            }
            slug
          }
        }
      }
    }
  }
`;
export const GET_ADMIN_SETTINGS = gql`
  query GetAdminSettings {
    user(id: "1", idType: DATABASE_ID) {
      userSettingsGroup {
        userSettings
        postsPerPage
      }
    }
  }
`;