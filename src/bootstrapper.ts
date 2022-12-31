import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

type ExecOptions = Parameters<typeof execSync>[1];

export type BootstrapOptions = Partial<{
  packageJson: Partial<{
    scripts: Record<string, string>;
    dependencies: string[];
    devDependencies: string[];
    params: Record<string, any>;
  }>;
  commandsArguments: Record<string, string>;
  files: Record<string, string>;
}>;

export interface IBootstrapper {
  bootstrap(options?: BootstrapOptions): void;
}

export const Bootstrapper = (appName: string): IBootstrapper => {
  const getDirPath = () => path.join(process.cwd(), appName);
  const packageJsonManager = PackageJsonManager(getDirPath());
  const execSyncInDir = (command: string, options?: ExecOptions) =>
    execSync(command, { cwd: getDirPath(), ...options });

  const init = () => {
    if (fs.existsSync(getDirPath()))
      throw new Error(`dir name ${appName} already exists`);

    fs.mkdirSync(getDirPath());

    execSyncInDir('npm init -y');
  };

  const handlePackageJson = (packageJson: BootstrapOptions['packageJson']) => {
    const { scripts, dependencies, devDependencies, params } =
      packageJson || {};

    if (scripts || params) {
      packageJsonManager.writeToPackageJson({ scripts, ...params });
    }

    if (dependencies) {
      execSyncInDir(`npm i --save ${dependencies.join(' ')}`);
    }

    if (devDependencies) {
      execSyncInDir(`npm i --save-dev ${devDependencies.join(' ')}`);
    }
  };

  const buildConfigs = (
    allDependencies: string[],
    commandsArguments: BootstrapOptions['commandsArguments'] = {}
  ) => {
    const dependencyHandlers = {
      typescript: (commandFlags: string = '') =>
        execSyncInDir(`npx tsc --init ${commandFlags}`),
      'ts-jest': () => execSyncInDir('npx ts-jest config:init'),
    };
    Object.entries(dependencyHandlers)
      .filter(([key]) => allDependencies.includes(key))
      .forEach(([key, handler]) => {
        handler(commandsArguments[key]);
      });
  };

  const buildGitIgnore = () => {
    const buildPath = path.join(getDirPath(), '.gitignore');
    const gitIgnoreContent = fs
      .readFileSync(path.join(__dirname, '..', '.gitignore'))
      .toString();

    fs.writeFileSync(buildPath, gitIgnoreContent);
  };

  const buildFiles = (files: BootstrapOptions['files']) =>
    files &&
    Object.entries(files).forEach(([filePath, fileContent]) => {
      const builtFilePath = path.join(getDirPath(), filePath);
      fs.mkdirSync(path.dirname(builtFilePath), {
        recursive: true,
      });
      fs.writeFileSync(builtFilePath, fileContent);
    });

  const bootstrap: IBootstrapper['bootstrap'] = ({
    commandsArguments,
    files,
    packageJson = {
      dependencies: [],
      devDependencies: [],
    },
  } = {}) => {
    init();
    handlePackageJson(packageJson);
    buildConfigs(
      [
        ...(packageJson.dependencies || []),
        ...(packageJson.devDependencies || []),
      ],
      commandsArguments
    );
    buildGitIgnore();
    buildFiles(files);
  };

  return {
    bootstrap,
  };
};

interface IPackageJsonManager {
  getPackageJson: () => BootstrapOptions['packageJson'];
  writeToPackageJson: (data: BootstrapOptions['packageJson']) => void;
}
const PackageJsonManager = (packageJsonDir: string): IPackageJsonManager => {
  const getPackageJsonPath = () => path.join(packageJsonDir, 'package.json');

  const getPackageJson: IPackageJsonManager['getPackageJson'] = () =>
    require(path.resolve(getPackageJsonPath()));

  const writeToPackageJson: IPackageJsonManager['writeToPackageJson'] = (
    data: BootstrapOptions['packageJson']
  ) =>
    fs.writeFileSync(
      getPackageJsonPath(),
      JSON.stringify({ ...getPackageJson(), ...data })
    );

  return { getPackageJson, writeToPackageJson };
};
