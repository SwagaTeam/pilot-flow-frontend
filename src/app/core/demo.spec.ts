import examples from '../../../public/demo-responses.json';
import { readDemo } from './demo';
import { Product, Route, MetricsInput } from './models';
const base =
  '/analyses/00000000-0000-4000-8000-000000000001/versions/00000000-0000-4000-8000-000000000011';
describe('Read-only contract fixtures', () => {
  it('loads the requested product and its route instead of always returning the first example', () => {
    const id = '00000000-0000-4000-8000-000000000026';
    expect(
      (readDemo(examples, `${base}/products/${id}`) as Product).data.calendarDurationDays,
    ).toBe('36');
    expect((readDemo(examples, `${base}/products/${id}/route`) as Route).steps).toHaveLength(6);
  });
  it('preserves unknown metrics in the control example', () => {
    const result = readDemo(
      examples,
      `${base}/families/00000000-0000-4000-8000-000000000034/metrics`,
    ) as MetricsInput;
    expect(result.laborHoursPerUnit).toBeNull();
  });
  it('rejects a foreign analysis rather than displaying unrelated fixture data', () => {
    expect(() => readDemo(examples, '/analyses/not-the-demo-analysis')).toThrow('Анализ не найден');
  });
  it('does not mutate the original examples when a form is edited', () => {
    const path = `${base}/products/00000000-0000-4000-8000-000000000021`;
    const product = readDemo(examples, path) as Product;
    product.data.revenue = '0';
    expect((readDemo(examples, path) as Product).data.revenue).toBe('90000000');
  });
});
