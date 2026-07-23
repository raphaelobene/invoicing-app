import OrganizationSettings from "@/features/organizations/components/organization-settings"
import { Page } from "@/lib/platform/server/safe-page"

export default Page.create({
	path: "/settings/organization",
	name: "organization-settings",
}).page(() => <OrganizationSettings />)
