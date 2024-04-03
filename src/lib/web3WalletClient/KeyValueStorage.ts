import { safeJsonParse, safeJsonStringify } from "@walletconnect/safe-json"
import localStorage from "./localStorage"

const PREFIX = "wallet_"

// Source
// https://github.com/WalletConnect/walletconnect-utils/blob/master/misc/keyvaluestorage/src/shared/types.ts
abstract class IKeyValueStorage {
  public abstract getKeys(): Promise<string[]>
  public abstract getEntries<T = any>(): Promise<[string, T][]>
  public abstract getItem<T = any>(key: string): Promise<T | undefined>
  public abstract setItem<T = any>(key: string, value: T): Promise<void>
  public abstract removeItem(key: string): Promise<void>
}

// Source
// https://github.com/WalletConnect/walletconnect-utils/blob/master/misc/keyvaluestorage/src/shared/utils.ts
function parseEntry(entry: [string, string | null]): [string, any] {
  return [entry[0], safeJsonParse(entry[1] ?? "")]
}

// Source
// https://github.com/WalletConnect/walletconnect-utils/blob/master/misc/keyvaluestorage/src/browser/index.ts
export class KeyValueStorage implements IKeyValueStorage {
  private readonly localStorage: Storage = localStorage

  public async getKeys(): Promise<string[]> {
    return Object.keys(this.localStorage).filter((key) =>
      key.startsWith(PREFIX),
    )
  }

  public async getEntries<T = any>(): Promise<[string, T][]> {
    return Object.entries(this.localStorage)
      .filter(([k, _v]) => k.startsWith(PREFIX))
      .map(parseEntry)
  }

  public async getItem<T = any>(key: string): Promise<T | undefined> {
    const item = this.localStorage.getItem(PREFIX + key)
    if (item === null) {
      return undefined
    }
    // TODO: fix this annoying type casting
    return safeJsonParse(item) as T
  }

  public async setItem<T = any>(key: string, value: T): Promise<void> {
    this.localStorage.setItem(PREFIX + key, safeJsonStringify(value))
  }

  public async removeItem(key: string): Promise<void> {
    this.localStorage.removeItem(PREFIX + key)
  }
}

export default KeyValueStorage
