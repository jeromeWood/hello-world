import { Router } from 'express'
import { generateAdvice, parseExpenseText } from '../services/ai.js'

const router = Router()

router.post('/parse', async (req, res, next) => {
  try {
    const text = String(req.body?.text || '').trim()
    if (!text) {
      return res.status(400).json({ ok: false, error: 'text 不能为空' })
    }
    const result = await parseExpenseText(text)
    res.json(result)
  } catch (e) {
    next(e)
  }
})

router.post('/advice', async (req, res, next) => {
  try {
    const payload = req.body || {}
    const result = await generateAdvice(payload)
    res.json(result)
  } catch (e) {
    next(e)
  }
})

export default router
