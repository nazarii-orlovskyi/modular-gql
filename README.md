# modular-gql
Help build GraphQL application with schema exploded by modules


# Modules structure
- Each directory in modules base path is module
- Each module can contain module.json on module.js file which bootstrap module
- Module contain "graphql" directory. This direcotry contain schema definitions
- "graphql" directory contain schema. Also directory can contain directories with schema exploded by version. Subdirectory with versioned schema has name pattern: ^v\d+$ (like v1 or v15).
- Schema directory contain all schema type definitions and resolvers
- Schema directory can contain subdirectories which has same structure as last one
- Schema directory can contain files with *.gql and *.graphql extensions. This files contains type definitions. Resolvers must located in files with same name and *.js extension and export schema as "default" key
- Schema directory can contain other js files. Each of this file must export "typeDefs" and "resolvers" keys.