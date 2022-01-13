import * as Generator from 'yeoman-generator';
import { BaseGenerator } from '../base-generator';
import { ReactFeature, ReactFeatures } from './nextjs-answers';

const hasFeatureFactory =
  (features: ReactFeature[]): ((feature: ReactFeature) => boolean) =>
  (feature: ReactFeature): boolean =>
    features.includes(feature);
module.exports = class extends BaseGenerator {
  answers: ReactFeatures = { features: [] };

  hasFeature: (feature: ReactFeature) => boolean = () => false;
  commonTemplateFolder = '';
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
          { name: 'State-management', value: 'state-management', checked: false },
          { name: 'Angular SSR /w express.js', value: 'ssr', checked: false },
        ],
      },
    ])) as ReactFeatures;

    this.hasFeature = hasFeatureFactory(this.answers.features);

    this.templateFolder = this.templatePath('../../../templates/nextjs');
    this.commonTemplateFolder = this.templatePath('../../../templates/common');
  }

  async installPackages(): Promise<void> {
    this.spawnCommandSync('npx', ['create-next-app', this.projectName, `--use-${this.packageManager}`]);

    if (this.hasFeature('eslint')) {
      await this.uninstall(['eslint', 'eslint-config-next']);
      await this.install(
        [
          {
            eslint: '7',
          },
          '@codingsans/eslint-config',
        ],
        true,
      );
    }

    if (this.hasFeature('prettier')) {
      await this.install(['prettier'], true);
    }

    if (this.hasFeature('jest')) {
      await this.install(['jest', '@testing-library/react', '@testing-library/jest-dom'], true);
    }

    if (this.hasFeature('stryker')) {
      await this.install(
        ['@stryker-mutator/core', '@stryker-mutator/jest-runner', '@stryker-mutator/typescript-checker'],
        true,
      );
    }
  }

  async writing(): Promise<void> {
    this.copyTemplate(
      `${this.templateFolder}/tsconfig.json`,
      this.destinationPath(`${this.projectName}/tsconfig.json`),
    );

    await this.install(['typescript', '@types/react'], true);

    if (this.hasFeature('eslint')) {
      if (this.hasFeature('codingsans-eslint')) {
        await this.extendJson(`${this.projectName}/.eslintrc.json`, {
          extends: ['@codingsans/eslint-config/typescript-recommended'],
        });
      }
    }

    if (this.hasFeature('prettier')) {
      if (this.hasFeature('prettier-vscode')) {
        this.copyTemplate(
          `${this.commonTemplateFolder}/settings.json`,
          this.destinationPath(`${this.projectName}/.vscode/settings.json`),
        );
      }
    }

    if (this.hasFeature('jest')) {
      this.copyTemplate(
        `${this.templateFolder}/jest.config.js`,
        this.destinationPath(`${this.projectName}/jest.config.js`),
      );
      this.copyTemplate(
        `${this.templateFolder}/jest.setup.js`,
        this.destinationPath(`${this.projectName}/jest.setup.js`),
      );
      await this.extendJson(`${this.projectName}/package.json`, {
        scripts: { test: 'jest', 'test:watch': 'jest --watch' },
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
