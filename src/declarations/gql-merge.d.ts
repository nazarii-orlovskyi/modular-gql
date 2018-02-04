declare module 'gql-merge' {
    interface GqlMerge {
        mergeStrings(schemaStrs: string[]): string;
    }

    const gqlMerge: GqlMerge;

    export = gqlMerge;
}
