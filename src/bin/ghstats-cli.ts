#!/usr/bin/env node

import readline from 'readline';
import { GithubStats } from '../lib/ghstats';

/**
 * Class representing a command-line interface for fetching GitHub release stats.
 */
export class GithubStatsCli {
  /**
   * Repository owner
   */
  private repoOwner = '';

  /**
   * Repository name
   */
  private repoName = '';

  /**
   * GitHub release tag
   */
  private releaseTag = '';

  /**
   * If `true`, `run()` prints detailed statistics for each release
   *
   * @see {@link run|`run`}
   */
  private detailed = false;

  /**
   * If `true`, `run()` fetches statistics only for the latest release
   *
   * @see {@link run|`run`}
   */
  private latest = false;

  /**
   * If `true`, `run()` prints only resulting numbers and errors
   *
   * @see {@link run|`run`}
   */
  private quiet = false;

  /**
   * Create an object representing a command-line interface
   * for fetching the GitHub release stats.
   *
   * @param args - Arguments passed to the script without the first two elements.
   */
  constructor(args: string[]) {
    args.forEach((arg) => {
      if (['-h', '--help', '-?'].includes(arg)) {
        GithubStatsCli.printHelp();
      } else if (['-d', '--detailed'].includes(arg)) {
        this.detailed = true;
      } else if (['-l', '--latest'].includes(arg)) {
        this.latest = true;
      } else if (['-q', '--quiet'].includes(arg)) {
        this.quiet = true;
      } else if (!this.repoOwner) {
        [this.repoOwner, this.repoName] = arg.split('/');
      } else if (!this.repoName) {
        this.repoName = arg;
      } else if (!this.releaseTag) {
        this.releaseTag = arg;
      }
    });
  }

  /**
   * Print GitHub release details.
   *
   * @param release - Release object fetched from the GitHub API
   */
  static printRelease(release: any): void {
    if (release.name) {
      console.info(`Name: ${release.name}`);
    }
    console.info(`Tag: ${release.tag_name}`);
    console.info(`URL: ${release.url}`);
    console.info(`Published at: ${release.published_at}`);
    console.info('Assets:');
    let total = 0;
    release.assets.forEach((asset: any) => {
      total += asset.download_count;
      console.info(`  ${asset.name} - ${asset.download_count} download(s)`);
    });
    console.info(`    ${total} total downloads`);
  }

  /**
   * Print help message and exit.
   */
  static printHelp(): void {
    console.info(
      'GitHub Release Stats\n'
      + '\nUsage:\n'
      + '  ghstats [owner] [repo] [tag] [options]\n'
      + '  ghstats [owner/repo] [tag] [options]\n'
      + '\nArguments:\n'
      + '  owner         Repository owner. If not present, you will be\n'
      + '                prompted for the input.\n'
      + '  repo          Repository name. If not present, you will be\n'
      + '                prompted for the input.\n'
      + '  tag           Release tag name. If not present, prints the\n'
      + '                total number of downloads.\n'
      + '\nOptions:\n'
      + '  -d, --detail  Print detailed statistics for each release.\n'
      + '  -q, --quiet   Print only resulting numbers and errors (quiet mode).\n'
      + '  -l, --latest  Print statistics for the latest release\n'
      + '  -h, --help    Print help message.\n'
      + '\nEnvironment variables:\n'
      + '  GITHUB_TOKEN  GitHub personal access token to increase API limits.'
    );
    process.exit(0);
  }

  /**
   * Print `error` details.
   *
   * @param error - Error object
   */
  static printError(error: Error): void {
    console.error(`${error.name}: ${error.message}`);
  }

  /**
   * Fetch and print GitHub release download statistics.
   */
  async run(): Promise<void> {
    this.printMessage('GitHub Release Stats');
    if (!this.repoOwner || !this.repoName) {
      await this.getUserInput();
    }
    if (this.releaseTag && this.latest) {
      console.error('Error: You must specify either the "tag" or "latest" option, not both.');
      process.exitCode = 1;
    } else if (this.detailed && this.quiet) {
      console.error('Error: You must specify either the "detailed" or "quiet" option, not both.');
      process.exitCode = 1;
    } else {
      const gh = new GithubStats(this.repoOwner, this.repoName);
      if (this.detailed) {
        if (this.latest) {
          this.printMessage(`Fetching ${this.repoOwner}/${this.repoName} latest release stats...\n`);
          gh.getLatestRelease()
            .then(GithubStatsCli.printRelease)
            .catch(GithubStatsCli.printError);
        } else if (this.releaseTag) {
          this.printMessage(`Fetching ${this.repoOwner}/${this.repoName} ${this.releaseTag} stats...\n`);
          gh.getRelease(this.releaseTag)
            .then(GithubStatsCli.printRelease)
            .catch(GithubStatsCli.printError);
        } else {
          this.printMessage(`Fetching ${this.repoOwner}/${this.repoName} stats...\n`);
          gh.getAllReleases().then((releases) => {
            let total = 0;
            releases.forEach((release) => {
              GithubStatsCli.printRelease(release);
              console.info();
              total += release.assets.reduce((acc, asset) => acc + asset.download_count, 0);
            });
            console.info(`${total} total downloads`);
          }).catch(GithubStatsCli.printError);
        }
      } else if (this.latest) {
        this.printMessage(`Fetching ${this.repoOwner}/${this.repoName} latest release download count...`);
        gh.getLatestReleaseDownloads().then(console.info).catch(GithubStatsCli.printError);
      } else if (this.releaseTag) {
        this.printMessage(`Fetching ${this.repoOwner}/${this.repoName} ${this.releaseTag} download count...`);
        gh.getReleaseDownloads(this.releaseTag).then(console.info).catch(GithubStatsCli.printError);
      } else {
        this.printMessage(`Fetching ${this.repoOwner}/${this.repoName} download count...`);
        gh.getTotalDownloads().then(console.info).catch(GithubStatsCli.printError);
      }
    }
  }

  /**
   * Get user input for `repoOwner` and `repoName` if these fields are empty.
   *
   * @see {@link repoOwner|`repoOwner`}
   * @see {@link repoName|`repoName`}
   */
  private async getUserInput(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    if (!this.repoOwner) {
      this.repoOwner = await new Promise<string>((resolve) => {
        rl.question('Enter the GitHub repository owner: ', resolve);
      });
    }
    if (!this.repoName) {
      this.repoName = await new Promise<string>((resolve) => {
        rl.question('Enter the GitHub repository name: ', resolve);
      });
    }
    rl.close();
  }

  /**
   * Print a `message` (or do nothing in the quiet node).
   *
   * @param message - Message text
   * @see {@link quiet|`quiet`}
   */
  private printMessage(message: string): void {
    if (!this.quiet) {
      console.info(message);
    }
  }
}

const cli = new GithubStatsCli(process.argv.slice(2));
cli.run();
