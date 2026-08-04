import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import aiRouter from './routes/ai.js'
import healthRouter from './routes/health.js'
import { createMcpHttpRouter } from './mcp/httpRouter.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 3000)

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.use('/api/health', healthRouter)
app.use('/api/ai', aiRouter)
// MCP Streamable HTTP：供其他平台远程接入业务 tools
app.use('/mcp', createMcpHttpRouter())

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ ok: false, error: err.message || '服务器错误' })
})

app.listen(port, () => {
  console.log(`doMoney server listening on http://localhost:${port}`)
  console.log(`REST:  /api/health  /api/ai/parse  /api/ai/advice`)
  console.log(`MCP:   POST /mcp  (stdio: npm run mcp)`)
  console.log(`AI mode: ${process.env.AI_API_KEY ? 'remote' : 'local-rules'}`)
})
