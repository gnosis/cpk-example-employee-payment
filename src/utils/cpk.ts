import CPK, { CpkTransactionManager, defaultNetworks , EthersAdapter } from 'contract-proxy-kit'
import { ethers, Signer } from 'ethers'

export const timeout = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const configureCpk = async (cpk: CPK, signer: Signer): Promise<void> => {
    const ethLibAdapter = new EthersAdapter({ ethers, signer })
    cpk.setNetworks(defaultNetworks)
    cpk.setEthLibAdapter(ethLibAdapter)
    if (!cpk.isSafeApp())
        cpk.setTransactionManager(new CpkTransactionManager())
    await cpk.init()
}