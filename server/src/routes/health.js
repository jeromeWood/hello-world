import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'doMoney',
    ai: process.env.AI_API_KEY ? 'remote' : 'local-rules',
    time: new Date().toISOString()
  })
})

export default router
