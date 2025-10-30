// 🔒 SECURE: API key is now safely stored on server-side
// No more exposed credentials in frontend code!

// 💎 SPONSORED COINS DATA - Featured premium projects
// First coin will be fetched from DexScreener API dynamically
const sponsoredCoins = [
    {
        mintAddress: '7a9bV18JwNQDZePjoXLnU69Y41GFZPuSLVtrNM9mbonk', // Will be fetched from DexScreener
        symbol: null,
        name: null,
        address: null,
        marketCap: 0,
        imageUrl: null,
        website: null,
        isLoading: true
    },
    {
        symbol: 'YOUR COIN',
        name: 'Your coin here',
        address: null,
        marketCap: 0,
        imageUrl: null,
        website: null,
        description: 'Advertise your coin here',
        isPlaceholder: true
    },
    {
        symbol: 'YOUR COIN',
        name: 'Your coin here',
        address: null,
        marketCap: 0,
        imageUrl: null,
        website: null,
        description: 'Advertise your coin here',
        isPlaceholder: true
    }
];

// Mock data for demonstration (remove when using real API)
const mockTokens = [
    {
        symbol: 'PEPE',
        name: 'Pepe The Frog',
        address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
        volume: 12500000,
        trades: 1250,
        buyers: 890,
        sellers: 360,
        marketCap: 85000000,
        price: 0.0000125
    },
    {
        symbol: 'DOGE',
        name: 'Dogecoin Solana',
        address: '8kJGPp1Mvv9Lfq9QVjCDkPZhqhGVq3mSHEFYgLqRgbhe',
        volume: 8900000,
        trades: 980,
        buyers: 720,
        sellers: 260,
        marketCap: 62000000,
        price: 0.0000089
    },
    {
        symbol: 'SHIB',
        name: 'Shiba Inu Sol',
        address: '9Dks8q1cTLsQLYKnPwQZk4VawKyM2GqCaYLgLTQKP9dP',
        volume: 7200000,
        trades: 850,
        buyers: 650,
        sellers: 200,
        marketCap: 45000000,
        price: 0.0000072
    },
    {
        symbol: 'BONK',
        name: 'Bonk Meme',
        address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        volume: 6800000,
        trades: 750,
        buyers: 580,
        sellers: 170,
        marketCap: 38000000,
        price: 0.0000068
    },
    {
        symbol: 'FLOKI',
        name: 'Floki Inu Sol',
        address: '5z3EqYQo9AZGCNk8s4YkZy2xF1w5PQQhbTtVCMWs7vQm',
        volume: 5500000,
        trades: 680,
        buyers: 520,
        sellers: 160,
        marketCap: 32000000,
        price: 0.0000055
    },
    {
        symbol: 'MOON',
        name: 'Moon Token',
        address: '3FKKKKq5c4QdG6sZmH6HxQdpCfV8WxfNT2qFaK7RqLhn',
        volume: 4200000,
        trades: 520,
        buyers: 420,
        sellers: 100,
        marketCap: 28000000,
        price: 0.0000042
    }
];


// 🌐 FETCH SPONSORED COIN: Fetch coin data from DexScreener API via server proxy
async function fetchSponsoredCoin(mintAddress) {
    try {
        console.log(`🔍 Fetching sponsored coin data for: ${mintAddress}`);
        const response = await fetch(`/api/dexscreener/${mintAddress}`);

        if (!response.ok) {
            throw new Error(`DexScreener API error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            console.warn('⚠️ No data found for this token');
            return null;
        }

        // Override image with local image for sponsored coin
        const coinData = result.data;
        coinData.imageUrl = '/image.webp';

        return coinData;
    } catch (error) {
        console.error('❌ Error fetching sponsored coin:', error);
        return null;
    }
}

// 💎 SPONSORED COINS: Create and render sponsored coin tiles
function createSponsoredTile(coin, index) {
    const tile = document.createElement('div');
    tile.className = 'sponsored-tile';

    // Check if this is a placeholder tile
    if (coin.isPlaceholder) {
        tile.classList.add('sponsored-placeholder');

        tile.innerHTML = `
            <div class="sponsored-badge">AD</div>
            <div class="placeholder-icon">📈</div>
            <div class="tile-content">
                <div class="sponsored-symbol">Your</div>
                <div class="sponsored-name">coin</div>
                <div class="sponsored-address">
                    Contact us
                </div>
            </div>
        `;

        // Add click handler for placeholder - opens Telegram
        tile.addEventListener('click', () => {
            trackEvent('placeholder_ad_click', {
                position: index + 1,
                page_title: document.title
            });
            window.open('https://t.me/phoenixIam', '_blank');
        });

        // Add hover effects for placeholder
        tile.addEventListener('mouseenter', () => {
            tile.style.transform = 'scale(1.02)';
            tile.style.filter = 'brightness(1.2)';
        });

        tile.addEventListener('mouseleave', () => {
            tile.style.transform = 'scale(1)';
            tile.style.filter = 'brightness(1)';
        });

        return tile;
    }

    // Regular sponsored coin logic
    // Use similar structure to ranking tiles but with "AD" instead of rank
    const imageElement = coin.imageUrl ?
        `<img src="${coin.imageUrl}" alt="${coin.symbol}" class="sponsored-image" onerror="this.style.display='none'">` :
        '';

    tile.innerHTML = `
        <div class="sponsored-badge">AD</div>
        ${imageElement}
        <div class="tile-content">
            <div class="sponsored-symbol">${coin.symbol}</div>
            <div class="sponsored-name">${coin.name}</div>
            <div class="sponsored-address">
                $${formatNumber(coin.marketCap)}
            </div>
        </div>
    `;

    // Add click handler to open website or Dexscreener
    tile.addEventListener('click', () => {
        trackCoinClick(coin.symbol, 'AD', 'sponsored');
        if (coin.website) {
            window.open(coin.website, '_blank');
        } else {
            openDexscreener(coin.address, coin.symbol);
        }
    });

    // Add hover effects similar to ranking tiles
    tile.addEventListener('mouseenter', () => {
        tile.style.transform = 'scale(1.02)';
        tile.style.filter = 'brightness(1.1)';
    });

    tile.addEventListener('mouseleave', () => {
        tile.style.transform = 'scale(1)';
        tile.style.filter = 'brightness(1)';
    });

    return tile;
}

async function populateSponsoredSection() {
    const sponsoredGrid = document.getElementById('sponsored-grid');
    if (!sponsoredGrid) return;

    // Clear existing content
    sponsoredGrid.innerHTML = '';

    // Fetch data for coins that need it (coins with mintAddress)
    for (let i = 0; i < sponsoredCoins.length; i++) {
        const coin = sponsoredCoins[i];

        // If coin has mintAddress, fetch data from DexScreener
        if (coin.mintAddress && coin.isLoading) {
            const fetchedData = await fetchSponsoredCoin(coin.mintAddress);

            if (fetchedData) {
                // Update the coin object with fetched data
                sponsoredCoins[i] = {
                    ...fetchedData,
                    mintAddress: coin.mintAddress
                };
                console.log(`✅ Successfully fetched sponsored coin: ${fetchedData.symbol}`);
            } else {
                console.warn('⚠️ Failed to fetch sponsored coin, using placeholder');
                sponsoredCoins[i] = {
                    symbol: 'ERROR',
                    name: 'Failed to load',
                    address: coin.mintAddress,
                    marketCap: 0,
                    imageUrl: null,
                    website: null,
                    isPlaceholder: true
                };
            }
        }
    }

    // Create and append sponsored tiles
    sponsoredCoins.forEach((coin, index) => {
        const tile = createSponsoredTile(coin, index);
        sponsoredGrid.appendChild(tile);
    });
}

// 🔍 CHECK API AVAILABILITY: Check if BitQuery API is available and hide mid-range option if not
async function checkApiAvailability() {
    try {
        const response = await fetch('/api/health');
        const healthData = await response.json();

        const dropdown = document.getElementById('market-cap-dropdown');
        const midRangeOption = dropdown.querySelector('option[value="mid-range"]');

        if (!healthData.apis.bitquery && midRangeOption) {
            // Hide mid-range option if BitQuery API is not available
            midRangeOption.style.display = 'none';
            midRangeOption.disabled = true;

            // If currently selected filter is mid-range, switch to 'all'
            if (currentMarketCapFilter === 'mid-range') {
                dropdown.value = 'all';
                currentMarketCapFilter = 'all';
            }
        } else if (healthData.apis.bitquery && midRangeOption) {
            // Show mid-range option if BitQuery API is available
            midRangeOption.style.display = 'block';
            midRangeOption.disabled = false;
        }

        // Track API health status
        trackApiHealthEvent(healthData.apis);
    } catch (error) {
        // If health check fails, assume APIs are unavailable and hide mid-range
        const dropdown = document.getElementById('market-cap-dropdown');
        const midRangeOption = dropdown.querySelector('option[value="mid-range"]');

        if (midRangeOption) {
            midRangeOption.style.display = 'none';
            midRangeOption.disabled = true;

            if (currentMarketCapFilter === 'mid-range') {
                dropdown.value = 'all';
                currentMarketCapFilter = 'all';
            }
        }
    }
}

async function fetchTokens(marketCapFilter = 'all') {
    try {
        let filterDesc;
        if (marketCapFilter === 'mid-range') {
            filterDesc = '3M-10M market cap';
        } else if (marketCapFilter === 'trending') {
            filterDesc = 'trending tokens (24h)';
        } else {
            filterDesc = '5M+ market cap';
        }
        // 🔒 PRODUCTION: Removed console logging for security

        // 🛡️ SECURE: Call our own API endpoint (API key is hidden on server)
        const url = marketCapFilter === 'all' ? '/api/tokens' : `/api/tokens?filter=${marketCapFilter}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            console.warn(`API endpoint error: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // ✅ Response received (logging removed for production security)
        
        // Handle new API response structure with apiInfo
        if (data.apiInfo) {
            // 📡 API source information processed (logging removed for production security)
            updateApiStatus(data.apiInfo);
        }
        
        if (data.error) {
            console.warn('API Error:', data.error);
            // Fallback to mock data if API fails
            return mockTokens;
        }
        
        if (data.errors) {
            console.warn('GraphQL Errors:', data.errors);
            // Fallback to mock data if API fails
            return mockTokens;
        }
        
        // Transform the API data with real price changes
        const tokens = data.data?.Solana?.TokenSupplyUpdates || [];
        // Token count processed (logging removed for production security)
        
        const transformedTokens = tokens.map((tokenData, index) => {
            const supplyUpdate = tokenData.TokenSupplyUpdate;
            const currency = supplyUpdate.Currency;
            const marketCap = parseFloat(supplyUpdate.Marketcap);
            const priceData = tokenData.price_data;

            // Extract real price change data
            let changePercent = 0;
            let isPositive = true;
            let currentPrice = 0;
            let hasValidChange = false;

            if (priceData && priceData.Trade && priceData.price_change_24h !== null) {
                changePercent = parseFloat(priceData.price_change_24h) || 0;
                isPositive = changePercent >= 0;
                currentPrice = parseFloat(priceData.Trade.current_price) || 0;
                hasValidChange = !isNaN(changePercent) && priceData.Trade.price_24h_ago && priceData.Trade.price_24h_ago > 0;
            } else {
                // Fallback: no valid price change data
                changePercent = 0;
                isPositive = true;
                currentPrice = marketCap / 1000000000; // Estimate from market cap
                hasValidChange = false;
            }

            return {
                symbol: currency.Symbol || 'UNKNOWN',
                name: currency.Name || 'Unknown Token',
                address: currency.MintAddress,
                marketCap: marketCap,
                volume: marketCap * 0.1, // Still estimated
                trades: Math.floor(Math.random() * 2000) + 200, // Still estimated
                buyers: Math.floor(Math.random() * 800) + 100, // Still estimated
                sellers: Math.floor(Math.random() * 300) + 50, // Still estimated
                price: currentPrice,
                rank: index + 1, // Will be updated after sorting
                changePercent: changePercent,
                isPositive: isPositive,
                hasValidChange: hasValidChange,
                imageUrl: currency.ImageUrl || null, // Add image URL from backend
                uri: currency.Uri || null // Keep URI for debugging if needed
            };
        }).sort((a, b) => b.marketCap - a.marketCap) // Sort by market cap descending (highest first)
        .map((token, index) => ({ ...token, rank: index + 1 })); // Update ranks after sorting

        return transformedTokens;

    } catch (error) {
        // Fallback to mock data if API fails
        return mockTokens;
    }
}

function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
}

function formatPrice(price) {
    if (price < 0.000001) return price.toExponential(2);
    if (price < 0.001) return price.toFixed(6);
    return price.toFixed(4);
}

function createCoin360Tile(token, index, maxMarketCap, marketCapFilter = 'all') {
    const tile = document.createElement('div');
    tile.className = 'coin360-tile';
    
    const tokenAddress = token.address || 'N/A';
    const marketCapRatio = Math.sqrt(token.marketCap / maxMarketCap);
    
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 480;
    
    // Calculate grid spans based on market cap (Masonry-style)
    const baseSpan = 1;
    const maxSpan = 4;
    let colSpan = Math.max(baseSpan, Math.min(maxSpan, Math.ceil(marketCapRatio * maxSpan)));
    let rowSpan = Math.max(baseSpan, Math.min(4, Math.ceil(marketCapRatio * 3)));
    
    
    // Mobile-specific logic for better 2-per-row layout
    if (isMobile) {
        // For All coins: Top 3 get span 2 (half row), others get span 1 or 2 based on market cap
        if (marketCapFilter === 'all') {
            if (index < 3) {
                colSpan = 2; // Top 3 tokens take 2 columns (half row)
                rowSpan = 2; // Increased height for hierarchy
                tile.classList.add('mobile-large');
            } else if (index < 10) {
                colSpan = 2; // Next 7 also take 2 columns for better visibility
                rowSpan = 1;
                tile.classList.add('mobile-medium');
            } else {
                colSpan = 1; // Smaller tokens take 1 column
                rowSpan = 1;
                tile.classList.add('mobile-small');
            }
        }
        // For Mid-range: Top 39 get span 2, rest get span 1
        else if (marketCapFilter === 'mid-range') {
            if (index < 39) {
                colSpan = 2; // Top 39 tokens take 2 columns (half row)
                rowSpan = index < 3 ? 2 : 1; // Top 3 get more height for hierarchy
                tile.classList.add(index < 3 ? 'mobile-large' : 'mobile-medium');
            } else {
                colSpan = 1; // Rest take 1 column
                rowSpan = 1;
                tile.classList.add('mobile-small');
            }
        }
    } else {
        // Desktop logic (original)
        // Ensure top 3 tokens are prominent
        if (index < 3) {
            colSpan = Math.max(colSpan, 3);
            rowSpan = Math.max(rowSpan, 2);
        }
        
        // Apply scaling for mid-range filter to reduce overall box sizes
        if (marketCapFilter === 'mid-range') {
            const midRangeScale = 0.6; // Scale down by 40%
            colSpan = Math.max(baseSpan, Math.ceil(colSpan * midRangeScale));
            rowSpan = Math.max(baseSpan, Math.ceil(rowSpan * midRangeScale));
            
            // Ensure top 3 tokens remain prominent but scaled
            if (index < 3) {
                colSpan = Math.max(colSpan, 2);
                rowSpan = Math.max(rowSpan, 1);
            }
        }
    }
    
    // Color based on real price change
    let backgroundColor, borderColor;

    if (!token.hasValidChange) {
        backgroundColor = `hsla(0, 0%, 40%, 0.4)`;
        borderColor = `hsla(0, 0%, 50%, 0.3)`;
    } else {
        const absChange = Math.abs(token.changePercent);

        if (token.isPositive) {
            // Green intensity: 0.1% = light, 10%+ = deep green
            const intensity = Math.min(1, absChange / 10); // Scale to 10% max for full intensity
            const greenAlpha = 0.15 + (intensity * 0.7); // 0.15 to 0.85 opacity range
            const saturation = 50 + (intensity * 30); // 50% to 80% saturation
            const lightness = 50 - (intensity * 10); // 50% to 40% lightness (darker = more intense)

            backgroundColor = `hsla(120, ${saturation}%, ${lightness}%, ${greenAlpha})`;
            borderColor = `hsla(120, ${saturation + 10}%, ${lightness + 5}%, ${0.4 + intensity * 0.5})`;
        } else {
            // Red intensity: -0.1% = light, -10%+ = deep red
            const intensity = Math.min(1, absChange / 10); // Scale to 10% max for full intensity
            const redAlpha = 0.15 + (intensity * 0.7); // 0.15 to 0.85 opacity range
            const saturation = 60 + (intensity * 25); // 60% to 85% saturation
            const lightness = 55 - (intensity * 15); // 55% to 40% lightness (darker = more intense)

            backgroundColor = `hsla(0, ${saturation}%, ${lightness}%, ${redAlpha})`;
            borderColor = `hsla(0, ${saturation + 5}%, ${lightness + 5}%, ${0.4 + intensity * 0.5})`;
        }
    }
    
    // Set grid spans and style
    tile.style.gridColumn = `span ${colSpan}`;
    tile.style.gridRow = `span ${rowSpan}`;
    tile.style.backgroundColor = backgroundColor;
    tile.style.border = `1px solid ${borderColor}`;

    // Add class for large tiles based on width (227px or larger)
    // Calculate approximate tile width: colSpan × (container width / 12 columns)
    // We'll add the class after the tile is rendered and we can measure its actual width
    
    // Dynamic font sizes based on span size (bigger and more readable)
    const spanArea = colSpan * rowSpan;
    const symbolSize = Math.max(14, 12 + spanArea * 2);
    const marketCapSize = Math.max(11, 9 + spanArea * 1.5);
    const percentSize = Math.max(10, 8 + spanArea * 1.2);
    
    // Format percentage display
    let percentageDisplay;
    if (!token.hasValidChange) {
        percentageDisplay = '<span style="color: rgba(255,255,255,0.5); font-size: 0.8em;">N/A</span>';
    } else {
        const sign = token.isPositive ? '+' : '';
        percentageDisplay = `<span class="${token.isPositive ? 'positive' : 'negative'}">${sign}${token.changePercent.toFixed(2)}%</span>`;
    }

    // Create image element with fallback and size-based sizing
    // Calculate approximate box size (assuming each grid unit is ~56px)
    const approximateBoxWidth = colSpan * 56;
    const approximateBoxHeight = rowSpan * 56;
    const minBoxDimension = Math.min(approximateBoxWidth, approximateBoxHeight);
    
    let imageClass = 'tile-image';
    if (minBoxDimension <= 112) {
        imageClass = 'tile-image tile-image-18px';
    } else if (marketCapFilter === 'all' && index >= 8) {
        imageClass = 'tile-image tile-image-small';
    }
    
    const imageElement = token.imageUrl ? 
        `<img src="${token.imageUrl}" alt="${token.symbol}" class="${imageClass}" onerror="this.style.display='none'">` : 
        '';
    
    const rankDisplay = `#${index + 1}`;
    const rankClass = 'tile-rank';
    
    tile.innerHTML = `
        <div class="${rankClass}">${rankDisplay}</div>
        ${imageElement}
        <div class="tile-content">
            <div class="tile-symbol" style="font-size: ${symbolSize}px">${token.symbol}</div>
            <div class="tile-marketcap" style="font-size: ${marketCapSize}px">$${formatNumber(token.marketCap)}</div>
            <div class="tile-percentage" style="font-size: ${percentSize}px">
                ${percentageDisplay}
            </div>
        </div>
    `;

    // Add click handler to open Dexscreener
    tile.addEventListener('click', () => {
        trackCoinClick(token.symbol, index + 1, 'main_grid');
        openDexscreener(tokenAddress, token.symbol);
    });

    // Add hover effect
    tile.addEventListener('mouseenter', () => {
        tile.style.transform = 'scale(1.02)';
        tile.style.filter = 'brightness(1.1)';
        showCoin360Tooltip(token, tile);
    });

    tile.addEventListener('mouseleave', () => {
        tile.style.transform = 'scale(1)';
        tile.style.filter = 'brightness(1)';
        hideCoin360Tooltip();
    });

    // Check tile width after rendering and add large-tile class if width >= 227px
    setTimeout(() => {
        const tileWidth = tile.offsetWidth;
        if (tileWidth >= 227) {
            tile.classList.add('large-tile');
        }
    }, 0);

    return tile;
}

function createTokenCard(token, index) {
    // This function is kept for compatibility but not used in heatmap mode
    const card = document.createElement('div');
    card.className = 'token-card';
    card.style.animationDelay = `${index * 0.05}s`;
    card.style.cursor = 'pointer';

    const rank = index + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-default';
    const tokenAddress = token.address || 'N/A';

    card.innerHTML = `
        <div class="token-rank ${rankClass}">#${rank}</div>
        <div class="token-header">
            <div class="token-symbol">${token.symbol}</div>
            <div class="token-name">${token.name}</div>
        </div>
        <div class="token-stats">
            <div class="stat-row">
                <span class="stat-label">Market Cap:</span>
                <span class="stat-value glow">$${formatNumber(token.marketCap)}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Price:</span>
                <span class="stat-value">$${formatPrice(token.price)}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Rank:</span>
                <span class="stat-value">#${token.rank}</span>
            </div>
        </div>
        <div class="token-actions">
            <div class="token-address">
                <span class="address-label">CA:</span>
                <span class="address-value" onclick="event.stopPropagation(); copyAddress('${tokenAddress}')">${tokenAddress.substring(0, 8)}...</span>
            </div>
            <div class="dex-link" onclick="event.stopPropagation(); openDexscreener('${tokenAddress}', '${token.symbol}')">
                📊 View on DEX
            </div>
        </div>
    `;

    card.addEventListener('click', () => {
        openDexscreener(tokenAddress, token.symbol);
    });

    return card;
}


function openDexscreener(address, symbol) {
    if (address && address !== 'N/A') {
        let targetUrl;
        
        // Check if this is CoinGecko data (prefixed with "coingecko:")
        if (address.startsWith('coingecko:')) {
            // For CoinGecko tokens, open CoinGecko page directly
            const coinId = address.replace('coingecko:', '');
            targetUrl = `https://www.coingecko.com/coins/${coinId}`;
            showToast('Opening on CoinGecko...');
        } else {
            // For BitQuery tokens, use the actual mint address on DexScreener
            targetUrl = `https://dexscreener.com/solana/${address}`;
            showToast('Opening on DexScreener...');
        }
        
        window.open(targetUrl, '_blank');
    } else {
        showToast('Token address not available');
    }
}

function copyAddress(address) {
    navigator.clipboard.writeText(address).then(() => {
        showToast('Address copied to clipboard!');
    });
}

function showCoin360Tooltip(token, element) {
    hideCoin360Tooltip(); // Remove existing tooltip
    
    const tooltip = document.createElement('div');
    tooltip.className = 'coin360-tooltip';
    tooltip.innerHTML = `
        <div class="tooltip-header">
            <strong>${token.symbol}</strong>
            <span class="tooltip-rank">#${token.rank}</span>
        </div>
        <div class="tooltip-name">${token.name}</div>
        <div class="tooltip-stats">
            <div>Market Cap: <strong>$${formatNumber(token.marketCap)}</strong></div>
            <div>Price: <strong>$${formatPrice(token.price)}</strong></div>
            ${token.hasValidChange 
                ? `<div>24h Change: <strong class="${token.isPositive ? 'positive' : 'negative'}">${token.isPositive ? '+' : ''}${token.changePercent.toFixed(2)}%</strong></div>`
                : `<div>24h Change: <strong style="color: rgba(255,255,255,0.5)">N/A (No Data)</strong></div>`
            }
            <div>Address: <strong>${token.address.substring(0, 12)}...</strong></div>
        </div>
        <div class="tooltip-note">Click to view token details</div>
    `;
    
    document.body.appendChild(tooltip);
    
    // Position tooltip near the element
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 280; // Expected tooltip width
    const tooltipHeight = 200; // Expected tooltip height
    
    // Check viewport boundaries
    const spaceOnRight = window.innerWidth - rect.right;
    const spaceOnLeft = rect.left;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Priority: Check if element is in bottom third of screen
    const isInBottomThird = rect.top > (window.innerHeight * 2/3);
    
    if (isInBottomThird && spaceAbove >= tooltipHeight + 15) {
        // Show above if element is in bottom third and there's space above
        tooltip.style.left = `${rect.left + (rect.width - tooltipWidth) / 2}px`;
        tooltip.style.top = `${rect.top - tooltipHeight - 10}px`;
        
        // Ensure it doesn't go off the left edge
        const tooltipLeft = parseInt(tooltip.style.left);
        if (tooltipLeft < 10) {
            tooltip.style.left = '10px';
        }
        // Ensure it doesn't go off the right edge
        if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
            tooltip.style.left = `${window.innerWidth - tooltipWidth - 10}px`;
        }
    } else if (spaceOnRight >= tooltipWidth + 15) {
        // Show on right side if there's enough space
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top}px`;
    } else if (spaceOnLeft >= tooltipWidth + 15) {
        // Show on left side if there's enough space
        tooltip.style.left = `${rect.left - tooltipWidth - 10}px`;
        tooltip.style.top = `${rect.top}px`;
    } else if (spaceAbove >= tooltipHeight + 15) {
        // Show above if no space on sides but space above
        tooltip.style.left = `${rect.left + (rect.width - tooltipWidth) / 2}px`;
        tooltip.style.top = `${rect.top - tooltipHeight - 10}px`;
        
        // Ensure it doesn't go off the left edge
        const tooltipLeft = parseInt(tooltip.style.left);
        if (tooltipLeft < 10) {
            tooltip.style.left = '10px';
        }
        // Ensure it doesn't go off the right edge
        if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
            tooltip.style.left = `${window.innerWidth - tooltipWidth - 10}px`;
        }
    } else {
        // Fallback: Show below (original behavior)
        tooltip.style.left = `${rect.left + (rect.width - tooltipWidth) / 2}px`;
        tooltip.style.top = `${rect.bottom + 10}px`;
        
        // Ensure it doesn't go off the left edge
        const tooltipLeft = parseInt(tooltip.style.left);
        if (tooltipLeft < 10) {
            tooltip.style.left = '10px';
        }
        // Ensure it doesn't go off the right edge
        if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
            tooltip.style.left = `${window.innerWidth - tooltipWidth - 10}px`;
        }
    }
    
    // Show tooltip
    setTimeout(() => {
        tooltip.classList.add('show');
    }, 50);
}

function hideCoin360Tooltip() {
    const existing = document.querySelector('.coin360-tooltip');
    if (existing) {
        existing.remove();
    }
}

function showTokenTooltip(token, element) {
    showCoin360Tooltip(token, element); // Use the new tooltip
}

function hideTokenTooltip() {
    hideCoin360Tooltip(); // Use the new tooltip
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2000);
}


function updateApiStatus(apiInfo) {
    const statusElement = document.getElementById('api-status');
    
    if (statusElement) {
        let statusText = '';
        let statusClass = '';
        
        if (apiInfo.isTrending) {
            statusText = 'Trending';
            statusClass = 'trending';
        } else if (apiInfo.isMiddleRange) {
            statusText = 'V1';
            statusClass = 'primary';
        } else {
            if (apiInfo.fallbackUsed) {
                statusText = `${apiInfo.version} (backup)`;
                statusClass = 'fallback';
            } else {
                statusText = apiInfo.version;
                statusClass = 'primary';
            }
        }
        
        statusElement.textContent = statusText;
        statusElement.className = `api-status ${statusClass}`;
    }
}


async function loadTokens(bypassCooldown = false, marketCapFilter = 'all') {
    const currentTime = Date.now();
    const timeSinceLastRefresh = currentTime - lastRefreshTime;

    // Check cooldown only if not bypassing (first load bypasses)
    if (!bypassCooldown && lastRefreshTime > 0 && timeSinceLastRefresh < REFRESH_COOLDOWN) {
        const remainingTime = Math.ceil((REFRESH_COOLDOWN - timeSinceLastRefresh) / 1000 / 60);
        showToast(`Please wait ${remainingTime} more minutes before refreshing again`);
        updateRefreshButtonState(timeSinceLastRefresh);
        return;
    }

    // Set loading state and disable dropdown
    setDropdownLoadingState(true);

    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const tokensGrid = document.getElementById('tokens-grid');
    const tokenCount = document.getElementById('token-count');

    loading.style.display = 'block';
    errorMessage.style.display = 'none';
    tokensGrid.innerHTML = '';

    try {
        const tokens = await fetchTokens(marketCapFilter);

        // Populate sponsored section first
        populateSponsoredSection();

        loading.style.display = 'none';

        if (tokens && tokens.length > 0) {
            // Store tokens for layout switching
            currentTokens = tokens;

            // Find the maximum market cap for sizing
            const maxMarketCap = Math.max(...tokens.map(t => t.marketCap));

            // Create Coin360-style tiles
            tokens.forEach((token, index) => {
                const tile = createCoin360Tile(token, index, maxMarketCap, marketCapFilter);
                tokensGrid.appendChild(tile);
            });

            // Also update table view if it's currently active
            const tokensTable = document.getElementById('tokens-table');
            if (tokensTable && tokensTable.style.display === 'table') {
                populateTable(tokens);
            }

            tokenCount.textContent = tokens.length;

            // Update refresh time and button state
            lastRefreshTime = currentTime;
            updateRefreshButtonState(0);
        } else {
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        loading.style.display = 'none';
        errorMessage.style.display = 'block';
    } finally {
        // Always re-enable dropdown when done (success or error)
        setDropdownLoadingState(false);
    }
}

// Layout switching functionality
let currentTokens = [];

// Market cap filter management
let currentMarketCapFilter = 'all';

// Refresh cooldown management
let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 15 * 60 * 1000; // 15 minutes in milliseconds

// Loading state management
let isLoading = false;

function setDropdownLoadingState(loading) {
    const dropdown = document.getElementById('market-cap-dropdown');
    if (dropdown) {
        dropdown.disabled = loading;
        dropdown.style.opacity = loading ? '0.6' : '1';
        dropdown.style.cursor = loading ? 'not-allowed' : 'pointer';
    }
    isLoading = loading;
}

function updateRefreshButtonState(timeSinceLastRefresh) {
    const refreshBtn = document.querySelector('.refresh-btn');
    const refreshIcon = document.querySelector('.refresh-icon');
    
    if (timeSinceLastRefresh < REFRESH_COOLDOWN && lastRefreshTime > 0) {
        const remainingTime = Math.ceil((REFRESH_COOLDOWN - timeSinceLastRefresh) / 1000 / 60);
        refreshBtn.style.opacity = '0.6';
        refreshBtn.style.cursor = 'not-allowed';
        refreshBtn.innerHTML = `
            <span class="refresh-icon">⏰</span>
            Wait ${remainingTime}min
        `;
        
        // Set up interval to update countdown
        const updateInterval = setInterval(() => {
            const currentTimeSinceRefresh = Date.now() - lastRefreshTime;
            if (currentTimeSinceRefresh >= REFRESH_COOLDOWN) {
                clearInterval(updateInterval);
                refreshBtn.style.opacity = '1';
                refreshBtn.style.cursor = 'pointer';
                refreshBtn.innerHTML = `
                    <span class="refresh-icon">🔄</span>
                    Refresh
                `;
            } else {
                const remainingMinutes = Math.ceil((REFRESH_COOLDOWN - currentTimeSinceRefresh) / 1000 / 60);
                refreshBtn.innerHTML = `
                    <span class="refresh-icon">⏰</span>
                    Wait ${remainingMinutes}min
                `;
            }
        }, 10000); // Update every 10 seconds
    } else {
        refreshBtn.style.opacity = '1';
        refreshBtn.style.cursor = 'pointer';
        refreshBtn.innerHTML = `
            <span class="refresh-icon">🔄</span>
            Refresh
        `;
    }
}

function changeLayout(layout) {
    const tokensGrid = document.getElementById('tokens-grid');
    const tokensTable = document.getElementById('tokens-table');

    // Track layout change
    trackEvent('layout_change', {
        new_layout: layout,
        page_title: document.title
    });

    if (layout === 'list') {
        tokensGrid.style.display = 'none';
        tokensTable.style.display = 'table';
        if (currentTokens.length > 0) {
            populateTable(currentTokens);
        }
    } else {
        tokensGrid.style.display = 'grid';
        tokensTable.style.display = 'none';
    }
}

function createTableRow(token, index) {
    const row = document.createElement('tr');
    row.style.cursor = 'pointer';
    
    const tokenAddress = token.address || 'N/A';

    // Format percentage display
    let percentageDisplay = 'N/A';
    let percentClass = '';
    if (token.hasValidChange) {
        const sign = token.isPositive ? '+' : '';
        percentageDisplay = `${sign}${token.changePercent.toFixed(2)}%`;
        percentClass = token.isPositive ? 'positive' : 'negative';
    }

    // Create image element for table
    const imageElement = token.imageUrl ?
        `<img src="${token.imageUrl}" alt="${token.symbol}" class="table-token-image" onerror="this.style.display='none'">` :
        '<div class="table-no-image">📊</div>';

    const rankDisplay = `#${index + 1}`;
    const rankClass = 'table-rank';

    row.innerHTML = `
        <td class="${rankClass}" data-label="Rank">${rankDisplay}</td>
        <td class="table-image" data-label="Image">${imageElement}</td>
        <td class="table-symbol" data-label="Symbol">${token.symbol}</td>
        <td data-label="Name">${token.name}</td>
        <td data-label="Market Cap">$${formatNumber(token.marketCap)}</td>
        <td data-label="Price">$${formatPrice(token.price)}</td>
        <td class="table-price-change ${percentClass}" data-label="24h Change">${percentageDisplay}</td>
        <td style="font-family: monospace; font-size: 0.75rem;" data-label="Address">${tokenAddress.substring(0, 12)}...</td>
    `;
    
    // Add click handler to open Dexscreener
    row.addEventListener('click', () => {
        trackCoinClick(token.symbol, index + 1, 'table');
        openDexscreener(tokenAddress, token.symbol);
    });
    
    return row;
}

function populateTable(tokens) {
    const tableBody = document.getElementById('tokens-table-body');
    tableBody.innerHTML = '';

    tokens.forEach((token, index) => {
        const row = createTableRow(token, index);
        tableBody.appendChild(row);
    });
}

// 🫧 BUBBLE VIEW FUNCTIONS
function getBubbleSize(marketCap, maxMarketCap) {
    const ratio = marketCap / maxMarketCap;
    if (ratio > 0.8) return 'bubble-xl';
    if (ratio > 0.6) return 'bubble-large';
    if (ratio > 0.4) return 'bubble-medium';
    if (ratio > 0.2) return 'bubble-small';
    return 'bubble-xs';
}

function getBubbleColor(token) {
    if (!token.hasValidChange) return 'bubble-neutral';

    const changePercent = Math.abs(token.changePercent);
    const baseClass = token.isPositive ? 'bubble-positive' : 'bubble-negative';

    // Add intensity based on percentage change
    if (changePercent >= 10) {
        return `${baseClass} intense`;
    } else if (changePercent >= 5) {
        return baseClass;
    } else {
        return `${baseClass} mild`;
    }
}

function createBubbleItem(token, index, maxMarketCap) {
    const bubble = document.createElement('div');
    bubble.className = `bubble-item ${getBubbleSize(token.marketCap, maxMarketCap)} ${getBubbleColor(token)}`;

    const changeText = token.hasValidChange ?
        `${token.isPositive ? '+' : ''}${token.changePercent.toFixed(2)}%` :
        'N/A';

    // Create image element if token has image
    const imageElement = token.imageUrl ?
        `<img src="${token.imageUrl}" alt="${token.symbol}" class="bubble-image" onerror="this.style.display='none'">` :
        '';

    bubble.innerHTML = `
        <div class="bubble-rank">#${index + 1}</div>
        ${imageElement}
        <div class="bubble-symbol">${token.symbol}</div>
        <div class="bubble-change">${changeText}</div>
        <div class="bubble-market-cap">$${formatNumber(token.marketCap)}</div>
    `;

    // Add random animation delay and variation for staggered floating effect
    const animationDelay = Math.random() * 6; // 0 to 6 seconds
    const animationDuration = 4 + Math.random() * 4; // 4 to 8 seconds
    const animationVariations = ['floatBubble', 'floatBubble2', 'floatBubble3'];
    const randomAnimation = animationVariations[Math.floor(Math.random() * animationVariations.length)];

    bubble.style.animationDelay = `${animationDelay}s`;
    bubble.style.animationDuration = `${animationDuration}s`;
    bubble.style.animationName = randomAnimation;

    // Add click handler
    bubble.addEventListener('click', () => {
        trackCoinClick(token.symbol, index + 1, 'bubble');
        openDexscreener(token.address, token.symbol);
    });

    return bubble;
}

function generateRandomPosition(container, bubbleSize, existingBubbles = []) {
    // Account for container padding (20px on all sides)
    const containerWidth = container.clientWidth - 40; // Subtract left + right padding
    const containerHeight = container.clientHeight - 40; // Subtract top + bottom padding

    // Get bubble dimensions based on size class - more distinct sizes
    let bubbleWidth, bubbleHeight;
    switch(bubbleSize) {
        case 'bubble-xl': bubbleWidth = bubbleHeight = 170; break;
        case 'bubble-large': bubbleWidth = bubbleHeight = 140; break;
        case 'bubble-medium': bubbleWidth = bubbleHeight = 110; break;
        case 'bubble-small': bubbleWidth = bubbleHeight = 85; break;
        case 'bubble-xs': bubbleWidth = bubbleHeight = 65; break;
        default: bubbleWidth = bubbleHeight = 110;
    }

    let attempts = 0;
    let position;
    // Use reasonable margin to account for ranking badges extending outside bubbles
    const margin = 30; // Sufficient margin to account for ranking badge (28px) plus some buffer

    // Ensure we have enough space for positioning
    const maxLeft = containerWidth - bubbleWidth - margin;
    const maxTop = containerHeight - bubbleHeight - margin;

    // Try random positioning first
    do {
        position = {
            left: Math.max(margin, Math.min(maxLeft, margin + Math.random() * (maxLeft - margin))),
            top: Math.max(margin, Math.min(maxTop, margin + Math.random() * (maxTop - margin)))
        };
        attempts++;
    } while (attempts < 50 && isOverlapping(position, bubbleWidth, bubbleHeight, existingBubbles));

    // If random fails, use intelligent grid placement
    if (attempts >= 50) {
        position = findGridPosition(containerWidth, containerHeight, bubbleWidth, bubbleHeight, existingBubbles, margin);
    }

    return position;
}

function findGridPosition(containerWidth, containerHeight, bubbleWidth, bubbleHeight, existingBubbles, margin) {
    // Calculate grid based on largest bubble size to ensure spacing
    const cellSize = 160; // Further increased cell size to accommodate largest bubbles (170px) with spacing
    const availableWidth = containerWidth - (margin * 2);
    const availableHeight = containerHeight - (margin * 2);
    const cols = Math.floor(availableWidth / cellSize);
    const rows = Math.floor(availableHeight / cellSize);

    // Create a grid and mark occupied cells
    const grid = Array(rows).fill().map(() => Array(cols).fill(false));

    // Mark existing bubbles in grid
    existingBubbles.forEach(existing => {
        const gridCol = Math.floor((existing.left - margin) / cellSize);
        const gridRow = Math.floor((existing.top - margin) / cellSize);
        if (gridRow >= 0 && gridRow < rows && gridCol >= 0 && gridCol < cols) {
            grid[gridRow][gridCol] = true;
        }
    });

    // Find first available cell
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (!grid[row][col]) {
                // Center the bubble in the cell with bounds checking
                const cellCenterX = margin + col * cellSize + (cellSize - bubbleWidth) / 2;
                const cellCenterY = margin + row * cellSize + (cellSize - bubbleHeight) / 2;

                // Ensure position is within bounds
                const safeLeft = Math.max(margin, Math.min(containerWidth - bubbleWidth - margin, cellCenterX));
                const safeTop = Math.max(margin, Math.min(containerHeight - bubbleHeight - margin, cellCenterY));

                return {
                    left: safeLeft + Math.random() * 10 - 5, // Smaller random offset
                    top: safeTop + Math.random() * 10 - 5
                };
            }
        }
    }

    // If grid is full, place in a safe fallback position
    const fallbackLeft = Math.max(margin, Math.min(containerWidth - bubbleWidth - margin, margin + (existingBubbles.length % cols) * cellSize));
    const fallbackTop = Math.max(margin, Math.min(containerHeight - bubbleHeight - margin, margin + Math.floor(existingBubbles.length / cols) * cellSize));

    return {
        left: fallbackLeft,
        top: fallbackTop
    };
}

function isOverlapping(position, width, height, existingBubbles) {
    const radius = width / 2;
    const centerX = position.left + radius;
    const centerY = position.top + radius;

    return existingBubbles.some(existing => {
        const existingCenterX = existing.left + existing.width / 2;
        const existingCenterY = existing.top + existing.height / 2;

        const distance = Math.sqrt(
            Math.pow(centerX - existingCenterX, 2) +
            Math.pow(centerY - existingCenterY, 2)
        );

        const minDistance = radius + existing.width / 2 + 15; // Increased buffer to 15px
        return distance < minDistance;
    });
}

function calculateOptimalHeight(tokenCount, container) {
    // Check if mobile
    const isMobile = window.innerWidth <= 768;
    const baseHeight = isMobile ? 550 : 650; // Minimum height
    const maxHeight = isMobile ? 1000 : 1400; // Increased maximum height for better spacing

    // Calculate how many tokens can fit in base height - use more conservative estimates
    const containerWidth = container.clientWidth - (isMobile ? 30 : 40); // Account for padding
    const cellSize = isMobile ? 110 : 160; // Increased cell size for better spacing (account for largest bubbles)
    const tokensPerRow = Math.floor(containerWidth / cellSize);
    const baseRowCount = Math.floor((baseHeight - (isMobile ? 30 : 40)) / cellSize); // Account for padding
    const baseTokenCapacity = tokensPerRow * baseRowCount;

    // More generous capacity calculation - reduce base capacity by 20% to ensure no overlapping
    const safeTokenCapacity = Math.floor(baseTokenCapacity * 0.8);

    // If tokens fit comfortably in base height, use base height
    if (tokenCount <= safeTokenCapacity) {
        return baseHeight;
    }

    // Calculate additional height needed with extra buffer
    const excessTokens = tokenCount - safeTokenCapacity;
    const additionalRows = Math.ceil(excessTokens / tokensPerRow);
    const additionalHeight = additionalRows * cellSize;

    // Add 20% extra height buffer to prevent any overlapping
    const bufferHeight = Math.floor(additionalHeight * 0.2);
    const calculatedHeight = baseHeight + additionalHeight + bufferHeight;

    // Cap at maximum height
    return Math.min(calculatedHeight, maxHeight);
}

function populateBubbles(tokens) {
    const bubbleContainer = document.getElementById('bubble-container');
    bubbleContainer.innerHTML = '';

    if (tokens.length === 0) return;

    // Calculate optimal height based on number of tokens
    const optimalHeight = calculateOptimalHeight(tokens.length, bubbleContainer);
    bubbleContainer.style.height = `${optimalHeight}px`;

    const maxMarketCap = Math.max(...tokens.map(t => t.marketCap));
    const existingBubbles = [];

    // Show all tokens like in box layout
    tokens.forEach((token, index) => {
        const bubble = createBubbleItem(token, index, maxMarketCap);
        const bubbleSize = getBubbleSize(token.marketCap, maxMarketCap);
        const position = generateRandomPosition(bubbleContainer, bubbleSize, existingBubbles);

        bubble.style.left = `${position.left}px`;
        bubble.style.top = `${position.top}px`;

        // Store position for overlap checking
        let bubbleWidth;
        switch(bubbleSize) {
            case 'bubble-xl': bubbleWidth = 140; break;
            case 'bubble-large': bubbleWidth = 110; break;
            case 'bubble-medium': bubbleWidth = 85; break;
            case 'bubble-small': bubbleWidth = 65; break;
            case 'bubble-xs': bubbleWidth = 45; break;
            default: bubbleWidth = 85;
        }

        existingBubbles.push({
            left: position.left,
            top: position.top,
            width: bubbleWidth,
            height: bubbleWidth
        });

        bubbleContainer.appendChild(bubble);
    });
}

function changeMarketCapFilter(filter) {
    // Prevent changing filter while loading
    if (isLoading) {
        showToast('Please wait for current data to load before switching filters');
        // Reset dropdown to current filter
        const dropdown = document.getElementById('market-cap-dropdown');
        if (dropdown) {
            dropdown.value = currentMarketCapFilter;
        }
        return;
    }

    // Track filter change
    const previousFilter = currentMarketCapFilter;
    trackFilterChange(filter, previousFilter);

    currentMarketCapFilter = filter;
    let filterDesc;
    if (filter === 'mid-range') {
        filterDesc = '3M-10M market cap';
    } else if (filter === 'trending') {
        filterDesc = 'trending tokens (24h)';
    } else {
        filterDesc = '5M+ market cap';
    }
    showToast(`Switching to ${filterDesc} view...`);

    // Load tokens with new filter, bypassing cooldown for filter changes
    loadTokens(true, filter);
}


function handleRefreshClick() {
    // Track refresh button click
    trackEvent('refresh_click', {
        page_title: document.title,
        current_filter: currentMarketCapFilter
    });

    // Load tokens without bypassing cooldown
    loadTokens(false, currentMarketCapFilter);
}


// Handle window resize to reapply mobile/desktop classes
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Re-render tokens with current filter to apply correct mobile/desktop styling
        if (currentTokens.length > 0) {
            const tokensGrid = document.getElementById('tokens-grid');
            const maxMarketCap = Math.max(...currentTokens.map(t => t.marketCap));
            tokensGrid.innerHTML = '';
            
            currentTokens.forEach((token, index) => {
                const tile = createCoin360Tile(token, index, maxMarketCap, currentMarketCapFilter);
                tokensGrid.appendChild(tile);
            });
        }
    }, 250); // Debounce resize events
});

// Auto-refresh removed to save API credits
// Use the refresh button to manually update data

// 📊 GOOGLE ANALYTICS: Enhanced event tracking functions
function trackEvent(eventName, parameters = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
}

function trackCoinClick(coinSymbol, coinRank, source) {
    trackEvent('coin_click', {
        coin_symbol: coinSymbol,
        coin_rank: coinRank,
        click_source: source, // 'main_grid', 'sponsored', 'table'
        page_title: document.title
    });
}

function trackFilterChange(filterType, previousFilter) {
    trackEvent('filter_change', {
        new_filter: filterType,
        previous_filter: previousFilter,
        page_title: document.title
    });
}

function trackAdvertiseClick() {
    trackEvent('advertise_cta_click', {
        page_title: document.title,
        cta_location: 'footer'
    });
}

function trackBannerClick(bannerName) {
    trackEvent('banner_ad_click', {
        banner_name: bannerName,
        page_title: document.title
    });
}

function trackApiHealthEvent(apiStatus) {
    trackEvent('api_health_check', {
        bitquery_status: apiStatus.bitquery ? 'available' : 'unavailable',
        coingecko_status: apiStatus.coingecko ? 'available' : 'unavailable',
        solanatracker_status: apiStatus.solanatracker ? 'available' : 'unavailable',
        page_title: document.title
    });
}

function trackContactClick(contactType) {
    trackEvent('contact_click', {
        contact_type: contactType,
        page_title: document.title
    });
}

// 🚀 INITIALIZE APPLICATION: Check API availability and load initial data
window.addEventListener('DOMContentLoaded', async () => {
    // Track page load
    trackEvent('page_view', {
        page_title: document.title,
        page_location: window.location.href
    });

    // Check API availability first to show/hide mid-range option
    await checkApiAvailability();

    // Load initial tokens with first load bypass
    loadTokens(true);

    // Check API availability every 5 minutes to handle runtime changes
    setInterval(checkApiAvailability, 5 * 60 * 1000);

    // Fetch Solana price initially and then every 30 seconds
    fetchSolanaPrice();
    setInterval(fetchSolanaPrice, 30000); // Update every 30 seconds (reads from server cache)
});

// Function to fetch and display Solana price (from server cache)
async function fetchSolanaPrice() {
    try {
        const response = await fetch('/api/solana-price');
        const data = await response.json();

        const priceFooter = document.getElementById('solana-price-footer');
        const priceValue = document.getElementById('solana-price-value');

        if (data && data.success && data.price) {
            const formattedPrice = `$${data.price.toFixed(2)}`;
            priceValue.textContent = formattedPrice;
            // Show the footer if it was hidden
            if (priceFooter) {
                priceFooter.style.display = 'flex';
            }
        } else {
            console.warn('Failed to fetch Solana price:', data.error || 'Unknown error');
            // Hide the footer if API is not working
            if (priceFooter) {
                priceFooter.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error fetching Solana price:', error);
        // Hide the footer on error to prevent breaking the site
        const priceFooter = document.getElementById('solana-price-footer');
        if (priceFooter) {
            priceFooter.style.display = 'none';
        }
    }
}

// FAQ Accordion Toggle Function
function toggleFaq(element) {
    const faqItem = element.parentElement;
    const faqAnswer = element.nextElementSibling;
    const toggle = element.querySelector('.faq-toggle');

    // Close all other FAQs
    const allFaqItems = document.querySelectorAll('.faq-item');
    allFaqItems.forEach(item => {
        if (item !== faqItem && item.classList.contains('active')) {
            item.classList.remove('active');
            const otherToggle = item.querySelector('.faq-toggle');
            if (otherToggle) otherToggle.textContent = '+';
        }
    });

    // Toggle current FAQ
    faqItem.classList.toggle('active');

    // Update toggle icon
    if (faqItem.classList.contains('active')) {
        toggle.textContent = '−';
    } else {
        toggle.textContent = '+';
    }
}

// Deployment fix
