
import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  currentRole: 'recruiter' | 'candidate';
  onRoleChange: (role: 'recruiter' | 'candidate') => void;
};

export function RoleSwitch({ currentRole, onRoleChange }: Props) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleRoleChange = async (newRole: 'recruiter' | 'candidate') => {
    try {
      setIsUpdating(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id);

      if (error) throw error;

      onRoleChange(newRole);
      toast({
        title: "Role Updated",
        description: `You are now using the app as a ${newRole === 'recruiter' ? 'Recruiter' : 'Job Seeker'}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">View as:</span>
      <Select
        value={currentRole}
        onValueChange={handleRoleChange}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="candidate">Job Seeker</SelectItem>
          <SelectItem value="recruiter">Recruiter</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
