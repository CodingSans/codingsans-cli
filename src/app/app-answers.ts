export type PackageManager = 'yarn' | 'npm';
export type Framework = 'angular' | 'nextjs';

export type AppAnswers = {
  packageManager: PackageManager;
  framework: Framework;
  projectName: string;
};
