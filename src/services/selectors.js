import { EXPENSE_CATEGORIES } from '../constants'
import { luggageCompletionRate } from './luggage'

function toNum(value) {
  return Number(value) || 0
}

// 单次出行总花费
export function planTotalSpend(plan) {
  return (plan.records || []).reduce(
    (sum, r) =>
      sum +
      toNum(r.transportCost) +
      toNum(r.mealCost) +
      toNum(r.ticketCost) +
      toNum(r.shoppingCost) +
      toNum(r.otherCost),
    0
  )
}

// 单次出行花费分类汇总
export function planSpendBreakdown(plan) {
  const records = plan.records || []
  return EXPENSE_CATEGORIES.reduce((acc, { key, label }) => {
    acc[label] = records.reduce((sum, r) => sum + toNum(r[key]), 0)
    return acc
  }, {})
}

// 单次出行按成员汇总花费（含未归属），用于家庭出行对账
export function planMemberSpendBreakdown(plan) {
  const records = plan.records || []
  const makeBucket = (memberId, name) => ({
    memberId,
    name,
    total: 0,
    breakdown: EXPENSE_CATEGORIES.reduce((acc, { label }) => {
      acc[label] = 0
      return acc
    }, {}),
  })

  const buckets = (plan.members || []).map((m) => makeBucket(m.id, m.name))
  const unattributed = makeBucket(null, '未归属')

  records.forEach((r) => {
    // 归属成员已被删除（或数据异常）时，计入未归属
    const bucket = buckets.find((b) => b.memberId === r.memberId) || unattributed
    EXPENSE_CATEGORIES.forEach(({ key, label }) => {
      const amount = toNum(r[key])
      bucket.breakdown[label] += amount
      bucket.total += amount
    })
  })

  return [...buckets, unattributed]
}

// 单次出行行李打包完成率（各成员平均）
export function planPackingRate(plan) {
  const lists = plan.luggage || []
  if (!lists.length) return 0
  const sum = lists.reduce((s, l) => s + luggageCompletionRate(l.items), 0)
  return Math.round(sum / lists.length)
}

// 单次出行待办完成进度（0-100）
export function planTodoProgress(plan) {
  const todos = plan.todos || []
  if (!todos.length) return 0
  return Math.round((todos.filter((t) => t.done).length / todos.length) * 100)
}

// 判断待办是否全部完成
export function planTodosAllDone(plan) {
  const todos = plan.todos || []
  return todos.length > 0 && todos.every((t) => t.done)
}
