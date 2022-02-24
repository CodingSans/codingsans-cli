import * as Generator from 'yeoman-generator';
import { BaseGenerator } from '../base-generator';
import { AppAnswers, Framework, PackageManager } from './app-answers';

module.exports = class extends BaseGenerator {
  constructor(args: string | string[], opts: Generator.GeneratorOptions) {
    super(args, opts);

    this.option('packageManager', {
      type: String,
      description: 'Packache manager (yarn of npm)',
    });

    this.option('framework', {
      type: String,
      description: 'Framework: angular',
    });
  }

  initializing(): void {
    this.log('Welcome in Coding Sans CLI!');
  }

  async prompting(): Promise<void> {
    const answers = (await this.prompt([
      {
        type: 'list',
        name: 'packageManager',
        message: 'Select a package manager.',
        choices: ['yarn', 'npm'],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        default: this.options['packageManager'],
        when: !['yarn', 'npm'].includes(this.options['packageManager']),
      },
      {
        type: 'list',
        name: 'framework',
        message: 'Select a framework you want to start.',
        choices: ['angular', 'nextjs'],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        default: this.options['framework'],
        when: !['angular', 'nextjs'].includes(this.options['framework']),
      },
      {
        type: 'input',
        name: 'projectName',
        message: 'Please type project name',
        default: 'project-starter',
        when: !this.options['projectName'],
      },
    ])) as AppAnswers;

    this.packageManager = (this.options['packageManager'] as PackageManager) || answers.packageManager;
    this.framework = (this.options['framework'] as Framework) || answers.framework;
    this.projectName = (this.options['projectName'] as string) || answers.projectName;
  }

  start(): void {
    if (this.framework === 'angular') {
      this.composeWith('codingsans-cli:angular');
    }

    if (this.framework === 'nextjs') {
      this.composeWith('codingsans-cli:nextjs');
    }
  }
};
