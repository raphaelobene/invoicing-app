import { Page } from "@/lib/platform/server/safe-page"

export default Page.create({
	path: "/settings",
	name: "settings",
}).page(() => <div>settings page</div>)
