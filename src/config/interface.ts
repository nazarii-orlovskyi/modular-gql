import ModuleConfigInterface from './module-interface';
import { ProcessAllCallback } from '../module/interface';

export default interface ConfigInterface {
    modulesBasePath: string;
    modules?: ModuleConfigInterface[];
    processAllCallback?: ProcessAllCallback;
}
