import { TestBed } from '@angular/core/testing';
import examples from '../../../public/demo-responses.json';
import { AnalysisReader } from './analysis-reader';
import { ApiError, PilotApi } from './api';
import { readDemo } from './demo';

const versionPath =
  '/analyses/00000000-0000-4000-8000-000000000001/versions/00000000-0000-4000-8000-000000000011';
const revision = '"v:00000000-0000-4000-8000-000000000011:r:1"';

describe('Consistent analysis loading', () => {
  function configureApi(get: (path: string) => Promise<unknown>): AnalysisReader {
    TestBed.configureTestingModule({ providers: [{ provide: PilotApi, useValue: { get } }] });
    return TestBed.inject(AnalysisReader);
  }

  it('rejects a selection read from a different revision than its products', async () => {
    const reader = configureApi(async (path) => ({
      data: readDemo(examples, path),
      etag: path.endsWith('/selection') ? '"v:changed:r:2"' : revision,
    }));
    await expect(reader.load(versionPath)).rejects.toMatchObject({ status: 412 });
  });

  it('allows an initial draft with no selection or protocol', async () => {
    const reader = configureApi(async (path) => {
      if (path.endsWith('/selection') || path.endsWith('/protocol')) {
        throw new ApiError('Not found', 404);
      }
      return { data: readDemo(examples, path), etag: revision };
    });
    const data = await reader.load(versionPath);
    expect(data.selection).toBeNull();
    expect(data.protocol).toBeNull();
    expect(data.products).toHaveLength(6);
  });

  it('does not treat an authorization failure as an empty protocol', async () => {
    const reader = configureApi(async (path) => {
      if (path.endsWith('/protocol')) throw new ApiError('Unauthorized', 401);
      return { data: readDemo(examples, path), etag: revision };
    });
    await expect(reader.load(versionPath)).rejects.toMatchObject({ status: 401 });
  });
});
