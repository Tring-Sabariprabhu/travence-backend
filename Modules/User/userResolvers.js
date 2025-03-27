import { getAuthUser, updateUser } from './service.js';

export default {
    Query: {
        getAuthUser: async (_, child, user) => {
            return await getAuthUser(user);
        },
    },
    Mutation: {
        updateUser: async (_, args)=>{
            return await updateUser(args);
        }
    }
}
