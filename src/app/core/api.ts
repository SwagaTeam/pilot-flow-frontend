import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DemoExamples, readDemo } from './demo';
import { Issue, Problem } from './models';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 0,
    readonly issues: Issue[] = [],
    readonly code = '',
    readonly traceId = '',
  ) {
    super(message);
  }
}
export interface ApiResult<T> {
  data: T;
  etag: string | null;
}

@Injectable({ providedIn: 'root' })
export class PilotApi {
  private readonly http = inject(HttpClient);
  readonly mode = signal<'demo' | 'live'>('demo');
  private token = '';
  private examples?: Promise<DemoExamples>;

  connect(token: string): void {
    this.token = token.trim().replace(/^Bearer\s+/i, '');
    this.mode.set('live');
  }
  useDemo(): void {
    this.token = '';
    this.mode.set('demo');
  }
  private headers(etag?: string): HttpHeaders {
    let headers = new HttpHeaders();
    if (this.token) headers = headers.set('Authorization', `Bearer ${this.token}`);
    if (etag) headers = headers.set('If-Match', etag);
    return headers;
  }

  async get<T>(path: string): Promise<ApiResult<T>> {
    if (this.mode() === 'demo') {
      this.examples ??= firstValueFrom(this.http.get<DemoExamples>('/demo-responses.json')).catch(
        (error: unknown) => {
          this.examples = undefined;
          throw error;
        },
      );
      const data = readDemo(await this.examples, path) as T;
      return { data, etag: null };
    }
    try {
      const response = await firstValueFrom(
        this.http.get<T>(`/api/v1${path}`, { headers: this.headers(), observe: 'response' }),
      );
      return { data: response.body as T, etag: response.headers.get('ETag') };
    } catch (error) {
      throw this.error(error);
    }
  }

  async write<T>(
    method: 'POST' | 'PUT' | 'DELETE',
    path: string,
    body: unknown,
    etag?: string,
  ): Promise<ApiResult<T>> {
    if (this.mode() === 'demo') {
      throw new ApiError(
        'Учебные данные доступны только для просмотра. Подключите API, чтобы сохранять изменения.',
      );
    }
    if (path.includes('/versions/') && !etag) {
      throw new ApiError('Не получена версия данных. Обновите анализ перед сохранением.');
    }
    try {
      const response = await firstValueFrom(
        this.http.request<T>(method, `/api/v1${path}`, {
          body,
          headers: this.headers(etag),
          observe: 'response',
        }),
      );
      return { data: response.body as T, etag: response.headers.get('ETag') };
    } catch (error) {
      throw this.error(error);
    }
  }

  async download(path: string, filename: string): Promise<void> {
    if (this.mode() === 'demo') {
      throw new ApiError('PDF формирует бэкенд. Подключите API для выгрузки.');
    }
    try {
      const blob = await firstValueFrom(
        this.http.get(`/api/v1${path}`, { headers: this.headers(), responseType: 'blob' }),
      );
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename;
      downloadLink.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      throw this.error(error);
    }
  }

  private error(error: unknown): ApiError {
    if (!(error instanceof HttpErrorResponse)) {
      return new ApiError(error instanceof Error ? error.message : 'Не удалось выполнить запрос.');
    }
    const problem = error.error as Partial<Problem> | null;
    return new ApiError(
      this.errorMessage(error.status, problem?.detail),
      error.status,
      problem?.issues ?? [],
      problem?.code ?? '',
      problem?.traceId ?? '',
    );
  }

  private errorMessage(status: number, detail?: string): string {
    switch (status) {
      case 412:
        return 'Данные изменились в другой сессии. Ваши поля сохранены на экране. Скопируйте изменения и перечитайте анализ перед повторным сохранением.';
      case 401:
        return 'Сессия не авторизована. Укажите действующий Bearer JWT в подключении.';
      case 0:
      case 502:
      case 504:
        return 'API недоступен. Проверьте запуск бэкенда и адрес в proxy.conf.json.';
      default:
        return detail || 'Запрос не выполнен. Попробуйте ещё раз.';
    }
  }
}
