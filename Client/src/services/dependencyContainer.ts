import { rootInjector } from 'typed-inject';

import { CrmService, ICrmService } from './CrmService';

const dependencies = rootInjector.provideClass(ICrmService, CrmService);

export const useDependency = dependencies.resolve.bind(dependencies);
