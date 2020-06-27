import gql from 'graphql-tag'

export const ME = gql`
  query me {
    user(login: "narise378") {
      name
      avatarUrl
    }
  }
`
