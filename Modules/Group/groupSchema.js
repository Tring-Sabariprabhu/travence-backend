

const groupSchema = `#graphql
    scalar DATETIME
      type Group{
        group_id: String
        name: String
        description: String
        created_user_email: String
        created_user_name: String
        created_by: String
        created_at: DATETIME
        updated_at: DATETIME
        group_members: [GroupMember!]
    }
    type Query{
        groupList(user_id: String!): [Group!]
        group(group_id: String!): Group!
    }
    type Mutation{
        createGroup(name: String!, description: String, created_by: String!): String
        updateGroup(name: String!, description: String, group_id: String!): String
        deletegroup(group_id: String!): String
    }`
    export default groupSchema;