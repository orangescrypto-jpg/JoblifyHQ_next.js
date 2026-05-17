'use client';
import { ReactNode } from 'react';

interface TableRow {
  id: string;
  cells: ReactNode[];
}

interface AdminTableProps {
  headers: string[];
  rows: TableRow[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function AdminTable({ headers, rows, onEdit, onDelete }: AdminTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
          <tr>{headers.map((h, i) => <th key={i} className="px-4 py-3">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="px-4 py-12 text-center text-gray-500">No records found.</td></tr>
          ) : rows.map(row => (
            <tr key={row.id} className="hover:bg-gray-50 transition">
              {row.cells.map((cell, i) => <td key={i} className="px-4 py-3">{cell}</td>)}
              <td className="px-4 py-3 text-right space-x-3">
                <button onClick={() => onEdit(row.id)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                <button onClick={() => onDelete(row.id)} className="text-red-600 hover:text-red-800 font-medium">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
