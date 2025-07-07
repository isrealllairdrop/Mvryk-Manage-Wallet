// File: index.js
// Deskripsi: Titik masuk utama untuk aplikasi skrip Mavryk.
// File ini menginisialisasi konfigurasi dan memulai menu utama.

const path = require('path');
const { displayBanner, promptMainMenu, printGoodbye, printError } = require('./services/ui');
const { handleSendWorkerToMain, handleDistributeMainToWorker, handleCheckBalances } = require('./services/operations');

/**
 * @description Konfigurasi utama untuk seluruh skrip.
 * Mengubah nilai di sini akan mempengaruhi semua operasi.
 */
const config = {
    rpcUrl: "https://atlasnet.rpc.mavryk.network",
    filePaths: {
        mainWalletAddress: path.join(__dirname, "addressutama.txt"),
        mainWalletPk: path.join(__dirname, "privatekeyutama.txt"),
        workerAddresses: path.join(__dirname, "addresstuyul.txt"),
        workerPks: path.join(__dirname, "privatekeytuyul.txt"),
        proxies: path.join(__dirname, "proxies.txt"),
    },
    operational: {
        mavToLeaveForGas: 0.05,
        delayBetweenWalletsSec: 5,
        retryAttempts: 3,
        retryDelaySeconds: 5,
    },
    nativeToken: {
        symbol: "MAV",
        displayName: "MVRK",
        name: "Mavryk",
        decimals: 6
    },
    tokens: {
        "MVN": {
            name: "MAVEN",
            address: "KT1EmkMv4FRTCC4op5Xzf3fcHzwazFXXDHLC",
            decimals: 9
        },
        "USDT": {
            name: "Tether USD",
            address: "KT1D7ZQBhwxkMgZThqctYtMXigFvJRZL4eSy",
            decimals: 6
        }
    }
};

/**
 * @description Fungsi utama untuk menjalankan aplikasi.
 * Menampilkan banner dan menu, lalu menangani pilihan pengguna secara berulang.
 */
async function main() {
    displayBanner();

    let running = true;
    while (running) {
        try {
            const choice = await promptMainMenu();
            switch (choice) {
                case 'worker_to_main':
                    await handleSendWorkerToMain(config);
                    break;
                case 'main_to_worker':
                    await handleDistributeMainToWorker(config);
                    break;
                case 'check_balance':
                    await handleCheckBalances(config);
                    break;
                case 'exit':
                    running = false;
                    break;
            }
        } catch (error) {
            printError(`An unexpected error occurred: ${error.message}`);
        }
    }
    printGoodbye();
}

main().catch(error => {
    printError("A critical error forced the script to terminate.", error);
    process.exit(1);
});
