import * as express from 'express';
import * as http from 'http';
import ModuleConfigInterface from '../config/module-interface';
import SchemaBuilder from '../schema/builder';
import * as bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import { GraphQLSchema } from 'graphql/type/schema';

export interface InitExpressOptionsInterface {
    app?: express.Application;
    modulesPath: string;
    modules?: ModuleConfigInterface[];
    endpoint?: string;
    subscriptionsEndpoint?: string;
    enableGraphiql?: boolean;
    graphiqlEndpoint?: string;
    graphiqlSubscriptionEndpoint?: string;
}

export interface InitExpressResultInterface {
    options: InitExpressOptionsInterface;
    expressApp: express.Application;
    server: http.Server;
    schema: GraphQLSchema;
    listen: (port: number | string, cb?: Function) => void;
    init(): Promise<void>;
    destroy(): Promise<void>;
}

export async function initExpress(
    options: InitExpressOptionsInterface,
): Promise<InitExpressResultInterface> {
    const _options: InitExpressOptionsInterface = Object.assign(
        {
            endpoint: '/graphql',
            subscriptionsEndpoint: '/graphql',
            enableGraphiql: true,
            graphiqlEndpoint: '/graphiql',
        } as InitExpressOptionsInterface,
        options,
    );

    if (!_options.app) {
        _options.app = express();
    }
 
    const schemaBuilder = new SchemaBuilder({
        modules: _options.modules,
        modulesBasePath: _options.modulesPath,
    });

    const modulesSchema = await schemaBuilder.createSchema();

    _options.app.use(
        _options.endpoint!,
        bodyParser.json(),
        graphqlExpress({ schema: modulesSchema.schema }),
    );

    const server = http.createServer(_options.app);

    SubscriptionServer.create(
        { execute, subscribe, schema: modulesSchema.schema },
        {
            server,
            path: _options.subscriptionsEndpoint,
        },
    );

    if (_options.enableGraphiql) {
        _options.app.get(_options.graphiqlEndpoint!, graphiqlExpress({
            endpointURL: _options.endpoint!,
            subscriptionsEndpoint: _options.graphiqlSubscriptionEndpoint,
        }));
    }

    return {
        server,
        schema: modulesSchema.schema,
        options: _options,
        expressApp: _options.app,
        async init() {
            for (let i = 0; i < modulesSchema.modules.length; i++) {
                await modulesSchema.modules[i].init();
            }
        },
        async destroy() {
            for (let i = 0; i < modulesSchema.modules.length; i++) {
                await modulesSchema.modules[i].destroy();
            }
        },
        listen(port, cb) {
            console.log('server listening');
            server.listen(port, cb);
        },
    };
}
