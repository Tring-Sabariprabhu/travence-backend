import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import jwt from 'jsonwebtoken';
import { resolvers } from './Schema/resolvers.js';
import { typeDefs } from './Schema/typedefs.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const authHeader = req.headers.authorization || '';

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    let decoded = null;
    if (token) {
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY ); 
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
