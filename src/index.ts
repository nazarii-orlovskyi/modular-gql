import ModuleInterface from './module/interface';
import ConfigInterface from './config/interface';
import ModuleConfigInterface from './config/module-interface';
import SchemaBuilder from './schema/builder';
import * as expressHelper from './helper/express';
import { TestHelper, TestRequestHelper } from './helper/test';
import { Application } from 'express';

export interface ModularGraphQlModuleInterface extends ModuleInterface {}
export interface ModularGraphQlModuleConfigInterface extends ModuleConfigInterface {}
export interface ModularGraphQlConfigInterface extends ConfigInterface {}

export class ModularGraphQlSchemaBuilder extends SchemaBuilder {}

export async function initExpressApp(
    options: expressHelper.InitExpressAppOptionsInterface,
): Promise<Application> {
    return await expressHelper.initExpressApp(options);
}

export const testHelper = new TestHelper();

export const v1: TestRequestHelper = testHelper.getRequestHelper(1);
export const v2: TestRequestHelper = testHelper.getRequestHelper(2);
export const v3: TestRequestHelper = testHelper.getRequestHelper(3);
export const v4: TestRequestHelper = testHelper.getRequestHelper(4);
export const v5: TestRequestHelper = testHelper.getRequestHelper(5);
export const v6: TestRequestHelper = testHelper.getRequestHelper(6);
export const v7: TestRequestHelper = testHelper.getRequestHelper(7);
export const v8: TestRequestHelper = testHelper.getRequestHelper(8);
export const v9: TestRequestHelper = testHelper.getRequestHelper(9);
