import { useState } from "react";
import {
  parsePostgresResults,
  formatDisplayValue,
  getValueType,
} from "./data-parser";

interface QueryResultsTableProps {
  data: Record<string, any>[];
  title?: string;
}

export const QueryResultsTable = ({ data, title }: QueryResultsTableProps) => {
  const [showTable, setShowTable] = useState(true);

  if (!data || data.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
        No data to display
      </div>
    );
  }

  // Parse raw PostgreSQL results into typed objects
  const parsedData = parsePostgresResults(data);

  // Get all unique column names from the data
  const columns = Array.from(
    new Set(parsedData.flatMap((row) => Object.keys(row))),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTable(!showTable)}
            className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors flex items-center gap-2"
          >
            <span>{showTable ? "▼" : "▶"}</span>
            {showTable ? "Hide" : "Show"} Table
          </button>
          {title && (
            <span className="text-xs font-semibold text-gray-600">{title}</span>
          )}
          <span className="text-xs text-gray-500">
            ({parsedData.length} rows)
          </span>
        </div>
      </div>

      {showTable && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  {columns.map((col) => {
                    const value = row[col];
                    const valueType = getValueType(value);
                    const displayValue = formatDisplayValue(value);

                    return (
                      <td
                        key={`${rowIndex}-${col}`}
                        className="px-4 py-3 text-gray-700 max-w-xs overflow-hidden text-ellipsis"
                        title={displayValue}
                      >
                        {valueType === "null" ? (
                          <span className="text-gray-400 italic">null</span>
                        ) : valueType === "boolean" ? (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              value
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {displayValue}
                          </span>
                        ) : valueType === "uuid" ? (
                          <code className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono">
                            {displayValue}
                          </code>
                        ) : valueType === "date" ? (
                          <span className="text-gray-700">{displayValue}</span>
                        ) : valueType === "number" ? (
                          <span className="text-right font-mono">
                            {displayValue}
                          </span>
                        ) : (
                          <span>{displayValue}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
