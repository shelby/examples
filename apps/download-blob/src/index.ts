import "dotenv/config"
import { createWriteStream, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import type { ReadableStream } from "node:stream/web"
import {
	AccountAddress,
	Network,
} from "@aptos-labs/ts-sdk"
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node"

const BLOB_NAME = "whitepaper.pdf" // Name to assign the blob in Shelby

/**
 * Load & validate env vars from the .env file (see README)
 */
const SHELBY_ACCOUNT_ADDRESS = process.env.SHELBY_ACCOUNT_ADDRESS as string
const SHELBY_API_KEY = process.env.SHELBY_API_KEY

if (!SHELBY_ACCOUNT_ADDRESS) {
	console.error("SHELBY_ACCOUNT_ADDRESS is not set in .env")
	process.exit(1)
}
if (!SHELBY_API_KEY) {
	console.error("SHELBY_API_KEY is not set in .env")
	process.exit(1)
}

/**
 * For now, Shelby only supports the shelbynet network
 * In the future, you can specify which network to use
 */
const client = new ShelbyNodeClient({
	network: Network.SHELBYNET,
	apiKey: SHELBY_API_KEY,
})
const account = AccountAddress.fromString(SHELBY_ACCOUNT_ADDRESS)

// Away we go!
async function main() {
	try {
		/**
		 * Download the blob from Shelby
		 */
		console.log("*** Downloading blob from Shelby...")
		const download = await client.download({ account, blobName: BLOB_NAME })
		console.log("*** Downloaded", BLOB_NAME, "successfully.")
		const outPath = join(process.cwd(), "downloads", BLOB_NAME)
		/**
		 * Save the blob to the local filesystem
		 */
		mkdirSync(dirname(outPath), { recursive: true })
		const webStream = download.readable as ReadableStream<Uint8Array>
		await pipeline(Readable.fromWeb(webStream), createWriteStream(outPath))
		console.log("*** Saved the blob to", outPath)
	} catch (e: unknown) {
		if (e instanceof Error && e.message.includes("429")) {
			console.error("*** Rate limit exceeded (429).")
			return
		}
		const msg = e instanceof Error ? e.message : String(e)
		if (/not\s*found|404/i.test(msg)) {
			console.error(
                `*** Blob "${BLOB_NAME}" not found for account ${SHELBY_ACCOUNT_ADDRESS}`
            )
			process.exit(1)
		}
		/**
		 * If this occurs repeatedly, please contact Shelby support!
		 */
		if (/500|internal server error/i.test(msg)) {
			console.error("*** Server error occurred.")
			process.exit(1)
		}
		console.error("Unexpected error:\n", msg)
		process.exit(1)
	}
}

main()
