/**
 * Mello Plugin SDK Client
 * Handles communication with Mello backend API
 */

import type {
  PluginContext,
  DataScope,
  Board,
  Card,
  List,
  Comment,
  APIResponse,
} from './types';

export interface ClientConfig {
  apiUrl?: string;
  token: string;
  debug?: boolean;
}

export class MelloClient {
  private config: ClientConfig;
  private context?: PluginContext;

  constructor(config: ClientConfig) {
    this.config = {
      apiUrl: config.apiUrl || 'http://localhost:8080/api',
      ...config,
    };
  }

  // Context management
  setContext(context: PluginContext): void {
    this.context = context;
  }

  getContext(): PluginContext | undefined {
    return this.context;
  }

  // HTTP request helper
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<APIResponse<T>> {
    const url = `${this.config.apiUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Plugin-Token': this.config.token,
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        return { error: error.error || error.message };
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return { data: undefined as T };
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      if (this.config.debug) {
        console.error('[Mello SDK] Request failed:', error);
      }
      return {
        error: error instanceof Error ? error.message : 'Request failed',
      };
    }
  }

  // Plugin Data API
  async getData<T = any>(
    scope: DataScope,
    entityId: string,
    key: string
  ): Promise<T | null> {
    const response = await this.request<T>(
      'GET',
      `/plugin-data/${scope}/${entityId}/${key}`
    );
    
    if (response.error) {
      if (this.config.debug) {
        console.error('[Mello SDK] getData error:', response.error);
      }
      return null;
    }
    
    return response.data || null;
  }

  async setData<T = any>(
    scope: DataScope,
    entityId: string,
    key: string,
    value: T
  ): Promise<boolean> {
    const response = await this.request(
      'PUT',
      `/plugin-data/${scope}/${entityId}/${key}`,
      value
    );
    
    return !response.error;
  }

  async deleteData(
    scope: DataScope,
    entityId: string,
    key: string
  ): Promise<boolean> {
    const response = await this.request(
      'DELETE',
      `/plugin-data/${scope}/${entityId}/${key}`
    );
    
    return !response.error;
  }

  async getAllData<T = Record<string, any>>(
    scope: DataScope,
    entityId: string
  ): Promise<T | null> {
    const response = await this.request<T>(
      'GET',
      `/plugin-data/${scope}/${entityId}`
    );
    
    if (response.error) {
      if (this.config.debug) {
        console.error('[Mello SDK] getAllData error:', response.error);
      }
      return null;
    }
    
    return response.data || null;
  }

  // Mello Core API - Read operations
  async getBoard(boardId: string): Promise<Board | null> {
    const response = await this.request<Board>('GET', `/boards/${boardId}`);
    return response.data || null;
  }

  async getCard(cardId: string): Promise<Card | null> {
    const response = await this.request<Card>('GET', `/cards/${cardId}`);
    return response.data || null;
  }

  async getList(listId: string): Promise<List | null> {
    const response = await this.request<List>('GET', `/lists/${listId}`);
    return response.data || null;
  }

  async getCardComments(cardId: string): Promise<Comment[]> {
    const response = await this.request<Comment[]>(
      'GET',
      `/cards/${cardId}/comments`
    );
    return response.data || [];
  }

  // Mello Core API - Write operations (requires permissions)
  async updateCard(
    cardId: string,
    data: Partial<Card>
  ): Promise<Card | null> {
    const response = await this.request<Card>(
      'PUT',
      `/cards/${cardId}`,
      data
    );
    return response.data || null;
  }

  async addComment(cardId: string, content: string): Promise<Comment | null> {
    const response = await this.request<Comment>(
      'POST',
      `/cards/${cardId}/comments`,
      { content }
    );
    return response.data || null;
  }

  async moveCard(
    cardId: string,
    listId: string,
    position: number
  ): Promise<Card | null> {
    const response = await this.request<Card>(
      'PUT',
      `/cards/${cardId}/move`,
      { list_id: listId, position }
    );
    return response.data || null;
  }

  async archiveCard(cardId: string): Promise<boolean> {
    const response = await this.request('PUT', `/cards/${cardId}/archive`);
    return !response.error;
  }

  async unarchiveCard(cardId: string): Promise<boolean> {
    const response = await this.request('PUT', `/cards/${cardId}/unarchive`);
    return !response.error;
  }

  // Helper method to check if user has permission
  hasPermission(permission: string): boolean {
    if (!this.context) return false;
    return this.context.permissions.includes(permission);
  }
}
