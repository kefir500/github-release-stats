import fetchMock, { enableFetchMocks, MockParams } from 'jest-fetch-mock';
enableFetchMocks();

import { GithubStats } from './ghstats';

class FakeApi {
  getAllReleases(): string {
    return JSON.stringify(this.releases);
  }

  getLatestRelease(): string {
    return JSON.stringify(this.releases[this.releases.length - 1]);
  }

  getTaggedRelease(tag: string): string {
    return JSON.stringify(this.releases.find((release) => release.tag_name === tag));
  }

  getEmptyResponse() {
    return JSON.stringify([]);
  }

  getPaginatedReleases(perPage: number = 3): [string, MockParams][] {
    const responses: [string, MockParams][] = [];
    const lastPage = Math.ceil(this.releases.length / perPage);
    for (let page = 1; page <= lastPage; ++page) {
      let linkHeader = '';
      if (page >= 2) {
        linkHeader += `<https://api.github.com/repositories/1/releases?page=${page - 1}>; rel="prev", `;
      }
      if (page < lastPage) {
        linkHeader += `<https://api.github.com/repositories/1/releases?page=${page + 1}>; rel="next", `;
        linkHeader += `<https://api.github.com/repositories/1/releases?page=${lastPage}>; rel="last", `;
      }
      if (page >= 2) {
        linkHeader += '<https://api.github.com/repositories/1/releases?page=1>; rel="first", ';
      }
      linkHeader = linkHeader.slice(0, -2);
      const offset = (page - 1) * perPage;
      responses.push([
        JSON.stringify(this.releases.slice(offset, offset + perPage)),
        {
          headers: {
            link: linkHeader,
          },
        },
      ]);
    }
    return responses;
  }

  private releases = [
    {
      tag_name: 'v1.2.0',
      assets: [
        { download_count: 120 },
        { download_count: 220 },
      ],
    },
    {
      tag_name: 'v1.1.2',
      assets: [
        { download_count: 112 },
        { download_count: 212 },
      ],
    },
    {
      tag_name: 'v1.1.1',
      assets: [
        { download_count: 111 },
        { download_count: 211 },
      ],
    },
    {
      tag_name: 'v1.1.0',
      assets: [
        { download_count: 110 },
        { download_count: 210 },
      ],
    },
    {
      tag_name: 'v1.0.2',
      assets: [
        { download_count: 102 },
        { download_count: 202 },
      ],
    },
    {
      tag_name: 'v1.0.1',
      assets: [
        { download_count: 101 },
        { download_count: 201 },
      ],
    },
    {
      tag_name: 'v1.0.0',
      assets: [
        { download_count: 100 },
        { download_count: 200 },
      ],
    },
  ];
}

let api: FakeApi;

const requestParams = {
  method: 'GET',
  headers: new Headers({ 'User-Agent': 'github-release-stats' }),
};

beforeEach(() => {
  api = new FakeApi();
  fetchMock.resetMocks();
});

describe('GithubStats class', () => {
  it('fetches the latest release', async () => {
    const release = api.getLatestRelease();
    fetchMock.mockResponseOnce(release);
    const gh = new GithubStats('foo', 'bar');
    const result = await gh.getLatestRelease();
    expect(result).toEqual(JSON.parse(release));
    expect(fetchMock.mock.calls[0][0]).toEqual('https://api.github.com/repos/foo/bar/releases/latest');
    expect(fetchMock.mock.calls[0][1]).toEqual(requestParams);
  });

  it('fetches the tagged release', async () => {
    const tag = 'v1.1.0';
    const release = api.getTaggedRelease(tag);
    fetchMock.mockResponseOnce(release);
    const gh = new GithubStats('foo', 'bar');
    const result = await gh.getRelease(tag);
    expect(result).toEqual(JSON.parse(release));
    expect(fetchMock.mock.calls[0][0]).toEqual(`https://api.github.com/repos/foo/bar/releases/tags/${tag}`);
    expect(fetchMock.mock.calls[0][1]).toEqual(requestParams);
  });

  it('fetches all releases', async () => {
    const releases = api.getAllReleases();
    fetchMock.mockResponseOnce(releases);
    const gh = new GithubStats('foo', 'bar');
    const result = await gh.getAllReleases();
    expect(result).toEqual(JSON.parse(releases));
    expect(fetchMock.mock.calls[0][0]).toEqual('https://api.github.com/repos/foo/bar/releases?per_page=100');
    expect(fetchMock.mock.calls[0][1]).toEqual(requestParams);
  });

  it('fetches releases with pagination', async () => {
    fetchMock.mockResponses(...api.getPaginatedReleases());
    const gh = new GithubStats('foo', 'bar');
    const result = await gh.getAllReleases();
    const releases = api.getAllReleases();
    expect(result).toEqual(JSON.parse(releases));
    expect(fetchMock.mock.calls.length).toEqual(3);
    expect(fetchMock.mock.calls[0][0]).toEqual('https://api.github.com/repos/foo/bar/releases?per_page=100');
    expect(fetchMock.mock.calls[1][0]).toEqual('https://api.github.com/repositories/1/releases?page=2');
    expect(fetchMock.mock.calls[2][0]).toEqual('https://api.github.com/repositories/1/releases?page=3');
    expect(fetchMock.mock.calls[0][1]).toEqual(requestParams);
    expect(fetchMock.mock.calls[1][1]).toEqual(requestParams);
    expect(fetchMock.mock.calls[2][1]).toEqual(requestParams);
  });

  it('counts downloads for the latest release', async () => {
    fetchMock.mockResponseOnce(api.getAllReleases());
    const gh = new GithubStats('foo', 'bar');
    const result = await gh.getLatestReleaseDownloads();
    expect(result).toBe(340);
    expect(fetchMock.mock.calls[0][0]).toEqual('https://api.github.com/repos/foo/bar/releases/latest');
    expect(fetchMock.mock.calls[0][1]).toEqual(requestParams);
  });

  it('counts downloads for the tagged release', async () => {
    const tag = 'v1.1.0';
    fetchMock.mockResponseOnce(api.getTaggedRelease(tag));
    const gh = new GithubStats('foo', 'bar');
    const result = await gh.getReleaseDownloads(tag);
    expect(result).toBe(320);
    expect(fetchMock.mock.calls[0][0]).toEqual(`https://api.github.com/repos/foo/bar/releases/tags/${tag}`);
    expect(fetchMock.mock.calls[0][1]).toEqual(requestParams);
  });

  it('counts downloads for all releases', async () => {
    fetchMock.mockResponseOnce(api.getAllReleases());
    const gh = new GithubStats('foo', 'bar');
    const result = await gh.getTotalDownloads();
    expect(result).toBe(2212);
    expect(fetchMock.mock.calls[0][0]).toEqual('https://api.github.com/repos/foo/bar/releases?per_page=100');
    expect(fetchMock.mock.calls[0][1]).toEqual(requestParams);
  });

  it('counts downloads with pagination', async () => {
    fetchMock.mockResponses(...api.getPaginatedReleases());
    const gh = new GithubStats('foo', 'bar');
    const result = await gh.getTotalDownloads();
    expect(result).toEqual(2212);
    expect(fetchMock.mock.calls.length).toEqual(3);
    expect(fetchMock.mock.calls[0][0]).toEqual('https://api.github.com/repos/foo/bar/releases?per_page=100');
    expect(fetchMock.mock.calls[1][0]).toEqual('https://api.github.com/repositories/1/releases?page=2');
    expect(fetchMock.mock.calls[2][0]).toEqual('https://api.github.com/repositories/1/releases?page=3');
    expect(fetchMock.mock.calls[0][1]).toEqual(requestParams);
    expect(fetchMock.mock.calls[1][1]).toEqual(requestParams);
    expect(fetchMock.mock.calls[2][1]).toEqual(requestParams);
  });

  it('gets token from the parameter', async () => {
    fetchMock.mockResponseOnce(api.getEmptyResponse());
    const token = 'secret';
    const gh = new GithubStats('foo', 'bar', token);
    await gh.getAllReleases();
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: 'GET',
      headers: new Headers({
        Authorization: `token ${token}`,
        'User-Agent': 'github-release-stats',
      }),
    });
  });

  it('gets token from the environment variable', async () => {
    const token = 'secret';
    const originalEnv = process.env;
    process.env.GITHUB_TOKEN = token;
    fetchMock.mockResponseOnce(api.getEmptyResponse());
    const gh = new GithubStats('foo', 'bar');
    await gh.getAllReleases();
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: 'GET',
      headers: new Headers({
        Authorization: `token ${token}`,
        'User-Agent': 'github-release-stats',
      }),
    });
    process.env = originalEnv;
  });

  it('fails on GitHub API error', (): Promise<void> => {
    fetchMock.mockResponseOnce(JSON.stringify({ message: 'Not Found' }), { status: 404 });
    const gh = new GithubStats('foo', 'bar');
    return expect(() => gh.getAllReleases()).rejects.toThrow(/^Not Found$/);
  });

  it('fails on network error', (): Promise<void> => {
    const error = new Error('Network error');
    fetchMock.mockRejectOnce(error);
    const gh = new GithubStats('foo', 'bar');
    return expect(() => gh.getAllReleases()).rejects.toThrow(error);
  });
});
