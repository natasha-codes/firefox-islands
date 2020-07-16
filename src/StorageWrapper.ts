import { ContextualIdentityDetails } from "./ContextualIdentity"

export class StorageWrapper {
  /**
   * Get the current stored settings.
   */
  static async getStoredSettings(): Promise<Settings> {
    const rawStoredSettings = await browser.storage.local.get([
      StorageConstants.islandsStorageKey,
      StorageConstants.routesStorageKey,
    ])

    return {
      islands: rawStoredSettings[StorageConstants.islandsStorageKey] ?? {},
      routes: rawStoredSettings[StorageConstants.routesStorageKey] ?? {},
    }
  }

  /**
   * Create an island with the given name and details. Resolves with `false`
   * if island could not be created.
   *
   * @param name - island name
   * @param ciDetails - island CI details
   */
  static async createIsland(
    name: string,
    ciDetails: ContextualIdentityDetails,
  ): Promise<boolean> {
    if (name === "") {
      console.warn("Island name must not be empty")
      return false
    }

    let islands = (await this.getStoredSettings()).islands

    if (name in islands) {
      console.warn("Island already exists")
      return false
    }

    islands[name] = ciDetails

    await browser.storage.local.set({
      [StorageConstants.islandsStorageKey]: islands,
    })

    return true
  }

  /**
   * Delete an island with the given name. Resolves with `false`
   * if no such island exists.
   *
   * @param name - island name
   */
  static async deleteIsland(name: string): Promise<boolean> {
    if (name === "") {
      console.warn("Island name must not be empty")
      return false
    }

    let settings = await this.getStoredSettings()

    if (!(name in settings.islands)) {
      console.warn("Island does not exist")
      return false
    }

    if (Object.values(settings.routes).includes(name)) {
      console.warn("Routes exist pointing to island")
      return false
    }

    delete settings.islands[name]

    await browser.storage.local.set({
      [StorageConstants.islandsStorageKey]: settings.islands,
    })

    return true
  }

  /**
   * Create a route with the given URL fragment and island. Resolves
   * with `false` if the route could not be created.
   *
   * Routes may fail to create if the island does not exist, or if
   * a route already exists for that exact URL fragment.
   *
   * @param urlFragment - route url fragment
   * @param island - route island
   */
  static async createRoute(
    urlFragment: string,
    island: string,
  ): Promise<boolean> {
    if (urlFragment === "" || island === "") {
      console.warn("Neither URL nor island may be empty")
      return false
    }

    const settings = await this.getStoredSettings()

    if (!(island in settings.islands)) {
      console.warn("Island does not exist")
      return false
    }

    if (urlFragment in settings.routes) {
      console.warn("Route already exists")
      return false
    }

    settings.routes[urlFragment] = island

    await browser.storage.local.set({
      [StorageConstants.routesStorageKey]: settings.routes,
    })

    return true
  }

  /**
   * Delete a route with the given URL fragment. Resolves with `false`
   * if no such route exists.
   *
   * @param urlFragment - route URL fragment
   */
  static async deleteRoute(urlFragment: string): Promise<boolean> {
    if (urlFragment === "") {
      console.warn("URL must not be empty")
      return false
    }

    const routes = (await this.getStoredSettings()).routes

    if (!(urlFragment in routes)) {
      console.warn("Route does not exist")
      return false
    }

    delete routes[urlFragment]

    await browser.storage.local.set({
      [StorageConstants.routesStorageKey]: routes,
    })

    return true
  }
}

export interface Settings {
  islands: IslandSettings
  routes: RouteSettings
}

export type IslandSettings = { [key: string]: ContextualIdentityDetails }
export type RouteSettings = { [key: string]: string }

class StorageConstants {
  static islandsStorageKey: string = "islands"
  static routesStorageKey: string = "routes"
}
