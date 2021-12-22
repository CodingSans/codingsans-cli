export type AngularFeature = 'eslint' | 'codingsans-eslint' | 'prettier' | 'prettier-vscode' | 'jest' | 'stryker';

export type AngularAnswers = {
  projectName: string;
  features: AngularFeature[];
};
