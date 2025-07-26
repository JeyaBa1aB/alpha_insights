import React from 'react';

interface TableProps {
  columns: string[];
  data: Array<Record<string, any>>;
  className?: string;
}

const Table: React.FC<TableProps> = ({ columns, data, className = '' }) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="min-w-full bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-left">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col} className="px-4 py-2 text-gray-300 font-semibold border-b border-white/20">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="hover:bg-white/20 transition-colors">
            {columns.map((col) => (
              <td key={col} className="px-4 py-2 border-b border-white/10 text-white">{row[col]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Table;
