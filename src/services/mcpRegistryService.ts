// ====================================================================
// L.U.N.A. MCP Registry Service - Fetches from Multiple MCP Sources
// ====================================================================
// Sources:
//   1. Official MCP Registry API (registry.modelcontextprotocol.io)
//   2. GitHub Official MCP Servers (github.com/modelcontextprotocol/servers)
// ====================================================================

const MCP_REGISTRY_API = 'https://registry.modelcontextprotocol.io/v0/servers';

// API Response Types
export interface MCPRegistryAPIServer {
    server: {
        $schema: string;
        name: string;
        description: string;
        repository?: {
            url?: string;
            source?: string;
            subfolder?: string;
        };
        version: string;
        packages?: Array<{
            registryType: 'npm' | 'pypi' | 'oci';
            registryBaseUrl?: string;
            identifier: string;
            version?: string;
            runtimeHint?: string;
            transport?: {
                type: string;
            };
            environmentVariables?: Array<{
                name: string;
                description?: string;
                isRequired?: boolean;
                isSecret?: boolean;
                default?: string;
            }>;
        }>;
        remotes?: Array<{
            type: string;
            url: string;
            headers?: Array<{
                name: string;
                description?: string;
                isSecret?: boolean;
            }>;
        }>;
    };
    _meta?: {
        'io.modelcontextprotocol.registry/official'?: {
            status: string;
            publishedAt: string;
            updatedAt: string;
            isLatest: boolean;
        };
    };
}

export interface MCPRegistryAPIResponse {
    servers: MCPRegistryAPIServer[];
    metadata: {
        nextCursor?: string;
        count: number;
    };
}

// Internal normalized type for UI
export interface MCPServerItem {
    id: string;
    name: string;
    displayName: string;
    description: string;
    category: string;
    icon: string;
    author: string;
    version: string;
    installType: 'npm' | 'pip' | 'remote' | 'docker';
    command?: string;
    args?: string[];
    remoteUrl?: string;
    envRequired?: string[];
    homepage?: string;
    isLatest?: boolean;
    isOfficial?: boolean;  // Official Anthropic/MCP reference servers
    publishedAt?: string;
    source?: 'registry' | 'github' | 'fallback';
}

// Category inference from server name/description
function inferCategory(name: string, description: string): string {
    const text = `${name} ${description}`.toLowerCase();
    
    if (text.includes('search') || text.includes('web') || text.includes('browse')) return 'search';
    if (text.includes('file') || text.includes('storage') || text.includes('drive') || text.includes('database') || text.includes('sql')) return 'storage';
    if (text.includes('git') || text.includes('docker') || text.includes('code') || text.includes('dev')) return 'development';
    if (text.includes('slack') || text.includes('discord') || text.includes('email') || text.includes('chat') || text.includes('message')) return 'communication';
    if (text.includes('calendar') || text.includes('task') || text.includes('notion') || text.includes('todo')) return 'productivity';
    if (text.includes('ai') || text.includes('model') || text.includes('llm') || text.includes('openai') || text.includes('claude')) return 'ai';
    
    return 'utility';
}

// Icon inference from category/name
function inferIcon(category: string, name: string): string {
    const nameLower = name.toLowerCase();
    
    // Specific name matches
    if (nameLower.includes('github')) return '🐙';
    if (nameLower.includes('slack')) return '💬';
    if (nameLower.includes('discord')) return '🎮';
    if (nameLower.includes('notion')) return '📝';
    if (nameLower.includes('google')) return '🔍';
    if (nameLower.includes('postgres') || nameLower.includes('sql')) return '🐘';
    if (nameLower.includes('docker')) return '🐳';
    if (nameLower.includes('git')) return '🔀';
    if (nameLower.includes('file') || nameLower.includes('filesystem')) return '📁';
    if (nameLower.includes('memory')) return '🧠';
    if (nameLower.includes('time')) return '⏰';
    if (nameLower.includes('fetch') || nameLower.includes('web')) return '🌐';
    if (nameLower.includes('browser') || nameLower.includes('puppeteer')) return '🎭';
    
    // Category defaults
    const categoryIcons: Record<string, string> = {
        search: '🔍',
        storage: '💾',
        development: '💻',
        communication: '💬',
        productivity: '📊',
        ai: '🤖',
        utility: '🔧',
    };
    
    return categoryIcons[category] || '📦';
}

// Extract display name from full name
function extractDisplayName(fullName: string): string {
    // Format: "namespace/name" -> extract just "name" part and format nicely
    const parts = fullName.split('/');
    const name = parts[parts.length - 1];
    
    // Convert kebab-case to Title Case
    return name
        .replace(/-/g, ' ')
        .replace(/mcp server/gi, '')
        .replace(/mcp/gi, '')
        .trim()
        .split(' ')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ') || name;
}

// Extract author from namespace
function extractAuthor(fullName: string): string {
    const parts = fullName.split('/');
    if (parts.length >= 2) {
        // Extract domain-like namespace: "io.github.user" -> "user"
        const namespace = parts[0];
        const domainParts = namespace.split('.');
        return domainParts[domainParts.length - 1] || namespace;
    }
    return 'Community';
}

// Transform API response to our internal format
function transformServer(apiServer: MCPRegistryAPIServer): MCPServerItem | null {
    const { server, _meta } = apiServer;
    const meta = _meta?.['io.modelcontextprotocol.registry/official'];
    
    // Skip non-latest versions
    if (meta && !meta.isLatest) {
        return null;
    }
    
    const category = inferCategory(server.name, server.description);
    const displayName = extractDisplayName(server.name);
    const author = extractAuthor(server.name);
    const icon = inferIcon(category, server.name);
    
    // Determine install type and command
    let installType: 'npm' | 'pip' | 'remote' | 'docker' = 'remote';
    let command: string | undefined;
    let args: string[] | undefined;
    let remoteUrl: string | undefined;
    let envRequired: string[] = [];
    
    // Check for packages (local installation)
    if (server.packages && server.packages.length > 0) {
        const pkg = server.packages[0];
        
        if (pkg.registryType === 'npm') {
            installType = 'npm';
            command = pkg.runtimeHint || 'npx';
            args = command === 'npx' ? ['-y', pkg.identifier] : [pkg.identifier];
        } else if (pkg.registryType === 'pypi') {
            installType = 'pip';
            command = 'uvx';
            args = [pkg.identifier];
        } else if (pkg.registryType === 'oci') {
            installType = 'docker';
            command = 'docker';
            args = ['run', '-i', '--rm', pkg.identifier];
        }
        
        // Extract required env vars
        if (pkg.environmentVariables) {
            envRequired = pkg.environmentVariables
                .filter(env => env.isRequired || env.isSecret)
                .map(env => env.name);
        }
    }
    
    // Check for remotes (SSE/HTTP connections)
    if (server.remotes && server.remotes.length > 0) {
        const remote = server.remotes[0];
        remoteUrl = remote.url;
        
        if (!command) {
            installType = 'remote';
        }
        
        // Extract required headers as env vars
        if (remote.headers) {
            const headerEnvs = remote.headers
                .filter(h => h.isSecret)
                .map(h => h.name);
            envRequired = [...envRequired, ...headerEnvs];
        }
    }
    
    const homepage = server.repository?.url || undefined;
    
    return {
        id: server.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
        name: server.name,
        displayName,
        description: server.description,
        category,
        icon,
        author,
        version: server.version,
        installType,
        command,
        args,
        remoteUrl,
        envRequired: envRequired.length > 0 ? envRequired : undefined,
        homepage,
        isLatest: meta?.isLatest,
        publishedAt: meta?.publishedAt,
        source: 'registry',
    };
}

// Fetch all servers with pagination
export async function fetchMCPServers(
    options: {
        limit?: number;
        cursor?: string;
        onlyLatest?: boolean;
    } = {}
): Promise<{ servers: MCPServerItem[]; nextCursor?: string; total: number }> {
    const { limit = 100, cursor, onlyLatest = true } = options;
    
    try {
        let url = `${MCP_REGISTRY_API}?limit=${limit}`;
        if (cursor) {
            url += `&cursor=${encodeURIComponent(cursor)}`;
        }
        if (onlyLatest) {
            url += '&only_latest=true';
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data: MCPRegistryAPIResponse = await response.json();
        
        // Transform and filter servers
        const servers = data.servers
            .map(transformServer)
            .filter((s): s is MCPServerItem => s !== null);
        
        return {
            servers,
            nextCursor: data.metadata.nextCursor,
            total: data.metadata.count,
        };
    } catch (error) {
        console.error('Failed to fetch MCP servers from registry:', error);
        throw error;
    }
}

// ====================================================================
// GitHub Official Servers
// ====================================================================

// Reference server metadata from GitHub
interface GitHubReferenceServer {
    name: string;
    displayName: string;
    description: string;
    installType: 'npm' | 'pip';
    npmPackage?: string;
    pipPackage?: string;
    category: string;
    icon: string;
}

// Official reference servers from modelcontextprotocol/servers
const GITHUB_REFERENCE_SERVERS: GitHubReferenceServer[] = [
    {
        name: 'everything',
        displayName: 'Everything',
        description: 'Reference / test server with prompts, resources, and tools. Demonstrates MCP features.',
        installType: 'npm',
        npmPackage: '@modelcontextprotocol/server-everything',
        category: 'development',
        icon: '🧪',
    },
    {
        name: 'fetch',
        displayName: 'Fetch',
        description: 'Web content fetching and conversion for efficient LLM usage.',
        installType: 'pip',
        pipPackage: 'mcp-server-fetch',
        category: 'search',
        icon: '🌐',
    },
    {
        name: 'filesystem',
        displayName: 'Filesystem',
        description: 'Secure file operations with configurable access controls.',
        installType: 'npm',
        npmPackage: '@modelcontextprotocol/server-filesystem',
        category: 'storage',
        icon: '📁',
    },
    {
        name: 'git',
        displayName: 'Git',
        description: 'Tools to read, search, and manipulate Git repositories.',
        installType: 'pip',
        pipPackage: 'mcp-server-git',
        category: 'development',
        icon: '🔀',
    },
    {
        name: 'memory',
        displayName: 'Memory',
        description: 'Knowledge graph-based persistent memory system.',
        installType: 'npm',
        npmPackage: '@modelcontextprotocol/server-memory',
        category: 'ai',
        icon: '🧠',
    },
    {
        name: 'sequentialthinking',
        displayName: 'Sequential Thinking',
        description: 'Dynamic and reflective problem-solving through thought sequences.',
        installType: 'npm',
        npmPackage: '@modelcontextprotocol/server-sequential-thinking',
        category: 'ai',
        icon: '🤔',
    },
    {
        name: 'time',
        displayName: 'Time',
        description: 'Time and timezone conversion capabilities.',
        installType: 'pip',
        pipPackage: 'mcp-server-time',
        category: 'utility',
        icon: '⏰',
    },
];

// Transform GitHub reference server to MCPServerItem
function transformGitHubServer(ref: GitHubReferenceServer): MCPServerItem {
    return {
        id: `github-official-${ref.name}`,
        name: `modelcontextprotocol/${ref.name}`,
        displayName: ref.displayName,
        description: ref.description,
        category: ref.category,
        icon: ref.icon,
        author: 'Anthropic',
        version: 'latest',
        installType: ref.installType,
        command: ref.installType === 'npm' ? 'npx' : 'uvx',
        args: ref.installType === 'npm' 
            ? ['-y', ref.npmPackage!] 
            : [ref.pipPackage!],
        homepage: `https://github.com/modelcontextprotocol/servers/tree/main/src/${ref.name}`,
        isLatest: true,
        source: 'github',
    };
}

// Fetch GitHub official reference servers
export async function fetchGitHubOfficialServers(): Promise<MCPServerItem[]> {
    // We use a static list since the README structure is well-known
    // and these are the official reference implementations
    return GITHUB_REFERENCE_SERVERS.map(transformGitHubServer);
}

// ====================================================================
// Combined Fetching
// ====================================================================

// Fetch all servers (with auto-pagination) from Registry
export async function fetchAllMCPServers(maxPages = 10): Promise<MCPServerItem[]> {
    const allServers: MCPServerItem[] = [];
    let cursor: string | undefined;
    let pageCount = 0;
    
    while (pageCount < maxPages) {
        const result = await fetchMCPServers({ cursor, limit: 100, onlyLatest: true });
        allServers.push(...result.servers);
        
        if (!result.nextCursor) {
            break;
        }
        
        cursor = result.nextCursor;
        pageCount++;
    }
    
    return allServers;
}

// Fetch from all sources and merge
export async function fetchFromAllSources(): Promise<{
    servers: MCPServerItem[];
    sources: { registry: number; github: number };
}> {
    const [registryResult, githubServers] = await Promise.allSettled([
        fetchMCPServers({ limit: 50, onlyLatest: true }),
        fetchGitHubOfficialServers(),
    ]);
    
    const allServers: MCPServerItem[] = [];
    const sources = { registry: 0, github: 0 };
    
    // Add GitHub official servers first (they are highlighted)
    if (githubServers.status === 'fulfilled') {
        // Mark as official
        const officialServers = githubServers.value.map(s => ({
            ...s,
            isOfficial: true,
        }));
        allServers.push(...officialServers);
        sources.github = officialServers.length;
    }
    
    // Add registry servers
    if (registryResult.status === 'fulfilled') {
        // Filter out duplicates that already exist in GitHub
        const githubIds = new Set(allServers.map(s => s.name.toLowerCase()));
        const uniqueRegistryServers = registryResult.value.servers.filter(
            s => !githubIds.has(s.name.toLowerCase())
        );
        allServers.push(...uniqueRegistryServers);
        sources.registry = uniqueRegistryServers.length;
    }
    
    return { servers: allServers, sources };
}

// Search servers by query
export async function searchMCPServers(query: string): Promise<MCPServerItem[]> {
    // For now, fetch all and filter client-side
    // TODO: Use server-side search when API supports it
    const allServers = await fetchAllMCPServers(5);
    
    const searchLower = query.toLowerCase();
    return allServers.filter(server => 
        server.name.toLowerCase().includes(searchLower) ||
        server.displayName.toLowerCase().includes(searchLower) ||
        server.description.toLowerCase().includes(searchLower) ||
        server.category.toLowerCase().includes(searchLower)
    );
}

// Category labels (same as before for UI)
export const categoryLabels: Record<string, { en: string; ko: string; ja: string; icon: string }> = {
    productivity: { en: 'Productivity', ko: '생산성', ja: '生産性', icon: '📊' },
    search: { en: 'Search', ko: '검색', ja: '検索', icon: '🔍' },
    development: { en: 'Development', ko: '개발', ja: '開発', icon: '💻' },
    communication: { en: 'Communication', ko: '커뮤니케이션', ja: 'コミュニケーション', icon: '💬' },
    storage: { en: 'Storage', ko: '저장소', ja: 'ストレージ', icon: '💾' },
    ai: { en: 'AI', ko: 'AI', ja: 'AI', icon: '🤖' },
    utility: { en: 'Utility', ko: '유틸리티', ja: 'ユーティリティ', icon: '🔧' },
};
