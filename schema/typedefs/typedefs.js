export const typeDefs = `#graphql
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
    type Group{
        group_id: String
        name: String
        description: String
        created_user_email: String
        created_by: String
        created_at: DATETIME
        updated_at: DATETIME
        group_members: [GroupMember!]
    }
    type GroupMember{
        member_id: String
        user_id: String
        profile: User
        group_id: String
        joined_at: DATETIME
        role: String
    }
    type GroupInviteRequest{
        request_id: String
        admin_name: String
        admin_email: String
        group_name: String

        email: String
        user_registered: Boolean
        requested_by: String
        requested_at: DATETIME
        status: String
    }
    type Auth{
        token: String
    }
    type Query {
        getAuthUser: User
        groupList(user_id: String!): [Group!]
        group(group_id: String!): Group!
        group_member(member_id: String!): GroupMember!

        getGroupInvitedList(admin_id: String!): [GroupInviteRequest!]!
        getGroupJoinRequestsForUser(email: String!): [GroupInviteRequest!]!
    }
    type Mutation {
        signup(email: String!, name: String!, password: String!): Auth
        signin(email: String!, password: String!): Auth

        updateUser(user_id: String!, name: String!, password: String!, image: String): String

        createGroup(name: String!, description: String, created_by: String!): String
        updateGroup(name: String!, description: String, group_id: String!): String
        deletegroup(group_id: String!): String

        addUserToGroup(group_id: String!, user_id: String!, role: String): String
        deleteUserFromGroup(admin_id: String!, member_id: String!): String
        changeRoleInGroup(admin_id: String!, member_id: String!): String

        sendGroupJoinRequests(admin_id: String!, emails: [String!]!): String
        resendGroupJoinRequests(admin_id: String!, requestIDs: [String!]!): String
        deleteGroupJoinRequests(admin_id: String!, requestIDs: [String!]!): String

        acceptGroupJoinRequest( admin_id: String!, user_id: String!): String
        declineGroupJoinRequest(request_id: String!): String
    }

`

