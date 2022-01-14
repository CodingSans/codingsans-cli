import * as Generator from 'yeoman-generator';
import { BaseGenerator } from '../base-generator';
import {
  AngularAnswers,
  AngularFeature,
  AngularStateManagement,
  AngularStateManagementAnswers,
} from './angular-answers';

const hasFeatureFactory =
  (features: AngularFeature[]): ((feature: AngularFeature) => boolean) =>
  (feature: AngularFeature): boolean =>
    features.includes(feature);
module.exports = class extends BaseGenerator {
  answers: AngularAnswers = {} as AngularAnswers;
  stateAnswers: AngularStateManagementAnswers = {} as AngularStateManagementAnswers;

  hasFeature: (feature: AngularFeature) => boolean = () => false;
  isStateFeature: (feature: AngularStateManagement) => boolean = () => false;
  templateFolder = '';
  commonTemplateFolder = '';

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
          { name: 'ESLint', value: 'eslint', checked: true },
          { name: 'Prettier', value: 'prettier', checked: true },
          { name: 'Jest Unit test runner', value: 'jest', checked: true },
          { name: 'Stryker Mutation test runner', value: 'stryker', checked: true },
          { name: 'State-management', value: 'state-management', checked: false },
          { name: 'Angular SSR /w express.js', value: 'ssr', checked: false },
        ],
      },
    ])) as AngularAnswers;

    this.hasFeature = hasFeatureFactory(this.answers.features);

    if (this.hasFeature('state-management')) {
      this.stateAnswers = (await this.prompt([
        {
          type: 'list',
          name: 'stateManagement',
          message: 'Which state-management lib do you want to include?',
          choices: [
            { name: 'NGRX', value: 'ngrx' },
            { name: 'Akita', value: 'akita' },
            { name: 'NGXS', value: 'ngxs' },
          ],
        },
      ])) as AngularStateManagementAnswers;
    }

    this.isStateFeature = (stateManagement) => this.stateAnswers.stateManagement === stateManagement;

    this.templateFolder = this.templatePath('../../../templates/angular');
    this.commonTemplateFolder = this.templatePath('../../../templates/common');
  }

  async installPackages(): Promise<void> {
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

      this.spawnCommandSync('npx', ['ng', 'add', '@angular-eslint/schematics', '--skip-confirmation'], {
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
      this.spawnCommandSync('npx', ['ng', 'add', '@nguniversal/express-engine', '--skip-confirmation'], {
        cwd: this.projectName,
      });
    }

    if (this.isStateFeature('ngrx')) {
      this.spawnCommandSync('npx', ['ng', 'add', '@ngrx/store', '--skip-confirmation'], {
        cwd: this.projectName,
      });
      this.spawnCommandSync('npx', ['ng', 'add', '@ngrx/store-devtools', '--skip-confirmation'], {
        cwd: this.projectName,
      });
      this.spawnCommandSync('npx', ['ng', 'add', '@ngrx/effects', '--skip-confirmation'], {
        cwd: this.projectName,
      });
    }

    if (this.isStateFeature('ngxs')) {
      this.spawnCommandSync('npx', ['ng', 'add', '@ngxs/store', '--skip-confirmation'], {
        cwd: this.projectName,
      });
      this.spawnCommandSync('npx', ['ng', 'add', '@ngxs/devtools-plugin', '--skip-confirmation'], {
        cwd: this.projectName,
      });
    }

    if (this.isStateFeature('akita')) {
      await this.install(['@datorama/akita'], false);
      await this.install(['@datorama/akita-ngdevtools'], false);
    }
  }

  async writing(): Promise<void> {
    if (this.hasFeature('eslint')) {
      await this.extendJson(`${this.projectName}/.eslintrc.json`, {
        overrides: [{ extends: ['@codingsans/eslint-config/typescript-recommended'] }],
      });
    }

    if (this.hasFeature('prettier')) {
      this.copyTemplate(
        `${this.commonTemplateFolder}/.prettierrc`,
        this.destinationPath(`${this.projectName}/.prettierrc`),
      );
      this.copyTemplate(
        `${this.commonTemplateFolder}/settings.json`,
        this.destinationPath(`${this.projectName}/.vscode/settings.json`),
      );
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
