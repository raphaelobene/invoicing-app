import React from "react"
import {
	Control,
	Controller,
	ControllerFieldState,
	ControllerRenderProps,
	FieldValues,
	Path,
} from "react-hook-form"

import { Checkbox } from "@/components/ui/checkbox"
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox"
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@/components/ui/item"
import { PasswordInput } from "@/components/ui/password-input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { normalizer } from "@/lib/utils/dx"

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select"

export const FormFieldType = {
	CHECKBOX: "checkbox",
	COMBOBOX: "combobox",
	HIDDEN_INPUT: "hiddenInput",
	INPUT: "input",
	INPUT_GROUP: "inputGroup",
	PASSWORD_INPUT: "passwordInput",
	SELECT: "select",
	SKELETON: "skeleton",
	SWITCH: "switch",
	TEXTAREA: "textarea",
} as const

export type FormFieldType = (typeof FormFieldType)[keyof typeof FormFieldType]

const SELF_MANAGED_TYPES = new Set<FormFieldType>([
	FormFieldType.CHECKBOX,
	FormFieldType.COMBOBOX,
	FormFieldType.SWITCH,
	FormFieldType.INPUT_GROUP,
	FormFieldType.SELECT,
])

export interface BaseFieldOption {
	label: string
	value: string
	description?: string
}

export type FieldOption<
	TExtra extends Record<string, unknown> = Record<string, never>,
> = BaseFieldOption & TExtra

type Orientation = "vertical" | "horizontal" | "responsive"

type FocusBlurEvent = React.FocusEvent<
	HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement
>

interface CustomProps<
	T extends FieldValues,
	TOption extends BaseFieldOption = BaseFieldOption,
> {
	autoComplete?: string
	autoFocus?: boolean
	className?: string
	control: Control<T>
	disabled?: boolean
	fieldType: FormFieldType
	label?: React.ReactNode
	labelDescription?: React.ReactNode
	name: Path<T>
	onBlur?: (e: FocusBlurEvent) => void
	onFocus?: (e: FocusBlurEvent) => void
	options?: TOption[]
	orientation?: Orientation | null
	placeholder?: string
	renderSkeleton?: (field: ControllerRenderProps<T, Path<T>>) => React.ReactNode
	type?: React.HTMLInputTypeAttribute
	size?: "lg" | "sm"
	itemToStringValue?: (option: TOption) => string
	renderOption?: (option: TOption) => React.ReactNode
}

type SubRendererProps<
	T extends FieldValues,
	TOption extends BaseFieldOption = BaseFieldOption,
> = {
	field: ControllerRenderProps<T, Path<T>>
	fieldState: ControllerFieldState
	props: Omit<CustomProps<T, TOption>, "control">
}

const makeFieldId = (name: string) => `form-rhf-${name}`
const makeCheckboxId = (name: string, value: string) =>
	`form-rhf-checkbox-${name}-${value}`

function composeBlur(
	fieldOnBlur: () => void,
	consumerOnBlur?: (e: FocusBlurEvent) => void
) {
	return (e: FocusBlurEvent) => {
		fieldOnBlur()
		consumerOnBlur?.(e)
	}
}

function pickPassthroughProps<
	T extends FieldValues,
	TOption extends BaseFieldOption,
>(props: Omit<CustomProps<T, TOption>, "control">) {
	const { className, disabled, autoFocus, placeholder, autoComplete, onFocus } =
		props
	return { className, disabled, autoFocus, placeholder, autoComplete, onFocus }
}

function renderCheckbox<
	T extends FieldValues,
	TOption extends BaseFieldOption,
>({ field, fieldState, props }: SubRendererProps<T, TOption>) {
	const { label, labelDescription, name, onBlur, fieldType } = props
	const id = makeFieldId(name)
	const passthrough = pickPassthroughProps(props)
	const handleBlur = composeBlur(field.onBlur, onBlur)

	const control =
		fieldType === FormFieldType.SWITCH ? (
			<Switch
				id={id}
				ref={field.ref}
				checked={!!field.value}
				onCheckedChange={(checked) => field.onChange(checked)}
				onBlur={handleBlur}
				aria-invalid={fieldState.invalid}
				{...passthrough}
			/>
		) : (
			<Checkbox
				id={id}
				ref={field.ref}
				checked={!!field.value}
				onCheckedChange={(checked) => field.onChange(checked === true)}
				onBlur={handleBlur}
				aria-invalid={fieldState.invalid}
				{...passthrough}
			/>
		)

	return (
		<>
			{control}
			<FieldContent>
				{label && (
					<FieldLabel className="cursor-pointer" htmlFor={id}>
						{label}
					</FieldLabel>
				)}
				{labelDescription && (
					<FieldDescription>{labelDescription}</FieldDescription>
				)}
				{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
			</FieldContent>
		</>
	)
}

function renderInputGroup<
	T extends FieldValues,
	TOption extends BaseFieldOption,
>({ field, fieldState, props }: SubRendererProps<T, TOption>) {
	const {
		label,
		labelDescription,
		options,
		orientation = "horizontal",
		disabled,
		name,
	} = props

	const selectedValues = normalizer<string>(
		field.value as string | string[] | undefined
	)

	return (
		<FieldSet>
			{label && <FieldLegend variant="label">{label}</FieldLegend>}
			{labelDescription && (
				<FieldDescription>{labelDescription}</FieldDescription>
			)}
			<FieldGroup data-slot="checkbox-group">
				{options?.map((option) => {
					const checkboxId = makeCheckboxId(name, option.value)
					return (
						<Field
							key={option.value}
							orientation={orientation ?? undefined}
							data-invalid={fieldState.invalid}
						>
							<Checkbox
								id={checkboxId}
								name={field.name}
								disabled={disabled}
								aria-invalid={fieldState.invalid}
								checked={selectedValues.includes(option.value)}
								onBlur={() => field.onBlur()}
								onCheckedChange={(checked) => {
									const isChecked = checked === true
									const next = isChecked
										? [...selectedValues, option.value]
										: selectedValues.filter((v) => v !== option.value)
									field.onChange(next)
								}}
							/>
							<FieldContent>
								<FieldLabel htmlFor={checkboxId}>{option.label}</FieldLabel>
								{option.description && (
									<FieldDescription>{option.description}</FieldDescription>
								)}
							</FieldContent>
						</Field>
					)
				})}
			</FieldGroup>
			{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
		</FieldSet>
	)
}

function renderSelect<T extends FieldValues, TOption extends BaseFieldOption>({
	field,
	fieldState,
	props,
}: SubRendererProps<T, TOption>) {
	const {
		label,
		labelDescription,
		options,
		orientation = "horizontal",
		name,
		onBlur,
		onFocus,
		disabled,
		className,
		placeholder,
	} = props

	const id = makeFieldId(name)

	return (
		<Field
			orientation={orientation ?? undefined}
			data-invalid={fieldState.invalid}
		>
			<FieldContent>
				{label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
				{labelDescription && (
					<FieldDescription>{labelDescription}</FieldDescription>
				)}
			</FieldContent>
			<Select
				value={field.value}
				name={name}
				disabled={disabled ?? false}
				onValueChange={field.onChange}
			>
				<SelectTrigger
					id={id}
					ref={field.ref}
					onBlur={composeBlur(field.onBlur, onBlur)}
					onFocus={onFocus}
					className={className}
					aria-invalid={fieldState.invalid}
				>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent className={className}>
					{options?.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
		</Field>
	)
}

function renderCombobox<
	T extends FieldValues,
	TOption extends BaseFieldOption,
>({ field, fieldState, props }: SubRendererProps<T, TOption>) {
	const {
		label,
		labelDescription,
		options = [] as TOption[],
		orientation = "horizontal",
		name,
		placeholder = "Search...",
		disabled,
		className,
		onBlur,
		onFocus,
		itemToStringValue = (o: TOption) => o.label,
		renderOption,
	} = props

	const id = makeFieldId(name)
	const selectedItem = options.find((o) => o.value === field.value) ?? null

	const defaultRenderOption = (option: TOption) => (
		<Item size="xs" className="p-0">
			<ItemContent>
				<ItemTitle className="whitespace-nowrap">{option.label}</ItemTitle>
				{option.description && (
					<ItemDescription>{option.description}</ItemDescription>
				)}
			</ItemContent>
		</Item>
	)

	const renderRow = renderOption ?? defaultRenderOption

	return (
		<Field
			orientation={orientation ?? undefined}
			data-invalid={fieldState.invalid}
		>
			<FieldContent>
				{label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
				{labelDescription && (
					<FieldDescription>{labelDescription}</FieldDescription>
				)}
				{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
			</FieldContent>
			<Combobox
				items={options}
				value={selectedItem}
				onValueChange={(item: TOption | null) =>
					field.onChange(item?.value ?? "")
				}
				itemToStringValue={itemToStringValue}
				disabled={disabled}
			>
				<ComboboxInput
					id={id}
					ref={field.ref}
					placeholder={placeholder}
					className={className}
					aria-invalid={fieldState.invalid}
					onBlur={composeBlur(field.onBlur, onBlur)}
					onFocus={onFocus}
				/>
				<ComboboxContent>
					<ComboboxEmpty>No results found.</ComboboxEmpty>
					<ComboboxList>
						{(option: TOption) => (
							<ComboboxItem key={option.value} value={option}>
								{renderRow(option)}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
			{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
		</Field>
	)
}

function RenderInput<T extends FieldValues, TOption extends BaseFieldOption>({
	field,
	fieldState,
	props,
}: SubRendererProps<T, TOption>) {
	const { fieldType, renderSkeleton, name } = props
	const id = makeFieldId(name)
	const passthrough = pickPassthroughProps(props)

	switch (fieldType) {
		case FormFieldType.CHECKBOX:
		case FormFieldType.SWITCH:
			return renderCheckbox<T, TOption>({ field, fieldState, props })

		case FormFieldType.COMBOBOX:
			return renderCombobox<T, TOption>({ field, fieldState, props })

		case FormFieldType.HIDDEN_INPUT:
			return (
				<input
					id={id}
					type="hidden"
					name={field.name}
					ref={field.ref}
					value={(field.value ?? "") as string}
					onChange={field.onChange}
				/>
			)

		case FormFieldType.INPUT:
			return (
				<Input
					id={id}
					name={field.name}
					ref={field.ref}
					type={props.type}
					value={field.value ?? ""}
					onChange={field.onChange}
					onBlur={composeBlur(field.onBlur, props.onBlur)}
					aria-invalid={fieldState.invalid}
					{...passthrough}
				/>
			)

		case FormFieldType.INPUT_GROUP:
			return renderInputGroup<T, TOption>({ field, fieldState, props })

		case FormFieldType.PASSWORD_INPUT:
			return (
				<PasswordInput
					id={id}
					name={field.name}
					ref={field.ref}
					value={field.value ?? ""}
					onChange={field.onChange}
					onBlur={composeBlur(field.onBlur, props.onBlur)}
					aria-invalid={fieldState.invalid}
					{...passthrough}
				/>
			)

		case FormFieldType.SELECT:
			return renderSelect<T, TOption>({ field, fieldState, props })

		case FormFieldType.SKELETON:
			return renderSkeleton ? renderSkeleton(field) : null

		case FormFieldType.TEXTAREA:
			return (
				<Textarea
					id={id}
					name={field.name}
					ref={field.ref}
					value={field.value ?? ""}
					onChange={field.onChange}
					onBlur={composeBlur(field.onBlur, props.onBlur)}
					aria-invalid={fieldState.invalid}
					{...passthrough}
				/>
			)

		default:
			return null
	}
}

function CustomFormField<
	T extends FieldValues,
	TOption extends BaseFieldOption = BaseFieldOption,
>({
	label,
	labelDescription,
	orientation = "vertical",
	control,
	name,
	...props
}: CustomProps<T, TOption>) {
	const isSelfManaged = SELF_MANAGED_TYPES.has(props.fieldType)
	const showLabel = !isSelfManaged && !!label

	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => {
				const renderProps: SubRendererProps<T, TOption> = {
					field,
					fieldState,
					props: { ...props, label, labelDescription, name },
				}

				if (props.fieldType === FormFieldType.HIDDEN_INPUT) {
					return <RenderInput<T, TOption> {...renderProps} />
				}

				if (isSelfManaged) {
					return <RenderInput<T, TOption> {...renderProps} />
				}

				return (
					<Field
						orientation={orientation ?? undefined}
						data-invalid={fieldState.invalid}
					>
						{showLabel && (
							<FieldLabel htmlFor={makeFieldId(name)}>{label}</FieldLabel>
						)}
						<RenderInput<T, TOption> {...renderProps} />
						{labelDescription && (
							<FieldDescription>{labelDescription}</FieldDescription>
						)}
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)
			}}
		/>
	)
}

export default CustomFormField
