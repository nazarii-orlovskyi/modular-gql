import ModuleSchemaInterface from './schema-interface';

export default interface ModuleSchemaByVersionInterface {
    [key: string]: ModuleSchemaInterface;
}
