// Super secret, high-level security.
const API_KEY_1 = 'TECNS4mXvDoMJgtBqeJG';
const API_KEY_2 = 'OmbTyuzaBlC3eGme0gru';
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

function authenticatedRequest(url) {
  url.searchParams.set('api_key', API_KEY_1 + API_KEY_2);
  return fetch(url);
}

function parseNutrients(nutrients) {
  const x = nutrients.reduce((agg, n) => ({ ...agg, [n.nutrientName]: n.value }), {});
  return {
    kcal: x['Energy'] || 0,
    protein: x['Protein'] || 0,
    fat: x['Total lipid (fat)'] || 0,
    carbs: x['Carbohydrate, by difference'] || 0,
    fiber: x['Fiber, total dietary'] || 0,
    sugar: x['Total Sugars'] || 0,
  }
}

function parseFoodSearchResult(result) {
  return {
    id: result.fdcId,
    name: result.description,
    title: `${result.description} (${result.brandName})`,
    nutrients: parseNutrients(result.foodNutrients),
    serving: {
      size: result.servingSize,
      unit: result.servingSizeUnit,
    },
  }
}

function parseFoodIdLookupResult(result) {
  return {
    id: result.fdcId,
    name: result.description,
    title: `${result.description} (${result.brandName})`,
    nutrients: {
      kcal: result.labelNutrients.calories?.value,
      protein: result.labelNutrients.protein?.value,
      fat: result.labelNutrients.fat?.value,
      carbs: result.labelNutrients.carbohydrates?.value,
      fiber: result.labelNutrients.fiber?.value,
      sugar: result.labelNutrients.sugars?.value,
    },
    serving: {
      size: result.servingSize,
      unit: result.servingSizeUnit,
    },
    url: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${result.fdcId}/nutrients`,
  }
}

function filterMissingMacros(food) {
  return Object.keys(food.nutrients).some(k => food.nutrients[k] > 0);
}

export class USDA {

  static async lookupFoodId(fdcId) {
    const url = new URL(`${BASE_URL}/food/${fdcId}`);
    const result = await authenticatedRequest(url).then((res) => res.json());
    return parseFoodIdLookupResult(result);
  }

  static async searchFoods(query) {
    this.ingredientChoices = [];
    const url = new URL(`${BASE_URL}/foods/search`);
    url.searchParams.set('query', query);
    url.searchParams.set('dataType', 'Branded');
    const result = await authenticatedRequest(url).then((res) => res.json());
    if (result.error?.message) throw new Error(result.error.message);
    return result.foods.map(parseFoodSearchResult).filter(filterMissingMacros);
  };

}
