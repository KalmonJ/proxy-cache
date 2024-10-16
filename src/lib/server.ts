import express from "express"
import { createProxyMiddleware, responseInterceptor } from "http-proxy-middleware"
import { memoryCache } from "../config/cache"
import { createServer } from "net"

type ServerProps = {
  port: number
  url: string
}

const server = createServer((socket) => {
  socket.on("data", (data) => {
    const message = data.toString("utf-8")
    if (message === "clear-cache") {
      memoryCache.clear()
      console.log("Cache successfully clear")
    }
  })
})

server.listen(8000)

export const startServer = ({ port, url }: ServerProps) => {
  const app = express()

  app.use(express.json())

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

  app.use(proxyMiddleware)

  app.listen(port, () => {
    console.log(`Proxy server is listen on http://localhost:${port}`)
  })



  process.on("uncaughtException", (error: any) => {
    if (error.code === "EACCES") {
      console.log(`Port ${error.port} is already in use, try again with a different port argument.`)
    }
  })
}

process.on("message", (message: ServerProps) => {
  startServer(message)
})