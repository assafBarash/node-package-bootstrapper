import util from 'util';
import { exec } from 'child_process';
import fs from 'node:fs/promises';

type Promisify<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => Promise<ReturnType<T>>;

type ExecPromised = Promisify<typeof exec>;

export const execPromised = util.promisify(
  require('child_process').exec
) as ExecPromised;

export const pathExists = async (dirname: string): Promise<boolean> => {
  try {
    await fs.access(dirname);
    return true;
  } catch (err: any) {
    return false;
  }
};
