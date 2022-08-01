const { ApolloServer, gql } = require('apollo-server');
const { ApolloServerPluginLandingPageGraphQLPlayground } = require("apollo-server-core");

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Bug" type defines the queryable fields for every vuln in our data source.

  type Bug {
    bugClass: String
    payloads: [String]
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "bugs" query returns an array of zero or more Vulnerabilities (defined above).
  type Query {
    bugs: [Bug]
  }

  type Mutation {
    addBug(bugClass: String!, payloads: [String]): Bug
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

  // Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
      bugs: () => bugs,
    },
    Mutation: {
      addBug: async (_, {bugClass, payloads}) => {
        bug = {
          bugClass: bugClass,
          payloads: payloads
        }
        bugs.push(bug)
        return bug
      }
    }
  };

  // The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: true,
    plugins: [
        ApolloServerPluginLandingPageGraphQLPlayground()
    ]
  });
  
  // The `listen` method launches a web server.
  server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  });