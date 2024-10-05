import express from "express"
import { createProxyMiddleware, responseInterceptor } from "http-proxy-middleware"

const app = express()
app.use(express.json())

export const startServer = (url: string, port: number) => {

  const proxyMiddleware = createProxyMiddleware({
    target: url,
    changeOrigin: true,
    selfHandleResponse: true,
    on: {
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
        const response = responseBuffer.toString("utf-8")
        console.log(response, "resposta")
        return response
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