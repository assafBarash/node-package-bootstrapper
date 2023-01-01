import fs from 'fs';
import path from 'path';
import { BootstrapOptions, Bootstrapper, IBootstrapper } from '../src';
import { BootstrapperTestkit } from './bootstrapper.testkit';

describe('bootstrapper', () => {
  const testAppName = 'test-app';
  const testkit = BootstrapperTestkit(testAppName);
  let bootstrapper: IBootstrapper;

  beforeEach(() => {
    bootstrapper = Bootstrapper(testAppName);
  });

  afterEach(async () => {
    await testkit.cleanup();
  });

  it('should init package', async () => {
    await bootstrapper.bootstrap();

    expect(fs.existsSync(testkit.getAppDirPath())).toBe(true);
    expect(
      fs.existsSync(path.join(testkit.getAppDirPath(), 'package.json'))
    ).toBe(true);
  });

  it('should throw error and not bootstrap when dir with given name already exists', async () => {
    await bootstrapper.bootstrap();
    try {
      await bootstrapper.bootstrap();
    } catch (e: any) {
      expect(e.message).toBe(`dir name ${testAppName} already exists`);
    }
  });

  it('should add start script', async () => {
    const scripts = { start: 'node build/index.js' };
    await bootstrapper.bootstrap({ packageJson: { scripts } });

    expect(
      (await testkit.getJsonFile<BootstrapOptions['packageJson']>('package'))
        ?.scripts
    ).toEqual(expect.objectContaining(scripts));
  });

  it.each(['dependencies', 'devDependencies'])(
    'should add %s to package.json',
    async (dependenciesKey) => {
      const dependencies = ['express'];
      await bootstrapper.bootstrap({
        packageJson: { [dependenciesKey]: dependencies },
      });

      expect(
        Object.keys(
          (
            await testkit.getJsonFile<BootstrapOptions['packageJson']>(
              'package'
            )
          )?.[dependenciesKey as keyof BootstrapOptions['packageJson']] || {}
        )
      ).toEqual(dependencies);
    }
  );

  it('should create .gitignore', async () => {
    await bootstrapper.bootstrap();
    expect(await testkit.hasFile('.gitignore')).toBe(true);
  });

  it('should create tsconfig.json', async () => {
    const devDependencies = ['typescript'];
    await bootstrapper.bootstrap({
      packageJson: { devDependencies },
    });

    expect(await testkit.hasFile('tsconfig.json')).toBe(true);
  });

  it('should create jest.config.js', async () => {
    const devDependencies = ['ts-jest'];
    await bootstrapper.bootstrap({
      packageJson: { devDependencies },
    });

    expect(await testkit.hasFile('jest.config.js')).toBe(true);
  }, 10000);

  it('should have create index file with content', async () => {
    const filePath = path.join('src', 'index.ts');
    const fileContent = '#! /usr/bin/env node';
    await bootstrapper.bootstrap({
      files: {
        [filePath]: fileContent,
      },
    });

    expect(await testkit.getFileContent(filePath)).toBe(fileContent);
  });

  it('should add params to package.json', async () => {
    const params = {
      typing: 'build/index',
    };
    await bootstrapper.bootstrap({
      packageJson: {
        params,
      },
    });

    expect((await testkit.getJsonFile<any>('package'))?.typing).toEqual(
      params.typing
    );
  });
});
