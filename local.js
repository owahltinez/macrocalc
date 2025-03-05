import Fuse from "https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs";

function parseProductLookupResult(result) {
  return {
    id: result.id,
    name: result.name,
    title: `${result.name} (${result.brand})`,
    nutrients: {
      kcal: result.kcal || 0,
      protein: result.protein || 0,
      fat: result.fat || 0,
      carbs: result.carbs || 0,
      fiber: result.fiber || 0,
      sugar: result.sugar || 0,
    },
    serving: {
      size: result.serving_size,
      unit: result.serving_unit,
    },
    url: result.url,
    source: "local",
  };
}

const fuseOptions = {
  keys: ["name", "brand"],
  ignoreDiacritics: true,
  ignoreLocation: true,
  threshold: 0.4,
};

export class Local {
  constructor() {
    this._fuse = null;
    this._products = null;
  }

  get products() {
    if (!this._products) {
      this._products = fetch("products.json").then((r) => r.json());
    }
    return this._products;
  }

  get fuse() {
    if (!this._fuse) {
      this._fuse = this.products.then(
        (products) => new Fuse(products, fuseOptions)
      );
    }
    return this._fuse;
  }

  async lookupFoodId(id) {
    const products = await this.products;
    return parseProductLookupResult(products.find((p) => p.id == id));
  }

  async searchFoods(query, { limit = 10 } = {}) {
    const fuse = await this.fuse;
    return fuse
      .search(query)
      .slice(0, limit)
      .map((food) => parseProductLookupResult(food.item));
  }
}
