# Node Package Bootstrapper

Bootstraps node projects by given config

## Getting Started

```ts
import { Bootstrapper } from 'package-bootstrapper';

const appName = 'test-app';
Bootstrapper(appName).bootstrap();
```

## API

```ts
.bootstrap(options:BootstrapOptions)
```

### Options

```ts
type BootstrapOptions = Partial<{
  packageJson: Partial<{
    scripts: Record<string, string>;
    dependencies: string[];
    devDependencies: string[];
    params: Record<string, any>;
  }>;
  files: Record<string, string>;
  postScripts: string[];
}>;
```

**packageJson** <br/>

- `scripts`: override default scripts
- `dependencies`: an array of dependencies to install
- `devDependencies`: an array of devDependencies to install
- `params`: additional params to attach to `package.json`

**files** <br/>

defines files to be created on bootstrap. each key is a file path and each value is the corresponding file content

**postScripts** <br/>

scripts to run post initialization
