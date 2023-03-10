import path from 'path';
import { execPromised, pathExists } from './utils';
import fs from 'node:fs/promises';

type ExecOptions = Parameters<typeof execPromised>[1];

export type BootstrapOptions = Partial<{
  packageJson: Partial<{
    scripts: Record<string, string>;
    dependencies: string[];
    devDependencies: string[];
    params: Record<string, any>;
  }>;
  files: Record<string, string>;
  postScripts: string[];
}>;

export interface IBootstrapper {
  bootstrap(options?: BootstrapOptions): Promise<void>;
}

export const Bootstrapper = (appName: string): IBootstrapper => {
  const getDirPath = () => path.join(process.cwd(), appName);
  const packageJsonManager = PackageJsonManager(getDirPath());
  const execInDir = (command: string, options?: ExecOptions) =>
    execPromised(command, { cwd: getDirPath(), ...options });

  const init = async () => {
    if (await pathExists(getDirPath()))
      throw new Error(`dir name ${appName} already exists`);

    await fs.mkdir(getDirPath());

    await execInDir('npm init -y');
  };

  const handlePackageJson = async (
    packageJson: BootstrapOptions['packageJson'] = {}
  ) => {
    const { scripts, dependencies, devDependencies, params } = packageJson;

    if (scripts || params) {
      await packageJsonManager.writeToPackageJson({ scripts, ...params });
    }

    if (dependencies) {
      await execInDir(`npm i --save ${dependencies.join(' ')}`);
    }

    if (devDependencies) {
      await execInDir(`npm i --save-dev ${devDependencies.join(' ')}`);
    }
  };

  const runPostScripts = (postScripts: BootstrapOptions['postScripts'] = []) =>
    Promise.all(postScripts?.map((script) => execInDir(script)));

  const buildGitIgnore = async () => {
    const buildPath = path.join(getDirPath(), '.gitignore');
    const templatePath = path.join(__dirname, 'templates', 'gitignore');
    await fs.copyFile(templatePath, buildPath);
  };

  const buildFiles = async (files: BootstrapOptions['files']) =>
    files &&
    Promise.all(
      Object.entries(files).map(async ([filePath, fileContent]) => {
        const builtFilePath = path.join(getDirPath(), filePath);
        await fs.mkdir(path.dirname(builtFilePath), {
          recursive: true,
        });
        await fs.writeFile(builtFilePath, fileContent);
      })
    );

  const bootstrap: IBootstrapper['bootstrap'] = async ({
    postScripts,
    files,
    packageJson,
  } = {}) => {
    await init();
    await handlePackageJson(packageJson);
    await buildGitIgnore();
    await buildFiles(files);
    await runPostScripts(postScripts);
  };

  return {
    bootstrap,
  };
};

interface IPackageJsonManager {
  getPackageJson: () => BootstrapOptions['packageJson'];
  writeToPackageJson: (data: BootstrapOptions['packageJson']) => Promise<void>;
}
const PackageJsonManager = (packageJsonDir: string): IPackageJsonManager => {
  const getPackageJsonPath = () => path.join(packageJsonDir, 'package.json');

  const getPackageJson: IPackageJsonManager['getPackageJson'] = () =>
    require(path.resolve(getPackageJsonPath()));

  const writeToPackageJson: IPackageJsonManager['writeToPackageJson'] = (
    data: BootstrapOptions['packageJson']
  ) =>
    fs.writeFile(
      getPackageJsonPath(),
      JSON.stringify({ ...getPackageJson(), ...data }, null, 4)
    );

  return { getPackageJson, writeToPackageJson };
};
