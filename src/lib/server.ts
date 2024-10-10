import express from "express"
import { createProxyMiddleware, responseInterceptor } from "http-proxy-middleware"
import { memoryCache } from "../config/cache"
import { parentPort } from "worker_threads"

const app = express()
app.use(express.json())


export const startServer = (url: string, port: number) => {
  const proxyMiddleware = createProxyMiddleware({
    target: url,
    changeOrigin: true,
    selfHandleResponse: true,
    followRedirects: true,
    on: {
      proxyReq(_, req, res, __) {
        const URL = url + req.url
        const buffer = memoryCache.getValue(URL)
        if (buffer) {
          res.writeHead(200, { "content-type": "application/json", "X-Cache": "HIT" }).end(buffer)
        }
      },
      proxyRes: responseInterceptor(async (responseBuffer, _, req, res) => {
        const URL = url + req.url
        const cachingData = memoryCache.getValue(URL)

        if (!cachingData) {
          memoryCache.setValue(URL, responseBuffer)
          res.writeHead(200, { "X-Cache": "MISS" }).end(responseBuffer)
        }

        return responseBuffer
      })
    }
  })

  app.listen(port, () => {
    console.log(`Proxy server is listen on http://localhost:${port}`)
  })

  app.use(proxyMiddleware)


  process.on("uncaughtException", (error: any) => {
    if (error.code === "EACCES") {
      console.log(`Port ${error.port} is already in use, try again with a different port argument.`)
    }
  })
}

parentPort?.on("message", (value) => {
  console.log(value, "valor da mensagem")
})