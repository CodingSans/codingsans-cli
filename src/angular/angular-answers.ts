export type AngularFeature =
  | 'eslint'
  | 'codingsans-eslint'
  | 'prettier'
  | 'prettier-vscode'
  | 'jest'
  | 'stryker'
  | 'ssr';

export type AngularAnswers = {
  features: AngularFeature[];
};
