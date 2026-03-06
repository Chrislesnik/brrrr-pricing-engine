/**
 * dscr.ai TypeScript SDK
 *
 * Auto-generated from the OpenAPI specification.
 * Run `pnpm generate` to regenerate after API changes.
 */

export interface DscrClientConfig {
  baseUrl?: string;
  apiKey: string;
}

export class DscrClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: DscrClientConfig) {
    this.baseUrl = config.baseUrl ?? 'https://pricingengine.pro';
    this.apiKey = config.apiKey;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new DscrApiError(response.status, body);
    }

    return response.json() as Promise<T>;
  }

  async listDeals(params?: { status?: string; page?: number; per_page?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    const qs = query.toString();
    return this.request(`/api/deals${qs ? `?${qs}` : ''}`);
  }

  async createDeal(body: { deal_inputs: Array<{ input_id: string; input_type: string; value: string | number | boolean | null }> }) {
    return this.request('/api/deals', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async listLoans(params?: { deal_id?: string; status?: string; page?: number; per_page?: number }) {
    const query = new URLSearchParams();
    if (params?.deal_id) query.set('deal_id', params.deal_id);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    const qs = query.toString();
    return this.request(`/api/loans/list${qs ? `?${qs}` : ''}`);
  }

  async searchBorrowers(params: { q: string }) {
    return this.request(`/api/applicants/borrowers?q=${encodeURIComponent(params.q)}`);
  }

  async searchEntities(params: { q: string }) {
    return this.request(`/api/applicants/entities?q=${encodeURIComponent(params.q)}`);
  }

  async getScenario(id: string) {
    return this.request(`/api/scenarios/${id}`);
  }

  async listPrograms() {
    return this.request('/api/programs');
  }

  async getPipeline() {
    return this.request('/api/pipeline');
  }
}

export class DscrApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API request failed with status ${status}`);
    this.name = 'DscrApiError';
  }
}
