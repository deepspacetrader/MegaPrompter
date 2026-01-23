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
            console.log('🔍 Checking cache status...')
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    const response = await fetch('/api/cache-check', {
                        signal: AbortSignal.timeout(10000) // 10 second timeout
                    })
                    if (response.ok) {
                        const cacheInfo: CacheInfo = await response.json()
                        console.log('📊 Cache info:', cacheInfo)
                        setUseCache(cacheInfo.exists && cacheInfo.valid)
                        console.log('✅ useCache set to:', cacheInfo.exists && cacheInfo.valid)
                        return
                    } else {
                        console.log(`❌ Cache check failed with status: ${response.status} (attempt ${attempt}/${retries})`)
                        if (attempt === retries) setUseCache(false)
                    }
                } catch (error) {
                    console.error(`❌ Failed to check cache (attempt ${attempt}/${retries}):`, error)
                    if (attempt === retries) {
                        setUseCache(false)
                        // Don't throw error, just use fallback
                        console.log('🔄 Using fallback mode due to cache check failure')
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
