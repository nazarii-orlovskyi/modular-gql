import SchemaBuilderInternal from './schema/builder';
import * as express from './express';
import * as test from './test';
import { Application } from 'express';

export class SchemaBuilder extends SchemaBuilderInternal {}
export async function initExpress(
    options: express.InitExpressAppOptionsInterface,
): Promise<Application> {
    return await express.initExpress(options);
}
export class TestHelper extends test.TestHelper {}
export const gql = new TestHelper();
