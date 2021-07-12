# GitHub Release Stats

## Description

**GitHub Release Stats** is a JavaScript library written in TypeScript
for fetching the GitHub release download count and other statistics.

It can be used in several ways:

- [Command-line tool](#using-as-a-command-line-tool)
- [Module (Node.js or browser)](#using-as-a-module)

This library also supports the GitHub API pagination out of the box.

## Usage

### Using as a command-line tool

#### Installation

```sh
npm i -g github-release-stats
```

Now you can run `ghstats` in your command line interpreter.

#### Syntax

```sh
ghstats [owner] [repo] [tag] [options]
ghstats [owner/repo] [tag] [options]
```

#### Parameters

| Parameter | Description                                                             |
| --------- | ----------------------------------------------------------------------- |
| `owner`   | Repository owner. If not present, you will be prompted for the input.   |
| `repo`    | Repository name. If not present, you will be prompted for the input.    |
| `tag`     | Release tag name. If not present, prints the total number of downloads. |

#### Options

| Option           | Description
| ---------------- | ---------------------------------------------------- |
| `-d`, `--detail` | Print detailed statistics for each release           |
| `-q`, `--quiet`  | Print only resulting numbers and errors (quiet mode) |
| `-l`, `--latest` | Print statistics for the latest release              |
| `-h`, `--help`   | Print help message                                   |

#### Environment Variables

| Environment Variable | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `GITHUB_TOKEN`       | GitHub personal access token. [Read more](#api-limits) |

#### Examples

```sh
ghstats atom atom            # Print download count for all releases.
ghstats atom/atom            # Print download count for all releases (alt. syntax).
ghstats atom atom -q         # Quiet mode (print only numerical result or errors).
ghstats atom atom -d         # Print detailed description for each release.
ghstats atom atom -l         # Print download count for the latest release.
ghstats atom atom -l -q      # Print download count for the latest release (quiet mode).
ghstats atom atom -l -d      # Print detailed description for the latest release.
ghstats atom atom v1.0.0     # Print download count for the the "v1.0.0" release.
ghstats atom atom v1.0.0 -q  # Print download count for the the "v1.0.0" release (quiet mode).
ghstats atom atom v1.0.0 -d  # Print detailed description for the "v1.0.0" release.
ghstats                      # Get repository owner and name from the user input.
ghstats -h                   # Print help message.
```

### Using as a Module

You can use this library in both Node.js and browser environments.
In the latter case, you can use bundlers such as Webpack and Parcel.

#### Installation

```sh
npm i github-release-stats
```

#### Constructor

```ts
GithubStats(repoOwner: string, repoName: string, token?: string)
```

| Parameter   | Description                                            | Required |
| ----------- | ------------------------------------------------------ | -------- |
| `repoOwner` | Repository owner                                       | Yes      |
| `repoName`  | Repository name                                        | Yes      |
| `token`     | GitHub personal access token. [Read more](#api-limits) | No       |

#### Methods

| Method                             | Description                                                               | Returns                    |
| ---------------------------------- | ------------------------------------------------------------------------- | -------------------------- |
| `getAllReleases()`                 | Fetch all releases                                                        | `Promise<GithubRelease[]>` |
| `getLatestRelease()`               | Fetch the latest release                                                  | `Promise<GithubRelease>`   |
| `getRelease(tag: string)`          | Fetch a single release by the specified `tag`                             | `Promise<GithubRelease>`   |
| `getTotalDownloads()`              | Fetch the total number of release downloads for the whole repo            | `Promise<number>`          |
| `getLatestReleaseDownloads()`      | Fetch the number of downloads for the latest release                      | `Promise<number>`          |
| `getReleaseDownloads(tag: string)` | Fetch the number of downloads for a single release by the specified `tag` | `Promise<number>`          |

Example of a `GithubRelease` object:
https://api.github.com/repos/atom/atom/releases/latest

#### Example

```js
// ES Module:
import { GithubStats } from 'github-release-stats';

// CommonJS Module:
const { GithubStats } = require('github-release-stats');
```

```js
const gh = new GithubStats('atom', 'atom');

gh.getTotalDownloads().then(count => {
  console.log('Total downloads: ' + count);
}).catch(error => {
  console.error(error.message);
});
```

## API Limits

By default, GitHub API allows you to make up to 60 requests per hour.
You can increase this limit by specifying your personal access token
which can be created [here](https://github.com/settings/tokens).

- Store your token in the `GITHUB_TOKEN` environment variable
  (works in CLI and Node.js environment)
- Pass your token to the `GithubStats` constructor
  (works in Node.js and browser environments)

## License

**MIT License**

You are free to use, modify, distribute (including commercial purposes)
as long as you credit the original author and include the
[license text](https://raw.githubusercontent.com/kefir500/github-release-stats/master/LICENSE).
