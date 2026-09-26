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

// 单次出行按成员的花费汇总（含未归属；未归属仅在存在记录时返回）
export function planMemberSpend(plan) {
  const records = plan.records || []
  const emptyBreakdown = () =>
    Object.fromEntries(EXPENSE_CATEGORIES.map(({ label }) => [label, 0]))
  const rows = (plan.members || []).map((m) => ({
    memberId: m.id,
    name: m.name,
    count: 0,
    total: 0,
    breakdown: emptyBreakdown(),
  }))
  const unassigned = { memberId: null, name: '未归属', count: 0, total: 0, breakdown: emptyBreakdown() }

  records.forEach((r) => {
    // 找不到归属成员（未归属或成员已被移除的残留）一律计入未归属
    const row = rows.find((row) => row.memberId === r.memberId) || unassigned
    row.count += 1
    EXPENSE_CATEGORIES.forEach(({ key, label }) => {
      const amount = toNum(r[key])
      row.breakdown[label] += amount
      row.total += amount
    })
  })

  return unassigned.count ? [...rows, unassigned] : rows
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
