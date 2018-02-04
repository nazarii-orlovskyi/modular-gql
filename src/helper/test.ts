import { expect } from 'chai';
import * as request from 'supertest';
import { Application } from 'express';

export class TestRequestHelper {
    constructor(
        protected _testHelper: TestHelper,
        protected _version: number,
    ) {}

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
        const response = await this._makeRequest(query, variables);
        expect(response.data).to.deep.eq(expected);
    }

    protected async _makeRequest(
        query: string, variables: object,
    ): Promise<{ [key: string]: any }> {
        return await this._testHelper.makeGraphQlRequest(this._version, query, variables);
    }
}

export interface TestHelperInitExpressOptions {
    app: Application;
    endpoint: string;
}

export class TestHelper {
    protected _expressApp?: Application;
    protected _endpoint?: string;

    initExpress(options: TestHelperInitExpressOptions) {
        this._expressApp = options.app;
        this._endpoint = options.endpoint;
    }

    public makeGraphQlRequest(
        apiVersion: number,
        query: string, 
        variables: object,
    ): Promise<object> {
        if (!this._expressApp) {
            throw new Error('Express app not initialized');
        }
        return new Promise((resolve, reject) => {
            request(this._expressApp)
                .post(this._endpoint + '/v' + apiVersion)
                .send({ query, variables })
                .end((err, res) => {
                    if (err) reject(err);
    
                    resolve(res.body);
                });
        });
    }

    public getRequestHelper(version: number): TestRequestHelper {
        return new TestRequestHelper(this, version);
    }
}
