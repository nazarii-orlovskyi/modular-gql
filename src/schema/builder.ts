import * as path from 'path';
import { GraphQLSchema } from 'graphql';
import ConfigInterface from '../config/interface';
import { makeExecutableSchema } from 'graphql-tools';
import { mergeStrings } from 'gql-merge';
import { merge } from 'lodash';
import ModuleInterface from '../module/interface';
import BaseModule from '../module/base';
import ModuleConfigInterface from '../config/module-interface';
import * as fs from 'fs-extra';
import ModuleBase from '../module/base';

export default class SchemaBuilder {
    protected _options : ConfigInterface;

    constructor(options: ConfigInterface) {
        if (options.modules && !options.modules.length) {
            throw new Error('Modules list are empty');
        }
        this._options = options;
    }

    public static async getDefaultModulesConfig(
        modulesDir: string,
    ): Promise<ModuleConfigInterface[]> {
        const modules: ModuleConfigInterface[] = [];
        for (const name of await fs.readdir(modulesDir)) {
            modules.push({ name });
        }
    
        return modules;
    }

    async createSchema(): Promise<{ schema: GraphQLSchema, modules: ModuleInterface[] }> {
        const modules = await this._loadModules();

        const typeDefsArray: string[] = [];
        const resolversArray: object[] = [];

        for (const module of modules) {
            const moduleSchema = await module.loadSchema();
           
            typeDefsArray.push(moduleSchema.typeDefs);
            resolversArray.push(moduleSchema.resolvers);
        }

        const resolvers = merge({}, ...resolversArray);
        if (this._options.processAllCallback) {
            ModuleBase.applyProcessAllCallbackRecurcively(
                resolvers, this._options.processAllCallback
            );
        }
        
        return {
            modules,
            schema: makeExecutableSchema({
                typeDefs: mergeStrings(typeDefsArray),
                resolvers,
            }),
        };
    }

    protected async _loadModules(): Promise<ModuleInterface[]> {
        const modules: ModuleInterface[] = [];
        const modulesConfig: ModuleConfigInterface[] = this._options.modules
            ? this._options.modules
            : await SchemaBuilder.getDefaultModulesConfig(this._options.modulesBasePath);

        for (const moduleConfig of modulesConfig) {
            const rootPath = path.resolve(this._options.modulesBasePath, moduleConfig.name);
            const moduleMainPath = path.resolve(rootPath, 'module');

            try {
                const module = require(moduleMainPath);
                if (typeof module.module !== 'function') {
                    throw new Error(`Module not found in file "${moduleMainPath}"`);
                }

                modules.push(new module.module({ rootPath }));
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
