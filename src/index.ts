import SchemaBuilderInternal from './schema/builder';
import ModuleInterfaceInternal from './module/interface';
import ModuleBaseInterna from './module/base';
import * as expressHelper from './express';
import * as test from './test';

export class SchemaBuilder extends SchemaBuilderInternal {}
export interface ModuleInterface extends ModuleInterfaceInternal {}
export class BaseModule extends ModuleBaseInterna implements ModuleInterface {}
export async function initExpress(
    options: expressHelper.InitExpressOptionsInterface,
): Promise<expressHelper.InitExpressResultInterface> {
    return await expressHelper.initExpress(options);
}
export class TestHelper extends test.TestHelper {}
export const gql = new TestHelper();
