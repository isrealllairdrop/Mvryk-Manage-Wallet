// File: services/ui.js
// Deskripsi: Mengelola semua output antarmuka pengguna (UI),
// seperti banner, menu, spinner, tabel, dan pesan log.

const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');

// Banner Art
const BANNER_ART = [
    `███╗░░░███╗██╗░░░██╗██████╗░██╗░░░██╗██╗░░██╗   ███╗░░░███╗░█████╗░███╗░░██╗░█████╗░░██████╗░███████╗███╗░░░███╗███████╗███╗░░██╗████████╗`,
    `████╗░████║██║░░░██║██╔══██╗╚██╗░██╔╝██║░██╔╝   ████╗░████║██╔══██╗████╗░██║██╔══██╗██╔════╝░██╔════╝████╗░████║██╔════╝████╗░██║╚══██╔══╝`,
    `██╔████╔██║╚██╗░██╔╝██████╔╝░╚████╔╝░█████═╝░   ██╔████╔██║███████║██╔██╗██║███████║██║░░██╗░█████╗░░██╔████╔██║█████╗░░██╔██╗██║░░░██║░░░`,
    `██║╚██╔╝██║░╚████╔╝░██╔══██╗░░╚██╔╝░░██╔═██╗░   ██║╚██╔╝██║██╔══██║██║╚████║██╔══██║██║░░╚██╗██╔══╝░░██║╚██╔╝██║██╔══╝░░██║╚████║░░░██║░░░`,
    `██║░╚═╝░██║░░╚██╔╝░░██║░░██║░░░██║░░░██║░╚██╗   ██║░╚═╝░██║██║░░██║██║░╚███║██║░░██║╚██████╔╝███████╗██║░╚═╝░██║███████╗██║░╚███║░░░██║░░░`,
    `╚═╝░░░░░╚═╝░░░╚═╝░░░╚═╝░░╚═╝░░░╚═╝░░░╚═╝░░╚═╝   ╚═╝░░░░░╚═╝╚═╝░░╚═╝╚═╝░░╚══╝╚═╝░░╚═╝░╚═════╝░╚══════╝╚═╝░░░░░╚═╝╚══════╝╚═╝░░╚══╝░░░╚═╝░░░`,
    ``,
    `░██╗░░░░░░░██╗░█████╗░██╗░░░░░██╗░░░░░███████╗████████╗`,
    `░██║░░██╗░░██║██╔══██╗██║░░░░░██║░░░░░██╔════╝╚══██╔══╝`,
    `░╚██╗████╗██╔╝███████║██║░░░░░██║░░░░░█████╗░░░░░██║░░░`,
    `░░████╔═████║░██╔══██║██║░░░░░██║░░░░░██╔══╝░░░░░██║░░░`,
    `░░╚██╔╝░╚██╔╝░██║░░██║███████╗███████╗███████╗░░░██║░░░`,
    `░░░╚═╝░░░╚═╝░░╚═╝░░╚═╝╚══════╝╚══════╝╚══════╝░░░╚═╝░░░`
];

function centerText(text) {
    const terminalWidth = process.stdout.columns || 80;
    const padding = Math.max(0, Math.floor((terminalWidth - text.length) / 2));
    return ' '.repeat(padding) + text;
}

function displayBanner() {
    console.clear();
    BANNER_ART.forEach(line => console.log(centerText(chalk.cyan.bold(line))));
    console.log("\n");
    console.log(centerText(chalk.yellow.bold("by ISREALLL AIRDROP")));
    console.log(centerText(chalk.yellow.bold("Telegram: https://t.me/Isrealll1")));
    console.log("\n");
}

async function promptMainMenu() {
    const { choice } = await inquirer.prompt([{
        type: 'list',
        name: 'choice',
        message: 'Pilih operasi yang ingin Anda jalankan:',
        choices: [
            { name: '  ▶  Kirim Saldo dari Wallet Tuyul ke Wallet Utama', value: 'worker_to_main' },
            { name: '  ▶  Distribusi Saldo dari Wallet Utama ke Wallet Tuyul', value: 'main_to_worker' },
            { name: '  ▶  Cek Saldo (Otomatis & Total)', value: 'check_balance' },
            new inquirer.Separator(),
            { name: '  ✖  Keluar', value: 'exit' }
        ],
        loop: false
    }]);
    return choice;
}

function printOperationHeader(title) {
    console.log(chalk.blue.bold("\n======================================================"));
    console.log(chalk.blue.bold(`               ${title}`));
    console.log(chalk.blue.bold("======================================================"));
}

function printGoodbye() {
    console.log(chalk.yellow.bold("\nTerima kasih telah menggunakan skrip ini. Sampai jumpa!"));
}

function printError(message, error = null) {
    console.error(chalk.red.bold(`\n✖ [ERROR] ${message}`));
    if (error) {
        console.error(chalk.red(error.message || error));
    }
}

const createSpinner = (text) => ora({ text, spinner: 'dots' });

module.exports = {
    displayBanner,
    promptMainMenu,
    printOperationHeader,
    printGoodbye,
    printError,
    createSpinner,
};
