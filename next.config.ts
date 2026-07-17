import type { NextConfig } from "next"

import "./src/lib/env/client"
import "./src/lib/env/server"

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	logging: { incomingRequests: false },
	serverExternalPackages: ["pino"],
}

export default nextConfig
