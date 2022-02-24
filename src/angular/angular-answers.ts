export type AngularFeature = 'eslint' | 'prettier' | 'jest' | 'stryker' | 'ssr' | 'state-management';

export type AngularAnswers = {
  features: AngularFeature[];
};

export type AngularStateManagement = 'ngrx' | 'akita' | 'ngxs';

export type AngularStateManagementAnswers = { stateManagement: AngularStateManagement };
