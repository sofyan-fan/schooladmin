import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';

const ClassSelectionDialog = ({
  open,
  onOpenChange,
  classes,
  selectedClassId,
  setSelectedClassId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClasses = classes.filter((klass) =>
    klass.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClassSelect = (classId) => {
    setSelectedClassId(classId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Selecteer een klas</DialogTitle>
          <DialogDescription>
            Zoek en selecteer een klas om het rooster te bekijken.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Zoek klas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <ScrollArea className="h-72 w-full rounded-md border">
            <div className="p-4 grid grid-cols-1 gap-2">
              {filteredClasses.map((klass) => (
                <Button
                  key={klass.id}
                  variant={
                    selectedClassId === String(klass.id) ? 'default' : 'outline'
                  }
                  onClick={() => handleClassSelect(String(klass.id))}
                  className="w-full justify-start"
                >
                  {klass.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClassSelectionDialog;
