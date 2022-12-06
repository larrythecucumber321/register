import { memo, useCallback, useEffect, useState } from 'react'
import { Box, BoxProps, Divider, Flex, Text } from 'theme-ui'
import { Web3Provider } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import { promiseMulticall } from 'state/web3/lib/multicall'

import { ERC20Interface } from 'abis'
import { ActionItem } from 'components/rtoken-selector'
import TokenItem from 'components/token-item'
import { ContractCall, Token } from 'types'
import Popup from 'components/popup'
import { ChevronDown, ChevronUp } from 'react-feather'
import { select, Trans } from '@lingui/macro'

/**
 * Fetch a list of tokens metadata from the blockchain
 */
const getTokenMeta = async (
  addresses: string[],
  provider: Web3Provider
): Promise<Token[]> => {
  const calls = addresses.reduce((acc, address) => {
    const params: any = { abi: ERC20Interface, address, args: [] }

    return [
      ...acc,
      {
        ...params,
        method: 'name',
      },
      {
        ...params,
        method: 'symbol',
      },
      {
        ...params,
        method: 'decimals',
      },
    ]
  }, [] as ContractCall[])

  const multicallResult = await promiseMulticall(calls, provider)

  return addresses.reduce((tokens, address) => {
    const [name, symbol, decimals] = multicallResult.splice(0, 3)

    tokens.push({
      address,
      name,
      symbol,
      decimals,
    })
    return tokens
  }, [] as Token[])
}

interface TokenListProps {
  onSelect(address: string): void
  tokens: Token[]
}
export const TokenList = memo(({ onSelect, tokens }: TokenListProps) => {
  return (
    <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
      {Object.values(tokens).map(({ address, logo, symbol }) => (
        <ActionItem key={address} onClick={() => onSelect(address)}>
          <TokenItem symbol={symbol} logo={logo} />
        </ActionItem>
      ))}
    </Box>
  )
})

// TODO: these should come from zap contract
const supportedTokens: string[] = [
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
  '0x853d955aCEf822Db058eb8505911ED77F175b99e',
  '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
  '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
  '0x12392F67bdf24faE0AF363c24aC620a2f67DAd86',
]

const ZapTokenSelector = (props: BoxProps) => {
  const { provider } = useWeb3React()
  const [tokens, setTokens] = useState<Token[]>([])
  const [isVisible, setVisible] = useState(false)

  const [selectedToken, setSelectedToken] = useState<Token | undefined>(
    undefined
  )

  const handleSelect = useCallback(
    (tokenAddr: string) => {
      if (tokenAddr !== selectedToken?.address) {
        setSelectedToken(tokens.find((t) => t.address === tokenAddr))
        setVisible(false)
      }
    },
    [setSelectedToken, selectedToken]
  )
  useEffect(() => {
    const updateTokens = async () => {
      if (!provider) return
      const tokens = await getTokenMeta(supportedTokens, provider)
      setTokens(tokens)
      if (!selectedToken) setSelectedToken(tokens[0])
    }

    updateTokens()
  }, [provider])

  if (!tokens.length) return null

  return (
    <Box style={{ paddingLeft: '0.5rem' }}>
      <Flex sx={{ alignItems: 'center' }} mb={2}>
        <Text as="label" variant="legend" ml={2}>
          <Trans>Mint with Zap</Trans>
        </Text>
      </Flex>
      <Popup
        show={isVisible}
        onDismiss={() => setVisible(false)}
        content={<TokenList onSelect={handleSelect} tokens={tokens} />}
      >
        <Flex
          {...props}
          sx={{ alignItems: 'center', cursor: 'pointer', minWidth: 100 }}
          onClick={() => setVisible(!isVisible)}
        >
          {selectedToken && (
            <TokenItem
              sx={{
                overflow: 'hidden',
                width: [60, 'auto'],
                textOverflow: 'ellipsis',
              }}
              logo={selectedToken.logo}
              symbol={selectedToken.symbol}
            />
          )}
          <Box mr="2" />
          {isVisible ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </Flex>
      </Popup>
      <Box my={1} />
    </Box>
  )
}

export default ZapTokenSelector
