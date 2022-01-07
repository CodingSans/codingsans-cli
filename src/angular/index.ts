import { existsSync } from 'fs';
import * as Generator from 'yeoman-generator';
import { BaseGenerator } from '../base-generator';
import { AngularAnswers, AngularFeature } from './angular-answers';

const hasFeatureFactory =
  (features: AngularFeature[]): ((feature: AngularFeature) => boolean) =>
  (feature: AngularFeature): boolean =>
    features.includes(feature);

module.exports = class extends BaseGenerator {
  answers: AngularAnswers = {} as AngularAnswers;
  hasFeature: (feature: AngularFeature) => boolean = () => false;
  templateFolder = '';

  constructor(args: string | string[], opts: Generator.GeneratorOptions) {
    super(args, opts);

    const root = this.env.rootGenerator() as BaseGenerator;
    this.copyOptionsFromRoot(root);
  }

  initializing(): void {
    this.log('Generating Angular application');
  }

  async prompting(): Promise<void> {
    this.answers = (await this.prompt([
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
          { name: 'Angular SSR /w express.js', value: 'ssr', checked: false },
        ],
      },
    ])) as AngularAnswers;

    this.hasFeature = hasFeatureFactory(this.answers.features);
    this.templateFolder = this.templatePath('../../../templates/angular');
  }

  async installPackages(): Promise<void> {
    const absolutePath = this.destinationPath(`${this.projectName}/yarn.lock`);
    const isYarn = existsSync(absolutePath);
    const runnerCommand = isYarn ? 'yarn' : 'npx';
    this.spawnCommandSync('npx', [
      '@angular/cli',
      'new',
      this.projectName,
      `--packageManager=${this.packageManager}`,
      '--routing',
      '--strict',
      '--style=scss',
    ]);

    if (this.hasFeature('eslint')) {
      await this.install(
        [
          {
            eslint: '7',
          },
          '@codingsans/eslint-config',
        ],
        true,
      );

      this.spawnCommandSync(runnerCommand, ['ng', 'add', '@angular-eslint/schematics', '--skip-confirmation'], {
        cwd: this.projectName,
      });
    }

    if (this.hasFeature('prettier')) {
      await this.install(['prettier'], true);
    }

    if (this.hasFeature('jest')) {
      await this.install(['jest', '@types/jest', 'jest-preset-angular'], true);
      await this.uninstall([
        'jasmine-core',
        '@types/jasmine',
        'karma',
        'karma-chrome-launcher',
        'karma-coverage',
        'karma-jasmine',
        'karma-jasmine-html-reporter',
      ]);
    }

    if (this.hasFeature('stryker')) {
      await this.install(
        ['@stryker-mutator/core', '@stryker-mutator/jest-runner', '@stryker-mutator/typescript-checker'],
        true,
      );
    }

    if (this.hasFeature('ssr')) {
      this.spawnCommandSync(runnerCommand, ['ng', 'add', '@nguniversal/express-engine', '--skip-confirmation'], {
        cwd: this.projectName,
      });
    }
  }

  async writing(): Promise<void> {
    if (this.hasFeature('eslint')) {
      if (this.hasFeature('codingsans-eslint')) {
        await this.extendJson(`${this.projectName}/.eslintrc.json`, {
          overrides: [{ extends: ['@codingsans/eslint-config/typescript-recommended'] }],
        });
      }
    }

    if (this.hasFeature('prettier')) {
      if (this.hasFeature('prettier-vscode')) {
        this.copyTemplate(
          `${this.templateFolder}/settings.json`,
          this.destinationPath(`${this.projectName}/.vscode/settings.json`),
        );
      }
    }

    if (this.hasFeature('jest')) {
      this.copyTemplate(
        `${this.templateFolder}/setup-jest.ts`,
        this.destinationPath(`${this.projectName}/setup-jest.ts`),
      );
      this.copyTemplate(
        `${this.templateFolder}/jest.config.js`,
        this.destinationPath(`${this.projectName}/jest.config.js`),
      );

      const karmaConfPath = this.destinationPath(`${this.projectName}/karma.conf.js`);
      this.deleteDestination(karmaConfPath);
      const karmaInitPath = this.destinationPath(`${this.projectName}/src/test.ts`);
      this.deleteDestination(karmaInitPath);

      await this.extendJson(`${this.projectName}/tsconfig.spec.json`, {
        compilerOptions: { types: ['jest'], esModuleInterop: true },
        files: [],
      });

      await this.extendJson(`${this.projectName}/package.json`, {
        scripts: { test: 'jest' },
      });
    }

    if (this.hasFeature('stryker')) {
      this.copyTemplate(
        `${this.templateFolder}/tsconfig.stryker.json`,
        this.destinationPath(`${this.projectName}/tsconfig.stryker.json`),
      );

      this.copyTemplate(
        `${this.templateFolder}/stryker.conf.js`,
        this.destinationPath(`${this.projectName}/stryker.conf.js`),
      );

      await this.extendJson(`${this.projectName}/package.json`, {
        scripts: { stryker: 'stryker run' },
      });
    }
  }
};
