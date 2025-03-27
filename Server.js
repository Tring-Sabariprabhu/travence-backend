import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import jwt from 'jsonwebtoken';
import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";
import authResolvers from "./Modules/Auth/authResolvers.js";
import userResolvers from "./Modules/User/userResolvers.js";
import groupResolvers from "./Modules/Group/groupResolvers.js";
import groupMemberResolvers from "./Modules/GroupMember/groupMemberResolvers.js";
import groupInviteResolvers from "./Modules/GroupInvite/groupInviteResolvers.js";
import authSchema from './Modules/Auth/authSchema.js';
import userSchema from './Modules/User/userSchema.js';
import groupSchema from './Modules/Group/groupSchema.js';
import  groupMemberSchema  from './Modules/GroupMember/groupMemberSchema.js';
import  groupInviteSchema  from './Modules/GroupInvite/groupInviteSchema.js';

import dotenv from 'dotenv';
dotenv.config();

const app = express();
const resolvers = mergeResolvers([
  authResolvers,
  userResolvers,
  groupResolvers,
  groupMemberResolvers,
  groupInviteResolvers
]);
const typeDefs = mergeTypeDefs([
  authSchema,
  userSchema,
  groupSchema,
  groupMemberSchema,
  groupInviteSchema
])
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    let decoded = null;
    if (token) {
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      } catch (err) {
        throw new Error('Invalid or expired token');
      }
    } 
    return { token, decoded };
  }
});

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });

  app.listen({ port: 4000 }, () =>
    console.log(`Server running at http://localhost:4000`)
  );
}

startServer(); 
