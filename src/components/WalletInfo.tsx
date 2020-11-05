import { EthHashInfo } from '@gnosis.pm/safe-react-components'
import React from 'react'

const AccountInfo: React.FC<{ address: string }> = ({ address }) => {
  if (!address) {
    return null
  }

  return (
    <EthHashInfo
      hash={address}
      textSize="xl"
      showCopyBtn
      showIdenticon
      showEtherscanBtn
      className="address"
      network="rinkeby"
    />
  )
}

export default AccountInfo
