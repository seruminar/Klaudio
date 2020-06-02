import { rootInjector } from 'typed-inject';

import { CrmService, ICrmService } from './services/crmService/CrmService';
import { CrmServiceCache, ICrmServiceCache } from './services/crmService/CrmServiceCache';

const dependencies = rootInjector.provideClass(ICrmService, CrmService).provideClass(ICrmServiceCache, CrmServiceCache);

export const useDependency = dependencies.resolve.bind(dependencies);
