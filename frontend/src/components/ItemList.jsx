const CATEGORY_STYLES = {
  Electronics: "bg-violet-100 text-violet-700 ring-violet-200",
  Furniture: "bg-amber-100 text-amber-800 ring-amber-200",
  Stationery: "bg-sky-100 text-sky-700 ring-sky-200",
};

function CategoryBadge({ category }) {
  const style =
    CATEGORY_STYLES[category] ?? "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {category}
    </span>
  );
}

function StockBadge({ inStock }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        inStock
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
          : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-emerald-500" : "bg-rose-500"}`}
        aria-hidden="true"
      />
      {inStock ? "In stock" : "Out of stock"}
    </span>
  );
}

export default function ItemList({ items, onToggleStock, togglingId, loading }) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <div className="animate-pulse space-y-4 p-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-5 flex-1 rounded bg-slate-100" />
              <div className="h-5 w-24 rounded bg-slate-100" />
              <div className="h-5 w-20 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200/60">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <svg
            className="h-7 w-7 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">No items found</h3>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting your search or category filter.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80">
            <tr>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Product
              </th>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Price
              </th>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map((item) => {
              const isToggling = togglingId === item.id;
              return (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-slate-50/70"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="font-medium text-slate-900">{item.name}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <CategoryBadge category={item.category} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold tabular-nums text-slate-900">
                        ${item.price.toFixed(2)}
                      </span>
                      {typeof item.priceEur === "number" ? (
                        <span className="text-xs tabular-nums text-slate-400">
                          €{item.priceEur.toFixed(2)} EUR
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StockBadge inStock={item.inStock} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => onToggleStock(item.id)}
                      aria-label={`Toggle stock for ${item.name}`}
                      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                        item.inStock
                          ? "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:ring-slate-400"
                          : "bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500"
                      }`}
                    >
                      {isToggling ? (
                        <>
                          <svg
                            className="h-4 w-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          Updating…
                        </>
                      ) : item.inStock ? (
                        "Mark unavailable"
                      ) : (
                        "Restock"
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
