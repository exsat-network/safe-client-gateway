import { FakeConfigurationService } from '@/config/__tests__/fake.configuration.service';
import type { CacheFirstDataSource } from '@/datasources/cache/cache.first.data.source';
import type { ICacheService } from '@/datasources/cache/cache.service.interface';
import { CacheDir } from '@/datasources/cache/entities/cache-dir.entity';
import { ConfigApi } from '@/datasources/config-api/config-api.service';
import type { HttpErrorFactory } from '@/datasources/errors/http-error-factory';
import { chainBuilder } from '@/domain/chains/entities/__tests__/chain.builder';
import { DataSourceError } from '@/domain/errors/data-source.error';
import { safeAppBuilder } from '@/domain/safe-apps/entities/__tests__/safe-app.builder';
import type { ILoggingService } from '@/logging/logging.interface';
import { rawify } from '@/validation/entities/raw.entity';
import { faker } from '@faker-js/faker';

const dataSource = {
  get: jest.fn(),
} as jest.MockedObjectDeep<CacheFirstDataSource>;
const mockDataSource = jest.mocked(dataSource);

const cacheService = {
  deleteByKey: jest.fn(),
  hSet: jest.fn(),
} as jest.MockedObjectDeep<ICacheService>;
const mockCacheService = jest.mocked(cacheService);

const httpErrorFactory = {
  from: jest.fn(),
} as jest.MockedObjectDeep<HttpErrorFactory>;
const mockHttpErrorFactory = jest.mocked(httpErrorFactory);

const mockLoggingService = {
  info: jest.fn(),
} as jest.MockedObjectDeep<ILoggingService>;

describe('ConfigApi', () => {
  const baseUri = faker.internet.url({ appendSlash: false });
  const expirationTimeInSeconds = faker.number.int();
  const notFoundExpirationTimeInSeconds = faker.number.int();
  let fakeConfigurationService: FakeConfigurationService;
  let service: ConfigApi;

  beforeAll(() => {
    fakeConfigurationService = new FakeConfigurationService();
    fakeConfigurationService.set('safeConfig.baseUri', baseUri);
    fakeConfigurationService.set(
      'expirationTimeInSeconds.default',
      expirationTimeInSeconds,
    );
    fakeConfigurationService.set(
      'expirationTimeInSeconds.notFound.default',
      notFoundExpirationTimeInSeconds,
    );
    fakeConfigurationService.set('features.configHooksDebugLogs', false);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ConfigApi(
      dataSource,
      mockCacheService,
      fakeConfigurationService,
      mockHttpErrorFactory,
      mockLoggingService,
    );
  });

  it('should error if configuration is not defined', () => {
    const fakeConfigurationService = new FakeConfigurationService();

    expect(
      () =>
        new ConfigApi(
          dataSource,
          mockCacheService,
          fakeConfigurationService,
          mockHttpErrorFactory,
          mockLoggingService,
        ),
    ).toThrow();
  });

  it('should return the chains retrieved', async () => {
    const data = [chainBuilder().build(), chainBuilder().build()];
    mockDataSource.get.mockResolvedValue(rawify(data));

    const actual = await service.getChains({});

    expect(actual).toBe(data);
    expect(mockDataSource.get).toHaveBeenCalledTimes(1);
    expect(mockDataSource.get).toHaveBeenCalledWith({
      cacheDir: new CacheDir('chains', 'undefined_undefined'),
      url: `${baseUri}/api/v1/chains`,
      notFoundExpireTimeSeconds: notFoundExpirationTimeInSeconds,
      networkRequest: { params: { limit: undefined, offset: undefined } },
      expireTimeSeconds: expirationTimeInSeconds,
    });
    expect(mockHttpErrorFactory.from).toHaveBeenCalledTimes(0);
  });

  it('should return the chain retrieved', async () => {
    const data = chainBuilder().build();
    mockDataSource.get.mockResolvedValue(rawify(data));

    const actual = await service.getChain(data.chainId);

    expect(actual).toBe(data);
    expect(mockDataSource.get).toHaveBeenCalledTimes(1);
    expect(mockDataSource.get).toHaveBeenCalledWith({
      cacheDir: new CacheDir(`${data.chainId}_chain`, ''),
      url: `${baseUri}/api/v1/chains/${data.chainId}`,
      notFoundExpireTimeSeconds: notFoundExpirationTimeInSeconds,
      expireTimeSeconds: expirationTimeInSeconds,
    });
    expect(mockHttpErrorFactory.from).toHaveBeenCalledTimes(0);
  });

  it('should return the safe apps retrieved by chainId', async () => {
    const chainId = faker.string.numeric();
    const data = [safeAppBuilder().build(), safeAppBuilder().build()];
    mockDataSource.get.mockResolvedValue(rawify(data));

    const actual = await service.getSafeApps({ chainId });

    expect(actual).toBe(data);
    expect(mockDataSource.get).toHaveBeenCalledTimes(1);
    expect(mockDataSource.get).toHaveBeenCalledWith({
      cacheDir: new CacheDir(
        `${chainId}_safe_apps`,
        'undefined_undefined_undefined',
      ),
      url: `${baseUri}/api/v1/safe-apps/`,
      notFoundExpireTimeSeconds: notFoundExpirationTimeInSeconds,
      networkRequest: {
        params: { chainId, clientUrl: undefined, url: undefined },
      },
      expireTimeSeconds: expirationTimeInSeconds,
    });
    expect(mockHttpErrorFactory.from).toHaveBeenCalledTimes(0);
  });

  it('should return the safe apps retrieved by chainId and url', async () => {
    const chainId = faker.string.numeric();
    const url = faker.internet.url({ appendSlash: false });
    const data = [safeAppBuilder().build(), safeAppBuilder().build()];
    mockDataSource.get.mockResolvedValue(rawify(data));

    const actual = await service.getSafeApps({ chainId, url });

    expect(actual).toBe(data);
    expect(mockDataSource.get).toHaveBeenCalledTimes(1);
    expect(mockDataSource.get).toHaveBeenCalledWith({
      cacheDir: new CacheDir(
        `${chainId}_safe_apps`,
        `undefined_undefined_${url}`,
      ),
      url: `${baseUri}/api/v1/safe-apps/`,
      notFoundExpireTimeSeconds: notFoundExpirationTimeInSeconds,
      networkRequest: { params: { chainId, clientUrl: undefined, url } },
      expireTimeSeconds: expirationTimeInSeconds,
    });
    expect(mockHttpErrorFactory.from).toHaveBeenCalledTimes(0);
  });

  it('should return the safe apps retrieved by chainId and clientUrl', async () => {
    const chainId = faker.string.numeric();
    const clientUrl = faker.internet.url({ appendSlash: false });
    const data = [safeAppBuilder().build(), safeAppBuilder().build()];
    mockDataSource.get.mockResolvedValue(rawify(data));

    const actual = await service.getSafeApps({ chainId, clientUrl });

    expect(actual).toBe(data);
    expect(mockDataSource.get).toHaveBeenCalledTimes(1);
    expect(mockDataSource.get).toHaveBeenCalledWith({
      cacheDir: new CacheDir(
        `${chainId}_safe_apps`,
        `${clientUrl}_undefined_undefined`,
      ),
      url: `${baseUri}/api/v1/safe-apps/`,
      notFoundExpireTimeSeconds: notFoundExpirationTimeInSeconds,
      networkRequest: { params: { chainId, clientUrl, url: undefined } },
      expireTimeSeconds: expirationTimeInSeconds,
    });
    expect(mockHttpErrorFactory.from).toHaveBeenCalledTimes(0);
  });

  it('should return the safe apps retrieved by chainId, clientUrl and onlyListed', async () => {
    const chainId = faker.string.numeric();
    const clientUrl = faker.internet.url({ appendSlash: false });
    const onlyListed = faker.datatype.boolean();
    const data = [safeAppBuilder().build(), safeAppBuilder().build()];
    mockDataSource.get.mockResolvedValue(rawify(data));

    const actual = await service.getSafeApps({
      chainId,
      clientUrl,
      onlyListed,
    });

    expect(actual).toBe(data);
    expect(mockDataSource.get).toHaveBeenCalledTimes(1);
    expect(mockDataSource.get).toHaveBeenCalledWith({
      cacheDir: new CacheDir(
        `${chainId}_safe_apps`,
        `${clientUrl}_${onlyListed}_undefined`,
      ),
      url: `${baseUri}/api/v1/safe-apps/`,
      notFoundExpireTimeSeconds: notFoundExpirationTimeInSeconds,
      networkRequest: {
        params: { chainId, clientUrl, onlyListed, url: undefined },
      },
      expireTimeSeconds: expirationTimeInSeconds,
    });
    expect(mockHttpErrorFactory.from).toHaveBeenCalledTimes(0);
  });

  it('should forward error', async () => {
    const expected = new DataSourceError('some unexpected error');
    mockHttpErrorFactory.from.mockReturnValue(expected);
    mockDataSource.get.mockRejectedValueOnce(new Error('Some error'));

    await expect(service.getChains({})).rejects.toThrow(expected);

    expect(mockDataSource.get).toHaveBeenCalledTimes(1);
    expect(mockHttpErrorFactory.from).toHaveBeenCalledTimes(1);
  });

  describe('Cache-clearing tests', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('clear safe apps for a given chain should trigger delete on cache service', async () => {
      const chainId = faker.string.numeric();
      await service.clearSafeApps(chainId);

      expect(mockCacheService.deleteByKey).toHaveBeenCalledTimes(1);
      expect(mockCacheService.deleteByKey).toHaveBeenCalledWith(
        `${chainId}_safe_apps`,
      );
    });
  });
});
