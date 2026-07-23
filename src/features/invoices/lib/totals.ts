import { Prisma } from "@/generated/prisma/client"

import type { InvoiceItemInput } from "../schema"

export interface LineItemCalculated {
	description: string
	quantity: Prisma.Decimal
	unitPrice: Prisma.Decimal
	taxRate: Prisma.Decimal
	lineSubtotal: Prisma.Decimal
	lineTax: Prisma.Decimal
	sortOrder: number
}

export interface InvoiceTotals {
	items: LineItemCalculated[]
	subtotal: Prisma.Decimal
	taxTotal: Prisma.Decimal
	discountTotal: Prisma.Decimal
	total: Prisma.Decimal
}

/**
 * Money math happens entirely in Prisma's Decimal (decimal.js under the
 * hood), never plain `number`. 0.1 + 0.2 !== 0.3 in floating point, and
 * that kind of off-by-a-cent drift is exactly what erodes trust in a tool
 * whose entire job is getting numbers right.
 */
export function calculateInvoiceTotals(
	items: InvoiceItemInput[],
	discountTotal: number
): InvoiceTotals {
	const calculatedItems: LineItemCalculated[] = items.map((item, index) => {
		const quantity = new Prisma.Decimal(item.quantity)
		const unitPrice = new Prisma.Decimal(item.unitPrice)
		const taxRate = new Prisma.Decimal(item.taxRate)
		const lineSubtotal = quantity.mul(unitPrice)
		const lineTax = lineSubtotal.mul(taxRate).div(100)

		return {
			description: item.description,
			quantity,
			unitPrice,
			taxRate,
			lineSubtotal,
			lineTax,
			sortOrder: index,
		}
	})

	const subtotal = calculatedItems.reduce(
		(sum, item) => sum.add(item.lineSubtotal),
		new Prisma.Decimal(0)
	)
	const taxTotal = calculatedItems.reduce(
		(sum, item) => sum.add(item.lineTax),
		new Prisma.Decimal(0)
	)
	const discount = new Prisma.Decimal(discountTotal)
	const total = subtotal.add(taxTotal).sub(discount)

	return {
		items: calculatedItems,
		subtotal: subtotal.toDecimalPlaces(2),
		taxTotal: taxTotal.toDecimalPlaces(2),
		discountTotal: discount.toDecimalPlaces(2),
		total: total.toDecimalPlaces(2),
	}
}
