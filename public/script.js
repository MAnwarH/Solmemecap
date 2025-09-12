// 🔒 SECURE: API key is now safely stored on server-side
// No more exposed credentials in frontend code!

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

async function fetchTokens(marketCapFilter = 'all') {
    try {
        const filterDesc = marketCapFilter === 'mid-range' ? '3M-10M market cap' : '5M+ market cap';
        console.log(`🔒 Fetching tokens (${filterDesc}) from secure backend...`);
        
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
        console.log('✅ Secure API Response received');
        
        // Handle new API response structure with apiInfo
        if (data.apiInfo) {
            console.log(`📡 API Source: ${data.apiInfo.source}${data.apiInfo.fallbackUsed ? ' (fallback)' : ''}`);
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
        console.log('Parsed tokens count:', tokens.length);
        
        return tokens.map((tokenData, index) => {
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
    let rowSpan = Math.max(baseSpan, Math.min(3, Math.ceil(marketCapRatio * 2.5)));
    
    
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

    // Create image element with fallback and rank-based sizing
    const imageClass = marketCapFilter === 'all' && index >= 8 ? 'tile-image tile-image-small' : 'tile-image';
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

// API source management functions
async function getApiStatus() {
    try {
        const response = await fetch('/api/source');
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.warn('Failed to get API status:', error);
    }
    return null;
}

async function setApiSource(source) {
    try {
        const response = await fetch('/api/set-source', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ source })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ API source changed:', result);
            showToast(result.message || `Switched to ${source} API`);
            updateApiSourceSelector(source);
            return true;
        } else {
            const error = await response.json();
            console.error('❌ Failed to change API source:', error);
            showToast(`Failed to switch API: ${error.error}`);
            return false;
        }
    } catch (error) {
        console.error('❌ API source change error:', error);
        showToast('Failed to change API source');
        return false;
    }
}

function updateApiStatus(apiInfo) {
    const statusElement = document.getElementById('api-status');
    const sourceElement = document.getElementById('api-source');
    
    if (statusElement && sourceElement) {
        let statusText = '';
        let statusClass = '';
        
        if (apiInfo.isMiddleRange) {
            statusText = 'V1';
            statusClass = 'bitquery';
        } else {
            if (apiInfo.fallbackUsed) {
                const versionText = apiInfo.source === 'bitquery' ? 'V1' : 'V2';
                statusText = `${versionText} (fallback)`;
                statusClass = 'fallback';
            } else {
                statusText = apiInfo.source === 'bitquery' ? 'V1' : 'V2';
                statusClass = apiInfo.source;
            }
        }
        
        statusElement.textContent = statusText;
        statusElement.className = `api-status ${statusClass}`;
        
        // Update source selector
        updateApiSourceSelector(apiInfo.currentPreference);
    }
}

function updateApiSourceSelector(currentSource) {
    const selector = document.getElementById('api-source-selector');
    if (selector) {
        selector.value = currentSource;
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
    
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const tokensGrid = document.getElementById('tokens-grid');
    const tokenCount = document.getElementById('token-count');
    const lastUpdated = document.getElementById('last-updated');

    loading.style.display = 'block';
    errorMessage.style.display = 'none';
    tokensGrid.innerHTML = '';

    try {
        const tokens = await fetchTokens(marketCapFilter);
        
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
            lastUpdated.textContent = new Date().toLocaleTimeString();
            
            // Update refresh time and button state
            lastRefreshTime = currentTime;
            updateRefreshButtonState(0);
        } else {
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        loading.style.display = 'none';
        errorMessage.style.display = 'block';
    }
}

// Layout switching functionality
let currentTokens = [];

// Market cap filter management
let currentMarketCapFilter = 'all';

// Refresh cooldown management
let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 15 * 60 * 1000; // 15 minutes in milliseconds

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
    
    row.innerHTML = `
        <td class="table-rank" data-label="Rank">#${index + 1}</td>
        <td class="table-symbol" data-label="Symbol">${token.symbol}</td>
        <td data-label="Name">${token.name}</td>
        <td data-label="Market Cap">$${formatNumber(token.marketCap)}</td>
        <td data-label="Price">$${formatPrice(token.price)}</td>
        <td class="table-price-change ${percentClass}" data-label="24h Change">${percentageDisplay}</td>
        <td style="font-family: monospace; font-size: 0.75rem;" data-label="Address">${tokenAddress.substring(0, 12)}...</td>
    `;
    
    // Add click handler to open Dexscreener
    row.addEventListener('click', () => {
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

function changeMarketCapFilter(filter) {
    currentMarketCapFilter = filter;
    const filterDesc = filter === 'mid-range' ? '3M-10M market cap' : '5M+ market cap';
    showToast(`Switching to ${filterDesc} view...`);
    
    // Load tokens with new filter, bypassing cooldown for filter changes
    loadTokens(true, filter);
}

async function handleApiSourceChange(source) {
    // Show notification about mid-range limitation
    if (currentMarketCapFilter === 'mid-range' && source !== 'auto') {
        showToast('Mid-range coins always use V1');
        updateApiSourceSelector('auto'); // Reset selector
        return;
    }
    
    const success = await setApiSource(source);
    if (success) {
        // Refresh tokens with new API source
        loadTokens(true, currentMarketCapFilter);
    } else {
        // Reset selector on failure
        const apiStatus = await getApiStatus();
        if (apiStatus) {
            updateApiSourceSelector(apiStatus.currentSource);
        }
    }
}

// Load tokens and API status when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize API status
    const apiStatus = await getApiStatus();
    if (apiStatus) {
        updateApiSourceSelector(apiStatus.currentSource);
    }
    
    // Load tokens (bypass cooldown on first load)
    loadTokens(true);
});

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