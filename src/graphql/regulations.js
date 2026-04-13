import { gql } from "@/gql-client";

const GET_ALL_REGULATIONS_QUERY = gql`
  query allRegulations {
    regulations(sort: "published_at:desc") {
      id
      created_at
      updated_at
      published_at
      title
      slug
      summary
      url
    }
  }
`;

export { GET_ALL_REGULATIONS_QUERY };
