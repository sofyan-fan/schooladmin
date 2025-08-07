import { useEffect, useState } from "react";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import courseModuleApi from "../apis/courses/courseModuleAPI";
import CourseModuleModal from "../components/courses/CourseModuleModal"; 
import subjectAPI from "@/apis/subjects/subjectAPI";

const CourseModulesPage = () => {
  const [courseModules, setCourseModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);

  // Fetch course modules and subjects on mount
  useEffect(() => {
    fetchCourseModules();
    fetchSubjects();
  }, []);

  const fetchCourseModules = async () => {
    setLoading(true);
    setApiError("");
    try {
      const data = await courseModuleApi.get_coursemodules();
      setCourseModules(data);
    } catch (e) {
      setApiError(e.message || "Failed to load course modules.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    setLoading(true);
    setApiError("");
    try {
      const data = await subjectAPI.get_subjects();
      setSubjects(data);
    } catch (e) {
      setApiError(e.message || "Failed to load subjects.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourseModule = async (newCourseModule) => {
    try {
      await courseModuleApi.add_coursemodule(newCourseModule);
      fetchCourseModules();
    } catch (e) {
      setApiError(e.message || "Failed to add course module.");
    }
  };

  return (
    <LayoutWrapper>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Lespakketten</h1>
          <Button className="cursor-pointer" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Lespakket toevoegen
          </Button>
          
            <CourseModuleModal 
              open={isModalOpen}
              onOpenChange={setIsModalOpen}
              onSave={handleSaveCourseModule}
                subjects={subjects}
            />
         
        </div>

        {loading && <div className="text-gray-500 mb-4">Loading course modules...</div>}
        {apiError && <div className="text-red-500 mb-4">{apiError}</div>}

        <div className="border rounded-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lespakket naam</TableHead>
                <TableHead>Inhoud (Vak, Niveau, Literatuur)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseModules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell>{module.name}</TableCell>
                  <TableCell>
                    {module.subjects && module.subjects.length > 0 ? (
                      <ul className="list-disc pl-4">
                        {module.subjects.map((item, idx) => (
                          <li key={idx}>
                            {/* 
                              You might want to resolve subjectId to subject name, 
                              if you have all subjects loaded in state. 
                              For now, just show IDs/strings.
                            */}
                            Vak: {item.subjectName || item.subjectId}, Niveau: {item.level}, Literatuur: {item.material}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400 italic">Geen vakken toegevoegd</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default CourseModulesPage;
