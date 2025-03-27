

const groupInviteSchema = `#graphql
    scalar DATETIME
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
    type Query{
        getGroupInvitedList(admin_id: String!): [GroupInviteRequest!]!
        getGroupJoinRequestsForUser(email: String!): [GroupInviteRequest!]!
    }
    type Mutation{
        sendGroupJoinRequests(admin_id: String!, emails: [String!]!): String
        resendGroupJoinRequests(admin_id: String!, requestIDs: [String!]!): String
        deleteGroupJoinRequests(admin_id: String!, requestIDs: [String!]!): String

        acceptGroupJoinRequest( admin_id: String!, user_id: String!): String
        declineGroupJoinRequest(request_id: String!): String
    }`
export default groupInviteSchema;