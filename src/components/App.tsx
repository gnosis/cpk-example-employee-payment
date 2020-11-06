import CPK from 'contract-proxy-kit'
import React, { useEffect } from 'react'
import SafeLogo from 'src/assets/icons/safe-logo.svg'
import ConnectButton from 'src/components/ConnectButton'
import WalletInfo from 'src/components/WalletInfo'
import { configureCpk, timeout } from 'src/utils/cpk'
import styled from 'styled-components'
import { providers, Signer, utils, BigNumber } from 'ethers'
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
  const [walletState, setWalletState] = React.useState<IWalletState>(initialWalletState)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [provider, setProvider] = React.useState<providers.Provider | undefined>(undefined)
  const [proxyKit, setProxyKit] = React.useState<CPK | undefined>(undefined)

  const handleProvider = React.useCallback(async (cpk: CPK, provider: providers.Provider, signer: Signer) => {
    setProvider(provider)
    await configureCpk(cpk, signer)
    setWalletState({
      account: cpk.address
    })
  }, [setProvider, setWalletState])

  const onWeb3Connect = React.useCallback(async (web3Provider: any) => {
    if (web3Provider) {
      const provider = new providers.Web3Provider(web3Provider)
      await handleProvider(proxyKit!!, provider, provider.getSigner())
    }
  }, [proxyKit, handleProvider])

  // Init CPK
  useEffect(() => {
    const setupProxyKit = async () => {
      console.log({
        proxyKit
      })
      if (proxyKit != undefined) return;
      const cpk = await CPK.create()
      await timeout(500)
      setProxyKit(cpk)
      if (cpk.isSafeApp()) {
        const provider = new providers.JsonRpcProvider(rpcUrl)
        await handleProvider(cpk, provider, provider.getSigner())
      }
      setLoading(false)
    }
    setupProxyKit()
  }, [proxyKit, setProxyKit, handleProvider, setLoading])

  // Load Balance
  const [balance, setBalance] = React.useState<BigNumber | undefined>(undefined)
  useEffect(() => {
    let canceled = false
    const updateBalance = async () => {
      if (proxyKit && proxyKit.address) {
        try {
          setBalance(await provider?.getBalance(proxyKit.address))
        } catch (e) { }
      }
      if (!canceled) setTimeout(updateBalance, 5000)
    }
    updateBalance()
    return () => {
      canceled = true
    }
  }, [proxyKit, provider, setBalance])

  // Tx creation logic
  const [amount, setAmount] = React.useState<BigNumber | undefined>(undefined)
  const [receivers, setReceivers] = React.useState<string[]>([])

  const handleFileUpload = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files!![0]
      const reader = new FileReader()
      reader.onload = (e) => {
        if (!e.target?.result) return;
        const data = JSON.parse(e.target.result.toString())
        setAmount(utils.parseEther(data.amount))
        setReceivers(data.receivers.map((receiver: string) => utils.getAddress(receiver)))
      }
      reader.readAsBinaryString(file)
    } catch (e) {
      console.error(e)
    }
  }, [setAmount, setReceivers])

  const sendTx = React.useCallback(async () => {
    if (!proxyKit || !amount || receivers.length == 0) return
    try {
      console.log(await proxyKit.execTransactions(
        receivers.map(receiver => {
          return {
            to: receiver,
            value: amount.toString()
          }
        })
      ))
    } catch (e) {
      console.error(e)
      console.log("Rejected")
    }
  }, [proxyKit, amount, receivers])

  if (loading) {
    return (<div>Loading</div>)
  }
  if (amount && receivers.length > 0) {
    const requiredFunds = amount.mul(receivers.length);
    const disabled = balance ? balance.lt(requiredFunds) : true;
    return (<SAppContainer>
      <SHeading>Send {utils.formatEther(amount)} ETH to:</SHeading>
      { receivers.map(receiver => (<WalletInfo address={receiver} />))}
      <p>from</p>
      <WalletInfo address={walletState.account!} />
      <p>Total required funds {utils.formatEther(requiredFunds)} ETH</p>
      { balance ? (<>Current Safe balance: {utils.formatEther(balance)} ETH </>) : (<>Loading balance ...</>)}
      <Button color="primary" size="lg" onClick={sendTx} disabled={disabled}>Send</Button>
    </SAppContainer>
    )
  }
  return (
    <SAppContainer>
      <img src={SafeLogo} alt="Gnosis Safe Logo" width="100"></img>
      <SHeading>Safe Contract Proxy Kit Employee Payment</SHeading>
      {walletState.account && proxyKit ? (
        <div>
          <WalletInfo address={walletState.account!} />
          <input type="file" accept=".json" onChange={handleFileUpload} />
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
