import ModuleInterface, { ProcessAllCallback } from './interface';
import * as fs from 'fs-extra';
import * as path from 'path';
import ModuleSchemaInterface from './schema-interface';
import { merge } from 'lodash';
import { mergeStrings } from 'gql-merge';

export interface ModuleOptions {
    rootPath: string;
}

export const PATH_TO_SCHEMA = 'graphql';

export default class ModuleBase implements ModuleInterface {
    protected _options: ModuleOptions;

    constructor(options: ModuleOptions) {
        this._options = options;
    }

    async loadSchema(): Promise<ModuleSchemaInterface> {
        return await this._loadSchemaRecursively(
            path.resolve(this._options.rootPath, PATH_TO_SCHEMA),
        );
    }

    protected async _loadSchemaRecursively(
        rootDir: string,
    ): Promise<ModuleSchemaInterface> {
        const typeDefsArray: string[] = [];
        const resolversArray: object[] = [];
        const files: string[] = [];
            
        for (const file of await fs.readdir(rootDir)) {
            const fullPath = path.resolve(rootDir, file);
            const stats = await fs.stat(fullPath);
            if (stats.isDirectory()) {
                const subDirectorySchema = await this._loadSchemaRecursively(fullPath);
                typeDefsArray.push(subDirectorySchema.typeDefs);
                resolversArray.push(subDirectorySchema.resolvers);
            } else {
                files.push(file);
            }
        }

        if (files.length) {
            const currentDirSchema = await this._loadSchemaFromDir(rootDir, files);
            typeDefsArray.push(currentDirSchema.typeDefs);
            resolversArray.push(currentDirSchema.resolvers);
        }

        return {
            typeDefs: mergeStrings(typeDefsArray),
            resolvers: merge({}, ...resolversArray),
        };
    }

    protected async _loadSchemaFromDir(
        dir: string,
        files: string[],
    ): Promise<ModuleSchemaInterface> {
        const gqlFilesMap: { [name: string]: { gqlPath: string, sourcePath: string | null } } = {};
        for (const file of files) {
            const matches = file.match(/^(.*)\.(gql|graphql)$/);
            if (matches) {
                const [, name] = matches;
                gqlFilesMap[name] = {
                    gqlPath: path.resolve(dir, file),
                    sourcePath: null,
                };
            }
        }

        const sourceFiles: string[] = [];
        for (const file of files) {
            const matches = file.match(/(.*)\.(js|ts)/);
            if (matches && !file.match(/(.*)\.d\.ts/)) {
                const [, name] = matches;
                if (gqlFilesMap[name]) {
                    gqlFilesMap[name].sourcePath = path.resolve(dir, file);
                } else {
                    sourceFiles.push(path.resolve(dir, file));
                }
            }
        }

        const typeDefsArray: string[] = [];
        const resolversArray: string[] = [];

        for (const name in gqlFilesMap) {
            const gqlFile = gqlFilesMap[name];
            if (!gqlFile.sourcePath) {
                throw new Error(`Resolvers file not found for schema file "${gqlFile.gqlPath}"`);
            }

            resolversArray.push(require(gqlFile.sourcePath).default);
            typeDefsArray.push((await fs.readFile(gqlFile.gqlPath)).toString());
        }

        for (const sourceFile of sourceFiles) {
            const schemaFromFile = require(sourceFile);

            resolversArray.push(schemaFromFile.resolvers);
            typeDefsArray.push(schemaFromFile.typeDefs);
        }

        const resolvers = merge({}, ...resolversArray);
        const processAllCallback = this.getProcessAllCallback();
        if (processAllCallback) {
            ModuleBase.applyProcessAllCallbackRecurcively(resolvers, processAllCallback);
        }

        return {
            resolvers,
            typeDefs: mergeStrings(typeDefsArray),
        };
    }

    static applyProcessAllCallbackRecurcively(
        resolvers: any, callback: ProcessAllCallback, path: string = ''
    ): void {
        for (const key in resolvers) {
            if (typeof resolvers[key] === 'function') {
                if (key === 'subscribe') {
                    // do not wrap subscriptions
                    continue;
                }
                const currentResolver = resolvers[key];
                resolvers[key] = function (parent: any, args: any, context: any, info: any) {
                    return callback(
                        currentResolver,
                        { parent, args, context, info, path: path + '.' + key }
                    );
                };
            } else if (typeof resolvers[key] === 'object') {
                ModuleBase.applyProcessAllCallbackRecurcively(
                    resolvers[key], callback, path + '.' + key
                );
            }
        }
    }

    getProcessAllCallback() {
        return null;
    }

    init() {}
    destroy() {}
}
