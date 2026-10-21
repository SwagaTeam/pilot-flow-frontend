import { Snapshot, AssignmentOptions } from './models';

export type DemoExamples = Record<string, unknown>;
const versionPrefix = '/analyses/{analysisId}/versions/{versionId}';

/** Read-only contract examples. This adapter never calculates business results. */
export function readDemo(examples: DemoExamples, path: string): unknown {
  const url = new URL(path, 'http://demo');
  const snapshot = (examples[`${versionPrefix}/protocol-preview`] as { snapshot: Snapshot })
    .snapshot;
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] === 'analyses' && parts[1] && parts[1] !== snapshot.version.analysisId)
    throw new Error('Анализ не найден в учебном примере.');
  if (parts[2] === 'versions' && parts[3] && parts[3] !== snapshot.version.id)
    throw new Error('Версия не найдена в учебном примере.');
  const template = Object.keys(examples).find((key) =>
    new RegExp(`^${key.replace(/\{\w+\}/g, '[^/]+')}$`).test(url.pathname),
  );
  if (!template) throw new Error('В учебном режиме этот ресурс недоступен.');
  let value = structuredClone(examples[template]);
  const id = parts[5];
  if (parts[4] === 'products' && id) {
    const product = snapshot.products.find((p) => p.id === id);
    if (!product) throw new Error('Продукция не найдена.');
    const route = snapshot.productRoutes.find((p) => p.productId === id)?.route;
    if (parts[6] === 'route') value = route;
    else if (parts[6] === 'assignment-options') {
      // For products other than the documented assignment example, show explicitly
      // unknown options instead of inventing a compatibility result.
      const options = value as AssignmentOptions;
      value =
        product.id === options.productId
          ? options
          : {
              ...options,
              productId: id,
              options: options.options.map((option) => ({
                ...option,
                canAssign: false,
                routeMatches: false,
                issues: [
                  {
                    code: 'DEMO_OPTION_UNAVAILABLE',
                    severity: 'info',
                    path: '/assignment-options',
                    message: 'Проверка этой позиции доступна при подключении API.',
                    suggestion: '',
                    entityId: id,
                  },
                ],
              })),
            };
    } else value = product;
  }
  if (parts[4] === 'families' && id)
    value =
      parts[6] === 'metrics'
        ? snapshot.metrics.find((m) => m.familyId === id)?.data
        : snapshot.families.find((f) => f.id === id);
  if (parts[4] === 'operations' && id) value = snapshot.operations.find((o) => o.id === id);
  if (!value) throw new Error('Данные не найдены в учебном примере.');
  if (typeof value === 'object' && 'items' in value) {
    const page = value as {
      items: Array<{
        data?: { name?: string; productCode?: string | null };
        completeness?: string;
      }>;
    };
    const q = (url.searchParams.get('q') ?? '').toLocaleLowerCase('ru');
    const completeness = url.searchParams.get('completeness') ?? 'all';
    const all = page.items;
    const filtered = all.filter(
      (item) =>
        `${item.data?.name ?? ''} ${item.data?.productCode ?? ''}`
          .toLocaleLowerCase('ru')
          .includes(q) &&
        (completeness === 'all' || item.completeness === completeness),
    );
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? 1000);
    value = {
      items: filtered.slice(offset, offset + limit),
      total: filtered.length,
      unfilteredTotal: all.length,
      offset,
      limit,
    };
  }
  return structuredClone(value);
}
