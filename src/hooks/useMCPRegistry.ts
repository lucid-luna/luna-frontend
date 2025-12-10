// ====================================================================
// L.U.N.A. MCP Registry Hook - React hook for fetching MCP servers
// ====================================================================

import { useState, useEffect, useCallback } from 'react';
import { 
    fetchMCPServers,
    fetchFromAllSources,
    MCPServerItem,
    categoryLabels 
} from '../services/mcpRegistryService';
import { mcpRegistry, MCPRegistryItem } from '../pages/Tools/mcpRegistry';

// Convert fallback data to MCPServerItem format
function convertFallbackItem(item: MCPRegistryItem): MCPServerItem {
    return {
        id: item.id,
        name: item.id,
        displayName: item.name,
        description: item.description,
        category: item.category,
        icon: item.icon,
        author: item.author,
        version: '1.0.0',
        installType: item.installType === 'npm' ? 'npm' : item.installType === 'pip' ? 'pip' : 'npm',
        command: item.command,
        args: item.args,
        envRequired: item.envRequired,
        homepage: item.homepage,
        source: 'fallback',
    };
}

// Featured server IDs (official GitHub reference servers first)
const FEATURED_IDS = ['github-official-filesystem', 'github-official-memory', 'github-official-fetch', 'github-official-git'];

export interface UseMCPRegistryOptions {
    autoFetch?: boolean;
    useFallbackOnError?: boolean;
    useAllSources?: boolean;  // Fetch from both Registry API and GitHub
}

export interface UseMCPRegistryResult {
    servers: MCPServerItem[];
    featuredServers: MCPServerItem[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
    search: (query: string) => MCPServerItem[];
    filterByCategory: (category: string | null) => MCPServerItem[];
    isUsingFallback: boolean;
    sources: { registry: number; github: number };
}

export function useMCPRegistry(options: UseMCPRegistryOptions = {}): UseMCPRegistryResult {
    const { autoFetch = true, useFallbackOnError = true, useAllSources = true } = options;
    
    const [servers, setServers] = useState<MCPServerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string | undefined>();
    const [hasMore, setHasMore] = useState(true);
    const [isUsingFallback, setIsUsingFallback] = useState(false);
    const [sources, setSources] = useState<{ registry: number; github: number }>({ registry: 0, github: 0 });

    // Load fallback data
    const loadFallback = useCallback(() => {
        const fallbackServers = mcpRegistry.map(convertFallbackItem);
        setServers(fallbackServers);
        setIsUsingFallback(true);
        setHasMore(false);
        setSources({ registry: 0, github: 0 });
        setLoading(false);
    }, []);

    // Initial fetch - from all sources
    const fetchInitial = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            if (useAllSources) {
                // Fetch from both GitHub and Registry API
                const result = await fetchFromAllSources();
                setServers(result.servers);
                setSources(result.sources);
                setHasMore(true); // Can still load more from registry
                setCursor(undefined);
            } else {
                // Only fetch from Registry API
                const result = await fetchMCPServers({ limit: 50, onlyLatest: true });
                setServers(result.servers);
                setCursor(result.nextCursor);
                setHasMore(!!result.nextCursor);
                setSources({ registry: result.servers.length, github: 0 });
            }
            setIsUsingFallback(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch MCP servers';
            setError(errorMessage);
            
            if (useFallbackOnError) {
                console.warn('Using fallback data due to API error:', errorMessage);
                loadFallback();
            }
        } finally {
            setLoading(false);
        }
    }, [useFallbackOnError, useAllSources, loadFallback]);

    // Load more (pagination)
    const loadMore = useCallback(async () => {
        if (!hasMore || loading || isUsingFallback) return;
        
        setLoading(true);
        
        try {
            const result = await fetchMCPServers({ cursor, limit: 50, onlyLatest: true });
            setServers(prev => [...prev, ...result.servers]);
            setCursor(result.nextCursor);
            setHasMore(!!result.nextCursor);
            setSources(prev => ({ ...prev, registry: prev.registry + result.servers.length }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load more servers';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [cursor, hasMore, loading, isUsingFallback]);

    // Refresh
    const refresh = useCallback(async () => {
        setCursor(undefined);
        setHasMore(true);
        setIsUsingFallback(false);
        await fetchInitial();
    }, [fetchInitial]);

    // Search
    const search = useCallback((query: string): MCPServerItem[] => {
        if (!query.trim()) return servers;
        
        const searchLower = query.toLowerCase();
        return servers.filter(server => 
            server.name.toLowerCase().includes(searchLower) ||
            server.displayName.toLowerCase().includes(searchLower) ||
            server.description.toLowerCase().includes(searchLower) ||
            server.category.toLowerCase().includes(searchLower) ||
            server.author.toLowerCase().includes(searchLower)
        );
    }, [servers]);

    // Filter by category
    const filterByCategory = useCallback((category: string | null): MCPServerItem[] => {
        if (!category) return servers;
        return servers.filter(server => server.category === category);
    }, [servers]);

    // Featured servers - prioritize official GitHub servers
    const featuredServers = servers.filter(s => 
        FEATURED_IDS.includes(s.id) || 
        s.isOfficial ||
        s.displayName.toLowerCase().includes('filesystem') ||
        s.displayName.toLowerCase().includes('memory') ||
        s.displayName.toLowerCase().includes('fetch')
    ).slice(0, 4);

    // Auto-fetch on mount
    useEffect(() => {
        if (autoFetch) {
            fetchInitial();
        }
    }, [autoFetch, fetchInitial]);

    return {
        servers,
        featuredServers,
        loading,
        error,
        hasMore,
        loadMore,
        refresh,
        search,
        filterByCategory,
        isUsingFallback,
        sources,
    };
}

// Export category labels for use in components
export { categoryLabels };
