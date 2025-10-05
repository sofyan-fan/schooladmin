import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Users } from 'lucide-react';
import { Badge } from '../ui/badge';

const AssessmentResultCard = ({ assessment, onSelect }) => {
  // Defensive check for nested properties
  const moduleName = assessment.moduleName || 'Onbekende Module';
  const className = assessment.class_layout?.name || 'Onbekende Klas';

  const totalStudents = assessment.class_layout?.student_count || 0;
  const gradedStudents = assessment.results?.length || 0;
  const isCompleted = totalStudents > 0 && gradedStudents === totalStudents;

  return (
    <div onClick={() => onSelect(assessment.id)} className="cursor-pointer">
      <Card
        className={`hover:shadow-lg transition-shadow duration-200 flex flex-col h-full ${
          isCompleted ? 'border-primary' : ''
        }`}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold">
                {assessment.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{moduleName}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Bekijk Details</DropdownMenuItem>
                <DropdownMenuItem>Exporteer Resultaten</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        {/* <CardContent className="flex-grow">

        </CardContent> */}
        <CardFooter>
          <div className="flex justify-between w-full gap-2">
            <Badge variant="outline">{className}</Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              {/* <span>Beoordelingen:</span> */}
              <span className="font-bold text-foreground mr-1.5 mt-0.5">
                {gradedStudents} / {totalStudents}
              </span>
              <Users className="size-4.5 mr-2" />
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AssessmentResultCard;
