import path from 'path';
import fs from 'node:fs/promises';
import fileSystem from 'fs';
import { pathExists } from '../src/utils';

export interface IBootstrapperTestkit {
  getAppDirPath: () => string;
  cleanup: () => Promise<void> | void;
  hasFile: (fileName: string) => Promise<boolean>;
  getJsonFile: <T extends {} | undefined = {}>(fileName: string) => Promise<T>;
  getFileContent: (fileName: string) => Promise<string>;
}

export const BootstrapperTestkit = (appName: string): IBootstrapperTestkit => {
  const getAppDirPath: IBootstrapperTestkit['getAppDirPath'] = () =>
    path.join(process.cwd(), appName);

  const cleanup: IBootstrapperTestkit['cleanup'] = () =>
    fileSystem.rmSync(getAppDirPath(), { recursive: true, force: true });

  const hasFile: IBootstrapperTestkit['hasFile'] = async (fileName) =>
    pathExists(await path.join(getAppDirPath(), fileName));

  const getFileContent: IBootstrapperTestkit['getFileContent'] = async (
    fileName
  ) => (await fs.readFile(path.join(getAppDirPath(), fileName))).toString();

  const getJsonFile: IBootstrapperTestkit['getJsonFile'] = async (fileName) =>
    JSON.parse(
      (
        await fs.readFile(path.join(getAppDirPath(), `${fileName}.json`))
      ).toString()
    );
  // require(path.resolve(path.join(getAppDirPath(), `${fileName}.json`)));

  return { getAppDirPath, cleanup, hasFile, getJsonFile, getFileContent };
};
