const redisBaseUrl = Deno.env.get('UPSTASH_REDIS_REST_URL')?.replace(/\/$/, '');
const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

function hasRedis() {
    return Boolean(redisBaseUrl && redisToken);
}

async function sha256Base64Url(input: string) {
    const bytes = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const value = String.fromCharCode(...new Uint8Array(digest));
    return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function createCacheKey(prefix: string, parts: string[]) {
    return `${prefix}:${await sha256Base64Url(parts.join('|'))}`;
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
    if (!hasRedis()) return null;

    const response = await fetch(`${redisBaseUrl}/get/${encodeURIComponent(key)}`, {
        headers: {
            Authorization: `Bearer ${redisToken}`,
        },
    });

    if (!response.ok) return null;

    const payload = await response.json();
    if (!payload?.result) return null;

    try {
        return JSON.parse(payload.result) as T;
    } catch {
        return null;
    }
}

export async function redisSetJson(key: string, value: unknown, ttlSeconds: number) {
    if (!hasRedis()) return false;

    const encodedValue = encodeURIComponent(JSON.stringify(value));
    const response = await fetch(`${redisBaseUrl}/setex/${encodeURIComponent(key)}/${ttlSeconds}/${encodedValue}`, {
        headers: {
            Authorization: `Bearer ${redisToken}`,
        },
    });

    return response.ok;
}
