import * as decomment from 'decomment';
import { existsSync } from 'fs';
import { first, isObject, keys, merge, values } from 'lodash';
import * as Generator from 'yeoman-generator';
import { AngularAnswers } from './angular/angular-answers';

export const extendJson = async (yeoman: Generator, path: string, data: Record<string, unknown>): Promise<void> => {
  const absolutePath = yeoman.destinationPath(path);
  const content = yeoman.readDestination(absolutePath);
  const removedComment = decomment(content);
  const parsed = JSON.parse(removedComment) as Record<string, unknown>;
  const newData = merge(parsed, data);
  yeoman.writeDestination(absolutePath, JSON.stringify(newData, null, 2));
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

export const install = async (
  yeoman: Generator & { answers: AngularAnswers },
  packages: (string | { [key: string]: string })[],
  isDev = false,
): Promise<void> => {
  const absolutePath = yeoman.destinationPath(`${yeoman.answers.projectName}/yarn.lock`);
  const isYarn = existsSync(absolutePath);
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const packageList = packages.map((p) => (isObject(p) ? `${first(keys(p))}@${first(values(p))}` : p));
  if (isYarn) {
    yeoman.spawnCommandSync('yarn', ['add', isDev ? '-D' : '-S', ...packageList], {
      cwd: yeoman.answers.projectName,
    });
  } else {
    yeoman.spawnCommandSync('npm', ['i', isDev ? '-D' : '-S', ...packageList], { cwd: yeoman.answers.projectName });
  }
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

export const uninstall = async (yeoman: Generator & { answers: AngularAnswers }, packages: string[]): Promise<void> => {
  const absolutePath = yeoman.destinationPath(`${yeoman.answers.projectName}/yarn.lock`);
  const isYarn = existsSync(absolutePath);
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  if (isYarn) {
    yeoman.spawnCommandSync('yarn', ['remove', ...packages], { cwd: yeoman.answers.projectName });
  } else {
    yeoman.spawnCommandSync('npm', ['uninstall', ...packages], { cwd: yeoman.answers.projectName });
  }
  return new Promise((resolve) => setTimeout(resolve, 1000));
};
