const BASE_URL = "https://api.folk.app";
const API_VERSION = "2025-06-09";

export class FolkClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    params?: Record<string, string>
  ): Promise<unknown> {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "X-API-Version": API_VERSION,
      "Content-Type": "application/json",
    };

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Folk API error ${response.status}: ${errorBody}`
      );
    }

    if (response.status === 204) {
      return { success: true };
    }

    return response.json();
  }

  // --- People ---

  async listPeople(params?: { limit?: string; cursor?: string; filter?: string }) {
    const queryParams: Record<string, string> = {};
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.cursor) queryParams.cursor = params.cursor;
    // Filter is passed as raw query string params, parse if provided
    return this.request("GET", "/v1/people", undefined, queryParams);
  }

  async getPerson(personId: string) {
    return this.request("GET", `/v1/people/${personId}`);
  }

  async createPerson(data: Record<string, unknown>) {
    return this.request("POST", "/v1/people", data);
  }

  async updatePerson(personId: string, data: Record<string, unknown>) {
    return this.request("PATCH", `/v1/people/${personId}`, data);
  }

  async deletePerson(personId: string) {
    return this.request("DELETE", `/v1/people/${personId}`);
  }

  // --- Companies ---

  async listCompanies(params?: {
    limit?: string;
    cursor?: string;
    groupId?: string;
    region?: string;
    customFilters?: Array<{ groupId: string; field: string; operator: string; value: string }>;
  }) {
    const queryParams: Record<string, string> = {};
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.cursor) queryParams.cursor = params.cursor;

    // Convenience: region filter (requires groupId)
    if (params?.region && params?.groupId) {
      queryParams[`filter[customFieldValues.${params.groupId}.Region][eq]`] = params.region;
    }

    // General custom field filters
    if (params?.customFilters) {
      for (const f of params.customFilters) {
        queryParams[`filter[customFieldValues.${f.groupId}.${f.field}][${f.operator}]`] = f.value;
      }
    }

    return this.request("GET", "/v1/companies", undefined, queryParams);
  }

  async getCompany(companyId: string) {
    return this.request("GET", `/v1/companies/${companyId}`);
  }

  async createCompany(data: Record<string, unknown>) {
    return this.request("POST", "/v1/companies", data);
  }

  async updateCompany(companyId: string, data: Record<string, unknown>) {
    return this.request("PATCH", `/v1/companies/${companyId}`, data);
  }

  async deleteCompany(companyId: string) {
    return this.request("DELETE", `/v1/companies/${companyId}`);
  }

  // --- Deals (group-scoped) ---

  async listDeals(groupId: string, objectType: string, params?: { limit?: string; cursor?: string }) {
    const queryParams: Record<string, string> = {};
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.cursor) queryParams.cursor = params.cursor;
    return this.request("GET", `/v1/groups/${groupId}/${objectType}`, undefined, queryParams);
  }

  async getDeal(groupId: string, objectType: string, objectId: string) {
    return this.request("GET", `/v1/groups/${groupId}/${objectType}/${objectId}`);
  }

  async createDeal(groupId: string, objectType: string, data: Record<string, unknown>) {
    return this.request("POST", `/v1/groups/${groupId}/${objectType}`, data);
  }

  async updateDeal(groupId: string, objectType: string, objectId: string, data: Record<string, unknown>) {
    return this.request("PATCH", `/v1/groups/${groupId}/${objectType}/${objectId}`, data);
  }

  async deleteDeal(groupId: string, objectType: string, objectId: string) {
    return this.request("DELETE", `/v1/groups/${groupId}/${objectType}/${objectId}`);
  }

  // --- Groups (read-only) ---

  async listGroups(params?: { limit?: string; cursor?: string }) {
    const queryParams: Record<string, string> = {};
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.cursor) queryParams.cursor = params.cursor;
    return this.request("GET", "/v1/groups", undefined, queryParams);
  }

  // --- Users (read-only) ---

  async listUsers(params?: { limit?: string; cursor?: string }) {
    const queryParams: Record<string, string> = {};
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.cursor) queryParams.cursor = params.cursor;
    return this.request("GET", "/v1/users", undefined, queryParams);
  }

  async getCurrentUser() {
    return this.request("GET", "/v1/users/me");
  }
}
