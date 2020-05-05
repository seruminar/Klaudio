import { rootInjector } from 'typed-inject';

import { CrmService, ICrmService } from './crmService/CrmService';

const dependencies = rootInjector.provideClass(ICrmService, CrmService);

export const useDependency = dependencies.resolve.bind(dependencies);
