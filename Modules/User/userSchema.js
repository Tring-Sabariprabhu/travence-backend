const userSchema = `#graphql
    scalar DATETIME
      type User{
        user_id: String
        email: String
        name: String
        image: String
        password: String
        created_at: DATETIME
        updated_at: DATETIME
    }
    type Query{
        getAuthUser: User
    }
    type Mutation{
        updateUser(user_id: String!, name: String!, password: String!, image: String): String
    }`
export default userSchema;