import { mergeResolvers } from "@graphql-tools/merge";
import authResolvers from "./authResolvers.js";
import userResolvers from "./userResolvers.js";
import groupResolvers from "./groupResolvers.js";
import groupMemberResolvers from "./groupMemberResolvers.js";
import groupInviteResolvers from "./groupInviteResolvers.js";

export const resolvers = mergeResolvers([
  authResolvers,
  userResolvers,
  groupResolvers,
  groupMemberResolvers,
  groupInviteResolvers
]);

