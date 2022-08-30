import { createServer } from "http";
import express from "express";
import { ApolloServer, gql } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { PubSub } from "graphql-subscriptions";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { RESTDataSource } from 'apollo-datasource-rest';
import { createImportSpecifier } from "typescript";

class BountyAPI extends RESTDataSource {
  constructor() {
      super();
      this.baseURL = 'http://localhost:8000/';
  }

  async getPayloads() {
      return this.get('payload')
  }

  getPayload(payloadId) {
      return this.get(`payload/${payloadId}`);
  }

  getBounties() {
      return this.get('bounty');
  }

  getBounty(bountyId) {
      return this.get(`bounty/${bountyId}`);
  }
}

const PORT = 4000;
const pubsub = new PubSub();

// Schema definition
const typeDefs = gql`
  type Bug {
    bugClass: String
    payloads: [String]
  }

  type Bounty {
    bug: Bug
    reward: Int!
    hunter: String!
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "bugs" query returns an array of zero or more Vulnerabilities (defined above).
  type Query {
    bugs: [Bug]
    bounties: [Bounty]
    bounty(id: ID!): Bounty
  }

  type Mutation {
    addBug(bugClass: String!, payloads: [String]): Bug
    awardBounty(bugClass: String!, reward: Int!, hunter: String!): Bounty
  }

  type Subscription {
    bountyAwarded: Bounty
  }
`;

const bugs = [
  {
    bugClass: 'XSS',
    payloads: [
      '<img src=x onerror=alert(document.domain)>', '<script>alert(document.domain)</script>'
    ],
  },
  {
    bugClass: 'SQLi',
    payloads: [
      '" OR 1=1 --'
    ],
  },
];
// Resolver map

const resolvers = {
  Query: {
    bugs: async (_, __, {dataSources}) => {
      const payloads = await dataSources.bountyAPI.getPayloads();
      let bugs = [];
      payloads.forEach(payloadObject => {
        let bugClass = payloadObject.bug_class;
        let payload = payloadObject.payload;
        let bugsIndex = bugs.findIndex((bug) => bug.bugClass === bugClass);
        if (bugsIndex !== -1){
          bugs[bugsIndex].payloads.push(payload)
        } else {
          let bug = {
            bugClass: bugClass,
            payloads: [
              payload
            ]
          };
          bugs.push(bug)
        }
      });
      return bugs;
    },
    bounties: (_, __, {dataSources}) => {
      return dataSources.bountyAPI.getBounties();
    },
    bounty: (_, { id }, {dataSources}) => {
      return dataSources.bountyAPI.getBounty(id)
    }
  },
  Mutation: {
    addBug: async (_, {bugClass, payloads}) => {
      let bug = {
        bugClass: bugClass,
        payloads: payloads
      }
      bugs.push(bug)
      return bug
    },
    awardBounty: async (_, {bugClass, reward, hunter}) => {
      let bug = {
        bugClass: bugClass
      }
      let bounty = {
        bug: bug,
        reward: reward,
        hunter: hunter
      }
      pubsub.publish('BOUNTY_AWARDED', { bountyAwarded: bounty });
      return bounty
    }
  },
  Subscription: {
    bountyAwarded: {
      subscribe: () => pubsub.asyncIterator(['BOUNTY_AWARDED'])
    }
  }
};

// Create schema, which will be used separately by ApolloServer and
// the WebSocket server.
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create an Express app and HTTP server; we will attach the WebSocket
// server and the ApolloServer to this HTTP server.
const app = express();
const httpServer = createServer(app);

// Set up WebSocket server.
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});
const serverCleanup = useServer({ schema }, wsServer);

// Set up ApolloServer.
const server = new ApolloServer({
  schema,
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),
    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
  dataSources: () => {
    return {
      bountyAPI: new BountyAPI(),
    };
  },
});
await server.start();
server.applyMiddleware({ app });

// Now that our HTTP server is fully set up, actually listen.
httpServer.listen(PORT, () => {
  console.log(
    `🚀 Query endpoint ready at http://localhost:${PORT}${server.graphqlPath}`
  );
  console.log(
    `🚀 Subscription endpoint ready at ws://localhost:${PORT}${server.graphqlPath}`
  );
});