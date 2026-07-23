import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/generated/prisma/client"
import { env } from "@/lib/env/server"

const connectionString = `${env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })

const globalForPrisma = global as unknown as {
	prisma: PrismaClient
}

const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		adapter,
		log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
	})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
