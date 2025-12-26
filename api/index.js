const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Import environment variables
const API_KEY = process.env.BITQUERY_API_KEY;
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const SOLANATRACKER_API_KEY = process.env.SOLANATRACKER_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

// Configuration constants
const BITQUERY_ENDPOINT = 'https://streaming.bitquery.io/eap';
const COINGECKO_ENDPOINT = 'https://api.coingecko.com/api/v3';
const SOLANATRACKER_ENDPOINT = 'https://data.solanatracker.io';
const CACHE_DURATION = 60 * 1000;
const DEXSCREENER_CACHE_DURATION = 5 * 60 * 1000;

// Caches
let tokensCacheAll = { data: null, lastUpdate: null };
let tokensCacheMidRange = { data: null, lastUpdate: null };
let tokensCacheTrending = { data: null, lastUpdate: null };
let solanaPriceCache = { price: null, lastUpdate: null };
let dexScreenerCache = new Map();
const imageCache = new Map();

let currentApiSource = 'auto';
let lastApiUsed = 'bitquery';

const isDevelopment = process.env.NODE_ENV !== 'production';
const debugLog = (...args) => { if (isDevelopment) console.log(...args); };
const safeLog = (...args) => console.log(...args);

// Helper functions
function getCachedTokens(filter) {
    const now = Date.now();
    let cache = filter === 'mid-range' ? tokensCacheMidRange : filter === 'trending' ? tokensCacheTrending : tokensCacheAll;
    if (cache.data && cache.lastUpdate && (now - cache.lastUpdate < CACHE_DURATION)) {
        const cacheAge = Math.floor((now - cache.lastUpdate) / 1000);
        console.log(`📦 Serving cached tokens for '${filter}' filter (age: ${cacheAge}s)`);
        return cache.data;
    }
    return null;
}

function setCachedTokens(filter, data) {
    const cacheObj = { data: data, lastUpdate: Date.now() };
    if (filter === 'mid-range') tokensCacheMidRange = cacheObj;
    else if (filter === 'trending') tokensCacheTrending = cacheObj;
    else tokensCacheAll = cacheObj;
    console.log(`💾 Cached tokens for '${filter}' filter`);
}

async function getTokenImage(uri) {
    try {
        if (!uri) return null;
        if (imageCache.has(uri)) return imageCache.get(uri);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(uri, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Meme360-Bot/1.0' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            imageCache.set(uri, null);
            return null;
        }

        const metadata = await response.json();
        const imageUrl = metadata.image || metadata.logo || metadata.icon || null;
        imageCache.set(uri, imageUrl);
        return imageUrl;
    } catch (error) {
        imageCache.set(uri, null);
        return null;
    }
}

async function fetchSolanaPrice() {
    try {
        const now = Date.now();
        if (solanaPriceCache.price && solanaPriceCache.lastUpdate && (now - solanaPriceCache.lastUpdate < CACHE_DURATION)) {
            console.log(`💰 Serving cached Solana price: $${solanaPriceCache.price.toFixed(2)}`);
            return solanaPriceCache.price;
        }

        console.log(`🔄 Fetching fresh Solana price from CoinMarketCap...`);
        const response = await fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SOL', {
            headers: {
                'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`CoinMarketCap API error: ${response.status}`);

        const data = await response.json();
        const price = data.data.SOL.quote.USD.price;

        solanaPriceCache = { price: price, lastUpdate: Date.now() };
        console.log(`💰 Updated Solana price: $${price.toFixed(2)}`);
        return price;
    } catch (error) {
        console.error('❌ Failed to fetch Solana price:', error.message);
        if (solanaPriceCache.price) {
            console.log(`⚠️ Returning stale cached price: $${solanaPriceCache.price.toFixed(2)}`);
            return solanaPriceCache.price;
        }
        return null;
    }
}

// GraphQL Queries (keeping them from server.js)
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
              "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"
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

const MID_RANGE_TOKENS_QUERY = TOP_TOKENS_QUERY.replace(
    'PostBalanceInUSD: {ge: "5000000"}',
    'PostBalanceInUSD: {ge: "3000000", le: "10000000"}'
);

// API Functions
async function fetchFromBitQuery(marketCapFilter) {
    const isMiddleRange = marketCapFilter === 'mid-range';
    const query = isMiddleRange ? MID_RANGE_TOKENS_QUERY : TOP_TOKENS_QUERY;

    const response = await fetch(BITQUERY_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({ query: query, variables: {} })
    });

    if (!response.ok) throw new Error(`Primary API error: ${response.status}`);
    return await response.json();
}

async function fetchFromCoinGecko() {
    const url = `${COINGECKO_ENDPOINT}/coins/markets?vs_currency=usd&category=solana-meme-coins&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h&include_platform=true`;

    const response = await fetch(url, {
        headers: { 'x-cg-demo-api-key': COINGECKO_API_KEY }
    });

    if (!response.ok) throw new Error(`Backup API error: ${response.status}`);

    const data = await response.json();
    const transformedTokens = data.map((token) => {
        // Shorten specific long token names and symbols
        let tokenName = token.name;
        let tokenSymbol = token.symbol.toUpperCase();

        if (tokenSymbol === '1-COIN-CAN-CHANGE-YOUR-LIFE') {
            tokenName = '1-COIN';
            tokenSymbol = '1-COIN';
        }

        return {
        TokenSupplyUpdate: {
            Currency: {
                Name: tokenName,
                Symbol: tokenSymbol,
                MintAddress: token.platforms?.solana || `coingecko:${token.id}`,
                Decimals: 6,
                Uri: null,
                Fungible: true,
                Native: false,
                TokenStandard: 'Token',
                ImageUrl: token.image
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
    };
    });

    return { data: { Solana: { TokenSupplyUpdates: transformedTokens } } };
}

async function fetchFromSolanaTracker() {
    const url = `${SOLANATRACKER_ENDPOINT}/tokens/trending/24h`;
    const response = await fetch(url, {
        headers: { 'x-api-key': SOLANATRACKER_API_KEY }
    });

    if (!response.ok) throw new Error(`SolanaTracker API error: ${response.status}`);

    const data = await response.json();
    const transformedTokens = data.map((tokenData) => {
        const token = tokenData.token;
        const pool = tokenData.pools && tokenData.pools.length > 0 ? tokenData.pools[0] : null;
        const events = tokenData.events || {};

        let changePercent = 0;
        if (events['24h'] && events['24h'].priceChangePercentage !== undefined) {
            changePercent = events['24h'].priceChangePercentage;
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

    return { data: { Solana: { TokenSupplyUpdates: transformedTokens } } };
}

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        apis: {
            bitquery: !!API_KEY,
            coingecko: !!COINGECKO_API_KEY,
            solanatracker: !!SOLANATRACKER_API_KEY,
            coinmarketcap: !!COINMARKETCAP_API_KEY
        }
    });
});

app.get('/api/tokens', async (req, res) => {
    try {
        if (!API_KEY && !COINGECKO_API_KEY) {
            return res.status(500).json({ error: 'No API keys configured' });
        }

        const marketCapFilter = req.query.filter || 'all';
        const cachedData = getCachedTokens(marketCapFilter);
        if (cachedData) return res.json(cachedData);

        let data, apiUsed = 'bitquery';

        if (marketCapFilter === 'trending') {
            if (!SOLANATRACKER_API_KEY) {
                return res.status(500).json({ error: 'SolanaTracker API key required' });
            }
            data = await fetchFromSolanaTracker();
            apiUsed = 'solanatracker';
        } else if (marketCapFilter === 'mid-range') {
            if (!API_KEY) {
                return res.status(500).json({ error: 'Primary API key required' });
            }
            data = await fetchFromBitQuery(marketCapFilter);
        } else {
            if (!COINGECKO_API_KEY) {
                return res.status(500).json({ error: 'CoinGecko API key required' });
            }
            data = await fetchFromCoinGecko();
            apiUsed = 'coingecko';
        }

        lastApiUsed = apiUsed;

        // Filter out zero price tokens
        if (data.data?.Solana?.TokenSupplyUpdates) {
            data.data.Solana.TokenSupplyUpdates = data.data.Solana.TokenSupplyUpdates.filter(tokenData => {
                const priceData = tokenData.price_data;
                if (priceData?.Trade) {
                    const currentPriceValue = Number(priceData.Trade.current_price) || 0;
                    const price24hAgoValue = Number(priceData.Trade.price_24h_ago) || 0;
                    return currentPriceValue !== 0 && price24hAgoValue !== 0;
                }
                return true;
            });
        }

        // Process images for BitQuery
        if (data.data?.Solana?.TokenSupplyUpdates && apiUsed === 'bitquery') {
            const tokensWithImages = await Promise.all(
                data.data.Solana.TokenSupplyUpdates.map(async (tokenData) => {
                    const uri = tokenData.TokenSupplyUpdate.Currency.Uri;
                    const imageUrl = await getTokenImage(uri);
                    return {
                        ...tokenData,
                        TokenSupplyUpdate: {
                            ...tokenData.TokenSupplyUpdate,
                            Currency: {
                                ...tokenData.TokenSupplyUpdate.Currency,
                                ImageUrl: imageUrl
                            }
                        }
                    };
                })
            );
            data.data.Solana.TokenSupplyUpdates = tokensWithImages;
        }

        const response = {
            ...data,
            apiInfo: {
                version: apiUsed === 'bitquery' ? 'V1' : (apiUsed === 'solanatracker' ? 'Trending' : 'V2'),
                fallbackUsed: false,
                isMiddleRange: marketCapFilter === 'mid-range',
                isTrending: marketCapFilter === 'trending'
            }
        };

        setCachedTokens(marketCapFilter, response);
        res.json(response);

    } catch (error) {
        console.error('❌ Error fetching tokens:', error);
        res.status(500).json({ error: 'Failed to fetch token data', details: error.message });
    }
});

app.get('/api/dexscreener/:address', async (req, res) => {
    try {
        const { address } = req.params;
        if (!address) return res.status(400).json({ error: 'Mint address is required' });

        const now = Date.now();
        const cachedEntry = dexScreenerCache.get(address);

        if (cachedEntry && (now - cachedEntry.lastUpdate < DEXSCREENER_CACHE_DURATION)) {
            const cacheAge = Math.floor((now - cachedEntry.lastUpdate) / 1000);
            console.log(`📦 Serving cached DexScreener data for ${address} (age: ${cacheAge}s)`);
            return res.json({ success: true, data: cachedEntry.data, cached: true, cacheAge: cacheAge });
        }

        console.log(`🔍 Fetching fresh DexScreener data for: ${address}`);
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);

        if (!response.ok) throw new Error(`DexScreener API error: ${response.status}`);

        const data = await response.json();
        if (!data.pairs || data.pairs.length === 0) {
            return res.status(404).json({ error: 'No pairs found for this token' });
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

        dexScreenerCache.set(address, { data: tokenData, lastUpdate: Date.now() });
        console.log(`💾 Cached DexScreener data for ${address}`);

        res.json({ success: true, data: tokenData, cached: false });
    } catch (error) {
        console.error('❌ Error fetching from DexScreener:', error);
        const cachedEntry = dexScreenerCache.get(req.params.address);
        if (cachedEntry) {
            return res.json({ success: true, data: cachedEntry.data, cached: true, stale: true });
        }
        res.status(500).json({ error: 'Failed to fetch token data', details: error.message });
    }
});

app.get('/api/solana-price', async (req, res) => {
    try {
        if (!COINMARKETCAP_API_KEY) {
            return res.status(500).json({ error: 'CoinMarketCap API key not configured' });
        }

        const price = await fetchSolanaPrice();
        if (!price) {
            return res.status(503).json({ error: 'Price data not available', message: 'Please try again in a moment' });
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
        res.status(500).json({ error: 'Failed to fetch Solana price', details: error.message });
    }
});

// Export for Vercel serverless
module.exports = app;
