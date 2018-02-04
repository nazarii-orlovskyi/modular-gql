import ModuleInterface from './interface';
import * as fs from 'fs-extra';
import * as path from 'path';
import ModuleSchemaInterface from './schema-interface';
import ModuleSchemaByVersionInterface from './schema-by-version-interface';
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

    async loadSchemaByVersion(): Promise<ModuleSchemaByVersionInterface> {
        return await this._loadSchemaByVersion(
            path.resolve(this._options.rootPath, PATH_TO_SCHEMA),
        );
    }

    protected async _loadSchemaByVersion(
        rootDir: string,
    ): Promise<ModuleSchemaByVersionInterface> {
        const schemaByVersion: ModuleSchemaByVersionInterface = {};

        const versionsRootDirs = await fs.readdir(rootDir);
        for (const versionDir of versionsRootDirs) {
            const matches = versionDir.match(/^v(\w+)$/);
            if (!matches) {
                throw new Error(
                    `Directory "${versionDir}" do not match pattern /^v(\w+)$/.` +
                    `Base dir: "${rootDir}"`,
                );
            }

            const [dirName, version] = matches;
            const versionRootDir = path.resolve(rootDir, dirName);
            schemaByVersion[version] = await this._loadSchemaRecursively(versionRootDir);
        }

        return schemaByVersion;
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

        return {
            typeDefs: mergeStrings(typeDefsArray),
            resolvers: merge({}, ...resolversArray),
        };
    }

    init() {}
    destroy() {}
}
