{
  Solana {
    TokenSupplyUpdates(
      limitBy: {by: TokenSupplyUpdate_Currency_MintAddress, count: 1}
      limit: {count: 100}
      orderBy: {descending: Block_Time}
      where: {
        any: [
          {
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
          },
          {
            TokenSupplyUpdate: {
              Currency: {
                MintAddress: {in: ["38PgzpJYu2HkiYvV8qePFakB8tuobPdGm2FFEn7Dpump", "3bc2e2rxcfvf9op22lvbansvwos2t98q6ercroayqydq", "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", "pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn"]}
              }
              PostBalanceInUSD: {ge: "5000000"}
            }
          }
        ]
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
}