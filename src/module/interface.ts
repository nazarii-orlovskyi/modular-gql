import ModuleSchemaInterface from './schema-interface';

export interface BeforeAllResolverParams {
    parent: any;
    args: any;
    context: any;
    info: any;
    path: string;
}

export interface ProcessAllCallback {
    (resolver: Function, params: BeforeAllResolverParams): Promise<any> | any;
}

export default interface ModuleInterface {
    loadSchema(): ModuleSchemaInterface | Promise<ModuleSchemaInterface>;
    getProcessAllCallback(): Promise<ProcessAllCallback> | ProcessAllCallback | null;
    init(): Promise<void> | void;
    destroy(): Promise<void> | void;
}
