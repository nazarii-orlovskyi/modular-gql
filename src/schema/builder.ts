import * as path from 'path';
import { GraphQLSchema } from 'graphql';
import ConfigInterface from '../config/interface';
import { makeExecutableSchema } from 'graphql-tools';
import { mergeStrings } from 'gql-merge';
import { merge } from 'lodash';
import ModuleInterface from '../module/interface';
import BaseModule from '../module/base';

export interface GraphQLSchemaByVersionInterface {
    [key: string]: GraphQLSchema;
}

export default class SchemaBuilder {
    protected _options : ConfigInterface;

    constructor(options: ConfigInterface) {
        if (!options.modules.length) {
            throw new Error('Modules are not specified');
        }
        this._options = options;
    }

    async createSchema(): Promise<GraphQLSchemaByVersionInterface> {
        const schemaByVersion: GraphQLSchemaByVersionInterface = {};
        const modules = await this._loadModules();

        const typeDefsArray: { [key: string]: string[] } = {};
        const resolversArray: { [key: string]: object[] } = {};

        for (const module of modules) {
            const schemaByVersion = await module.loadSchemaByVersion();
           
            for (const version in schemaByVersion) {
                if (!typeDefsArray[version]) {
                    typeDefsArray[version] = [];
                    resolversArray[version] = [];
                }

                typeDefsArray[version].push(schemaByVersion[version].typeDefs);
                resolversArray[version].push(schemaByVersion[version].resolvers);
            }
        }
        
        for (const version in typeDefsArray) {
            schemaByVersion[version] = makeExecutableSchema({
                typeDefs: mergeStrings(typeDefsArray[version]),
                resolvers: merge({}, ...resolversArray[version]),
            });
        }

        return schemaByVersion;
    }

    protected async _loadModules(): Promise<ModuleInterface[]> {
        const modules: ModuleInterface[] = [];

        for (const moduleConfig of this._options.modules) {
            const rootPath = path.resolve(this._options.modulesBasePath, moduleConfig.name);
            const bootstrap = path.resolve(rootPath, 'bootstrap');

            try {
                modules.push(require(bootstrap));
            } catch (err) {
                if (err.code === 'MODULE_NOT_FOUND') {
                    modules.push(new BaseModule({ rootPath }));
                } else {
                    throw err;
                }
            }
        }

        return modules;
    }
}
