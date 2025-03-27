const authSchema = `#graphql
     type Auth{
        token: String
    }
    type Mutation{
        signup(email: String!, name: String!, password: String!): Auth
        signin(email: String!, password: String!): Auth
    }
    `
export default authSchema;