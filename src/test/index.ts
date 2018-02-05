import { expect } from 'chai';
import * as request from 'supertest';
import * as path from 'path';
import { Application } from 'express';
import { InitExpressResultInterface, InitExpressOptionsInterface } from '../express';
import SchemaBuilder from '../schema/builder';

export class TestHelper {
    protected _expressApp?: Application;
    protected _options?: InitExpressOptionsInterface;
    protected _beforeEachHandlers: Function[] | null = null;
    protected _destroy?: () => Promise<void>;

    async initExpress(options: InitExpressResultInterface) {
        await options.init();

        this._destroy = options.destroy;

        this._expressApp = options.expressApp;
        this._options = options.options;
        this._beforeEachHandlers = null;
    }

    async beforeEach() {
        if (!this._beforeEachHandlers) {
            this._beforeEachHandlers = await this._initBeforeHandlers();
        }
        
        for (let i = 0; i < this._beforeEachHandlers.length; i++) {
            await this._beforeEachHandlers[i]();
        }
    }

    protected async _initBeforeHandlers(): Promise<Function[]> {
        if (!this._options) {
            throw new Error('Test helper not initialized');
        }

        const modules = this._options.modules
            ? this._options.modules
            : await SchemaBuilder.getDefaultModulesConfig(this._options.modulesPath);

        const handlers: Function[] = [];
        for (let i = 0; i < modules.length; i++) {
            const modulePath = path.resolve(
                this._options.modulesPath,
                modules[i].name,
                'test/integration/before',
            );
            try {
                const module = require(modulePath);
                if (typeof module.before !== 'function') {
                    throw new Error(`Before handler not found in file "${modulePath}"`);
                }
            } catch (err) {
                if (err.code !== 'MODULE_NOT_FOUND') {
                    throw err;
                }
            }
        }

        return handlers;
    }

    request(query: string, variables: object): Promise<{ [key: string]: any }> {
        if (!this._expressApp) {
            throw new Error('Express app not initialized');
        }
        return new Promise((resolve, reject) => {
            request(this._expressApp)
                .post(this._options!.endpoint!)
                .send({ query, variables })
                .end((err, res) => {
                    if (err) reject(err);
    
                    resolve(res.body);
                });
        });
    }

    async match(query: string, variables: object, expected: object): Promise<void>;
    async match(query: string, expected: object): Promise<void>;
    async match(query: string, variables: object, expected?: object) {
        if (expected) {
            return await this._match(query, variables, expected);
        } else {
            return await this._match(query, {}, variables);
        }
    }

    protected async _match(query: string, variables: object, expected: object): Promise<void> {
        const response = await this.request(query, variables);
        expect(response.data).to.deep.eq(expected);
    }

    async destroy() {
        await this._destroy!();
    }
}
