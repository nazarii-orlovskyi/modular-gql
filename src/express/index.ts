import { Application } from 'express';
import ModuleConfigInterface from '../config/module-interface';
import SchemaBuilder from '../schema/builder';
import * as bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';

export interface InitExpressAppOptionsInterface {
    app: Application;
    modulesPath: string;
    modules?: ModuleConfigInterface[];
    endpoint?: string;
    enableGraphiql?: boolean;
    graphiqlEndpoint?: string;
}

export async function initExpress(
    options: InitExpressAppOptionsInterface,
): Promise<Application> {
    const _options: InitExpressAppOptionsInterface = Object.assign(
        {
            endpoint: '/graphql',
            enableGraphiql: true,
            graphiqlEndpoint: '/graphiql',
        } as InitExpressAppOptionsInterface,
        options,
    );
 
    const schemaBuilder = new SchemaBuilder({
        modules: _options.modules,
        modulesBasePath: _options.modulesPath,
    });

    const schema = await schemaBuilder.createSchema();

    _options.app.use(_options.endpoint!, bodyParser.json(), graphqlExpress({ schema }));

    if (_options.enableGraphiql) {
        _options.app.get(_options.graphiqlEndpoint!, graphiqlExpress({
            endpointURL: _options.endpoint!,
        }));
    }

    return options.app;
}
