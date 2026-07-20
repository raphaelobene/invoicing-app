"use client"

import { Plus, Trash2 } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { Formatter } from "@/lib/utils/formatter"

export interface LineItemDraft {
	description: string
	quantity: number
	unitPrice: number
	taxRate: number
}

const EMPTY_ITEM: LineItemDraft = {
	description: "",
	quantity: 1,
	unitPrice: 0,
	taxRate: 0,
}

interface LineItemsEditorProps {
	items: LineItemDraft[]
	onChange: (items: LineItemDraft[]) => void
	discountTotal: number
	onDiscountChange: (value: number) => void
	currency: string
}

/**
 * This preview is plain-number math on purpose — it never gets persisted.
 * The number that actually gets saved is recomputed server-side in
 * Decimal via features/invoices/lib/totals.ts, which is the only place
 * that's allowed to be the source of truth for money. Client and server
 * agreeing to the cent is a nice-to-have here, not a requirement.
 */
function previewTotals(items: LineItemDraft[], discountTotal: number) {
	const subtotal = items.reduce(
		(sum, item) => sum + item.quantity * item.unitPrice,
		0
	)
	const tax = items.reduce(
		(sum, item) => sum + item.quantity * item.unitPrice * (item.taxRate / 100),
		0
	)
	return { subtotal, tax, total: subtotal + tax - discountTotal }
}

export function LineItemsEditor({
	items,
	onChange,
	discountTotal,
	onDiscountChange,
	currency,
}: LineItemsEditorProps) {
	const updateItem = (index: number, patch: Partial<LineItemDraft>) => {
		onChange(
			items.map((item, i) => (i === index ? { ...item, ...patch } : item))
		)
	}
	const removeItem = (index: number) => {
		onChange(items.filter((_, i) => i !== index))
	}
	const addItem = () => onChange([...items, { ...EMPTY_ITEM }])

	const { subtotal, tax, total } = previewTotals(items, discountTotal)
	const money = (value: number) => Formatter.currency(value, currency || "USD")

	return (
		<div className="rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-full">Description</TableHead>
						<TableHead>Qty</TableHead>
						<TableHead>Unit price</TableHead>
						<TableHead>Tax %</TableHead>
						<TableHead className="text-right">Line total</TableHead>
						<TableHead />
					</TableRow>
				</TableHeader>
				<TableBody>
					{items.map((item, index) => (
						<TableRow key={index}>
							<TableCell>
								<Input
									value={item.description}
									onChange={(e) =>
										updateItem(index, { description: e.target.value })
									}
									placeholder="Design consultation"
									required
								/>
							</TableCell>
							<TableCell>
								<Input
									type="number"
									min={0}
									step="any"
									className="w-20"
									value={item.quantity}
									onChange={(e) =>
										updateItem(index, { quantity: Number(e.target.value) })
									}
								/>
							</TableCell>
							<TableCell>
								<Input
									type="number"
									min={0}
									step="any"
									className="w-28"
									value={item.unitPrice}
									onChange={(e) =>
										updateItem(index, { unitPrice: Number(e.target.value) })
									}
								/>
							</TableCell>
							<TableCell>
								<Input
									type="number"
									min={0}
									max={100}
									step="any"
									className="w-20"
									value={item.taxRate}
									onChange={(e) =>
										updateItem(index, { taxRate: Number(e.target.value) })
									}
								/>
							</TableCell>
							<TableCell className="text-right font-mono tabular-nums">
								{money(
									item.quantity * item.unitPrice * (1 + item.taxRate / 100)
								)}
							</TableCell>
							<TableCell>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => removeItem(index)}
									disabled={items.length === 1}
								>
									<HugeiconsIcon
										icon={Trash2}
										strokeWidth={2}
										aria-hidden="true"
										data-slot="trash-icon"
									/>
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			<div className="flex items-center justify-between border-t p-3">
				<Button type="button" variant="ghost" size="sm" onClick={addItem}>
					<HugeiconsIcon
						icon={Plus}
						strokeWidth={2}
						aria-hidden="true"
						data-slot="plus-icon"
					/>
					Add line
				</Button>

				<div className="w-64 space-y-1.5 text-sm">
					<div className="flex justify-between text-muted-foreground">
						<span>Subtotal</span>
						<span className="font-mono tabular-nums">{money(subtotal)}</span>
					</div>
					<div className="flex justify-between text-muted-foreground">
						<span>Tax</span>
						<span className="font-mono tabular-nums">{money(tax)}</span>
					</div>
					<div className="flex items-center justify-between text-muted-foreground">
						<span>Discount</span>
						<Input
							type="number"
							min={0}
							step="any"
							className="h-7 w-24 text-right"
							value={discountTotal}
							onChange={(e) => onDiscountChange(Number(e.target.value))}
						/>
					</div>
					<div className="flex justify-between border-t pt-1.5 font-semibold">
						<span>Total</span>
						<span className="font-mono tabular-nums">{money(total)}</span>
					</div>
				</div>
			</div>
		</div>
	)
}
