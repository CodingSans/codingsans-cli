import * as decomment from 'decomment';
import { existsSync } from 'fs';
import { first, isObject, keys, merge, values } from 'lodash';
import * as Generator from 'yeoman-generator';
import { Framework, PackageManager } from './app/app-answers';

export class BaseGenerator extends Generator {
  protected extendJson: (path: string, data: Record<string, unknown>) => Promise<void>;
  protected install: (packages: (string | { [key: string]: string })[], isDev: boolean) => Promise<void>;
  protected uninstall: (packages: string[]) => Promise<void>;
  protected copyOptionsFromRoot: (generator: BaseGenerator) => void;

  public packageManager!: PackageManager;
  public framework!: Framework;
  public projectName = 'project-starter';

  constructor(args: string | string[], opts: Generator.GeneratorOptions) {
    super(args, opts);

    this.extendJson = async (path: string, data: Record<string, unknown>): Promise<void> => {
      const absolutePath = this.destinationPath(path);
      const content = this.readDestination(absolutePath);
      const removedComment = decomment(content);
      const parsed = JSON.parse(removedComment) as Record<string, unknown>;
      const newData = merge(parsed, data);
      this.writeDestination(absolutePath, JSON.stringify(newData, null, 2));
      return new Promise((resolve) => setTimeout(resolve, 1000));
    };

    this.install = async (packages: (string | { [key: string]: string })[], isDev = false): Promise<void> => {
      const absolutePath = this.destinationPath(`${this.projectName}/yarn.lock`);
      const isYarn = existsSync(absolutePath);
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      const packageList = packages.map((p) => (isObject(p) ? `${first(keys(p))}@${first(values(p))}` : p));
      if (isYarn) {
        this.spawnCommandSync('yarn', ['add', isDev ? '-D' : '-S', ...packageList], {
          cwd: this.projectName,
        });
      } else {
        this.spawnCommandSync('npm', ['i', isDev ? '-D' : '-S', ...packageList], { cwd: this.projectName });
      }
      return new Promise((resolve) => setTimeout(resolve, 1000));
    };

    this.uninstall = async (packages: string[]): Promise<void> => {
      const absolutePath = this.destinationPath(`${this.projectName}/yarn.lock`);
      const isYarn = existsSync(absolutePath);
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      if (isYarn) {
        this.spawnCommandSync('yarn', ['remove', ...packages], { cwd: this.projectName });
      } else {
        this.spawnCommandSync('npm', ['uninstall', ...packages], { cwd: this.projectName });
      }
      return new Promise((resolve) => setTimeout(resolve, 1000));
    };

    this.copyOptionsFromRoot = (generator: BaseGenerator) => {
      if (generator) {
        const { packageManager, framework, projectName } = generator;
        if (packageManager && framework && projectName) {
          this.packageManager = generator.packageManager;
          this.framework = generator.framework;
          this.projectName = generator.projectName;
        }
      }
    };
  }
}
