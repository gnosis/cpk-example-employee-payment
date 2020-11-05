import { config } from 'dotenv'

config()

export const rpcUrl: string = process.env.RPC_URL!!