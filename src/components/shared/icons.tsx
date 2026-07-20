import {
	FileText,
	GoogleIcon,
	LayoutDashboard,
	LoaderCircle,
	LogOut,
	Pencil,
	Plus,
	Receipt,
	Search,
	Settings,
	Trash2,
	Users,
	View,
	ViewOffSlashIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export type IconProps = React.ComponentProps<typeof HugeiconsIcon>

export const Icons = {
	view: View,
	viewOff: ViewOffSlashIcon,
	google: GoogleIcon,
	layout: LayoutDashboard,
	users: Users,
	receipt: Receipt,
	fileText: FileText,
	logout: LogOut,
	pencil: Pencil,
	plus: Plus,
	settings: Settings,
	trash: Trash2,
	search: Search,
	spinner: LoaderCircle,
}

export function Icon({
	size = 16,
	color = "currentColor",
	strokeWidth = 2,
	...rest
}: IconProps) {
	return (
		<HugeiconsIcon
			size={size}
			color={color}
			strokeWidth={strokeWidth}
			{...rest}
		/>
	)
}
