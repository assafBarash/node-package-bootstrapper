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

  afterEach(() => {
    testkit.cleanup();
  });

  it('should init package', () => {
    bootstrapper.bootstrap();

    expect(fs.existsSync(testkit.getAppDirPath())).toBe(true);
    expect(
      fs.existsSync(path.join(testkit.getAppDirPath(), 'package.json'))
    ).toBe(true);
  });

  it('should throw error and not bootstrap when dir with given name already exists', () => {
    bootstrapper.bootstrap();
    try {
      bootstrapper.bootstrap();
    } catch (e: any) {
      expect(e.message).toBe(`dir name ${testAppName} already exists`);
    }
  });

  it('should add start script', () => {
    const scripts = { start: 'node build/index.js' };
    bootstrapper.bootstrap({ packageJson: { scripts } });
    expect(
      testkit.getJsonFile<BootstrapOptions['packageJson']>('package')?.scripts
    ).toEqual(scripts);
  });

  it('should add dependencies to package.json', () => {
    const dependencies = ['express'];
    bootstrapper.bootstrap({ packageJson: { dependencies } });

    expect(
      Object.keys(
        testkit.getJsonFile<BootstrapOptions['packageJson']>('package')
          ?.dependencies || {}
      )
    ).toEqual(dependencies);
  });
});
