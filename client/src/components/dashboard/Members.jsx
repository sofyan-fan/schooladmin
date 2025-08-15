import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MoreHorizontal } from 'lucide-react';

const MembersTable = ({ members }) => (
  <Table>
  
    <TableBody>
      {members.map((member, index) => (
        <TableRow
          key={index}
          className="border-b border-neutral-200 hover:bg-neutral-50 text-sm text-neutral-700"
        >
          <TableCell>
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={member.avatar} />
                <AvatarFallback>
                  {member.first_name && member.last_name
                    ? `${member.first_name.substring(
                        0,
                        1
                      )}${member.last_name.substring(0, 1)}`
                    : 'N/A'}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-text-default">
                {member.first_name} {member.last_name}
              </span>
            </div>
          </TableCell>
          <TableCell>{member.group}</TableCell>
          <TableCell>{member.status}</TableCell>
          <TableCell>
            <MoreHorizontal className="h-4 w-4" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const Members = ({ members }) => {
  return (
    <Card className="rounded-lg shadow-md bg-white py-0">
    
      <CardContent className="p-0">
        <Tabs defaultValue="studenten">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="studenten"
              className="inline-flex cursor-pointer rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-sm font-medium text-neutral-600 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              Studenten
            </TabsTrigger>
            <TabsTrigger
              value="leraren"
              className="inline-flex cursor-pointer rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-sm font-medium text-neutral-600 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              Leraren
            </TabsTrigger>
            <TabsTrigger
              value="personeel"
              className="inline-flex cursor-pointer rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-sm font-medium text-neutral-600 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              Personeel
            </TabsTrigger>
          </TabsList>
          <TabsContent value="studenten">
            <MembersTable members={members.studenten} />
          </TabsContent>
          <TabsContent value="leraren">
            <MembersTable members={members.leraren} />
          </TabsContent>
          <TabsContent value="personeel">
            <MembersTable members={members.personeel} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Members;
