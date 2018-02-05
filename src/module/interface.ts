import ModuleSchemaInterface from './schema-interface';

export default interface ModuleInterface {
    loadSchema(): ModuleSchemaInterface | Promise<ModuleSchemaInterface>;
}
