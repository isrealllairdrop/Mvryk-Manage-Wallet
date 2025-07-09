# Skrip Manajemen Wallet Mavryk

Sebuah alat bantu baris perintah (CLI) yang kuat dan interaktif untuk mengelola beberapa dompet Mavryk secara efisien. Didesain untuk menyederhanakan proses pengumpulan (gas fee) dan distribusi token antara dompet utama dan banyak dompet pekerja (tuyul).

> Contact Me **ISREALLL AIRDROP**
> - Telegram : https://t.me/Isrealll1
> - Web      : https://isrealllairdrop.tech/ 

![image](https://github.com/user-attachments/assets/bf89cb13-105f-4bab-a5f5-a232bf2ec173)


## ✨ Fitur Utama

-   **Distribusi Token**: Kirim token MVRK (MAV), MVN, dan USDT dari dompet utama ke banyak dompet tuyul sekaligus dengan jumlah yang dapat ditentukan.
-   **Pengumpulan Token**: Kumpulkan semua saldo token (MVRK, MVN, USDT) dari semua dompet tuyul kembali ke dompet utama, dengan menyisakan sedikit MVRK untuk biaya gas.
-   **Pemeriksaan Saldo Massal**: Periksa saldo semua dompet (utama dan tuyul) secara otomatis dan tampilkan total gabungan di akhir.
-   **Antarmuka Interaktif**: Menu yang mudah digunakan untuk memilih operasi yang ingin dijalankan.
-   **Retry Otomatis**: Jika transaksi gagal karena masalah jaringan, skrip akan mencoba lagi secara otomatis sebanyak 3 kali.
-   **Log Informatif**: Output yang bersih, menampilkan alamat, saldo, status transaksi, dan stempel waktu (timestamp) untuk setiap operasi yang berhasil.
-   **Konfigurasi Fleksibel**: Mudah untuk mengkonfigurasi URL RPC, token, jumlah gas yang disisakan, dan detail lainnya.

## ⚙️ Prasyarat

Sebelum memulai, pastikan Anda telah menginstal:
-   [Node.js](https://nodejs.org/) (disarankan versi 16 atau lebih baru)
-   npm (biasanya terinstal bersama Node.js)

## 🚀 Instalasi & Setup

1.  **Clone atau Unduh Proyek**
    ```sh
    git clone https://github.com/isrealllairdrop/Mvryk-Manage-Wallet.git
    cd Mvryk-Manage-Wallet
    ```

2.  **Instal Dependensi**
    Jalankan perintah berikut di terminal untuk menginstal semua paket yang dibutuhkan:
    ```sh
    npm install chalk@4 inquirer@8.2.4 ora@5 @mavrykdynamics/taquito @mavrykdynamics/taquito-http-utils @mavrykdynamics/taquito-rpc @mavrykdynamics/taquito-signer https-proxy-agent node-fetch
    ```

3.  **Siapkan File Konfigurasi**
    Buat file-file `.txt` berikut di dalam direktori proyek dan isi sesuai petunjuk:

    -   `addressutama.txt`
        Isi dengan **satu** alamat dompet utama Anda.
        ```
        mv1XB.....sQG
        ```

    -   `privatekeyutama.txt`
        Isi dengan **satu** kunci privat (private key) dari dompet utama Anda.
        ```
        edsk...
        ```

    -   `addresstuyul.txt`
        Isi dengan semua alamat dompet tuyul Anda, **satu alamat per baris**.
        ```
        mv1Bn.....UREx
        mv1LA.....FAgW
        mv1DY.....kdu
        ```

    -   `privatekeytuyul.txt`
        Isi dengan semua kunci privat dari dompet tuyul Anda, **satu per baris**.
        ```
        edsk...
        edsk...
        edsk...
        ```
    -   `proxies.txt` (Opsional)
        Jika Anda ingin menggunakan proxy, isi dengan daftar proxy, satu per baris.

4.  **Review Konfigurasi Skrip (Opsional)**
    Anda dapat mengubah pengaturan lanjutan seperti jumlah MAV yang disisakan untuk gas atau jumlah percobaan ulang dengan mengedit file `index.js` pada bagian `config`.

## ▶️ Cara Menjalankan Skrip

Setelah semua setup selesai, jalankan skrip dengan perintah berikut dari terminal:

```sh
node index.js
```

---

## Opsi Menu
- Kirim Saldo dari Wallet Tuyul ke Wallet Utama: Mengumpulkan semua token dari setiap dompet tuyul dan mengirimkannya ke dompet utama.

- Distribusi Saldo dari Wallet Utama ke Wallet Tuyul: Mengirim sejumlah token (yang Anda tentukan) dari dompet utama ke setiap dompet tuyul.

- Cek Saldo (Otomatis & Total): Menampilkan rincian saldo untuk setiap dompet secara berurutan, diakhiri dengan total keseluruhan.

- Keluar: Menghentikan skrip.
