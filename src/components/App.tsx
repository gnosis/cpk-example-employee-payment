import CPK from 'contract-proxy-kit'
import React, { useEffect } from 'react'
import SafeLogo from 'src/assets/icons/safe-logo.svg'
import ConnectButton from 'src/components/ConnectButton'
import WalletInfo from 'src/components/WalletInfo'
import { configureCpk, timeout } from 'src/utils/cpk'
import styled from 'styled-components'
import { providers, Signer } from 'ethers'
import { rpcUrl } from 'src/utils/config'
import { Button } from '@gnosis.pm/safe-react-components'

const SAppContainer = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 100vw;
`

const SHeading = styled.h1`
  @media screen and (max-width: 768px) {
    font-size: 1.2em;
  }
`

interface IWalletState {
  account: string | undefined
}

const initialWalletState = {
  account: undefined
}

const App: React.FC = () => {
  const [loading, setLoading] = React.useState<boolean>(true)
  const [, setProvider] = React.useState<providers.Provider | undefined>(undefined)
  const [proxyKit, setProxyKit] = React.useState<CPK | undefined>(undefined)
  const [walletState, setWalletState] = React.useState<IWalletState>(
    initialWalletState
  )

  const handleProvider = React.useCallback(async (cpk: CPK, provider: providers.Provider, signer: Signer) => {
    setProvider(provider)
    await configureCpk(cpk, signer)
    setWalletState({
      account: cpk.address
    })
  }, [setProvider, setWalletState])

  const sendTx = React.useCallback(async () => {
    if (!proxyKit) return
    const target = await proxyKit.getOwnerAccount()
    try {
      console.log(await proxyKit.execTransactions([
        {
          to: target!!,
          value: 0
        }
      ]))
    } catch(e) {
      console.error(e)
      console.log("Rejected")
    }
  }, [proxyKit])

  const onWeb3Connect = React.useCallback((web3Provider: any) => {
    if (web3Provider) {
      const provider = new providers.Web3Provider(web3Provider)
      console.log({proxyKit})
      handleProvider(proxyKit!!, provider, provider.getSigner())
    }
  }, [proxyKit, handleProvider])

  // Init CPK
  useEffect(() => {
    if (proxyKit != undefined) return;
    const setupProxyKit = async () => {
      const cpk = await CPK.create()
      setProxyKit(cpk)
      await timeout(500)
      if (cpk.isSafeApp()) {
        const provider = new providers.JsonRpcProvider(rpcUrl)
        handleProvider(cpk, provider, provider.getSigner())
      }
      setLoading(false)
    }
    setupProxyKit()
  }, [proxyKit, setProxyKit, handleProvider, setLoading])

  if (loading) {
    return (<div>Loading</div>)
  }
  return (
    <SAppContainer>
      <img src={SafeLogo} alt="Gnosis Safe Logo" width="100"></img>
      <SHeading>Safe Contract Proxy Kit Employee Payment</SHeading>
      {walletState.account && proxyKit ? (
        <div>
          <WalletInfo address={walletState.account!} />
          <Button color="primary" size="md" onClick={sendTx}>Send tx</Button>
        </div>
      ) : (
          <>
            <p>Start by connecting your wallet using button below.</p>
            <ConnectButton onConnect={onWeb3Connect} />
          </>
        )}
    </SAppContainer>
  )
}

export default App
