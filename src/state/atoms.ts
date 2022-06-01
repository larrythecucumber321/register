import { _ReserveToken } from './../types/index'
import { BigNumber } from '@ethersproject/bignumber'
import { atom } from 'jotai'
import { atomWithStorage, createJSONStorage } from 'jotai/utils'
import {
  MulticallState,
  RawCall,
  ReserveToken,
  TransactionState,
  Wallet,
} from 'types'
import { RSR, TRANSACTION_STATUS } from 'utils/constants'

localStorage.setItem('selectedAccount', localStorage.selectedAccount || ' ')
localStorage.setItem('selectedToken', localStorage.selectedToken || ' ')

export const blockAtom = atom<number | undefined>(undefined)
// Prices
export const ethPriceAtom = atom(1)
export const rsrPriceAtom = atom(1)
export const gasPriceAtom = atom(1)
export const rTokenPriceAtom = atom(1)
export const rsrExchangeRateAtom = atom(1)
export const blockTimestampAtom = atom<number>(0)

// Cache layer for loaded tokens
export const reserveTokensAtom = atomWithStorage<{ [x: string]: ReserveToken }>(
  'reserveTokens',
  {}
)
export const _reserveTokensAtom = atomWithStorage<{
  [x: string]: _ReserveToken
}>('reserveTokens', {})

export const selectedRTokenAtom = atomWithStorage('selectedRToken', '')

export const _rTokenAtom = atom<_ReserveToken | null>((get) =>
  get(_reserveTokensAtom) && get(_reserveTokensAtom)[get(selectedRTokenAtom)]
    ? get(_reserveTokensAtom)[get(selectedRTokenAtom)]
    : null
)

// export const _rTokenAtom = atom<_ReserveToken | null>((get) => {
//   get(_reserveTokensAtom) && get(_reserveTokensAtom)[get(selectedRTokenAtom)]
//     ? get(_reserveTokensAtom)[get(selectedRTokenAtom)]
//     : null
// })

export const rTokenAtom = atom<ReserveToken | null>((get) =>
  get(reserveTokensAtom) && get(reserveTokensAtom)[get(selectedRTokenAtom)]
    ? get(reserveTokensAtom)[get(selectedRTokenAtom)]
    : null
)

export const walletsAtom = atomWithStorage<{ [x: string]: Wallet }>(
  'wallets',
  {}
)
export const selectedAccountAtom = atomWithStorage('trackedAccount', '')
export const connectedAccountAtom = atom('')

export const walletAtom = atom<Wallet | null>((get) =>
  get(walletsAtom) && get(walletsAtom)[get(selectedAccountAtom)]
    ? get(walletsAtom)[get(selectedAccountAtom)]
    : null
)

export const currentWalletAtom = atom<Wallet | null>(
  (get) => get(walletsAtom)[get(connectedAccountAtom)] || null
)

export const balancesAtom = atom<{ [x: string]: number }>({})
export const rTokenBalanceAtom = atom((get) => {
  const rToken = get(rTokenAtom)

  if (rToken && get(balancesAtom)[rToken.token.address]) {
    return get(balancesAtom)[rToken.token.address]
  }

  return 0
})
export const rsrBalanceAtom = atom((get) => {
  return get(balancesAtom)[RSR.address] || 0
})
export const stRsrBalanceAtom = atom((get) => {
  const stRSR = get(rTokenAtom)?.insurance?.token.address

  if (stRSR) {
    return get(balancesAtom)[stRSR] || 0
  }

  return 0
})
export const allowanceAtom = atom<{ [x: string]: BigNumber }>({})
export const pendingIssuancesAtom = atom<any[]>([])
export const pendingIssuancesSummary = atom((get) => {
  const pending = get(pendingIssuancesAtom)
  const currentBlock = get(blockAtom) ?? 0

  // TODO: Correct timestamp formatting
  return pending.reduce(
    (acc, issuance) => {
      acc.index = issuance.index
      acc.availableAt = issuance.availableAt

      if (currentBlock >= issuance.availableAt) {
        acc.availableAmount += issuance.amount
      } else {
        acc.pendingAmount += issuance.amount
      }

      return acc
    },
    {
      index: BigNumber.from(0),
      pendingAmount: 0,
      availableAmount: 0,
      availableAt: 0,
    }
  )
})

export const pendingRSRAtom = atom<any[]>([])
export const pendingRSRSummaryAtom = atom((get) => {
  const currentTime = get(blockTimestampAtom)
  return get(pendingRSRAtom).reduce(
    (acc, unstake) => {
      acc.index = unstake.index
      acc.availableAt = unstake.availableAt

      if (currentTime >= unstake.availableAt) {
        acc.availableAmount += unstake.amount
      } else {
        acc.pendingAmount += unstake.amount
      }

      return acc
    },
    {
      index: BigNumber.from(0),
      pendingAmount: 0,
      availableAt: 0,
      availableAmount: 0,
    }
  )
})

// Calls state
export const callsAtom = atom<RawCall[]>([])
export const multicallStateAtom = atom<MulticallState>({})

interface TransactionMap {
  [x: string]: TransactionState[]
}

const txStorage = createJSONStorage<TransactionMap>(() => localStorage)

txStorage.getItem = (key: string): TransactionMap => {
  const data = localStorage?.getItem(key)

  if (!data) return {}

  try {
    const parsed = JSON.parse(data) as TransactionMap

    return Object.keys(parsed).reduce((txs, current) => {
      txs[current] = parsed[current].map((tx) => {
        if (
          tx.status === TRANSACTION_STATUS.SIGNING ||
          tx.status === TRANSACTION_STATUS.PENDING
        ) {
          return { ...tx, status: TRANSACTION_STATUS.UNKNOWN }
        }

        return tx
      })

      return txs
    }, {} as TransactionMap)
  } catch (e) {
    localStorage.setItem(key, JSON.stringify({}))
    return {}
  }
}

export const txAtom = atomWithStorage<TransactionMap>(
  'transactions',
  {},
  txStorage
)

export const currentTxAtom = atom((get) =>
  get(txAtom) && get(txAtom)[get(selectedAccountAtom)]
    ? get(txAtom)[get(selectedAccountAtom)]
    : []
)

// TODO: Improve or split this atom
export const pendingTxAtom = atom((get) => {
  const result = {
    pending: <[number, TransactionState][]>[],
    signing: <[number, TransactionState][]>[],
    mining: <[number, TransactionState][]>[],
  }

  return get(currentTxAtom).reduce((acc, current, index) => {
    if (current.status === TRANSACTION_STATUS.PENDING) {
      acc.pending = [...acc.pending, [index, current]]
    }

    if (current.status === TRANSACTION_STATUS.MINING) {
      acc.mining = [...acc.mining, [index, current]]
    }

    if (current.status === TRANSACTION_STATUS.SIGNING) {
      acc.signing = [...acc.signing, [index, current]]
    }

    return acc
  }, result)
})

export const addTransactionAtom = atom(
  null,
  (get, set, tx: TransactionState[]) => {
    const txs = get(txAtom)
    const account = get(selectedAccountAtom)
    set(txAtom, {
      ...txs,
      [account]: [...(txs[account] ?? []), ...tx].slice(-50),
    })
  }
)

export const updateTransactionAtom = atom(
  null,
  (get, set, data: [number, Partial<TransactionState>]) => {
    const txs = get(txAtom)
    const account = get(selectedAccountAtom)
    const currentTx = txs[account]
    const [index, newData] = data

    set(txAtom, {
      ...txs,
      [account]: [
        ...currentTx.slice(0, index),
        { ...currentTx[index], ...newData },
        ...currentTx.slice(index + 1),
      ],
    })
  }
)
