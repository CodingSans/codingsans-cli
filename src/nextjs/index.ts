import { ChildProcess } from 'child_process';
import { AbortController } from 'node-abort-controller';
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
    this.log('Generating NextJS application');
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
      await this.install([{ eslint: '7' }, '@codingsans/eslint-config'], true);
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
      await this.extendJson(`${this.projectName}/.eslintrc.json`, {
        extends: ['@codingsans/eslint-config/typescript-recommended'],
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

  async end(): Promise<void> {
    const abortController = new AbortController();
    const asd = this.spawnCommand(this.packageManager, ['run', 'dev'], {
      cwd: this.projectName,
      signal: abortController.signal,
    }) as ChildProcess;
    asd.on('error', () => {
      console.log(`Child process (${this.packageManager} run dev) aborted.`);
    });
    await new Promise((res) => setTimeout(res, 3000));
    abortController.abort();
  }
};
