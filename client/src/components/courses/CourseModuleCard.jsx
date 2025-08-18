// src/components/CourseModuleCard.jsx

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Trash2 } from 'lucide-react';

export const CourseModuleCard = ({ module, onEdit, onDelete, onView }) => {
  const { name, subjects = [] } = module;

  return (
      <Card className="flex flex-col h-full border hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
              <CardTitle className="text-lg font-bold">{name}</CardTitle>
              <CardDescription>
                  {subjects.length > 0
                      ? `Bevat ${subjects.length} ${subjects.length === 1 ? 'vak' : 'vakken'}`
                      : 'Nog geen vakken'}
              </CardDescription>
          </CardHeader>

          <CardContent className="flex-grow">
              {subjects.length > 0 ? (
                  <div className="space-y-4 text-sm">
                      <ul className="space-y-3">
                          {subjects.map((item, idx) => (
                              <li key={idx} className="flex flex-col">
                                  <span className="font-semibold text-foreground">
                                      {item.subjectName || item.subjectId}
                                  </span>
                                  <span className="text-muted-foreground">
                                      Niveau: {item.level}, Literatuur: {item.material}
                                  </span>
                              </li>
                          ))}
                      </ul>
                  </div>
              ) : (
                  <div className="flex items-center justify-center h-full text-center">
                      <p className="text-sm text-muted-foreground italic">
                          Voeg vakken toe om dit lespakket inhoud te geven.
                      </p>
                  </div>
              )}
          </CardContent>

          <CardFooter className="pt-4 border-t mt-auto flex justify-between items-center">
              <Button size="sm" className="flex-grow" onClick={onView}>
                  <Eye className="mr-2 h-4 w-4" /> Bekijk Lespakket
              </Button>
              <div className="flex items-center ml-2">
                  <TooltipProvider delayDuration={200}>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={onEdit}>
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Bewerken</span>
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>Bewerken</p>
                          </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider delayDuration={200}>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={onDelete}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Verwijderen</span>
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>Verwijderen</p>
                          </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
              </div>
          </CardFooter>
      </Card>
  );
};