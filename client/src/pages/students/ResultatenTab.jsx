import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ComboboxField from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import format from 'date-fns/format';
import { nl } from 'date-fns/locale';
import { ArrowUpDown, X } from 'lucide-react';

export default function ResultatenTab({
  search,
  setSearch,
  moduleOptions,
  moduleFilters,
  setModuleFilters,
  filteredSortedResults,
  toggleSort,
  getModuleName,
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek resultaten op naam of vak"
            />
          </div>
          <div className="w-full sm:w-64">
            <ComboboxField
              label={null}
              items={moduleOptions}
              value={''}
              onChange={(v) => {
                if (!v) {
                  setModuleFilters([]);
                  return;
                }
                setModuleFilters((prev) =>
                  prev.includes(v) ? prev : [...prev, v]
                );
              }}
              placeholder="Filter op vak"
            />
          </div>
        </div>
        {(search?.trim() || (moduleFilters || []).length > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {search?.trim() ? (
                <Badge
                  variant="secondary"
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
                >
                  <span className="text-sm">Zoek: “{search.trim()}”</span>
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="grid h-5 w-5 place-items-center rounded-full hover:bg-foreground/10"
                    aria-label="Zoekfilter verwijderen"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ) : null}
              {(moduleFilters || []).map((mf) => (
                <Badge
                  key={mf}
                  variant="secondary"
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
                >
                  <span className="text-sm">Vak: {mf}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setModuleFilters((prev) => prev.filter((v) => v !== mf))
                    }
                    className="grid h-5 w-5 place-items-center rounded-full hover:bg-foreground/10"
                    aria-label="Vakfilter verwijderen"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="text-lg">
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort('module')}
              >
                <span className="inline-flex items-center gap-1">
                  Vak <ArrowUpDown className="size-4 opacity-60" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort('type')}
              >
                <span className="inline-flex items-center gap-1">
                  Type <ArrowUpDown className="size-4 opacity-60" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort('name')}
              >
                <span className="inline-flex items-center gap-1">
                  Naam <ArrowUpDown className="size-4 opacity-60" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort('date')}
              >
                <span className="inline-flex items-center gap-1">
                  Datum <ArrowUpDown className="size-4 opacity-60" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort('grade')}
              >
                <span className="inline-flex items-center gap-1">
                  Cijfer <ArrowUpDown className="size-4 opacity-60" />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-base">
            {filteredSortedResults.map((result) => (
              <TableRow key={result.id}>
                <TableCell>{getModuleName(result)}</TableCell>
                <TableCell>
                  {result.assessment.type === 'test' ? 'Toets' : 'Examen'}
                </TableCell>
                <TableCell>{result.assessment.name}</TableCell>
                <TableCell>
                  {format(result.date, 'dd-MM-yyyy', { locale: nl })}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${
                      result.grade >= 8
                        ? 'text-white bg-green-700 size-8 rounded-full text-base'
                        : result.grade >= 6
                        ? 'text-white bg-primary size-8 rounded-full text-base'
                        : 'text-white bg-red-500 size-8 rounded-full text-base'
                    }`}
                    variant="default"
                  >
                    {result.grade}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filteredSortedResults.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  Geen resultaten gevonden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
