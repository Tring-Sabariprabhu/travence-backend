
import {
    getGroupInvitedList, 
    getGroupJoinRequestsForUser, 
    resendGroupJoinRequests, 
    deleteGroupJoinRequests, 
    sendGroupJoinRequests,
    acceptGroupJoinRequest,
    declineGroupJoinRequest} from './service.js';

export default {
    Query: {
        getGroupInvitedList: async (_, args) => {
           return await getGroupInvitedList(args);
        },
        getGroupJoinRequestsForUser: async (_, args) => {
            return await getGroupJoinRequestsForUser(args);
        }
    },
    Mutation: {
        resendGroupJoinRequests: async (_, args) => {
            return await resendGroupJoinRequests(args);
        },
        deleteGroupJoinRequests: async (_, args) => {
            return await deleteGroupJoinRequests(args);
        },
        sendGroupJoinRequests: async (_, args) => {
            return await sendGroupJoinRequests(args);
        },
        acceptGroupJoinRequest: async (_, args) => {
            return await acceptGroupJoinRequest(args);
        },
        declineGroupJoinRequest: async (_, args) => {
            return await declineGroupJoinRequest(args);
        },
    }
}
