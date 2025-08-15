// src/components/CourseModuleCard.jsx (or your correct path)

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
  import { MoreHorizontal, Edit, Trash2, Eye, Archive, Copy } from "lucide-react";
  
  export const CourseModuleCard = ({ module }) => {
    // Destructure your ACTUAL module properties
    // Add a fallback for subjects to prevent errors if it's null or undefined
    const { name, subjects = [] } = module;
  
    const handleEdit = () => {
      // TODO: Implement your edit logic here
      // Example: open a modal with the module's data
      console.log("Editing module:", module.id);
    };
  
    const handleDelete = () => {
      // TODO: Implement your delete logic here
      // Example: show a confirmation dialog then call the delete API
      console.log("Deleting module:", module.id);
    };
  
    return (
      <Card className="flex flex-col h-full border hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1.5">
              <CardTitle>{name}</CardTitle>
              <CardDescription>{subjects.length} vak(ken) inbegrepen</CardDescription>
            </div>
            
            {/* Action Menu is still very useful for admins */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Meer acties</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acties</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" /> Bewerken
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" /> Bekijk inhoud
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="mr-2 h-4 w-4" /> Dupliceren
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Archive className="mr-2 h-4 w-4" /> Archiveren
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Verwijderen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow">
          {subjects.length > 0 ? (
            <div className="space-y-3 text-sm">
              <h4 className="font-semibold text-foreground">Inhoud</h4>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                {subjects.map((item, idx) => (
                  <li key={idx}>
                    <span className="font-medium text-foreground">{item.subjectName || item.subjectId}</span>
                    <div className="pl-1">
                      Niveau: {item.level}, Literatuur: {item.material}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-sm text-muted-foreground italic">Geen vakken toegevoegd</p>
            </div>
          )}
        </CardContent>
  
        <CardFooter className="pt-4 border-t mt-auto">
          <Button size="sm" className="w-full" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" /> Bewerk Lespakket
          </Button>
        </CardFooter>
      </Card>
    );
  };