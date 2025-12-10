// ====================================================================
// L.U.N.A. MCP Service - Model Context Protocol Tools
// ====================================================================

import { apiClient } from './apiClient';
import { config } from '../config';
import type { MCPTool, MCPServer, MCPToolCallResult } from '../types';

interface MCPToolListResponse {
    tools: MCPTool[];
    total: number;
}

interface MCPServerListResponse {
    servers: MCPServer[];
}

class MCPService {
    // Get all available tools
    async getTools(): Promise<MCPToolListResponse> {
        return apiClient.get<MCPToolListResponse>(config.endpoints.mcpTools);
    }

    // Call a tool
    async callTool(
        serverId: string,
        toolName: string,
        args: Record<string, unknown>
    ): Promise<MCPToolCallResult> {
        return apiClient.post<MCPToolCallResult>(config.endpoints.mcpCall, {
        server_id: serverId,
        tool_name: toolName,
        arguments: args,
        });
    }

    // Get external servers list
    async getServers(): Promise<MCPServerListResponse> {
        return apiClient.get<MCPServerListResponse>(config.endpoints.mcpExternalServers);
    }

    // Reload servers
    async reloadServers(): Promise<{ status: string }> {
        return apiClient.post(config.endpoints.mcpExternalReload);
    }

    // Get tools for specific server
    async getServerTools(serverId: string): Promise<{ server: string; tools: MCPTool[] }> {
        return apiClient.get(`/mcp/external/${serverId}/tools`);
    }

    // Get resources for specific server
    async getServerResources(serverId: string): Promise<{ server: string; resources: unknown[] }> {
        return apiClient.get(`/mcp/external/${serverId}/resources`);
    }

    // Call tool on specific server
    async callServerTool(
        serverId: string,
        toolName: string,
        args: Record<string, unknown> = {}
    ): Promise<{ server: string; result: unknown }> {
        return apiClient.post(`/mcp/external/${serverId}/call`, {
            name: toolName,
            arguments: args,
        });
    }

    // Add new server
    async addServer(serverConfig: Partial<MCPServer>): Promise<{ status: string; server: string }> {
        return apiClient.post(config.endpoints.mcpConfigAdd, serverConfig);
    }

    // Remove server
    async removeServer(serverId: string): Promise<{ status: string; server: string }> {
        return apiClient.post(`${config.endpoints.mcpConfigRemove}?server_id=${encodeURIComponent(serverId)}`);
    }

    // Update server configuration
    async updateServer(
        serverConfig: Partial<MCPServer>
    ): Promise<{ status: string; server: string }> {
        return apiClient.post(config.endpoints.mcpConfigUpdate, serverConfig);
    }

    // Toggle server enabled/disabled
    async toggleServer(serverId: string, enabled: boolean): Promise<{ status: string; server: string }> {
        return this.updateServer({ id: serverId, enabled });
    }
}

export const mcpService = new MCPService();
export default mcpService;
