import KeyValueStorage from "./KeyValueStorage"

const clearLocalStorage = async () => {
  const keys = await new KeyValueStorage().getKeys()

  keys.forEach((key) => window.localStorage.removeItem(key))

  console.debug("cleared WC client localStorage items")
}

export default clearLocalStorage
