export {}

declare module 'axios' {
  interface AxiosRequestConfig {
    quietProgress?: boolean
  }
}
