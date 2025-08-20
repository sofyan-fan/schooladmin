import classApi from '@/apis/classes/classAPI';
import classroomApi from '@/apis/classrooms/classroomAPI';
import rosterApi from '@/apis/rosters/rosterAPI';
import { createColumns as createClassColumns } from '@/components/classes/columns';
import CreateClassModal from '@/components/classes/CreateClassModal';
import EditClassModal from '@/components/classes/EditClassModal';
import ViewClassModal from '@/components/classes/ViewClassModal';
import { createColumns as createClassroomColumns } from '@/components/classrooms/columns';
import CreateClassroomModal from '@/components/classrooms/CreateClassroomModal';
import EditClassroomModal from '@/components/classrooms/EditClassroomModal';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import { createColumns as createRosterColumns } from '@/components/rosters/columns';
import CreateRosterModal from '@/components/rosters/CreateRosterModal';
import EditRosterModal from '@/components/rosters/EditRosterModal';
import ViewRosterModal from '@/components/rosters/ViewRosterModal';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/Table';
import Toolbar from '@/components/shared/Toolbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Calendar, LayoutDashboard, School } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const ClassroomsTab = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await classroomApi.get_classrooms();
      setClassrooms(data || []);
    } catch (e) {
      console.error('Failed to load classrooms', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (newClassroom) => {
    await classroomApi.add_classroom(newClassroom);
    fetchData();
  };

  const handleUpdate = async (updatedClassroom) => {
    await classroomApi.edit_classroom(updatedClassroom);
    fetchData();
  };

  const handleDelete = async (id) => {
    await classroomApi.delete_classroom(id);
    fetchData();
  };

  const handleEdit = (record) => {
    setSelected(record);
    setOpenEdit(true);
  };

  const columns = useMemo(
    () =>
      createClassroomColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    []
  );

  const table = useReactTable({
    data: classrooms,
    columns,
    state: {
      sorting,
      pagination,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      <Toolbar
        table={table}
        filterColumn="name"
        buttonText="Nieuw Lokaal"
        onAdd={() => setOpenCreate(true)}
      />
      <DataTable table={table} loading={loading} columns={columns} />
      <CreateClassroomModal
        isOpen={openCreate}
        onClose={() => setOpenCreate(false)}
        onSave={handleCreate}
      />
      <EditClassroomModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        onSave={handleUpdate}
        classroom={selected}
      />
    </div>
  );
};

const ClassesTab = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const classData = await classApi.get_classes();
      setClasses(classData);
    } catch (e) {
      console.error('Failed to load classes', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (newClass) => {
    await classApi.add_class(newClass);
    fetchData();
  };

  const handleUpdate = async (updatedClass) => {
    await classApi.edit_class(updatedClass);
    fetchData();
  };

  const handleDelete = async (id) => {
    await classApi.delete_class(id);
    fetchData();
  };

  const handleView = (record) => {
    setSelected(record);
    setOpenView(true);
  };

  const handleEdit = (record) => {
    setSelected(record);
    setOpenEdit(true);
  };

  const columns = useMemo(
    () =>
      createClassColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    []
  );

  const table = useReactTable({
    data: classes,
    columns,
    state: {
      sorting,
      pagination,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      <Toolbar
        table={table}
        filterColumn="name"
        buttonText="Nieuwe Klas"
        onAdd={() => setOpenCreate(true)}
      />
      <DataTable table={table} loading={loading} columns={columns} />
      <ViewClassModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        classData={selected}
      />
      <CreateClassModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSave={handleCreate}
      />
      <EditClassModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        onSave={handleUpdate}
        classData={selected}
      />
    </div>
  );
};

const RostersTab = () => {
  const [rosters, setRosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const rosterData = await rosterApi.get_rosters();
      const mappedData = (rosterData || []).map((r) => ({
        ...r,
        className: r.class?.name ?? '',
      }));
      setRosters(mappedData);
    } catch (e) {
      console.error('Failed to load rosters', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (data) => {
    await rosterApi.add_roster(data);
    fetchData();
    setOpenCreate(false);
  };

  const handleUpdate = async (updatedRoster) => {
    const payload = {
      id: updatedRoster.id,
      classId: updatedRoster.classId,
      schedules: updatedRoster.schedules,
    };
    await rosterApi.edit_roster(payload);
    fetchData();
    setOpenEdit(false);
  };

  const handleDelete = async (id) => {
    await rosterApi.delete_roster(id);
    fetchData();
  };

  const handleView = (record) => {
    setSelected(record);
    setOpenView(true);
  };

  const handleEdit = (record) => {
    setSelected(record);
    setOpenEdit(true);
  };

  const columns = useMemo(
    () =>
      createRosterColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    []
  );

  const table = useReactTable({
    data: rosters,
    columns,
    state: {
      sorting,
      pagination,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      <Toolbar
        table={table}
        filterColumn="className"
        buttonText="Nieuw Rooster"
        onAdd={() => setOpenCreate(true)}
      />
      <DataTable table={table} loading={loading} columns={columns} />
      <CreateRosterModal
        isOpen={openCreate}
        onClose={() => setOpenCreate(false)}
        onRosterCreated={handleCreate}
      />
      <EditRosterModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        roster={selected}
        onRosterUpdated={handleUpdate}
      />
      <ViewRosterModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        roster={selected}
      />
    </div>
  );
};

const ClassLayoutsPage = () => {
  return (
    <LayoutWrapper>
      <PageHeader
        title="Onderwijsindeling"
        icon={<LayoutDashboard className="size-9" />}
        description="Beheer klassen, lokalen en roosters."
      />
      <Tabs defaultValue="classes" className="mt-4">
        <TabsList>
          <TabsTrigger value="classes">
            <School className="mr-2" />
            Klassen
          </TabsTrigger>
          <TabsTrigger value="classrooms">
            <School className="mr-2" />
            Lokalen
          </TabsTrigger>
          <TabsTrigger value="rosters">
            <Calendar className="mr-2" />
            Roosters
          </TabsTrigger>
        </TabsList>
        <TabsContent value="classes">
          <ClassesTab />
        </TabsContent>
        <TabsContent value="classrooms">
          <ClassroomsTab />
        </TabsContent>
        <TabsContent value="rosters">
          <RostersTab />
        </TabsContent>
      </Tabs>
    </LayoutWrapper>
  );
};

export default ClassLayoutsPage;
