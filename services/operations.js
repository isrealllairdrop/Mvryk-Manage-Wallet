// File: services/operations.js
// Deskripsi: Mengandung logika inti untuk setiap operasi utama.

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { printOperationHeader, createSpinner, printError } = require('./ui');
const { setupTezosClient, sendToken, sendNativeToken, getWalletBalances } = require('./blockchain');

// --- Helper Functions ---

function formatNumberWithCommas(num) {
    if (typeof num !== 'number') return num;
    return num.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

function loadFromFile(filePath, singleLine = false) {
    if (!fs.existsSync(filePath)) {
        const errorMessage = `Error: File '${path.basename(filePath)}' tidak ditemukan.`;
        printError(errorMessage);
        throw new Error(errorMessage);
    }
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length === 0) {
             const errorMessage = `Error: File '${path.basename(filePath)}' kosong.`;
             printError(errorMessage);
             throw new Error(errorMessage);
        }
        return singleLine ? lines[0] : lines;
    } catch (error) {
        throw new Error(`Gagal membaca file '${filePath}': ${error.message}`);
    }
}

async function handleConfirmation(op, type) {
    const spinner = createSpinner(`Menunggu konfirmasi transfer ${type}...`).start();
    try {
        await op.confirmation(1);
        const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        
        spinner.succeed(`Transfer ${type} berhasil dikonfirmasi pada ${timestamp}`);
        console.log(chalk.blue(`  Hash: ${op.opHash}`));
        console.log(chalk.blue.bold(`  Explorer: https://nexus.mavryk.org/explorer/operation/${op.opHash}`));
    } catch (error) {
        spinner.fail(`Gagal mendapatkan konfirmasi untuk hash: ${op.opHash}`);
        throw error;
    }
}

function displayBalancesAsList(balances, config) {
    const { nativeToken, tokens } = config;
    const padding = 12;

    const nativeTokenBalance = balances[nativeToken.symbol] || 0;
    console.log(
        chalk.cyan(nativeToken.displayName.padEnd(padding)),
        chalk.white.bold(formatNumberWithCommas(nativeTokenBalance))
    );

    for (const symbol in tokens) {
        const balance = balances[symbol] || 0;
        console.log(
            chalk.cyan(symbol.padEnd(padding)),
            chalk.white.bold(formatNumberWithCommas(balance))
        );
    }
}

// --- CORE FUNCTIONS ---

async function handleSendWorkerToMain(config) {
    printOperationHeader("Kirim Saldo Tuyul ke Utama");
    try {
        const workerPks = loadFromFile(config.filePaths.workerPks);
        const mainAddress = loadFromFile(config.filePaths.mainWalletAddress, true);

        for (let i = 0; i < workerPks.length; i++) {
            const pk = workerPks[i];
            let Tezos, workerAddress;

            try {
                const setupSpinner = createSpinner(`Mempersiapkan Wallet Tuyul ${i + 1}...`).start();
                Tezos = await setupTezosClient(config.rpcUrl, pk);
                workerAddress = await Tezos.signer.publicKeyHash();
                setupSpinner.stop();
                
                console.log(chalk.magenta.bold(`\n--- Memproses Wallet Tuyul ${i + 1} dari ${workerPks.length} ---`));
                console.log(chalk.cyan(`Alamat: ${workerAddress}`));

                const balances = await getWalletBalances(workerAddress, config, Tezos);
                displayBalancesAsList(balances, config);

                console.log(chalk.cyan(`\n  Mengirim ke    : ${mainAddress}`));
                let hasSentSomething = false;

                for (const [symbol, tokenData] of Object.entries(config.tokens)) {
                    if (balances[symbol] > 0) {
                        console.log(chalk.white(`\n  - ${symbol} Balance: ${formatNumberWithCommas(balances[symbol])}`));
                        for (let attempt = 1; attempt <= config.operational.retryAttempts; attempt++) {
                            try {
                                process.stdout.write(chalk.yellow(`    > Mencoba mengirim... `));
                                const decimals = tokenData.decimals;
                                const amountRaw = Math.floor(balances[symbol] * (10 ** decimals));
                                const op = await sendToken(Tezos, { from: workerAddress, to: mainAddress, amountRaw, contractAddress: tokenData.address });
                                await handleConfirmation(op, symbol);
                                hasSentSomething = true;
                                break;
                            } catch (error) {
                                if (attempt < config.operational.retryAttempts) {
                                    console.log(chalk.red('Gagal, mencoba lagi...'));
                                    await new Promise(res => setTimeout(res, config.operational.retryDelaySeconds * 1000));
                                } else {
                                    console.log(chalk.red('Gagal permanen.'));
                                }
                            }
                        }
                    }
                }

                const mavSymbol = config.nativeToken.symbol;
                const amountToSend = balances[mavSymbol] - config.operational.mavToLeaveForGas;
                if (amountToSend > 0.000001) {
                    console.log(chalk.white(`\n  - ${mavSymbol} Balance: ${formatNumberWithCommas(balances[mavSymbol])} (Akan dikirim: ${formatNumberWithCommas(amountToSend)})`));
                    for (let attempt = 1; attempt <= config.operational.retryAttempts; attempt++) {
                        try {
                           process.stdout.write(chalk.yellow(`    > Mencoba mengirim... `));
                           const op = await sendNativeToken(Tezos, { to: mainAddress, amountMav: amountToSend });
                           await handleConfirmation(op, mavSymbol);
                           hasSentSomething = true;
                           break;
                       } catch (error) {
                            if (attempt < config.operational.retryAttempts) {
                               console.log(chalk.red('Gagal, mencoba lagi...'));
                               await new Promise(res => setTimeout(res, config.operational.retryDelaySeconds * 1000));
                           } else {
                               console.log(chalk.red('Gagal permanen.'));
                           }
                       }
                   }
                }

                if (!hasSentSomething) {
                    console.log(chalk.yellow("\n  Tidak ada saldo yang bisa dikirim dari wallet ini."));
                }
                console.log(chalk.green(`\n✔ Selesai memproses Wallet Tuyul ${i + 1}.`));

            } catch (error) {
                printError(`Gagal memproses Wallet Tuyul ${i + 1} secara keseluruhan`, error);
            }
        }
    } catch (e) {}
}


async function handleCheckBalances(config) {
    printOperationHeader("Cek Saldo Wallet");
    const mainSpinner = createSpinner("Memuat semua data wallet...").start();
    
    try {
        const mainAddress = loadFromFile(config.filePaths.mainWalletAddress, true);
        const workerAddresses = loadFromFile(config.filePaths.workerAddresses);
        const Tezos = await setupTezosClient(config.rpcUrl);

        const walletsToCheck = [{ type: '⭐ UTAMA', address: mainAddress }];
        workerAddresses.forEach((addr, i) => {
            walletsToCheck.push({ type: `👷 Tuyul ${i + 1}`, address: addr });
        });

        const totals = { [config.nativeToken.symbol]: 0 };
        Object.keys(config.tokens).forEach(symbol => totals[symbol] = 0);
        
        mainSpinner.succeed("Memulai pengecekan saldo...");

        for (const wallet of walletsToCheck) {
            try {
                const balances = await getWalletBalances(wallet.address, config, Tezos);
                
                Object.keys(balances).forEach(token => {
                    totals[token] += balances[token] || 0;
                });
                
                console.log(chalk.cyan.bold(`\n--- Saldo untuk ${wallet.type} ---`));
                console.log(chalk.white(`Alamat: ${wallet.address}\n`));
                
                displayBalancesAsList(balances, config);
                console.log("\n" + "-".repeat(40))

            } catch (error) {
                printError(`Gagal mengambil saldo untuk ${wallet.address}`);
            }
        }
        
        console.log(chalk.blue.bold("\n\n======================================================"));
        console.log(chalk.blue.bold("📊 TOTAL SALDO GABUNGAN DARI SEMUA WALLET"));
        console.log(chalk.blue.bold("======================================================\n"));

        displayBalancesAsList(totals, config);

    } catch (error) {
        mainSpinner.fail("Terjadi kesalahan saat memuat file wallet.");
    }
}


async function handleDistributeMainToWorker(config) {
    printOperationHeader("Distribusi Saldo ke Wallet Tuyul");
    try {
        const mainPk = loadFromFile(config.filePaths.mainWalletPk, true);
        const workerAddresses = loadFromFile(config.filePaths.workerAddresses);

        const { mavAmount, usdtAmount, mvnAmount } = await inquirer.prompt([
            { type: 'number', name: 'mavAmount', message: 'Masukkan jumlah MAV untuk dikirim ke setiap wallet tuyul:', default: 0},
            { type: 'number', name: 'usdtAmount', message: 'Masukkan jumlah USDT untuk dikirim ke setiap wallet tuyul:', default: 0},
            { type: 'number', name: 'mvnAmount', message: 'Masukkan jumlah MVN untuk dikirim ke setiap wallet tuyul:', default: 0}
        ]);

        if (mavAmount <= 0 && usdtAmount <= 0 && mvnAmount <= 0) {
            console.log(chalk.yellow("ℹ Tidak ada jumlah yang dimasukkan. Operasi dibatalkan."));
            return;
        }

        const Tezos = await setupTezosClient(config.rpcUrl, mainPk);
        const mainAddress = await Tezos.signer.publicKeyHash();

        for (let i = 0; i < workerAddresses.length; i++) {
            const workerAddress = workerAddresses[i];
            console.log(chalk.magenta.bold(`\n--- Mengirim ke Wallet Tuyul ${i + 1}/${workerAddresses.length} ---`));
            console.log(chalk.cyan(`  Dari: ${mainAddress}`));
            console.log(chalk.cyan(`  Ke  : ${workerAddress}`));
            
            try {
                if (mavAmount > 0) {
                    console.log(chalk.white(`  ℹ Mengirim ${formatNumberWithCommas(mavAmount)} MAV...`));
                    const op = await sendNativeToken(Tezos, { to: workerAddress, amountMav: mavAmount });
                    await handleConfirmation(op, config.nativeToken.symbol);
                }
                if (usdtAmount > 0) {
                    console.log(chalk.white(`  ℹ Mengirim ${formatNumberWithCommas(usdtAmount)} USDT...`));
                    const amountRaw = usdtAmount * (10 ** config.tokens.USDT.decimals);
                    const op = await sendToken(Tezos, { from: mainAddress, to: workerAddress, amountRaw, contractAddress: config.tokens.USDT.address });
                    await handleConfirmation(op, 'USDT');
                }
                if (mvnAmount > 0) {
                    console.log(chalk.white(`  ℹ Mengirim ${formatNumberWithCommas(mvnAmount)} MVN...`));
                    const amountRaw = mvnAmount * (10 ** config.tokens.MVN.decimals);
                    const op = await sendToken(Tezos, { from: mainAddress, to: workerAddress, amountRaw, contractAddress: config.tokens.MVN.address });
                    await handleConfirmation(op, 'MVN');
                }
                console.log(chalk.green(`✔ Distribusi ke Wallet Tuyul ${i + 1} berhasil.`));
            } catch (error) {
                printError(`Gagal distribusi ke Wallet Tuyul ${i + 1}`, error);
            }
        }
    } catch(e) {}
}

module.exports = {
    handleSendWorkerToMain,
    handleDistributeMainToWorker,
    handleCheckBalances,
};
