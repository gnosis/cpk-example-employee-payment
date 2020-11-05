import { config } from 'dotenv'

config()

export const rpcUrl: string = process.env.REACT_APP_RPC_URL!!