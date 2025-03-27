
import { addUserToGroup, group_member , group_members, profile, deleteUserFromGroup,changeRoleInGroup} from './service.js';

export default {
    Query: {
        group_member: async (_, args) => {
            return await group_member(args);
        },
    },
    Group: {
        group_members: async (parent, args) => {
            return await group_members(parent);
        },
    },
    GroupMember: {
        profile: async (parent, args) => {
           return await profile(parent);
        }
    },
    Mutation: {
        addUserToGroup: async (_, args) => {
            return await addUserToGroup(args);
        },
        deleteUserFromGroup: async (_, args) => {
            return await deleteUserFromGroup(args);
        },
        changeRoleInGroup: async (_, args) => {
            return await changeRoleInGroup(args);
        },
    }
}
