// Dashboard Queries and Mutations
import { gql } from "@apollo/client";

export const GET_LOGO_DATA = gql`
  query GetLogoData {
    siteLogo { sourceUrl }
    logoWidth
    logoHeight
    displaySiteTitle 
    generalSettings { title }
  }
`;
export const GET_USER_SETTINGS = gql`
  query GetUserSettings($id: ID!) {
    user(id: $id, idType: DATABASE_ID) {
      id
      databaseId
      name
      userSettingsGroup {
        userSettings
        postsPerPage
      }
    }
  }
`;
export const UPDATE_LOGO_SETTINGS = gql`
  mutation UpdateLogoSettings($width: Int, $height: Int, $displayTitle: Boolean) {
    updateLogoSettings(input: { width: $width, height: $height, displayTitle: $displayTitle }) {
      success
    }
  }
`;
export const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile($userId: Int!, $displayName: String, $mediaId: Int) {
    updateUserProfile(input: { userId: $userId, displayName: $displayName, mediaId: $mediaId }) {
      success
    }
  }
`;
export const GET_ALL_CATEGORIES = gql`
  query GetAllCategories {
    categories(first: 100) {
      nodes {
        name
        slug
      }
    }
  }
`;