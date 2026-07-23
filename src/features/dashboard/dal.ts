import { Prisma } from "@/generated/prisma/client"
import { unexpectedError, type AppError } from "@/lib/errors"
import prisma from "@/lib/prisma"
import { err, ok, type Result } from "@/lib/utils/result"

export interface DashboardSummary {
	outstandingTotal: string
	overdueTotal: string
	overdueCount: number
	paidThisMonthTotal: string
	draftQuoteCount: number
	recentInvoices: {
		id: string
		number: string
		status: string
		total: string
		currency: string
		dueDate: Date
		client: { name: string }
	}[]
}

export async function getDashboardSummary(
	organizationId: string
): Promise<Result<DashboardSummary, AppError>> {
	try {
		const startOfMonth = new Date()
		startOfMonth.setDate(1)
		startOfMonth.setHours(0, 0, 0, 0)

		const [
			outstanding,
			overdue,
			paidThisMonth,
			draftQuoteCount,
			recentInvoices,
		] = await Promise.all([
			prisma.invoice.aggregate({
				where: {
					organizationId,
					status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
				},
				_sum: { total: true, amountPaid: true },
			}),
			prisma.invoice.aggregate({
				where: { organizationId, status: "OVERDUE" },
				_sum: { total: true, amountPaid: true },
				_count: true,
			}),
			prisma.payment.aggregate({
				where: { paidAt: { gte: startOfMonth }, invoice: { organizationId } },
				_sum: { amount: true },
			}),
			prisma.quote.count({ where: { organizationId, status: "DRAFT" } }),
			prisma.invoice.findMany({
				where: { organizationId },
				orderBy: { issueDate: "desc" },
				take: 5,
				select: {
					id: true,
					number: true,
					status: true,
					total: true,
					currency: true,
					dueDate: true,
					client: { select: { name: true } },
				},
			}),
		])

		const outstandingTotal = (
			outstanding._sum.total ?? new Prisma.Decimal(0)
		).sub(outstanding._sum.amountPaid ?? new Prisma.Decimal(0))
		const overdueTotal = (overdue._sum.total ?? new Prisma.Decimal(0)).sub(
			overdue._sum.amountPaid ?? new Prisma.Decimal(0)
		)

		return ok({
			outstandingTotal: outstandingTotal.toFixed(2),
			overdueTotal: overdueTotal.toFixed(2),
			overdueCount: overdue._count,
			paidThisMonthTotal: (
				paidThisMonth._sum.amount ?? new Prisma.Decimal(0)
			).toFixed(2),
			draftQuoteCount,
			recentInvoices: recentInvoices.map((inv) => ({
				...inv,
				total: inv.total.toFixed(2),
			})),
		})
	} catch (cause) {
		return err(unexpectedError("Failed to load dashboard summary.", cause))
	}
}
