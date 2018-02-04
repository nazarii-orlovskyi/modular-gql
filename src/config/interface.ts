import ModuleConfigInterface from './module-interface';

export default interface ConfigInterface {
    modulesBasePath: string;
    modules: ModuleConfigInterface[];
}
