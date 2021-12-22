import * as Generator from 'yeoman-generator';
import { AppAnswers } from '../app/app-answers';
import { extendJson, install, uninstall } from '../utils';
import { AngularAnswers, AngularFeature } from './angular-answers';

const hasFeatureFactory =
  (features: AngularFeature[]): ((feature: AngularFeature) => boolean) =>
  (feature: AngularFeature): boolean =>
    features.includes(feature);

module.exports = class extends Generator {
  rootAnswers: AppAnswers = {} as AppAnswers;
  answers: AngularAnswers = {} as AngularAnswers;
  hasFeature: (feature: AngularFeature) => boolean = () => false;

  initializing(): void {
    this.log('Generating Angular application');
    const root = this.env.rootGenerator() as unknown as { answers: AppAnswers };
    this.rootAnswers = root.answers;
  }

  async prompting(): Promise<void> {
    this.answers = (await this.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Please type project name',
        default: 'angular-starter',
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Which setups do you want to include?',
        choices: [
          {
            name: 'ESLint',
            value: 'eslint',
            checked: true,
          },
          {
            name: 'CodingSans ESLint (only with ESLint)',
            value: 'codingsans-eslint',
            checked: true,
          },
          {
            name: 'Prettier',
            value: 'prettier',
            checked: true,
          },
          {
            name: 'Prettier VSCode settings (only with Prettier)',
            value: 'prettier-vscode',
            checked: true,
          },
          { name: 'Jest Unit test runner', value: 'jest', checked: true },
          { name: 'Stryker Mutation test runner', value: 'stryker', checked: true },
        ],
      },
    ])) as AngularAnswers;

    this.hasFeature = hasFeatureFactory(this.answers.features);
  }

  async writing(): Promise<void> {
    this.spawnCommandSync('npx', [
      '@angular/cli',
      'new',
      this.answers.projectName,
      `--packageManager=${this.rootAnswers.packageManager}`,
      '--routing',
      '--strict',
      '--style=scss',
    ]);

    const templatePath = this.templatePath('../../../templates/angular');

    if (this.hasFeature('eslint')) {
      await install(
        this,
        [
          {
            eslint: '7',
          },
          '@codingsans/eslint-config',
        ],
        true,
      );

      this.spawnCommandSync('yarn', ['ng', 'add', '@angular-eslint/schematics', '--skip-confirmation'], {
        cwd: this.answers.projectName,
      });

      if (this.hasFeature('codingsans-eslint')) {
        await extendJson(this, `${this.answers.projectName}/.eslintrc.json`, {
          overrides: [{ extends: ['@codingsans/eslint-config/typescript-recommended'] }],
        });
      }
    }

    if (this.hasFeature('prettier')) {
      await install(this, ['prettier'], true);

      if (this.hasFeature('prettier-vscode')) {
        this.copyTemplate(
          `${templatePath}/settings.json`,
          this.destinationPath(`${this.answers.projectName}/.vscode/settings.json`),
        );
      }
    }

    if (this.hasFeature('jest')) {
      await install(this, ['jest', '@types/jest', 'jest-preset-angular'], true);
      await uninstall(this, [
        'jasmine-core',
        '@types/jasmine',
        'karma',
        'karma-chrome-launcher',
        'karma-coverage',
        'karma-jasmine',
        'karma-jasmine-html-reporter',
      ]);

      this.copyTemplate(
        `${templatePath}/setup-jest.ts`,
        this.destinationPath(`${this.answers.projectName}/setup-jest.ts`),
      );
      this.copyTemplate(
        `${templatePath}/jest.config.js`,
        this.destinationPath(`${this.answers.projectName}/jest.config.js`),
      );

      const karmaConfPath = this.destinationPath(`${this.answers.projectName}/karma.conf.js`);
      this.deleteDestination(karmaConfPath);
      const karmaInitPath = this.destinationPath(`${this.answers.projectName}/src/test.ts`);
      this.deleteDestination(karmaInitPath);

      await extendJson(this, `${this.answers.projectName}/tsconfig.spec.json`, {
        compilerOptions: { types: ['jest'], esModuleInterop: true },
        files: [],
      });

      await extendJson(this, `${this.answers.projectName}/package.json`, {
        scripts: { test: 'jest' },
      });
    }

    if (this.hasFeature('stryker')) {
      await install(
        this,
        ['@stryker-mutator/core', '@stryker-mutator/jest-runner', '@stryker-mutator/typescript-checker'],
        true,
      );

      this.copyTemplate(
        `${templatePath}/tsconfig.stryker.json`,
        this.destinationPath(`${this.answers.projectName}/tsconfig.stryker.json`),
      );

      this.copyTemplate(
        `${templatePath}/stryker.conf.js`,
        this.destinationPath(`${this.answers.projectName}/stryker.conf.js`),
      );

      await extendJson(this, `${this.answers.projectName}/package.json`, {
        scripts: { stryker: 'stryker run' },
      });
    }
  }
};
