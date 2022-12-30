import path from 'path';
import fs from 'fs';

export interface IBootstrapperTestkit {
  getAppDirPath: () => string;
  cleanup: () => void;
  hasFile: (fileName: string) => boolean;
  getJsonFile: <T extends {} | undefined = {}>(fileName: string) => T;
}

export const BootstrapperTestkit = (appName: string): IBootstrapperTestkit => {
  const getAppDirPath: IBootstrapperTestkit['getAppDirPath'] = () =>
    path.join(process.cwd(), appName);

  const cleanup: IBootstrapperTestkit['cleanup'] = () =>
    fs.rmSync(getAppDirPath(), { recursive: true, force: true });

  const hasFile: IBootstrapperTestkit['hasFile'] = (fileName) =>
    fs.existsSync(path.join(getAppDirPath(), fileName));

  const getJsonFile: IBootstrapperTestkit['getJsonFile'] = (fileName) =>
    JSON.parse(
      fs.readFileSync(path.join(getAppDirPath(), `${fileName}.json`)).toString()
    );

  return { getAppDirPath, cleanup, hasFile, getJsonFile };
};
