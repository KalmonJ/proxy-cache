import express from "express"

const app = express()
app.use(express.json())

export const startServer = (url: string, port: number) => {

  app.listen(port, () => {
    console.log(`server is listen on port:${port}`)
  })

  process.on("uncaughtException", (error: any) => {
    if (error.code === "EACCES") {
      console.log(`Port ${error.port} is already in use, try again with a different port argument.`)
    }
  })



}