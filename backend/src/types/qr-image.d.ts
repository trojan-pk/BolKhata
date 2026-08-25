declare module 'qr-image' {
    interface QrImageOptions {
        type?: 'png' | 'svg' | 'eps' | 'pdf'
        ec_level?: 'L' | 'M' | 'Q' | 'H'
        size?: number
        margin?: number
        parse_url?: boolean
    }
    export function image(text: string, options?: QrImageOptions): NodeJS.ReadableStream
    export function imageSync(text: string, options?: QrImageOptions): Buffer
    export function svgObject(text: string, options?: QrImageOptions): { size: number; path: string }
    export function matrix(text: string, ec_level?: string): number[][]
}
