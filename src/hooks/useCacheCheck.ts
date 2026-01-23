import { useState, useEffect } from 'react'

interface CacheInfo {
    exists: boolean
    valid: boolean
    timestamp?: number
}

export const useCacheCheck = () => {
    const [useCache, setUseCache] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)

    useEffect(() => {
        const checkCache = async (retries = 3) => {
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    const response = await fetch('/api/cache-check', {
                        signal: AbortSignal.timeout(10000) // 10 second timeout
                    })
                    if (response.ok) {
                        const cacheInfo: CacheInfo = await response.json()
                        setUseCache(cacheInfo.exists && cacheInfo.valid)
                        return
                    } else {
                        if (attempt === retries) setUseCache(false)
                    }
                } catch (error) {
                    console.error(`❌ Failed to check cache (attempt ${attempt}/${retries}):`, error)
                    if (attempt === retries) {
                        setUseCache(false)
                        // Don't throw error, just use fallback
                    } else {
                        // Wait before retrying
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
                    }
                }
            }
        }
        setIsLoading(false)
        checkCache()
    }, [])

    return { useCache, setUseCache, isLoading }
}
