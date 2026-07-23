import {
	ArrowDown02Icon,
	ArrowUp02Icon,
	ArrowUpRight03Icon,
	ChevronsUpDown,
	Download,
	FileCheck,
	FileText,
	GoogleIcon,
	LayoutDashboard,
	LoaderCircle,
	LogOut,
	Mail,
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
	ArrowDown: ArrowDown02Icon,
	arrowUp: ArrowUp02Icon,
	arrowUpRight: ArrowUpRight03Icon,
	chevronsUpDown: ChevronsUpDown,
	download: Download,
	fileCheck: FileCheck,
	fileText: FileText,
	google: GoogleIcon,
	layout: LayoutDashboard,
	logout: LogOut,
	mail: Mail,
	pencil: Pencil,
	plus: Plus,
	receipt: Receipt,
	settings: Settings,
	search: Search,
	spinner: LoaderCircle,
	trash: Trash2,
	users: Users,
	view: View,
	viewOff: ViewOffSlashIcon,
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
