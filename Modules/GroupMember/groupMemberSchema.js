const groupMemberSchema = `#graphql
    scalar DATETIME
     type GroupMember{
        member_id: String
        user_id: String
        profile: User
        group_id: String
        joined_at: DATETIME
        role: String
    }
    type Query{
        group_member(member_id: String!): GroupMember!
    }
    type Mutation{
        addUserToGroup(group_id: String!, user_id: String!, role: String): String
        deleteUserFromGroup(admin_id: String!, member_id: String!): String
        changeRoleInGroup(admin_id: String!, member_id: String!): String
    }`
export default groupMemberSchema;