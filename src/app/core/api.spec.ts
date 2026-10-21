import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PilotApi, ApiError } from './api';

describe('Pilot API transport', () => {
  let api: PilotApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(PilotApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('sends authentication and the captured revision without converting decimal strings', async () => {
    api.connect('Bearer local-test-token');
    const body = { revenue: '999999999999999999.123456', rawMaterialCost: null };
    const request = api.write('PUT', '/analyses/a/versions/v/products/p', body, '"v:v:r:7"');
    const pending = http.expectOne('/api/v1/analyses/a/versions/v/products/p');
    expect(pending.request.headers.get('Authorization')).toBe('Bearer local-test-token');
    expect(pending.request.headers.get('If-Match')).toBe('"v:v:r:7"');
    expect(pending.request.body).toEqual(body);
    pending.flush(body, { headers: { ETag: '"v:v:r:8"' } });
    expect(await request).toEqual({ data: body, etag: '"v:v:r:8"' });
  });
  it('does not retry a stale mutation and preserves the server issues', async () => {
    api.connect('test');
    const request = api.write('PUT', '/analyses/a/versions/v', {}, '"v:v:r:1"');
    const result = expect(request).rejects.toMatchObject({
      status: 412,
      code: 'REVISION_CONFLICT',
      traceId: 'trace-test',
    });
    http
      .expectOne('/api/v1/analyses/a/versions/v')
      .flush(
        { code: 'REVISION_CONFLICT', traceId: 'trace-test', issues: [] },
        { status: 412, statusText: 'Precondition Failed' },
      );
    await result;
    http.expectNone('/api/v1/analyses/a/versions/v');
  });
  it('refuses writes before a version ETag has been read', async () => {
    api.connect('test');
    await expect(api.write('PUT', '/analyses/a/versions/v', {})).rejects.toBeInstanceOf(ApiError);
    http.expectNone('/api/v1/analyses/a/versions/v');
  });
  it('does not pretend to save or export in demo mode', async () => {
    await expect(api.write('POST', '/analyses', {})).rejects.toThrow('Учебные данные');
    await expect(api.download('/analyses/a/versions/v/export', 'test.pdf')).rejects.toThrow(
      'PDF формирует бэкенд',
    );
    http.expectNone('/api/v1/analyses');
  });
  it('keeps API failures visible instead of replacing them with demo responses', async () => {
    api.connect('expired');
    const request = api.get('/me');
    const result = expect(request).rejects.toMatchObject({ status: 401 });
    http.expectOne('/api/v1/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    await result;
    expect(api.mode()).toBe('live');
    http.expectNone('/demo-responses.json');
  });
});
