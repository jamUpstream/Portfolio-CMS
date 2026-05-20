import { useEffect, useMemo, useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronLeft, ChevronRight, GripVertical, LayoutGrid, Pencil, Search, Table2, Trash2 } from 'lucide-react';

function SortableRow({ row, columns, selected, onSelect, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: row.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <tr ref={setNodeRef} style={style}>
      <td>
        <input type="checkbox" checked={selected} onChange={(event) => onSelect(row.id, event.target.checked)} aria-label={`Select ${row.title || row.name || row.id}`} />
      </td>
      <td>
        <button className="icon-button drag-handle" aria-label="Reorder" type="button" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      {columns.map((column) => (
        <td key={column}>{String(row[column] ?? '')}</td>
      ))}
      <td className="table-row-actions">
        <button className="icon-button" aria-label="Edit" onClick={() => onEdit(row)}>
          <Pencil className="h-4 w-4" />
        </button>
        <button className="icon-button danger" aria-label="Delete" onClick={() => onDelete(row)}>
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

function SortableCard({ row, columns, selected, onSelect, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: row.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const titleColumn = columns.find((column) => row[column]) || columns[0];
  const detailColumns = columns.filter((column) => column !== titleColumn).slice(0, 4);

  return (
    <article ref={setNodeRef} style={style} className={`data-card ${selected ? 'selected' : ''}`}>
      <div className="data-card-head">
        <input type="checkbox" checked={selected} onChange={(event) => onSelect(row.id, event.target.checked)} aria-label={`Select ${row.title || row.name || row.id}`} />
        <button className="icon-button drag-handle" aria-label="Reorder" type="button" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="data-card-title">
          <strong>{String(row[titleColumn] ?? 'Untitled')}</strong>
          <small>{titleColumn.replaceAll('_', ' ')}</small>
        </div>
      </div>
      <dl className="data-card-fields">
        {detailColumns.map((column) => (
          <div key={column}>
            <dt>{column.replaceAll('_', ' ')}</dt>
            <dd>{String(row[column] ?? '') || '-'}</dd>
          </div>
        ))}
      </dl>
      <div className="data-card-actions">
        <button className="icon-button" aria-label="Edit" onClick={() => onEdit(row)}>
          <Pencil className="h-4 w-4" />
        </button>
        <button className="icon-button danger" aria-label="Delete" onClick={() => onDelete(row)}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

export default function SortableTable({ rows, columns, onReorder, onEdit, onDelete, onBulkDelete }) {
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('admin-resource-view-mode') || 'table');

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;

    return rows.filter((row) =>
      columns.some((column) => String(row[column] ?? '').toLowerCase().includes(normalized))
    );
  }, [columns, query, rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageIds = paginatedRows.map((row) => row.id);
  const selectedRows = rows.filter((row) => selectedIds.includes(row.id));
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 160, tolerance: 8 }
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    setPage(1);
  }, [pageSize, query]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => rows.some((row) => row.id === id)));
  }, [rows]);

  useEffect(() => {
    localStorage.setItem('admin-resource-view-mode', viewMode);
  }, [viewMode]);

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((row) => row.id === active.id);
    const newIndex = rows.findIndex((row) => row.id === over.id);
    onReorder(arrayMove(rows, oldIndex, newIndex));
  }

  function toggleRow(id, checked) {
    setSelectedIds((current) => checked ? [...new Set([...current, id])] : current.filter((item) => item !== id));
  }

  function togglePage(checked) {
    setSelectedIds((current) => {
      if (!checked) return current.filter((id) => !pageIds.includes(id));
      return [...new Set([...current, ...pageIds])];
    });
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function bulkDelete() {
    onBulkDelete(selectedRows, clearSelection);
  }

  return (
    <div className="table-shell">
      <div className="table-toolbar">
        <label className="table-search">
          <Search className="h-4 w-4" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search..." />
        </label>
        <div className="table-toolbar-actions">
          <div className="view-toggle" aria-label="Content view">
            <button type="button" className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')} aria-pressed={viewMode === 'table'}>
              <Table2 className="h-4 w-4" />
              <span>Table</span>
            </button>
            <button type="button" className={viewMode === 'cards' ? 'active' : ''} onClick={() => setViewMode('cards')} aria-pressed={viewMode === 'cards'}>
              <LayoutGrid className="h-4 w-4" />
              <span>Cards</span>
            </button>
          </div>
          <span className="table-count">{selectedIds.length ? `${selectedIds.length} selected` : `${filteredRows.length} items`}</span>
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} aria-label="Rows per page">
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
          </select>
          <button className="button danger-button table-bulk-button" type="button" disabled={!selectedIds.length} onClick={bulkDelete}>
            Delete selected
          </button>
        </div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={paginatedRows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
          {viewMode === 'cards' ? (
            <div className="cards-view">
              <label className="cards-select-all">
                <input type="checkbox" checked={allPageSelected} onChange={(event) => togglePage(event.target.checked)} />
                Select all on this page
              </label>
              {paginatedRows.length ? (
                <div className="data-card-grid">
                  {paginatedRows.map((row) => (
                    <SortableCard
                      key={row.id}
                      row={row}
                      columns={columns}
                      selected={selectedIds.includes(row.id)}
                      onSelect={toggleRow}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              ) : <div className="cards-empty">No results found.</div>}
            </div>
          ) : (
            <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" checked={allPageSelected} onChange={(event) => togglePage(event.target.checked)} aria-label="Select all rows on this page" />
                  </th>
                  <th aria-label="Sort handle" />
                  {columns.map((column) => (
                    <th key={column}>{column.replaceAll('_', ' ')}</th>
                  ))}
                  <th className="table-actions-heading">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                  <SortableRow
                    key={row.id}
                    row={row}
                    columns={columns}
                    selected={selectedIds.includes(row.id)}
                    onSelect={toggleRow}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
                {!paginatedRows.length ? (
                  <tr>
                    <td colSpan={columns.length + 3} className="table-empty">No results found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            </div>
          )}
        </SortableContext>
      </DndContext>
      <div className="table-pagination">
        <span>Page {currentPage} of {totalPages}</span>
        <div className="flex gap-2">
          <button className="icon-button" type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="icon-button" type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
