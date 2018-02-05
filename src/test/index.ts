import { expect } from 'chai';
import * as request from 'supertest';
import { Application } from 'express';

export interface TestHelperInitExpressOptions {
    app: Application;
    endpoint?: string;
}

export class TestHelper {
    protected _expressApp?: Application;
    protected _endpoint?: string;

    initExpress(options: TestHelperInitExpressOptions) {
        this._expressApp = options.app;
        this._endpoint = options.endpoint;
    }

    makeRequest(query: string, variables: object): Promise<{ [key: string]: any }> {
        if (!this._expressApp || !this._endpoint) {
            throw new Error('Express app not initialized');
        }
        return new Promise((resolve, reject) => {
            request(this._expressApp)
                .post(this._endpoint ? this._endpoint : '/graphql')
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
        const response = await this.makeRequest(query, variables);
        expect(response.data).to.deep.eq(expected);
    }
}
