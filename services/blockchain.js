// File: services/blockchain.js
// Deskripsi: Menangani semua interaksi dengan blockchain Mavryk.

const { MavrykToolkit } = require("@mavrykdynamics/taquito");
const { HttpBackend } = require("@mavrykdynamics/taquito-http-utils");
const { RpcClient } = require("@mavrykdynamics/taquito-rpc");
const { InMemorySigner } = require("@mavrykdynamics/taquito-signer");
const { HttpsProxyAgent } = require("https-proxy-agent");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function setupTezosClient(rpcUrl, privateKey = null, proxy = null) {
    const agent = proxy ? new HttpsProxyAgent(proxy) : null;
    const httpBackend = new HttpBackend(undefined, agent);
    const rpcClient = new RpcClient(rpcUrl, undefined, httpBackend);
    const Tezos = new MavrykToolkit(rpcClient);

    if (privateKey) {
        const signer = await InMemorySigner.fromSecretKey(privateKey);
        Tezos.setProvider({ signer });
    }
    return Tezos;
}

async function sendToken(Tezos, { from, to, amountRaw, contractAddress }) {
    const tokenContract = await Tezos.wallet.at(contractAddress);
    const op = await tokenContract.methods.transfer([{ from_: from, txs: [{ to_: to, token_id: 0, amount: amountRaw }] }]).send();
    return op;
}

async function sendNativeToken(Tezos, { to, amountMav }) {
    const op = await Tezos.wallet.transfer({ to, amount: amountMav }).send();
    return op;
}

async function getWalletBalances(address, config, Tezos) {
    const balances = { [config.nativeToken.symbol]: 0 };
    Object.keys(config.tokens).forEach(symbol => balances[symbol] = 0);

    const balanceWei = await Tezos.rpc.getBalance(address);
    balances[config.nativeToken.symbol] = balanceWei.toNumber() / (10 ** config.nativeToken.decimals);

    const contractToSymbolMap = Object.fromEntries(
        Object.entries(config.tokens).map(([symbol, tokenData]) => [tokenData.address, symbol])
    );
    
    try {
        const apiUrl = `https://atlasnet.api.mavryk.network/v1/tokens/balances?account=${address}&balance.gt=0`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
        
        const allTokenData = await response.json();
        for (const item of allTokenData) {
            const contractAddress = item.token?.contract?.address;
            const symbol = contractToSymbolMap[contractAddress];
            if (symbol) {
                const decimals = item.token?.metadata?.decimals || config.tokens[symbol].decimals;
                balances[symbol] = parseInt(item.balance, 10) / (10 ** decimals);
            }
        }
    } catch (apiError) {
        // Abaikan jika API token gagal
    }
    
    return balances;
}

module.exports = {
    setupTezosClient,
    sendToken,
    sendNativeToken,
    getWalletBalances,
};
