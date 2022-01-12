export type AngularFeature =
  | 'eslint'
  | 'codingsans-eslint'
  | 'prettier'
  | 'prettier-vscode'
  | 'jest'
  | 'stryker'
  | 'ssr'
  | 'state-management';

export type AngularAnswers = {
  features: AngularFeature[];
};

export type AngularStateManagement = 'ngrx' | 'ngxs' | 'akita';

export type AngularStateManagementAnswers = { stateManagement: AngularStateManagement };
