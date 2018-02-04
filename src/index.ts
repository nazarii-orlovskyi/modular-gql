import ModuleInterface from './module/interface';
import ConfigInterface from './config/interface';
import ModuleConfigInterface from './config/module-interface';
import SchemaBuilder from './schema/builder';
import * as expressHelper from './helper/express';

export interface ModularGraphQlModuleInterface extends ModuleInterface {}
export interface ModularGraphQlModuleConfigInterface extends ModuleConfigInterface {}
export interface ModularGraphQlConfigInterface extends ConfigInterface {}

export class ModularGraphQlSchemaBuilder extends SchemaBuilder {}

export async function initExpressApp(
    options: expressHelper.InitExpressAppOptionsInterface,
): Promise<void> {
    return await expressHelper.initExpressApp(options);
}
