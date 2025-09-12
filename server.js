const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// BitQuery configuration - API key is now secure on server
const BITQUERY_ENDPOINT = 'https://streaming.bitquery.io/eap';
const API_KEY = process.env.BITQUERY_API_KEY; // Secure in .env file

// CoinGecko configuration - backup API for All coins
const COINGECKO_ENDPOINT = 'https://api.coingecko.com/api/v3';
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY; // Secure in .env file

// API source management
let currentApiSource = 'auto'; // 'auto', 'bitquery', 'coingecko'
let lastApiUsed = 'bitquery'; // Track which API was last used

// Image cache to avoid refetching same URIs
const imageCache = new Map();

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

// CoinGecko service functions
async function fetchFromCoinGecko() {
    try {
        console.log('🦎 Fetching tokens from CoinGecko API (Solana memecoins)...');
        
        const url = `${COINGECKO_ENDPOINT}/coins/markets?vs_currency=usd&category=solana-meme-coins&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`;
        
        const response = await fetch(url, {
            headers: {
                'x-cg-demo-api-key': COINGECKO_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ CoinGecko returned ${data.length} tokens`);
        
        // Transform CoinGecko data to match our app structure
        const transformedTokens = data
            .filter(token => token.market_cap && token.market_cap >= 5000000) // Filter for 5M+ market cap
            .map((token, index) => ({
                TokenSupplyUpdate: {
                    Currency: {
                        Name: token.name,
                        Symbol: token.symbol.toUpperCase(),
                        MintAddress: token.id, // Using CoinGecko ID as identifier
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

        console.log(`✅ Transformed ${transformedTokens.length} CoinGecko tokens`);
        return {
            data: {
                Solana: {
                    TokenSupplyUpdates: transformedTokens
                }
            }
        };
        
    } catch (error) {
        console.error('❌ CoinGecko API error:', error.message);
        throw error;
    }
}

async function fetchFromBitQuery(marketCapFilter) {
    const isMiddleRange = marketCapFilter === 'mid-range';
    const query = isMiddleRange ? MID_RANGE_TOKENS_QUERY : TOP_TOKENS_QUERY;
    const filterDesc = isMiddleRange ? '(3M-10M market cap)' : '(5M+ market cap)';

    console.log(`🔍 Fetching ${filterDesc} tokens from BitQuery...`);
    
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
        throw new Error(`BitQuery API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Successfully fetched data from BitQuery');
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
              "BnSOL6DYAJ3tBrHMZ8zqVDJwgpZPEnYVHnP8nCYJ7uAP",
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
        
        let data;
        let apiUsed = 'bitquery';
        let fallbackUsed = false;

        // Mid-range: ALWAYS use BitQuery (no CoinGecko backup)
        if (isMiddleRange) {
            if (!API_KEY) {
                return res.status(500).json({ 
                    error: 'BitQuery API key required for mid-range tokens' 
                });
            }
            console.log('🔍 Mid-range filter: Using BitQuery only');
            data = await fetchFromBitQuery(marketCapFilter);
        } 
        // All coins: Smart API selection with fallback
        else {
            // Determine which API to try first
            let shouldTryBitQuery = true;
            let shouldTryCoinGecko = true;

            if (currentApiSource === 'bitquery') {
                shouldTryCoinGecko = false;
            } else if (currentApiSource === 'coingecko') {
                shouldTryBitQuery = false;
            }
            // 'auto' mode tries BitQuery first, then CoinGecko

            // Try BitQuery first (if allowed)
            if (shouldTryBitQuery && API_KEY) {
                try {
                    console.log('🚀 Trying BitQuery first...');
                    data = await fetchFromBitQuery(marketCapFilter);
                    apiUsed = 'bitquery';
                } catch (bitqueryError) {
                    console.warn('⚠️ BitQuery failed:', bitqueryError.message);
                    
                    // Only fallback to CoinGecko if we're in auto mode or CoinGecko is forced
                    if (currentApiSource === 'auto' && shouldTryCoinGecko && COINGECKO_API_KEY) {
                        console.log('🔄 Falling back to CoinGecko...');
                        try {
                            data = await fetchFromCoinGecko();
                            apiUsed = 'coingecko';
                            fallbackUsed = true;
                        } catch (coingeckoError) {
                            console.error('❌ Both APIs failed');
                            throw new Error(`BitQuery: ${bitqueryError.message}. CoinGecko: ${coingeckoError.message}`);
                        }
                    } else {
                        throw bitqueryError;
                    }
                }
            }
            // Try CoinGecko first (if forced)
            else if (shouldTryCoinGecko && COINGECKO_API_KEY) {
                console.log('🦎 Using CoinGecko (manual selection)');
                data = await fetchFromCoinGecko();
                apiUsed = 'coingecko';
            }
            else {
                throw new Error('No available API source for the current configuration');
            }
        }

        // Track which API was used
        lastApiUsed = apiUsed;
        
        // Process tokens to add images (only for BitQuery tokens, CoinGecko already has images)
        if (data.data && data.data.Solana && data.data.Solana.TokenSupplyUpdates && apiUsed === 'bitquery') {
            console.log('🖼️ Processing token images from BitQuery...');
            
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
            console.log('✅ CoinGecko tokens already include image URLs');
        }
        
        // Return processed data to frontend with API source info
        const response = {
            ...data,
            apiInfo: {
                source: apiUsed,
                fallbackUsed: fallbackUsed,
                currentPreference: currentApiSource,
                isMiddleRange: isMiddleRange
            }
        };
        
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
                error: 'BitQuery API key not configured'
            });
        }
        
        if (source === 'coingecko' && !COINGECKO_API_KEY) {
            return res.status(400).json({
                error: 'CoinGecko API key not configured'
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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        apis: {
            bitquery: !!API_KEY,
            coingecko: !!COINGECKO_API_KEY
        },
        currentSource: currentApiSource,
        lastUsed: lastApiUsed
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🔒 Secure API server running on http://localhost:${PORT}`);
    console.log(`🛡️ API keys safely hidden in .env file`);
    console.log(`🔍 BitQuery API: ${API_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`🦎 CoinGecko API: ${COINGECKO_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`🚀 Current API source: ${currentApiSource}`);
    console.log(`🌐 Frontend endpoints:`);
    console.log(`   📊 Get tokens: http://localhost:${PORT}/api/tokens`);
    console.log(`   🔄 Change API: http://localhost:${PORT}/api/set-source`);
    console.log(`   ❤️ Health check: http://localhost:${PORT}/api/health`);
});