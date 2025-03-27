import db from '../../dbconnect.js'
import {groupList, group, createGroup, updateGroup, deleteGroup} from './service.js';
export default {
    Query: {
        groupList: async (_, args) => {
            return await groupList(args);
        },
        group: async (_, args) => {
            return await group(args);
        },
    },
    Mutation: {
        createGroup: async (_, args) => {
            return await createGroup(args);
        },
        updateGroup: async (_, args) => {
            return await updateGroup(args);
        },
        deletegroup: async (_, args) => {
            return await deleteGroup(args);
        },
    }
}
