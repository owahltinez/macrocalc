import Fuse from "https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs";

function parseProductLookupResult(result) {
  const item = result.item;
  console.log(item);
  return {
    id: item.id,
    name: item.name,
    title: `${item.name} (${item.brand})`,
    nutrients: {
      kcal: item.kcal || 0,
      protein: item.protein || 0,
      fat: item.fat || 0,
      carbs: item.carbs || 0,
      fiber: item.fiber || 0,
      sugar: item.sugar || 0,
    },
    serving: {
      size: item.serving_size,
      unit: item.serving_unit,
    },
    url: item.url,
  };
}

const fuseOptions = {
  keys: ["name", "brand"],
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
    return products.find((p) => p.id === id);
  }

  async searchFoods(query, { limit = 10 } = {}) {
    const fuse = await this.fuse;
    return fuse.search(query).slice(0, limit).map(parseProductLookupResult);
  }
}
