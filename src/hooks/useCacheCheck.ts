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
        const checkCache = async () => {
            console.log('🔍 Checking cache status...')
            try {
                const response = await fetch('/api/cache-check')
                if (response.ok) {
                    const cacheInfo: CacheInfo = await response.json()
                    console.log('📊 Cache info:', cacheInfo)
                    setUseCache(cacheInfo.exists && cacheInfo.valid)
                    console.log('✅ useCache set to:', cacheInfo.exists && cacheInfo.valid)
                } else {
                    console.log('❌ Cache check failed with status:', response.status)
                    setUseCache(false)
                }
            } catch (error) {
                console.error('❌ Failed to check cache:', error)
                setUseCache(false)
            } finally {
                setIsLoading(false)
            }
        }
        checkCache()
    }, [])

    return { useCache, setUseCache, isLoading }
}
