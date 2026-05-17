declare module 'primbon-scraper' {
    /** Hasil kecocokan nama pasangan. */
    export interface JodohResult {
        namaAnda: string;
        namaPasangan: string;
        positif: string;
        negatif: string;
        love: string;
    }

    /** Hasil ramalan rezeki & hoki (Pal Srigati). */
    export interface RejekiWetonResult {
        penjelasan: string;
        statistik: string;
    }

    /** Mendapat arti & karakteristik dari sebuah nama. */
    export function artiNama(nama: string): Promise<string>;

    /** Mendapat tafsir mimpi dari kata kunci. */
    export function tafsirMimpi(mimpi: string): Promise<string>;

    /** Mendapat kecocokan nama pasangan (cinta). */
    export function Jodoh(nama1: string, nama2: string): Promise<JodohResult>;

    /** Karakteristik tanggal jadian / pernikahan (format: D-M-YYYY). */
    export function tanggaljadi(tanggal: string): Promise<string>;

    /** Watak & karakter artis / tokoh (tanggal: D-M-YYYY). */
    export function watakartis(nama: string, tanggal: string): Promise<string>;

    /** Ramalan jodoh dari weton berpasangan (tanggal: D-M-YYYY). */
    export function ramalanjodoh(
        nama1: string,
        tanggal1: string,
        nama2: string,
        tanggal2: string
    ): Promise<string>;

    /** Ramalan rezeki & hoki (tanggal: D-M-YYYY). */
    export function rejekiweton(tanggal: string): Promise<RejekiWetonResult>;

    /** Kecocokan nama dengan tanggal lahir (numerologi, tanggal: D-M-YYYY). */
    export function kecocokannama(nama: string, tanggal: string): Promise<string>;

    /** Cek hari baik (Petung Kamarokam, tanggal: D-M-YYYY). */
    export function haribaik(tanggal: string): Promise<string>;

    /** Cek hari larangan / naas (tanggal: D-M-YYYY). */
    export function harilarangan(tanggal: string): Promise<string>;

    const primbon: {
        artiNama: typeof artiNama;
        tafsirMimpi: typeof tafsirMimpi;
        Jodoh: typeof Jodoh;
        tanggaljadi: typeof tanggaljadi;
        watakartis: typeof watakartis;
        ramalanjodoh: typeof ramalanjodoh;
        rejekiweton: typeof rejekiweton;
        kecocokannama: typeof kecocokannama;
        haribaik: typeof haribaik;
        harilarangan: typeof harilarangan;
    };
    export default primbon;
}
