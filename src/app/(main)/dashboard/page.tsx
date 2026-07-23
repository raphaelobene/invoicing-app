import Dashboard from "@/features/dashboard/components/dashboard"
import { Page } from "@/lib/platform/server/safe-page"

export default Page.create({
	path: "/dashboard",
	name: "dashboard",
}).page(() => <Dashboard />)
