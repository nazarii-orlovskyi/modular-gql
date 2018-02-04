import ModuleSchemaByVersionInterface from './schema-by-version-interface';

export default interface ModuleInterface {
    loadSchemaByVersion(): ModuleSchemaByVersionInterface | Promise<ModuleSchemaByVersionInterface>;
    init(): void | Promise<void>;
    destroy(): void | Promise<void>;
}
