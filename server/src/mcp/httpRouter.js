import { Router } from 'express'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createDoMoneyMcpServer } from './createServer.js'

/**
 * 可选 Bearer 鉴权：设置 MCP_API_KEY 后，HTTP MCP 需带
 * Authorization: Bearer <MCP_API_KEY>
 */
function authMiddleware(req, res, next) {
  const expected = String(process.env.MCP_API_KEY || '').trim()
  if (!expected) return next()

  const header = String(req.headers.authorization || '')
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (token && token === expected) return next()

  res.status(401).json({
    jsonrpc: '2.0',
    error: { code: -32001, message: 'Unauthorized: invalid or missing Bearer token' },
    id: null
  })
}

function methodNotAllowed(_req, res) {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed. Use POST /mcp' },
    id: null
  })
}

/**
 * Stateless Streamable HTTP MCP，挂载到 Express：
 * POST /mcp
 */
export function createMcpHttpRouter() {
  const router = Router()
  router.use(authMiddleware)

  router.post('/', async (req, res) => {
    const server = createDoMoneyMcpServer()
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined
      })
      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
      res.on('close', () => {
        transport.close()
        server.close()
      })
    } catch (error) {
      console.error('MCP HTTP error:', error)
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null
        })
      }
    }
  })

  router.get('/', methodNotAllowed)
  router.delete('/', methodNotAllowed)

  return router
}
