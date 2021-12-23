export type PackageManager = 'yarn' | 'npm';
export type Framework = 'angular';

export type AppAnswers = {
  packageManager: PackageManager;
  framework: Framework;
  projectName: string;
};
