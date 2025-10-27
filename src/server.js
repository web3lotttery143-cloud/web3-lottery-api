import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import connectDB from './config/db.js';
import resolvers from './graphql/resolvers.js';
import typeDefs from './graphql/typeDefs.js';
import Cycle from './models/Cycle.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const httpServer = http.createServer(app);

const initializeFirstCycle = async () => {
  try {
    const existingCycle = await Cycle.findOne();
    if (!existingCycle) {
      console.log('No cycles found. Initializing the first lottery cycle...');
      const firstCycle = new Cycle({
        cycleNumber: 1,
        status: 'OPEN',
        totalJackpot: 0,
      });
      await firstCycle.save();
      console.log('Cycle 1 has been successfully initialized.');
    } else {
      console.log('An existing lottery cycle was found.');
    }
  } catch (error) {
    console.error('Failed to initialize first cycle:', error);
  }
};

const startServer = async () => {
  await connectDB();
  await initializeFirstCycle();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use('/graphql', cors(), express.json(), expressMiddleware(server));

  const PORT = process.env.PORT || 4000;
  await new Promise(resolve => httpServer.listen({ port: PORT, host: '0.0.0.0' }, resolve));

  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
};

startServer();
