import { signin , signup} from './service.js';
import dotenv from 'dotenv';
dotenv.config();

export default  {
  Mutation: {
          signin: async (_, args) => {
            return await signin(args);
          },
          signup: async (_, args) => {
              return await signup(args);
          }
    }
};

