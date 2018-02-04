import { Application } from 'express';
import ModuleConfigInterface from '../config/module-interface';
import SchemaBuilder from '../schema/builder';
import * as bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import * as fs from 'fs-extra';

export interface InitExpressAppOptionsInterface {
    app: Application;
    modulesPath: string;
    modules?: ModuleConfigInterface[];
    endpoint?: string;
    enableGraphiql?: boolean;
    graphiqlEndpoint?: string;
}

interface InitExpressAppAllOptionsInterface extends InitExpressAppOptionsInterface {
    modules: ModuleConfigInterface[];
    endpoint: string;
    enableGraphiql: boolean;
    graphiqlEndpoint: string;
}

async function getDefaultModulesConfig(modulesDir: string): Promise<ModuleConfigInterface[]> {
    const modules: ModuleConfigInterface[] = [];
    for (const name of await fs.readdir(modulesDir)) {
        modules.push({ name });
    }

    return modules;
}

export async function initExpressApp(options: InitExpressAppOptionsInterface): Promise<void> {
    const allOptions = Object.assign(
        {
            endpoint: '/graphql/v:version',
            graphiqlEndpoint: '/graphiql/v:version',
        } as InitExpressAppOptionsInterface,
        options,
    ) as InitExpressAppAllOptionsInterface;

    const app = allOptions.app;

    let modules: ModuleConfigInterface[] = allOptions.modules as ModuleConfigInterface[];
    if (!modules) {
        modules = await getDefaultModulesConfig(allOptions.modulesPath);
    }
    
    const schemaBuilder = new SchemaBuilder({
        modules,
        modulesBasePath: allOptions.modulesPath,
    });

    const schemaByVersion = await schemaBuilder.createSchema();

    for (const version in schemaByVersion) {
        const endpoint = allOptions.endpoint.replace(':version', version);
        app.use(endpoint, bodyParser.json(), graphqlExpress({ schema: schemaByVersion[version] }));

        if (allOptions.enableGraphiql) {
            const graphiqlEndpoint = allOptions.graphiqlEndpoint.replace(':version', version);
            app.get(graphiqlEndpoint, graphiqlExpress({ endpointURL: endpoint }));
        }
        console.log(`Version ${version} initialized`);
    }
}
