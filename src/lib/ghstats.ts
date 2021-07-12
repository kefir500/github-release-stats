import fetch, { Headers } from 'node-fetch';

/**
 * Class (partially) representing a release object returned from the GitHub API.
 */
interface GithubRelease {
  assets: GithubAsset[],
}

/**
 * Class (partially) representing a release asset object returned from the GitHub API.
 */
interface GithubAsset {
  download_count: number,
}

/**
 * Class representing an error message returned from the GitHub API.
 */
class GithubError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GithubError';
  }
}

/**
 * Class for interacting with the GitHub API.
 */
export class GithubStats {
  /**
   * Repository owner
   */
  private readonly repoOwner: string;

  /**
   * Repository name
   */
  private readonly repoName: string;

  /**
   * GitHub API token
   */
  private readonly token: string;

  /**
   * Create an object for interacting with the GitHub API.
   *
   * @param repoOwner - Repository owner
   * @param repoName - Repository name
   * @param token - GitHub API token
   */
  constructor(repoOwner: string, repoName: string, token: string = '') {
    this.repoOwner = repoOwner;
    this.repoName = repoName;
    if (typeof self === 'undefined') {
      this.token = token || process.env.GITHUB_TOKEN || '';
    } else {
      /* istanbul ignore next */
      this.token = token;
    }
  }

  /**
   * Fetch the list of releases.
   *
   * @returns A promise to the list of releases
   */
  async getAllReleases(): Promise<GithubRelease[]> {
    const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/releases?per_page=100`;
    const response = await this.fetch(url);
    return response;
  }

  /**
   * Fetch a single release.
   *
   * @param tag - The name of the release tag
   * @returns A promise to the release by the `tag`
   */
  async getRelease(tag: string): Promise<GithubRelease> {
    const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/releases/tags/${tag}`;
    const response = await this.fetch(url);
    return response[0];
  }

  /**
   * Fetch the latest release.
   *
   * @returns A promise to the latest release
   */
  async getLatestRelease(): Promise<GithubRelease> {
    const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/releases/latest`;
    const response = await this.fetch(url);
    return response[0];
  }

  /**
   * Fetch the total number of downloads for all releases.
   *
   * @returns A promise to the number of downloads
   */
  async getTotalDownloads(): Promise<number> {
    return (await this.getAllReleases()).reduce((acc, release) => {
      return acc + release.assets.reduce((acc, asset) => {
        return acc + asset.download_count;
      }, 0);
    }, 0);
  }

  /**
   * Fetch the number of downloads for a single release.
   *
   * @param tag - The name of the release tag
   * @returns A promise to the number of downloads
   */
  async getReleaseDownloads(tag: string): Promise<number> {
    const release = await this.getRelease(tag);
    return release.assets.reduce((acc, asset) => acc + asset.download_count, 0);
  }

  /**
   * Fetch the number of downloads for the latest release.
   *
   * @returns A promise to the number of downloads
   */
  async getLatestReleaseDownloads(): Promise<number> {
    const release = await this.getLatestRelease();
    return release.assets.reduce((acc, asset) => acc + asset.download_count, 0);
  }

  /**
   * Fetch data from the GitHub API. Pagination is also supported.
   *
   * @param url - URL to a GitHub API endpoint
   * @returns A promise to the list of releases
   */
  private async fetch(url: string): Promise<GithubRelease[]> {
    const result: GithubRelease[] = [];
    const headers = new Headers();
    if (typeof self === 'undefined') {
      headers.append('User-Agent', 'github-release-stats');
    }
    if (this.token) {
      headers.append('Authorization', `token ${this.token}`);
    }
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      throw new GithubError((await response.json()).message);
    }
    if (response.headers.has('link')) {
      const match = (response.headers.get('link') as string).match(/^.*<(.*)>; rel="next"/);
      if (match) {
        // Fetch next page
        result.push(...await this.fetch(match[1]));
      }
    }
    result.unshift(...[await response.json()].flat());
    return result;
  }
}
