import * as Generator from 'yeoman-generator';
import { AppAnswers } from './app-answers';

module.exports = class extends Generator {
  public answers: AppAnswers = {} as AppAnswers;

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
        choices: ['angular'],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        default: this.options['framework'],
        when: !['angular'].includes(this.options['framework']),
      },
    ])) as AppAnswers;

    this.answers = Object.assign(
      {
        packageManager: this.options['packageManager'] as string,
        framework: this.options['framework'] as string,
      },
      answers,
    );
  }

  start(): void {
    if (this.answers.framework === 'angular') {
      this.composeWith('codingsans-cli:angular');
    }
  }
};
