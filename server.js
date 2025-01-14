import WebSocket from 'ws';
import dotenv from 'dotenv';
import fetch from 'node-fetch';  // Use node-fetch to fetch metadata
import { createClient } from '@supabase/supabase-js';  // Supabase client setup

// Load environment variables
dotenv.config();

// Supabase client setup with service role key
const supabase = createClient(
    process.env.SUPABASE_URL,  // Supabase URL
    process.env.SUPABASE_SERVICE_ROLE_KEY  // Supabase service role key
);

// WebSocket connection
const ws = new WebSocket('wss://pumpportal.fun/api/data');

ws.on('open', () => {
    console.log('🌐 WebSocket connection opened.');

    // Log the subscription to new token events
    console.log('🔔 Subscribing to new token events...');

    // Subscribe to new token events
    ws.send(
        JSON.stringify({
            method: 'subscribeNewToken',  // Subscribe to new token events
        })
    );
});

ws.on('message', async (message) => {
    try {
        // Parse the message to inspect the data
        const data = JSON.parse(message.toString());

        // Check if it's a new token event (name and mint)
        if (data.name && data.mint) {
            console.log(`💎💎💎💎💎 New token detected: ${data.name} (${data.symbol})`);

            // Create the token object from WebSocket data
            const token = {
                signature: data.signature,
                mintAddress: data.mint,
                traderPublicKey: data.traderPublicKey,
                txType: data.txType,
                initialBuy: data.initialBuy,
                solAmount: data.solAmount,
                bondingCurveKey: data.bondingCurveKey,
                vTokensInBondingCurve: data.vTokensInBondingCurve,
                vSolInBondingCurve: data.vSolInBondingCurve,
                marketCapSol: data.marketCapSol,
                name: data.name,
                symbol: data.symbol || 'UNKNOWN',
                uri: data.uri,
                pool: data.pool,
                description: 'N/A',  // Default placeholder, will be overwritten by metadata if available
                twitter: 'N/A',       // Default placeholder, will be overwritten by metadata if available
                telegram: 'N/A',      // Default placeholder, will be overwritten by metadata if available
                website: 'N/A',       // Default placeholder, will be overwritten by metadata if available
                image: 'N/A',         // Default placeholder, will be overwritten by metadata if available
                timestamp: Date.now()
            };

            // Extract the metadata URI and fetch metadata if available
            const uri = data.uri;
            console.log(`🔗 Metadata URI: ${uri}`);

            if (uri) {
                console.log('🔄 Fetching metadata for the new token...');
                try {
                    // Fetch metadata using fetch
                    const metadata = await fetchMetadata(uri);

                    // Combine the token data with metadata, ensuring fallback values
                    const fullTokenData = {
                        ...token,  // Existing token data
                        description: metadata.description || token.description,  // Override if metadata exists
                        twitter: metadata.twitter || token.twitter,
                        telegram: metadata.telegram || token.telegram,
                        website: metadata.website || token.website,
                        image: metadata.image || token.image,  // Optional field: if available
                    };

                    // Log the full token data after merging with metadata
                    console.log('📚 Full Token Data (After Metadata):', fullTokenData);

                    // Send the full token data to Supabase using the function with P_ prefix
                    const { data: tokenData, error: tokenError } = await supabase.rpc('insert_token_with_prefix', {
                        p_signature: fullTokenData.signature,
                        p_mint_address: fullTokenData.mintAddress,
                        p_trader_public_key: fullTokenData.traderPublicKey,
                        p_tx_type: fullTokenData.txType,
                        p_initial_buy: fullTokenData.initialBuy,
                        p_sol_amount: fullTokenData.solAmount,
                        p_bonding_curve_key: fullTokenData.bondingCurveKey,
                        p_v_tokens_in_bonding_curve: fullTokenData.vTokensInBondingCurve,
                        p_v_sol_in_bonding_curve: fullTokenData.vSolInBondingCurve,
                        p_market_cap_sol: fullTokenData.marketCapSol,
                        p_name: fullTokenData.name,
                        p_symbol: fullTokenData.symbol,
                        p_uri: fullTokenData.uri,
                        p_pool: fullTokenData.pool,
                        p_description: fullTokenData.description,
                        p_twitter: fullTokenData.twitter,
                        p_telegram: fullTokenData.telegram,
                        p_website: fullTokenData.website,
                        p_image: fullTokenData.image,
                        p_timestamp: fullTokenData.timestamp
                    });

                    if (tokenError) {
                        console.error('❌ Error inserting token data into Supabase:', tokenError.message);
                    } else {
                        console.log('✅ Token data inserted successfully into Supabase.');
                    }
                } catch (error) {
                    console.error('🚨 Error fetching metadata:', error.message);
                    // If metadata fetch fails, still insert basic token data
                    console.log('📚 Inserting token without metadata into Supabase');
                    const { data: tokenData, error: tokenError } = await supabase.rpc('insert_token_with_prefix', {
                        p_signature: token.signature,
                        p_mint_address: token.mintAddress,
                        p_trader_public_key: token.traderPublicKey,
                        p_tx_type: token.txType,
                        p_initial_buy: token.initialBuy,
                        p_sol_amount: token.solAmount,
                        p_bonding_curve_key: token.bondingCurveKey,
                        p_v_tokens_in_bonding_curve: token.vTokensInBondingCurve,
                        p_v_sol_in_bonding_curve: token.vSolInBondingCurve,
                        p_market_cap_sol: token.marketCapSol,
                        p_name: token.name,
                        p_symbol: token.symbol,
                        p_uri: token.uri,
                        p_pool: token.pool,
                        p_description: token.description,
                        p_twitter: token.twitter,
                        p_telegram: token.telegram,
                        p_website: token.website,
                        p_image: token.image,
                        p_timestamp: token.timestamp
                    });

                    if (tokenError) {
                        console.error('❌ Error inserting token data into Supabase:', tokenError.message);
                    } else {
                        console.log('✅ Token data inserted successfully into Supabase without metadata.');
                    }
                }
            } else {
                console.log('🚫 No metadata URI found for this token.');
                // Insert token without metadata if URI is not available
                console.log('📚 Inserting token without metadata into Supabase');
                const { data: tokenData, error: tokenError } = await supabase.rpc('insert_token_with_prefix', {
                    p_signature: token.signature,
                    p_mint_address: token.mintAddress,
                    p_trader_public_key: token.traderPublicKey,
                    p_tx_type: token.txType,
                    p_initial_buy: token.initialBuy,
                    p_sol_amount: token.solAmount,
                    p_bonding_curve_key: token.bondingCurveKey,
                    p_v_tokens_in_bonding_curve: token.vTokensInBondingCurve,
                    p_v_sol_in_bonding_curve: token.vSolInBondingCurve,
                    p_market_cap_sol: token.marketCapSol,
                    p_name: token.name,
                    p_symbol: token.symbol,
                    p_uri: token.uri,
                    p_pool: token.pool,
                    p_description: token.description,
                    p_twitter: token.twitter,
                    p_telegram: token.telegram,
                    p_website: token.website,
                    p_image: token.image,
                    p_timestamp: token.timestamp
                });

                if (tokenError) {
                    console.error('❌ Error inserting token data into Supabase:', tokenError.message);
                } else {
                    console.log('✅ Token data inserted successfully into Supabase without metadata.');
                }
            }

            // **Subscribe to trades and Raydium for the token, never unsubscribe**
            console.log(`📈 Subscribing to trades and Raydium for ${data.name}...`);
            ws.send(
                JSON.stringify({
                    method: 'subscribeTokenTrade',  // Subscribe to token trade events
                    keys: [data.mint],  // Use the mint address for trade subscription
                })
            );
            ws.send(
                JSON.stringify({
                    method: 'subscribeRaydiumLiquidity',  // Subscribe to Raydium liquidity events
                    keys: [data.mint],  // Use the mint address for Raydium liquidity subscription
                })
            );
            console.log(`✅ Successfully subscribed to trades and Raydium liquidity for ${data.name} 🚀`);
        }

        // Handle Raydium liquidity data (only insert to Supabase if pool is "raydium")
        if (data.pool && data.pool === 'raydium') {
            console.log('📡 Raydium liquidity detected:', data);

            // Store raydium data in the Migrating table
            const { data: raydiumData, error: raydiumError } = await supabase.rpc('insert_migrating_with_prefix', {
                p_signature: data.signature,
                p_mint_address: data.mint,
                p_tx_type: data.txType,
                p_market_id: data.marketId,
                p_market_cap_sol: data.marketCapSol,
                p_price: data.price,
                p_pool: data.pool,
                p_timestamp: Date.now()
            });

            if (raydiumError) {
                console.error('❌ Error inserting Raydium data into Supabase:', raydiumError.message);
            } else {
                console.log('✅ Raydium data inserted successfully into Supabase.');
            }
        }

        // Handle trade data (we are not adding metadata for trades)
        if (data.signature && data.txType) {
            console.log('📈📈📈📈📈 Trade Detected');
            // Log the trade data
            console.log('💼 Full Trade Data:', data);

            // Send the trade data to Supabase using the function with P_ prefix
            const { data: tradeData, error: tradeError } = await supabase.rpc('insert_trade_with_prefix', {
                p_signature: data.signature,
                p_mint_address: data.mint,
                p_trader_public_key: data.traderPublicKey,
                p_tx_type: data.txType,
                p_initial_buy: data.initialBuy || 0,
                p_sol_amount: data.solAmount,
                p_bonding_curve_key: data.bondingCurveKey,
                p_v_tokens_in_bonding_curve: data.vTokensInBondingCurve,
                p_v_sol_in_bonding_curve: data.vSolInBondingCurve,
                p_market_cap_sol: data.marketCapSol,
                p_name: data.name || 0,
                p_symbol: data.symbol || 'UNKNOWN',
                p_uri: data.uri || 0,
                p_pool: data.pool,
                p_timestamp: Date.now(),
                p_token_amount: data.tokenAmount || 0,  // Handle null or undefined
                p_new_token_balance: data.newTokenBalance || 0  // Handle null or undefined
            });

            if (tradeError) {
                console.error('❌ Error inserting trade data into Supabase:', tradeError.message);
            } else {
                console.log('✅ Trade data inserted successfully into Supabase.');
            }
        }

    } catch (err) {
        console.error('❌ Error processing message:', err);
    }
});

ws.on('error', (err) => console.error('🚨 WebSocket error:', err));

ws.on('close', () => {
    console.log('❌ WebSocket connection closed.');
    process.exit(1);
});

// Fetch metadata using fetch and IPFS gateway
const fetchMetadata = async (uri) => {
    try {
        // Default IPFS Gateway: Using ipfs.io directly
        const ipfsUrl = `https://ipfs.io/ipfs/${uri.split('ipfs.io/ipfs/')[1]}`;

        const response = await fetch(ipfsUrl);
        const metadata = await response.json();  // Assuming the metadata is in JSON format

        return metadata;
    } catch (error) {
        console.error('🚨 Error fetching metadata:', error.message);
        throw new Error('Failed to fetch metadata');
    }
};
