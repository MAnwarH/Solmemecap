const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 🔒 PRODUCTION-SAFE LOGGING: Only show detailed logs in development
const isDevelopment = process.env.NODE_ENV !== 'production';
const debugLog = (...args) => {
    if (isDevelopment) {
        console.log(...args);
    }
};
const safeLog = (...args) => console.log(...args); // Always show important logs

// 🔒 ENHANCED SECURITY: Smart rate limiting to prevent API abuse
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 500; // Increased: 500 requests per 15 minutes per IP (most will be cached)

// Smart rate limiting middleware - more lenient for endpoints with caching
app.use((req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const now = Date.now();

    // Skip rate limiting for static files (HTML, CSS, JS, images)
    if (req.path.startsWith('/api/')) {
        // Clean up old entries
        for (const [ip, data] of rateLimit.entries()) {
            if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
                rateLimit.delete(ip);
            }
        }

        // Check current IP
        const ipData = rateLimit.get(clientIp);
        if (!ipData) {
            rateLimit.set(clientIp, { firstRequest: now, count: 1 });
        } else if (now - ipData.firstRequest > RATE_LIMIT_WINDOW) {
            rateLimit.set(clientIp, { firstRequest: now, count: 1 });
        } else {
            ipData.count++;
            if (ipData.count > MAX_REQUESTS_PER_WINDOW) {
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    message: 'Too many requests. Please try again later.'
                });
            }
        }
    }
    next();
});

// 🔒 ENHANCED SECURITY: Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");
    next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.static('public')); // Serve static files

// 🔒 ENHANCED SECURITY: Validate API keys are present
if (!process.env.BITQUERY_API_KEY) {
    console.error('❌ SECURITY ERROR: BITQUERY_API_KEY not found in environment variables');
    console.error('📝 Please create a .env file with your API keys');
    process.exit(1);
}

if (!process.env.COINGECKO_API_KEY) {
    console.warn('⚠️ WARNING: COINGECKO_API_KEY not found - fallback API will not work');
}

if (!process.env.SOLANATRACKER_API_KEY) {
    console.warn('⚠️ WARNING: SOLANATRACKER_API_KEY not found - trending feature will not work');
}

if (!process.env.COINMARKETCAP_API_KEY) {
    console.warn('⚠️ WARNING: COINMARKETCAP_API_KEY not found - Solana price display will not work');
}

// BitQuery configuration - API key is now secure on server
const BITQUERY_ENDPOINT = 'https://streaming.bitquery.io/eap';
const API_KEY = process.env.BITQUERY_API_KEY; // Secure in .env file

// CoinGecko configuration - backup API for All coins
const COINGECKO_ENDPOINT = 'https://api.coingecko.com/api/v3';
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY; // Secure in .env file

// SolanaTracker configuration - for trending tokens
const SOLANATRACKER_ENDPOINT = 'https://data.solanatracker.io';
const SOLANATRACKER_API_KEY = process.env.SOLANATRACKER_API_KEY; // Secure in .env file

// CoinMarketCap configuration - for Solana price display
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const CACHE_DURATION = 60 * 1000; // Cache for 1 minute (60,000ms)
let solanaPriceCache = {
    price: null,
    lastUpdate: null
};

// BitQuery tokens cache - separate cache for each filter
let tokensCacheAll = {
    data: null,
    lastUpdate: null
};
let tokensCacheMidRange = {
    data: null,
    lastUpdate: null
};
let tokensCacheTrending = {
    data: null,
    lastUpdate: null
};

// DexScreener cache for sponsored coins (5-minute cache to minimize API calls)
const DEXSCREENER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (300,000ms)
let dexScreenerCache = new Map(); // address -> {data, lastUpdate}

// API source management
let currentApiSource = 'auto'; // 'auto', 'bitquery', 'coingecko'
let lastApiUsed = 'bitquery'; // Track which API was last used

// Image cache to avoid refetching same URIs
const imageCache = new Map();

// Helper function to get cached tokens data
function getCachedTokens(filter) {
    const now = Date.now();
    let cache;

    // Select appropriate cache based on filter
    if (filter === 'mid-range') {
        cache = tokensCacheMidRange;
    } else if (filter === 'trending') {
        cache = tokensCacheTrending;
    } else {
        cache = tokensCacheAll;
    }

    // Check if cache is valid (less than 1 minute old)
    if (cache.data && cache.lastUpdate && (now - cache.lastUpdate < CACHE_DURATION)) {
        const cacheAge = Math.floor((now - cache.lastUpdate) / 1000);
        console.log(`📦 Serving cached tokens for '${filter}' filter (age: ${cacheAge}s)`);
        return cache.data;
    }

    return null; // Cache expired or doesn't exist
}

// Helper function to set cached tokens data
function setCachedTokens(filter, data) {
    const cacheObj = {
        data: data,
        lastUpdate: Date.now()
    };

    // Store in appropriate cache based on filter
    if (filter === 'mid-range') {
        tokensCacheMidRange = cacheObj;
        console.log(`💾 Cached tokens for 'mid-range' filter`);
    } else if (filter === 'trending') {
        tokensCacheTrending = cacheObj;
        console.log(`💾 Cached tokens for 'trending' filter`);
    } else {
        tokensCacheAll = cacheObj;
        console.log(`💾 Cached tokens for 'all' filter`);
    }
}

// Function to fetch Solana price from CoinMarketCap (on-demand with 1-minute cache)
async function fetchSolanaPrice() {
    try {
        // Check if cache is still valid (less than 1 minute old)
        const now = Date.now();
        if (solanaPriceCache.price && solanaPriceCache.lastUpdate && (now - solanaPriceCache.lastUpdate < CACHE_DURATION)) {
            console.log(`💰 Serving cached Solana price: $${solanaPriceCache.price.toFixed(2)} (age: ${Math.floor((now - solanaPriceCache.lastUpdate) / 1000)}s)`);
            return solanaPriceCache.price;
        }

        // Cache expired or doesn't exist, fetch fresh data
        console.log(`🔄 Fetching fresh Solana price from CoinMarketCap...`);
        const response = await fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SOL', {
            headers: {
                'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`CoinMarketCap API error: ${response.status}`);
        }

        const data = await response.json();
        const price = data.data.SOL.quote.USD.price;

        // Update cache
        solanaPriceCache = {
            price: price,
            lastUpdate: Date.now()
        };

        console.log(`💰 Updated Solana price: $${price.toFixed(2)}`);
        return price;
    } catch (error) {
        console.error('❌ Failed to fetch Solana price:', error.message);
        // Return cached price if available, even if expired
        if (solanaPriceCache.price) {
            console.log(`⚠️ Returning stale cached price: $${solanaPriceCache.price.toFixed(2)}`);
            return solanaPriceCache.price;
        }
        return null;
    }
}

// Function to fetch token image from metadata URI
async function getTokenImage(uri) {
    try {
        if (!uri) return null;

        // Check cache first
        if (imageCache.has(uri)) {
            return imageCache.get(uri);
        }

        // Set timeout for metadata fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(uri, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Meme360-Bot/1.0'
            }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`Failed to fetch metadata from ${uri}: ${response.status}`);
            imageCache.set(uri, null);
            return null;
        }

        const metadata = await response.json();
        const imageUrl = metadata.image || metadata.logo || metadata.icon || null;

        // Cache the result
        imageCache.set(uri, imageUrl);

        return imageUrl;
    } catch (error) {
        console.warn(`Error fetching image from ${uri}:`, error.message);
        // Cache null result to avoid refetching failed URIs
        imageCache.set(uri, null);
        return null;
    }
}

// SolanaTracker service functions
async function fetchFromSolanaTracker() {
    try {
        debugLog('🔥 Fetching trending tokens from SolanaTracker API...');
        safeLog('📡 Fetching trending tokens from SolanaTracker...');

        const url = `${SOLANATRACKER_ENDPOINT}/tokens/trending/24h`;

        const response = await fetch(url, {
            headers: {
                'x-api-key': SOLANATRACKER_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`SolanaTracker API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        debugLog(`✅ SolanaTracker returned ${data.length} trending tokens`);
        safeLog(`✅ SolanaTracker returned ${data.length} trending tokens`);

        // Transform SolanaTracker data to match our app structure
        const transformedTokens = data.map((tokenData, index) => {
            const token = tokenData.token;
            const pool = tokenData.pools && tokenData.pools.length > 0 ? tokenData.pools[0] : null;
            const events = tokenData.events || {};

            // Calculate price change percentage (use 24h if available, fallback to 1h)
            let changePercent = 0;
            if (events['24h'] && events['24h'].priceChangePercentage !== undefined) {
                changePercent = events['24h'].priceChangePercentage;
            } else if (events['1h'] && events['1h'].priceChangePercentage !== undefined) {
                changePercent = events['1h'].priceChangePercentage;
            }

            const marketCap = pool ? pool.marketCap.usd : 0;
            const price = pool ? pool.price.usd : 0;

            return {
                TokenSupplyUpdate: {
                    Currency: {
                        Name: token.name,
                        Symbol: token.symbol.toUpperCase(),
                        MintAddress: token.mint,
                        Decimals: token.decimals || 6,
                        Uri: null,
                        Fungible: true,
                        Native: false,
                        TokenStandard: 'Token',
                        ImageUrl: token.image
                    },
                    Marketcap: marketCap.toString(),
                    TotalSupply: '0'
                },
                Block: {
                    Time: new Date().toISOString(),
                    Height: Date.now()
                },
                price_data: {
                    Trade: {
                        current_price: price,
                        price_24h_ago: price / (1 + changePercent / 100)
                    },
                    price_change_24h: changePercent
                }
            };
        });

        debugLog(`✅ Transformed ${transformedTokens.length} SolanaTracker trending tokens`);
        safeLog(`✅ Transformed ${transformedTokens.length} trending tokens`);
        return {
            data: {
                Solana: {
                    TokenSupplyUpdates: transformedTokens
                }
            }
        };

    } catch (error) {
        console.error('❌ SolanaTracker API error:', error.message);
        debugLog('❌ SolanaTracker API error:', error.message);
        throw error;
    }
}

// CoinGecko service functions
async function fetchFromCoinGecko() {
    try {
        debugLog('🦎 Fetching tokens from CoinGecko API (Solana memecoins)...');
        safeLog('📡 Fetching tokens from backup data source...');

        const url = `${COINGECKO_ENDPOINT}/coins/markets?vs_currency=usd&category=solana-meme-coins&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h&include_platform=true`;

        const response = await fetch(url, {
            headers: {
                'x-cg-demo-api-key': COINGECKO_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`Backup API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        debugLog(`✅ CoinGecko returned ${data.length} tokens`);
        safeLog(`✅ Backup source returned ${data.length} tokens`);

        // No market cap filtering - show top 100 memecoins by CoinGecko ranking
        const tokensToProcess = data;

        debugLog(`✅ Processing all ${tokensToProcess.length} tokens from CoinGecko`);
        safeLog(`✅ Processing ${tokensToProcess.length} tokens from backup source`);

        // Transform CoinGecko data to match our app structure
        const transformedTokens = tokensToProcess.map((token, index) => ({
            TokenSupplyUpdate: {
                Currency: {
                    Name: token.name,
                    Symbol: token.symbol.toUpperCase(),
                    MintAddress: token.platforms?.solana || `coingecko:${token.id}`, // Use platform data from initial API call, fallback to coin ID
                    Decimals: 6, // Default for most Solana tokens
                    Uri: null,
                    Fungible: true,
                    Native: false,
                    TokenStandard: 'Token',
                    ImageUrl: token.image // CoinGecko provides image URLs directly
                },
                Marketcap: token.market_cap.toString(),
                TotalSupply: token.total_supply || '0'
            },
            Block: {
                Time: new Date().toISOString(),
                Height: Date.now()
            },
            price_data: {
                Trade: {
                    current_price: token.current_price,
                    price_24h_ago: token.current_price / (1 + (token.price_change_percentage_24h || 0) / 100)
                },
                price_change_24h: token.price_change_percentage_24h || 0
            }
        }));

        debugLog(`✅ Transformed ${transformedTokens.length} CoinGecko tokens with platform data`);
        safeLog(`✅ Transformed ${transformedTokens.length} tokens from backup source`);
        return {
            data: {
                Solana: {
                    TokenSupplyUpdates: transformedTokens
                }
            }
        };

    } catch (error) {
        console.error('❌ Backup API error:', error.message);
        debugLog('❌ CoinGecko API error:', error.message);
        throw error;
    }
}

async function fetchFromBitQuery(marketCapFilter) {
    const isMiddleRange = marketCapFilter === 'mid-range';
    const query = isMiddleRange ? MID_RANGE_TOKENS_QUERY : TOP_TOKENS_QUERY;
    const filterDesc = isMiddleRange ? '(3M-10M market cap)' : '(5M+ market cap)';

    debugLog(`🔍 Fetching ${filterDesc} tokens from BitQuery...`);
    safeLog(`📡 Fetching ${filterDesc} tokens from primary data source...`);

    const response = await fetch(BITQUERY_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            query: query,
            variables: {}
        })
    });

    if (!response.ok) {
        throw new Error(`Primary API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    debugLog('✅ Successfully fetched data from BitQuery');
    safeLog('✅ Successfully fetched data from primary source');
    return data;
}

// GraphQL query for top 100 Solana memecoins (5M+) - Enhanced with fresh data ordering
const TOP_TOKENS_QUERY = `{
  Solana {
    TokenSupplyUpdates(
      limitBy: {by: TokenSupplyUpdate_Currency_MintAddress, count: 1}
      limit: {count: 100}
      orderBy: {descending: Block_Time}
      where: {
        TokenSupplyUpdate: {
          Currency: {
            MintAddress: {notIn: [
              "So11111111111111111111111111111111111111112",
              "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
              "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
              "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
              "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
              "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
              "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
              "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
              "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof",
              "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
              "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7AR5T4nud4EkHBof",
              "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",
              "AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB",
              "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E",
              "he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9Ct",
              "6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU",
              "USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX",
              "BXXkv6z8ykpG1yuvUDPgh732wzVHB69RnB9YgSYh3itW",
              "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
              "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
              "8wXtPeU6557ETkp9WHFY1n1EcU6NxDvbAggHGsMYiHsB",
              "LAinEtNLgpmCP9Rvsf5Hn8W6EhNiKLZQti1xfWMLy6X",
              "AGFEad2et2ZJif9jaGpdMixQqvW5i81aBdvKe7PHNfz3",
              "suPer8CPwxoJPQ7zksGMwFvjBQhjAHwUMmPV4FVatBw",
              "7Q2afV64in6N6SeZsAAB81TJzwDoD6zpqmHkzi9Dcavn",
              "jucy5XJ76pHVvtPZb5TKRcGQExkwit2P5s4vY8UzmpC",
              "BnSOL6DYAJ3tBrHMZ8zqVD4KCoNkY11McCe8BenwNYB",
              "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4",
              "jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v",
              "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
              "3jsFX1tx2Z8ewmamiwSU851GzyzM2DJMq7KWW5DM8Py3",
              "hSo1iDvcdNHKSh36vofSsWrGyf8qz8f8qz8pzKQ7eZTKWNCA",
              "sSo14endRuUbvQaJS3dq36Q829a3A6BEfoeeRGJywEh",
              "LFNTYraetVioAPnGJht4yNg2aUZFXR776cMeN9VMjXp",
              "USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA",
              "nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7",
              "BNso1VUJnh4zcfpZa6986Ea66P6TCp59hvtNJ8b1X85",
              "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
              "Bybit2vBJGhPF52GBdNaQfUJ6ZpThSgHBobjWZpLPb4B",
              "9zNQRsGLjNKwCUU5Gq5LR8beUCPzQMVMqKAi3SSZh54u",
              "he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9A",
              "HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr",
              "7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx",
              "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
              "AiXxRGmRc5oDiFXbEeRX9obPpr3Zir7rks1ef2NjddiF",
              "JDzPbXboQYWVmdxXS3LbvjM52RtsV1QaSv2AzoCiai2o",
              "SarosY6Vscao718M4A778z4CGtvcwcGef5M9MEH1LGL",
              "DriFtupJYLTosbwoN8koMbEYSx54aFAVLddWsbksjwg7",
              "KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS",
              "LAYER4xPpTCb3QL8S9u41EAhAX7mhBn8Q6xMTwY2Yzc",
              "CARDSccUMFKoPRZxt5vt3ksUbxEFEcnZ3H2pd3dKxYjp",
              "A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6",
              "NeonTjSjsuo3rexg9o6vHuMXw62f9V7zvmu8M8Zut44",
              "MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey",
              "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt",
              "J3umBWqhSjd13sag1E1aUojViWvPYA5dFNyqpKuX3WXj",
              "TNSRxcUxoT9xBG3de7PiJyTDYu7kskLqcpddxnEJAS6",
              "RoamA1USA8xjvpTJZ6RvvxyDRzNh6GCA1zVGKSiMVkn",
              "31k88G5Mq7ptbRDf3AM13HAq6wRQHXHikR8hik7wPygk",
              "CLoUDKc4Ane7HeQcPpE3YHnznRxhMimJ4MyaUqyHFzAu",
              "4LLbsb5ReP3yEtYzmXewyGjcir5uXtKFURtaEUVC2AHs",
              "STREAMribRwybYpMmSYoCsQUdr6MZNXEqHgm7p1gu9M",
              "ZEXy1pqteRu3n13kdyh4LwPQknkFk3GzmMYMuNadWPo",
              "FRAGMEWj2z65qM62zqKhNtwNFskdfKs4ekDUDX3b4VD5",
              "ATLASXmbPQxBUYbxPQYEqzQBUHgiFCUsXx2v2f9mCL",
              "haioZJAWTMaR4SFhZRwFBBejnGDPiwLTqrDiKpwH31h",
              "poLisWXnNRwC6oBu1vHiuKQzFjGL4XDSu4g9qjz9qVk"
            ]}
            Fungible: true
          }
          PostBalanceInUSD: {ge: "5000000"}
        }
        Block: {Time: {since: "2024-12-01T00:00:00Z"}}
        Transaction: {Result: {Success: true}}
      }
    ) {
      TokenSupplyUpdate {
        Currency {
          Name
          Symbol
          MintAddress
          Decimals
          Uri
          Fungible
          Native
          TokenStandard
        }
        Marketcap: PostBalanceInUSD
        TotalSupply: PostBalance
      }
      Block {
        Time
        Height
      }
      price_data: joinDEXTradeByTokens(
        join: inner
        Trade_Currency_MintAddress: TokenSupplyUpdate_Currency_MintAddress
        where: {
          Transaction: {Result: {Success: true}}
          Block: {Time: {since_relative: {hours_ago: 24}}}
        }
      ) {
        Trade {
          current_price: PriceInUSD(maximum: Block_Time)
          price_24h_ago: PriceInUSD(
            minimum: Block_Time
            if: {Block: {Time: {since_relative: {hours_ago: 24}}}}
          )
        }
        price_change_24h: calculate(
          expression: "(($Trade_current_price - $Trade_price_24h_ago) / $Trade_price_24h_ago) * 100"
        )
      }
    }
  }
}`;

// GraphQL query for mid-range Solana memecoins (3M-10M market cap) - Enhanced with latest data
const MID_RANGE_TOKENS_QUERY = `{
  Solana {
    TokenSupplyUpdates(
      limitBy: {by: TokenSupplyUpdate_Currency_MintAddress, count: 1}
      limit: {count: 100}
      orderBy: {descending: Block_Time}
      where: {
        TokenSupplyUpdate: {
          Currency: {
            MintAddress: {notIn: [
              "So11111111111111111111111111111111111111112",
              "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
              "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
              "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
              "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
              "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
              "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
              "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
              "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof",
              "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
              "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7AR5T4nud4EkHBof",
              "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",
              "AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB",
              "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E",
              "he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9Ct",
              "6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU",
              "USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX",
              "BXXkv6z8ykpG1yuvUDPgh732wzVHB69RnB9YgSYh3itW",
              "SENBBKVCM7homnf5RX9zqpf1GFe935hnbU4uVzY1Y6M",
              "5tB5D6DGJMxxHYmNkfJNG237x6pZGEwTzGpUUh62yQJ7",
              "XBGdqJ9P175hCC1LangCEyXWNeCPHaKWA17tymz2PrY",
              "3dQTr7ror2QPKQ3GbBCokJUmjErGg8kTJzdnYjNfvi3Z",
              "RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a",
              "octo82drBEdm8CSDaEKBymVn86TBtgmPnDdmE64PTqJ",
              "Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1",
              "3dgCCb15HMQSA4Pn3Tfii5vRk7aRqTH95LJjxzsG2Mug"
            ]}
            Fungible: true
          }
          PostBalanceInUSD: {ge: "3000000", le: "10000000"}
        }
        Block: {Time: {since: "2024-12-01T00:00:00Z"}}
        Transaction: {Result: {Success: true}}
      }
    ) {
      TokenSupplyUpdate {
        Currency {
          Name
          Symbol
          MintAddress
          Decimals
          Uri
          Fungible
          Native
          TokenStandard
        }
        Marketcap: PostBalanceInUSD
        TotalSupply: PostBalance
      }
      Block {
        Time
        Height
      }
      price_data: joinDEXTradeByTokens(
        join: inner
        Trade_Currency_MintAddress: TokenSupplyUpdate_Currency_MintAddress
        where: {
          Transaction: {Result: {Success: true}}
          Block: {Time: {since_relative: {hours_ago: 24}}}
        }
      ) {
        Trade {
          current_price: PriceInUSD(maximum: Block_Time)
          price_24h_ago: PriceInUSD(
            minimum: Block_Time
            if: {Block: {Time: {since_relative: {hours_ago: 24}}}}
          )
        }
        price_change_24h: calculate(
          expression: "(($Trade_current_price - $Trade_price_24h_ago) / $Trade_price_24h_ago) * 100"
        )
      }
    }
  }
}`;

// Secure API endpoint with smart fallback logic
app.get('/api/tokens', async (req, res) => {
    try {
        // Validate API keys exist
        if (!API_KEY && !COINGECKO_API_KEY) {
            return res.status(500).json({
                error: 'No API keys configured. Please check your .env file.'
            });
        }

        // Get market cap filter from query parameters
        const marketCapFilter = req.query.filter || 'all';
        const isMiddleRange = marketCapFilter === 'mid-range';
        const isTrending = marketCapFilter === 'trending';

        // Check cache first
        const cachedData = getCachedTokens(marketCapFilter);
        if (cachedData) {
            // Return cached data immediately
            return res.json(cachedData);
        }

        let data;
        let apiUsed = 'bitquery';
        let fallbackUsed = false;

        // Trending: ALWAYS use SolanaTracker API
        if (isTrending) {
            if (!SOLANATRACKER_API_KEY) {
                return res.status(500).json({
                    error: 'SolanaTracker API key required for trending tokens'
                });
            }
            debugLog('🔥 Trending filter: Using SolanaTracker only');
            safeLog('🔥 Trending filter: Using SolanaTracker');
            data = await fetchFromSolanaTracker();
            apiUsed = 'solanatracker';
        }
        // Mid-range: ALWAYS use BitQuery (no CoinGecko backup)
        else if (isMiddleRange) {
            if (!API_KEY) {
                return res.status(500).json({
                    error: 'Primary API key required for mid-range tokens'
                });
            }
            debugLog('🔍 Mid-range filter: Using BitQuery only');
            safeLog('🔍 Mid-range filter: Using primary data source');
            data = await fetchFromBitQuery(marketCapFilter);
        }
        // All coins: FORCE CoinGecko API (as per user request)
        else {
            if (!COINGECKO_API_KEY) {
                return res.status(500).json({
                    error: 'CoinGecko API key required for All coins view'
                });
            }
            debugLog('🦎 Using CoinGecko for All coins (forced by configuration)');
            safeLog('📊 Using CoinGecko data source for All coins');
            data = await fetchFromCoinGecko();
            apiUsed = 'coingecko';
        }

        // Track which API was used
        lastApiUsed = apiUsed;

        // Filter out tokens with both current_price and price_24h_ago as 0 (all APIs)
        if (data.data && data.data.Solana && data.data.Solana.TokenSupplyUpdates) {
            const originalCount = data.data.Solana.TokenSupplyUpdates.length;
            const filteredTokensList = []; // Collect filtered tokens for detailed logging

            data.data.Solana.TokenSupplyUpdates = data.data.Solana.TokenSupplyUpdates.filter(tokenData => {
                const priceData = tokenData.price_data;
                if (priceData && priceData.Trade) {
                    const currentPrice = priceData.Trade.current_price;
                    const price24hAgo = priceData.Trade.price_24h_ago;

                    // Convert null/undefined to 0 for comparison
                    const currentPriceValue = Number(currentPrice) || 0;
                    const price24hAgoValue = Number(price24hAgo) || 0;

                    // Check if token should be filtered
                    const shouldFilter = (currentPriceValue === 0 || price24hAgoValue === 0);

                    if (shouldFilter) {
                        const symbol = tokenData.TokenSupplyUpdate?.Currency?.Symbol || 'Unknown';
                        const name = tokenData.TokenSupplyUpdate?.Currency?.Name || 'Unknown';
                        const marketCap = tokenData.TokenSupplyUpdate?.Marketcap || 'Unknown';

                        // Add to filtered list for detailed console display
                        filteredTokensList.push({
                            symbol: symbol,
                            name: name,
                            marketCap: marketCap,
                            currentPrice: currentPrice,
                            price24hAgo: price24hAgo,
                            reason: currentPriceValue === 0 ? 'current_price = 0' : 'price_24h_ago = 0'
                        });

                        debugLog(`🚫 Filtering out ${symbol}: current_price=${currentPrice}, price_24h_ago=${price24hAgo}`);
                    }

                    // Filter out tokens where either current_price is 0 OR price_24h_ago is 0
                    return !shouldFilter;
                }
                return true; // Keep tokens without price data (shouldn't happen but safety check)
            });
            const filteredCount = data.data.Solana.TokenSupplyUpdates.length;

            if (originalCount !== filteredCount) {
                debugLog(`🔍 Price filter (${apiUsed}): Removed ${originalCount - filteredCount} tokens with zero prices`);
                safeLog(`🔍 Filtered out ${originalCount - filteredCount} tokens with invalid price data`);

                // Display detailed list of filtered tokens in console
                console.log('\n' + '='.repeat(80));
                console.log('🚫 FILTERED TOKENS WITH ZERO PRICES - DETAILED LIST');
                console.log('='.repeat(80));
                filteredTokensList.forEach((token, index) => {
                    console.log(`${index + 1}. ${token.symbol} (${token.name})`);
                    console.log(`   💰 Market Cap: ${token.marketCap}`);
                    console.log(`   💲 Current Price: ${token.currentPrice}`);
                    console.log(`   📊 24h Ago Price: ${token.price24hAgo}`);
                    console.log(`   ❌ Filtered Reason: ${token.reason}`);
                    console.log('   ' + '-'.repeat(50));
                });
                console.log('='.repeat(80) + '\n');
            }
        }

        // Process tokens to add images (only for BitQuery tokens, CoinGecko and SolanaTracker already have images)
        if (data.data && data.data.Solana && data.data.Solana.TokenSupplyUpdates && apiUsed === 'bitquery') {
            debugLog('🖼️ Processing token images from BitQuery...');
            safeLog('🖼️ Processing token images from primary source...');

            const tokensWithImages = await Promise.all(
                data.data.Solana.TokenSupplyUpdates.map(async (tokenData) => {
                    try {
                        const uri = tokenData.TokenSupplyUpdate.Currency.Uri;
                        const imageUrl = await getTokenImage(uri);

                        return {
                            ...tokenData,
                            TokenSupplyUpdate: {
                                ...tokenData.TokenSupplyUpdate,
                                Currency: {
                                    ...tokenData.TokenSupplyUpdate.Currency,
                                    ImageUrl: imageUrl // Add image URL to currency data
                                }
                            }
                        };
                    } catch (error) {
                        console.warn(`Failed to process image for token ${tokenData.TokenSupplyUpdate.Currency.Symbol}:`, error.message);
                        // Return original data without image on error
                        return {
                            ...tokenData,
                            TokenSupplyUpdate: {
                                ...tokenData.TokenSupplyUpdate,
                                Currency: {
                                    ...tokenData.TokenSupplyUpdate.Currency,
                                    ImageUrl: null
                                }
                            }
                        };
                    }
                })
            );

            // Update the data structure with processed tokens
            data.data.Solana.TokenSupplyUpdates = tokensWithImages;
            console.log(`✅ Processed ${tokensWithImages.length} tokens with image data`);
        } else if (apiUsed === 'coingecko') {
            debugLog('✅ CoinGecko tokens already include image URLs');
            safeLog('✅ Secondary source tokens already include image URLs');
        } else if (apiUsed === 'solanatracker') {
            debugLog('✅ SolanaTracker tokens already include image URLs');
            safeLog('✅ SolanaTracker tokens already include image URLs');
        }

        // Return processed data to frontend (API provider info sanitized for security)
        const response = {
            ...data,
            apiInfo: {
                version: apiUsed === 'bitquery' ? 'V1' : (apiUsed === 'solanatracker' ? 'Trending' : 'V2'),
                fallbackUsed: fallbackUsed,
                isMiddleRange: isMiddleRange,
                isTrending: isTrending
                // Removed: source, currentPreference (security enhancement)
            }
        };

        // Cache the response for future requests
        setCachedTokens(marketCapFilter, response);

        res.json(response);

    } catch (error) {
        console.error('❌ Error fetching tokens:', error);
        res.status(500).json({
            error: 'Failed to fetch token data',
            details: error.message
        });
    }
});

// API source management endpoints
app.get('/api/source', (req, res) => {
    res.json({
        currentSource: currentApiSource,
        lastUsed: lastApiUsed,
        availableApis: {
            bitquery: !!API_KEY,
            coingecko: !!COINGECKO_API_KEY
        }
    });
});

app.post('/api/set-source', (req, res) => {
    try {
        const { source } = req.body;

        if (!source || !['auto', 'bitquery', 'coingecko'].includes(source)) {
            return res.status(400).json({
                error: 'Invalid source. Must be one of: auto, bitquery, coingecko'
            });
        }

        // Validate API availability
        if (source === 'bitquery' && !API_KEY) {
            return res.status(400).json({
                error: 'Primary API key not configured'
            });
        }

        if (source === 'coingecko' && !COINGECKO_API_KEY) {
            return res.status(400).json({
                error: 'Backup API key not configured'
            });
        }

        currentApiSource = source;
        console.log(`🔄 API source changed to: ${source}`);

        res.json({
            success: true,
            newSource: currentApiSource,
            message: `API source switched to ${source}`
        });

    } catch (error) {
        res.status(500).json({
            error: 'Failed to change API source',
            details: error.message
        });
    }
});

// DexScreener API proxy endpoint for sponsored coins (with 5-minute cache)
app.get('/api/dexscreener/:address', async (req, res) => {
    try {
        const { address } = req.params;

        if (!address) {
            return res.status(400).json({
                error: 'Mint address is required'
            });
        }

        // Check cache first (5-minute cache for sponsored coins)
        const now = Date.now();
        const cachedEntry = dexScreenerCache.get(address);

        if (cachedEntry && (now - cachedEntry.lastUpdate < DEXSCREENER_CACHE_DURATION)) {
            const cacheAge = Math.floor((now - cachedEntry.lastUpdate) / 1000);
            console.log(`📦 Serving cached DexScreener data for ${address} (age: ${cacheAge}s)`);
            return res.json({
                success: true,
                data: cachedEntry.data,
                cached: true,
                cacheAge: cacheAge
            });
        }

        // Cache expired or doesn't exist, fetch fresh data
        console.log(`🔍 Fetching fresh DexScreener data for: ${address}`);

        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);

        if (!response.ok) {
            throw new Error(`DexScreener API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.pairs || data.pairs.length === 0) {
            return res.status(404).json({
                error: 'No pairs found for this token'
            });
        }

        const token = data.pairs[0];

        const tokenData = {
            symbol: token.baseToken.symbol || 'Unknown',
            name: token.baseToken.name || 'Unknown Token',
            address: address,
            marketCap: Number(token.fdv) || 0,
            imageUrl: token.info?.imageUrl || null,
            website: token.url || `https://dexscreener.com/solana/${address}`
        };

        // Cache the response for 5 minutes
        dexScreenerCache.set(address, {
            data: tokenData,
            lastUpdate: Date.now()
        });
        console.log(`💾 Cached DexScreener data for ${address} (5-minute cache)`);

        res.json({
            success: true,
            data: tokenData,
            cached: false
        });
    } catch (error) {
        console.error('❌ Error fetching from DexScreener:', error);

        // Try to return stale cache if available (graceful degradation)
        const cachedEntry = dexScreenerCache.get(req.params.address);
        if (cachedEntry) {
            console.log(`⚠️ Returning stale cached data due to error`);
            return res.json({
                success: true,
                data: cachedEntry.data,
                cached: true,
                stale: true
            });
        }

        res.status(500).json({
            error: 'Failed to fetch token data',
            details: error.message
        });
    }
});

// Solana price endpoint (fetches on-demand with 1-minute cache)
app.get('/api/solana-price', async (req, res) => {
    try {
        if (!COINMARKETCAP_API_KEY) {
            return res.status(500).json({
                error: 'CoinMarketCap API key not configured'
            });
        }

        // Fetch price (will use cache if less than 1 minute old)
        const price = await fetchSolanaPrice();

        if (!price) {
            return res.status(503).json({
                error: 'Price data not available',
                message: 'Please try again in a moment'
            });
        }

        res.json({
            success: true,
            price: price,
            symbol: 'SOL',
            currency: 'USD',
            lastUpdate: solanaPriceCache.lastUpdate,
            cached: Date.now() - solanaPriceCache.lastUpdate < CACHE_DURATION
        });
    } catch (error) {
        console.error('❌ Error serving Solana price:', error);
        res.status(500).json({
            error: 'Failed to fetch Solana price',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        apis: {
            bitquery: !!API_KEY,
            coingecko: !!COINGECKO_API_KEY,
            solanatracker: !!SOLANATRACKER_API_KEY,
            coinmarketcap: !!COINMARKETCAP_API_KEY
        },
        currentSource: currentApiSource,
        lastUsed: lastApiUsed,
        solanaPriceCache: {
            available: !!solanaPriceCache.price,
            lastUpdate: solanaPriceCache.lastUpdate
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🔒 ENHANCED SECURE API server running on http://localhost:${PORT}`);
    console.log(`🛡️ Security Features Enabled:`);
    console.log(`   ✅ API keys secured in .env file`);
    console.log(`   ✅ Smart rate limiting (500 req/15min per IP - cached requests friendly)`);
    console.log(`   ✅ Security headers (XSS, CSRF, etc.)`);
    console.log(`   ✅ Input validation & sanitization`);
    console.log(`   ✅ Request size limits (10MB)`);
    debugLog(`🔍 BitQuery API: ${API_KEY ? '✅ Configured' : '❌ Missing'}`);
    debugLog(`🦎 CoinGecko API: ${COINGECKO_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    debugLog(`🔥 SolanaTracker API: ${SOLANATRACKER_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    safeLog(`📡 Primary API: ${API_KEY ? '✅ Configured' : '❌ Missing'}`);
    safeLog(`📡 Backup API: ${COINGECKO_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    safeLog(`🔥 Trending API: ${SOLANATRACKER_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`🚀 Current API source: ${currentApiSource}`);
    console.log(`🌐 Frontend endpoints:`);
    console.log(`   📊 Get tokens: http://localhost:${PORT}/api/tokens`);
    console.log(`   🔄 Change API: http://localhost:${PORT}/api/set-source`);
    console.log(`   ❤️ Health check: http://localhost:${PORT}/api/health`);
});